import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { hashPassword } from "../src/lib/auth/password.js";
import {
  createSessionToken,
  revokeUserSessions,
  withSessionToken,
} from "../src/lib/auth/session.js";
import prisma from "../src/lib/db/prisma.js";
import { TERMS_VERSION, PRIVACY_VERSION } from "../src/lib/legal/versions.js";
import { consentIsCurrent } from "../src/lib/legal/consent.js";
import {
  markSyncAttempt,
  markSyncFinished,
  readSyncState,
  safeSyncError,
} from "../src/lib/herrac/syncStatus.js";
import { updateUser } from "../src/lib/db/users.js";
import { GET as getWorkspace, PUT as putWorkspace } from "../src/app/api/me/workspace/route.js";
import { GET as listScenarios } from "../src/app/api/me/scenarios/route.js";
import {
  GET as getScenario,
  PUT as putScenario,
} from "../src/app/api/me/scenarios/[lotId]/route.js";
import {
  GET as listTickets,
  POST as createTicket,
} from "../src/app/api/support/tickets/route.js";
import { PATCH as patchTicket } from "../src/app/api/support/tickets/[id]/route.js";
import { POST as postMessage } from "../src/app/api/support/tickets/[id]/messages/route.js";
import { GET as listUsers } from "../src/app/api/users/route.js";
import { GET as syncStatus } from "../src/app/api/admin/herrac/sync/route.js";
import { POST as acceptConsent } from "../src/app/api/me/consent/route.js";

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

const stamp = `${Date.now()}-${process.pid}`;
const ids = {};
let syncBackup = null;

function jsonRequest(url, method, body) {
  return new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
}

async function call(token, fn) {
  return withSessionToken(token, fn);
}

describe("two-user API isolation", () => {
  before(async () => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required for isolation tests");
    syncBackup = await prisma.herracSyncState.findUnique({ where: { id: "main" } });
    const passwordHash = await hashPassword("isolation-pass-1");
    for (const [key, role] of [
      ["a", "investor"],
      ["b", "investor"],
      ["admin", "admin"],
      ["stale", "investor"],
      ["blocked", "investor"],
    ]) {
      const row = await prisma.user.create({
        data: {
          email: `gate-${key}-${stamp}@example.com`,
          passwordHash,
          displayName: key,
          role,
          sessionVersion: 0,
        },
      });
      ids[key] = row;
    }
    for (const key of ["a", "b", "admin", "blocked"]) {
      await prisma.legalConsent.createMany({
        data: [
          {
            userId: ids[key].id,
            documentType: "terms",
            version: TERMS_VERSION,
            locale: "az",
          },
          {
            userId: ids[key].id,
            documentType: "privacy",
            version: PRIVACY_VERSION,
            locale: "az",
          },
        ],
      });
    }
    await prisma.legalConsent.createMany({
      data: [
        {
          userId: ids.stale.id,
          documentType: "terms",
          version: "1999-01-01",
          locale: "ru",
        },
        {
          userId: ids.stale.id,
          documentType: "privacy",
          version: "1999-01-01",
          locale: "ru",
        },
      ],
    });
    for (const key of Object.keys(ids)) {
      ids[key].token = await createSessionToken({
        userId: ids[key].id,
        email: ids[key].email,
        role: ids[key].role,
        sessionVersion: 0,
      });
    }
  });

  after(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: `-${stamp}@example.com` } },
    });
    if (syncBackup) {
      const { id, updatedAt, ...rest } = syncBackup;
      void id;
      void updatedAt;
      await prisma.herracSyncState.upsert({
        where: { id: "main" },
        create: { id: "main", ...rest },
        update: rest,
      });
    } else {
      await prisma.herracSyncState.deleteMany({ where: { id: "main" } });
    }
    await prisma.$disconnect();
  });

  it("keeps watchlist, compare, portfolio and alerts on the owning user", async () => {
    const saved = await call(ids.a.token, () =>
      putWorkspace(
        jsonRequest("http://localhost/api/me/workspace", "PUT", {
          userId: ids.b.id,
          watchlist: ["bmw-a"],
          compare: ["bmw-a", "kia-a"],
          deals: [
            { id: "deal-a", lotId: "bmw-a", stage: "explore", bid: null },
            { id: "deal-zero", lotId: "bmw-a", stage: "analysis", bid: 0 },
          ],
          alerts: [{ id: "alert-a", enabled: true }],
        })
      )
    );
    assert.equal(saved.status, 200);

    await call(ids.b.token, () =>
      putWorkspace(
        jsonRequest("http://localhost/api/me/workspace", "PUT", {
          userId: ids.a.id,
          watchlist: ["bmw-b"],
          compare: ["lot-b"],
          deals: [{ id: "deal-b", lotId: "lot-b", stage: "auction", bid: 15 }],
          alerts: [{ id: "alert-b", enabled: false }],
        })
      )
    );

    const mine = await call(ids.a.token, () => getWorkspace());
    const body = await mine.json();
    assert.deepEqual(body.workspace.watchlist, ["bmw-a"]);
    assert.deepEqual(body.workspace.compare, ["bmw-a", "kia-a"]);
    assert.equal(body.workspace.deals.find((deal) => deal.id === "deal-a").bid, null);
    assert.equal(body.workspace.deals.find((deal) => deal.id === "deal-zero").bid, 0);
    assert.equal(body.workspace.alerts[0].id, "alert-a");

    const other = await call(ids.b.token, () => getWorkspace());
    const otherBody = await other.json();
    assert.deepEqual(otherBody.workspace.watchlist, ["bmw-b"]);
    assert.equal(otherBody.workspace.watchlist.includes("bmw-a"), false);

    const rowA = await prisma.userWorkspace.findUnique({ where: { userId: ids.a.id } });
    assert.deepEqual(rowA.watchlist, ["bmw-a"]);
  });

  it("keeps investment scenarios per user and per lot", async () => {
    const context = { params: Promise.resolve({ lotId: "bmw-1" }) };
    const saved = await call(ids.a.token, () =>
      putScenario(
        jsonRequest("http://localhost/api/me/scenarios/bmw-1", "PUT", {
          inputs: { repairChoice: "amount", repairAmount: "0", reserveChoice: "unknown" },
          maxBid: 22500,
          marketReference: 30000,
        }),
        context
      )
    );
    assert.equal(saved.status, 200);

    await call(ids.b.token, () =>
      putScenario(
        jsonRequest("http://localhost/api/me/scenarios/bmw-1", "PUT", {
          inputs: { repairChoice: "amount", repairAmount: "9" },
          maxBid: 1,
          marketReference: 2,
        }),
        context
      )
    );

    const seenByB = await call(ids.b.token, () =>
      getScenario(new Request("http://localhost/api/me/scenarios/bmw-1"), context)
    );
    const scenarioB = (await seenByB.json()).scenario;
    assert.equal(scenarioB.maxBid, 1);
    assert.equal(scenarioB.inputs.repairAmount, "9");

    const seenByA = await call(ids.a.token, () =>
      getScenario(new Request("http://localhost/api/me/scenarios/bmw-1"), context)
    );
    const scenarioA = (await seenByA.json()).scenario;
    assert.equal(scenarioA.maxBid, 22500);
    assert.equal(scenarioA.inputs.repairAmount, "0");

    const listB = await call(ids.b.token, () => listScenarios());
    const rows = (await listB.json()).scenarios;
    assert.equal(rows.some((row) => row.maxBid === 22500), false);
  });

  it("hides support tickets from the other user", async () => {
    const created = await call(ids.a.token, () =>
      createTicket(
        jsonRequest("http://localhost/api/support/tickets", "POST", {
          subject: "A only",
          body: "private note",
          topic: "other",
        })
      )
    );
    assert.equal(created.status, 200);
    const ticket = (await created.json()).ticket;
    assert.ok(ticket.id);

    const listB = await call(ids.b.token, () => listTickets());
    const ticketsB = (await listB.json()).tickets;
    assert.equal(ticketsB.some((row) => row.id === ticket.id), false);

    const patched = await call(ids.b.token, () =>
      patchTicket(
        jsonRequest(`http://localhost/api/support/tickets/${ticket.id}`, "PATCH", {
          status: "closed",
        }),
        { params: Promise.resolve({ id: ticket.id }) }
      )
    );
    assert.equal(patched.status, 403);

    const message = await call(ids.b.token, () =>
      postMessage(
        jsonRequest(`http://localhost/api/support/tickets/${ticket.id}/messages`, "POST", {
          body: "intrusion",
        }),
        { params: Promise.resolve({ id: ticket.id }) }
      )
    );
    assert.equal(message.status, 403);

    const still = await prisma.supportTicket.findUnique({ where: { id: ticket.id } });
    assert.equal(still.userId, ids.a.id);
    assert.equal(still.status, "open");
  });

  it("refuses investor access to the admin user list", async () => {
    const denied = await call(ids.a.token, () =>
      listUsers(new Request("http://localhost/api/users"))
    );
    assert.equal(denied.status, 403);

    const allowed = await call(ids.admin.token, () =>
      listUsers(new Request("http://localhost/api/users"))
    );
    assert.equal(allowed.status, 200);
  });

  it("rejects a JWT after password change, block, and explicit revoke", async () => {
    await updateUser(ids.a.id, { password: "changed-pass-99" });
    const afterPassword = await call(ids.a.token, () => getWorkspace());
    assert.equal(afterPassword.status, 401);

    const fresh = await prisma.user.findUnique({ where: { id: ids.blocked.id } });
    const blockedToken = await createSessionToken({
      userId: fresh.id,
      email: fresh.email,
      role: fresh.role,
      sessionVersion: fresh.sessionVersion,
    });
    await updateUser(ids.blocked.id, { blocked: true });
    const afterBlock = await call(blockedToken, () => getWorkspace());
    assert.equal(afterBlock.status, 401);

    const adminFresh = await prisma.user.findUnique({ where: { id: ids.admin.id } });
    const adminToken = await createSessionToken({
      userId: adminFresh.id,
      email: adminFresh.email,
      role: adminFresh.role,
      sessionVersion: adminFresh.sessionVersion,
    });
    await revokeUserSessions(ids.admin.id);
    const afterRevoke = await call(adminToken, () =>
      listUsers(new Request("http://localhost/api/users"))
    );
    assert.equal(afterRevoke.status, 401);
  });

  it("requires the current consent version and keeps older rows", async () => {
    assert.equal(
      consentIsCurrent([
        { documentType: "terms", version: "1999-01-01", acceptedAt: "2020-01-01" },
        { documentType: "privacy", version: PRIVACY_VERSION, acceptedAt: "2020-01-01" },
      ]),
      false
    );

    const blocked = await call(ids.stale.token, () => getWorkspace());
    assert.equal(blocked.status, 403);

    const accepted = await call(ids.stale.token, () =>
      acceptConsent(
        jsonRequest("http://localhost/api/me/consent", "POST", {
          acceptLegal: true,
          locale: "ru",
        })
      )
    );
    assert.equal(accepted.status, 200);

    const rows = await prisma.legalConsent.findMany({ where: { userId: ids.stale.id } });
    assert.ok(rows.some((row) => row.version === "1999-01-01"));
    assert.ok(rows.some((row) => row.documentType === "terms" && row.version === TERMS_VERSION));
    assert.ok(rows.length >= 4);

    const opened = await call(ids.stale.token, () => getWorkspace());
    assert.equal(opened.status, 200);
  });

  it("stores Hərrac sync status without calling the network", async () => {
    assert.equal(safeSyncError(new Error("postgres://user:secret@db/emlak failed")), "[redacted] failed");
    const before = await readSyncState();
    await markSyncAttempt();
    await markSyncFinished(
      { received: 4, created: 1, updated: 2, failed: 1, error: "detail timeout" },
      null
    );
    const state = await readSyncState();
    assert.equal(state.status, "failed");
    assert.equal(state.received, 4);
    assert.equal(state.created, 1);
    assert.equal(state.updated, 2);
    assert.equal(state.failed, 1);
    assert.ok(state.lastAttemptAt);
    assert.equal(String(state.lastSuccessAt), String(before.lastSuccessAt));

    const previous = process.env.CRON_SECRET;
    process.env.CRON_SECRET = "integration-cron-secret";
    try {
      const denied = await call(ids.a.token, () =>
        syncStatus(new Request("http://localhost/api/admin/herrac/sync"))
      );
      assert.equal(denied.status, 403);

      const allowed = await call("", () =>
        syncStatus(
          new Request("http://localhost/api/admin/herrac/sync", {
            headers: { "x-cron-secret": "integration-cron-secret" },
          })
        )
      );
      assert.equal(allowed.status, 200);
      const body = await allowed.json();
      assert.equal(body.scheduled, false);
      assert.equal(body.sync.received, 4);
    } finally {
      if (previous == null) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previous;
    }
  });
});
