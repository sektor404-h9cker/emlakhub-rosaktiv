import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bonusForPayment,
  nextExpiry,
  normalizeGrowth,
  boundedExpiry,
  pullExpiry,
  referralBindDecision,
} from "../src/lib/growth/rules.js";
import { PAYMENT_PROVIDER, verifyWebhook } from "../src/lib/payments/provider.js";

describe("growth rules", () => {
  it("adds bonus days after an active term and starts from now when the term is over", () => {
    const now = new Date("2026-10-08T00:00:00Z");
    const active = new Date("2026-11-01T00:00:00Z");
    assert.equal(nextExpiry(active, now, 7).toISOString(), "2026-11-08T00:00:00.000Z");
    assert.equal(nextExpiry(new Date("2026-09-01T00:00:00Z"), now, 3).toISOString(), "2026-10-11T00:00:00.000Z");
  });

  it("rejects self-invite and a second bonus for the same invited person", () => {
    assert.equal(referralBindDecision({ referrerId: "a", referredId: "a" }).reason, "self");
    assert.equal(
      referralBindDecision({
        referrerId: "a",
        referredId: "b",
        referrerEmail: "same@emlak.az",
        referredEmail: "same@emlak.az",
      }).reason,
      "self"
    );
    assert.equal(referralBindDecision({ referrerId: "a", referredId: "b" }).ok, true);
    assert.equal(bonusForPayment({ enabled: true, status: "rewarded", referrerDays: 7, referredDays: 3 }), null);
    assert.equal(bonusForPayment({ enabled: false, status: "awaiting_payment" }), null);
    assert.deepEqual(bonusForPayment({ enabled: true, status: "awaiting_payment", referrerDays: 7, referredDays: 3 }), {
      referrerDays: 7,
      referredDays: 3,
    });
  });

  it("keeps a future bonus change away from the stored day count", () => {
    const stored = 7;
    const next = normalizeGrowth({ referrerDays: 14, referredDays: 1 });
    assert.equal(stored, 7);
    assert.equal(next.referrerDays, 14);
    assert.equal(pullExpiry(new Date("2026-11-08T00:00:00Z"), stored).toISOString(), "2026-11-01T00:00:00.000Z");
    const start = new Date("2026-10-01T00:00:00Z");
    const pulledPast = pullExpiry(new Date("2026-10-03T00:00:00Z"), 30);
    assert.equal(boundedExpiry(start, pulledPast).toISOString(), start.toISOString());
  });

  it("does not pretend a payment provider is connected", async () => {
    assert.equal(PAYMENT_PROVIDER.automatic, false);
    await assert.rejects(() => verifyWebhook(), (err) => err.status === 501);
  });
});
