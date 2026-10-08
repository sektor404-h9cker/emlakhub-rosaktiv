import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, describe, it } from "node:test";

function loadEnvFile(name) {
  const file = path.join(process.cwd(), name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");
import { classifyDiscovered } from "../src/lib/herrac/classify.js";
import { discoverAuctions, fetchAuctionDetail, herracFetch } from "../src/lib/herrac/client.js";
import { mapHerracDetailToLot } from "../src/lib/herrac/mapLot.js";
import { endSync, tryBeginSync } from "../src/lib/herrac/sync.js";
import { classifySyncOutcome, syncRunBlocked } from "../src/lib/herrac/syncStatus.js";
import prisma from "../src/lib/db/prisma.js";
import { listPublishedLots } from "../src/lib/db/lots.js";

const fast = { minDelayMs: 0, jitterMs: 0, retryBaseMs: 0, timeoutMs: 1000 };

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Hərrac sync outcomes use mocked responses", () => {
  after(async () => {
    endSync();
    await prisma.$disconnect();
  });

  it("marks a complete list with no card errors as success", () => {
    const judged = classifySyncOutcome({
      discovery: { attempted: true, ok: true, complete: true, truncated: false },
      details: { upserted: 2, fetched: 2, errors: [] },
    });
    assert.equal(judged.outcome, "success");
    assert.equal(judged.mode, "full");
    assert.equal(judged.catalogStatus, "available");
  });

  it("marks HTTP 500 on the list and a useful card update as partial", () => {
    const judged = classifySyncOutcome({
      discovery: { attempted: true, ok: false, complete: false, status: 500, error: "herrac 500" },
      details: { upserted: 3, fetched: 3, errors: [] },
    });
    assert.equal(judged.outcome, "partial");
    assert.equal(judged.catalogStatus, "unavailable");
    assert.equal(judged.detailStatus, "available");
    assert.notEqual(judged.outcome, "blocked_or_restricted");
  });

  it("marks 401, 403 and 429 without useful data as restricted", () => {
    for (const status of [401, 403, 429]) {
      const judged = classifySyncOutcome({
        discovery: { attempted: true, ok: false, status },
        details: { upserted: 0, fetched: 0, errors: [] },
      });
      assert.equal(judged.outcome, "blocked_or_restricted", String(status));
    }
  });

  it("marks a dead source as failed", () => {
    const judged = classifySyncOutcome({
      discovery: { attempted: true, ok: false, status: 500 },
      details: { upserted: 0, fetched: 0, errors: [{ id: "1", message: "network" }] },
    });
    assert.equal(judged.outcome, "failed");
    assert.equal(judged.mode, "unavailable");
  });

  it("marks one failed card on a complete list as partial", () => {
    const judged = classifySyncOutcome({
      discovery: { attempted: true, ok: true, complete: true, truncated: false },
      details: { upserted: 1, fetched: 1, errors: [{ id: "9", message: "detail" }] },
    });
    assert.equal(judged.outcome, "partial");
  });

  it("treats a new id, a repeated id and a price change separately", () => {
    const existing = new Map([
      ["10", { listFingerprint: JSON.stringify({ price: "100", status: "ONGOING", end: null }), source: "herrac" }],
      ["11", { listFingerprint: JSON.stringify({ price: "50", status: "ONGOING", end: null }), source: "herrac" }],
    ]);
    const result = classifyDiscovered(
      existing,
      [
        { id: "10", initialPrice: 100, status: "ONGOING" },
        { id: "10", initialPrice: 100, status: "ONGOING" },
        { id: "11", initialPrice: 80, status: "ONGOING" },
        { id: "12", initialPrice: 5, status: "ONGOING" },
      ],
      { complete: true }
    );
    assert.equal(result.unchanged, 1);
    assert.equal(result.changed, 1);
    assert.equal(result.fresh, 1);
    assert.deepEqual(result.needDetail.map((row) => row.id).sort(), ["11", "12"]);
  });

  it("posts the public list and keeps a 200 card when the list returns 500", async () => {
    const calls = [];
    const previous = global.fetch;
    global.fetch = async (url, init) => {
      calls.push({ url: String(url), method: init?.method, body: init?.body });
      if (String(url).includes("/auctions/details/")) {
        return jsonResponse(200, {
          data: { id: "42", lotName: "Test lot", initialPrice: 10, categoryId: "15707206488020125" },
        });
      }
      return jsonResponse(500, { message: "Unable to proceed", key: "AUCTION_ORGANIZATION_SERVICE_001", status: 500 });
    };
    try {
      const list = await discoverAuctions({ ...fast, retries: 1, categoryIds: ["15707206488020125"] });
      assert.equal(list.ok, false);
      assert.equal(list.status, 500);
      assert.equal(calls[0].method, "POST");
      assert.equal(calls[0].body, "[]");
      assert.equal(calls.length, 2);
      const detail = await fetchAuctionDetail("42", fast);
      assert.equal(detail.id, "42");
      const mapped = mapHerracDetailToLot(detail);
      assert.equal(mapped.registryNo, "42");
      assert.equal(Number(mapped.startPrice), 10);
    } finally {
      global.fetch = previous;
    }
  });

  it("backs off on HTTP 429 and stops after the allowed attempts", async () => {
    let calls = 0;
    const previous = global.fetch;
    global.fetch = async () => {
      calls += 1;
      return jsonResponse(429, { message: "slow down" });
    };
    try {
      await assert.rejects(
        () => herracFetch("/os/v1/auctions?page=0", { ...fast, method: "POST", body: [], retries: 4 }),
        (err) => err.status === 429
      );
      assert.equal(calls, 3);
    } finally {
      global.fetch = previous;
    }
  });

  it("refuses a second sync while the first lock is held", () => {
    assert.equal(tryBeginSync(), true);
    assert.equal(tryBeginSync(), false);
    endSync();
    assert.equal(tryBeginSync(), true);
    endSync();
    assert.equal(
      syncRunBlocked({ status: "running", lastAttemptAt: new Date().toISOString() }),
      true
    );
    assert.equal(
      syncRunBlocked({ status: "running", lastAttemptAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() }),
      false
    );
  });

  it("shows a fixture lot through the published terminal list and then removes it", async () => {
    const registry = `sync-fixture-${Date.now()}`;
    const created = await prisma.lot.create({
      data: {
        registryNo: registry,
        titleAz: "Sync fixture",
        titleRu: "Тестовый лот синхронизации",
        market: "auto",
        startPrice: 123,
        status: "published",
        payload: { source: "herrac", herracId: registry, sourceLastSeenAt: new Date().toISOString() },
      },
    });
    try {
      const lots = await listPublishedLots();
      const found = lots.find((lot) => lot.registryNo === registry);
      assert.ok(found);
      assert.equal(found.market, "auto");
      assert.equal(Number(found.startPrice), 123);
    } finally {
      await prisma.lot.delete({ where: { id: created.id } });
      const gone = await prisma.lot.findUnique({ where: { registryNo: registry } });
      assert.equal(gone, null);
    }
  });
});
