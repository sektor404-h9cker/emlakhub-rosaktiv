import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isKnownDevPassword } from "../src/lib/auth/password.js";
import { rateLimit, resetRateLimits } from "../src/lib/security/rateLimit.js";
import { TERMS_VERSION, PRIVACY_VERSION, legalLocale } from "../src/lib/legal/versions.js";
import { sanitizeWorkspace } from "../src/lib/workspace/shape.js";
import { moneyOrNull, sanitizeScenarioInputs } from "../src/lib/scenarios/shape.js";

describe("production gate", () => {
  it("rejects the known local seed password", () => {
    assert.equal(isKnownDevPassword("Admin123!"), true);
    assert.equal(isKnownDevPassword("a-real-password"), false);
  });

  it("rate limit returns  after the budget", () => {
    resetRateLimits();
    const key = "test:login";
    assert.equal(rateLimit({ key, limit: 2, windowMs: 1000, now: 1 }).ok, true);
    assert.equal(rateLimit({ key, limit: 2, windowMs: 1000, now: 2 }).ok, true);
    const blocked = rateLimit({ key, limit: 2, windowMs: 1000, now: 3 });
    assert.equal(blocked.ok, false);
    assert.ok(blocked.retryAfter >= 1);
  });

  it("keeps consent versions explicit", () => {
    assert.ok(TERMS_VERSION);
    assert.ok(PRIVACY_VERSION);
    assert.equal(legalLocale("en"), "en");
    assert.equal(legalLocale("xx"), "az");
  });

  it("isolates workspace payloads and does not invent a bid", () => {
    const a = sanitizeWorkspace({
      watchlist: ["lot-a"],
      compare: ["lot-a", "lot-b"],
      deals: [{ id: "d1", lotId: "lot-a", stage: "explore", bid: null }],
    });
    const b = sanitizeWorkspace({
      watchlist: ["lot-b"],
      deals: [{ id: "d2", lotId: "lot-b", stage: "auction", bid: 10 }],
    });
    assert.deepEqual(a.watchlist, ["lot-a"]);
    assert.deepEqual(b.watchlist, ["lot-b"]);
    assert.equal(a.deals[0].bid, null);
    assert.equal(b.deals[0].bid, 10);
    assert.equal(a.deals[0].lotId === b.deals[0].lotId, false);
  });

  it("keeps zero money and unknown money apart", () => {
    assert.equal(moneyOrNull(null), null);
    assert.equal(moneyOrNull(""), null);
    assert.equal(moneyOrNull(0), 0);
    assert.equal(moneyOrNull("0"), 0);
    assert.equal(moneyOrNull(-1), null);
    const inputs = sanitizeScenarioInputs({ repairAmount: "0", repairChoice: "amount" });
    assert.equal(inputs.repairAmount, "0");
    assert.equal(inputs.repairChoice, "amount");
    assert.equal(sanitizeScenarioInputs({}).reserveChoice, "unknown");
  });
});
