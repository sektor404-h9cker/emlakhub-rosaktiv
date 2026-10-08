import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { hashPassword } from "../src/lib/auth/password.js";
import { createSessionToken, withSessionToken } from "../src/lib/auth/session.js";
import prisma from "../src/lib/db/prisma.js";
import { confirmPayment, createPaymentIntent, refundPayment } from "../src/lib/db/payments.js";
import { bindReferral, ensureReferralCode, readGrowthConfig, writeGrowthConfig } from "../src/lib/growth/service.js";
import { TERMS_VERSION, PRIVACY_VERSION } from "../src/lib/legal/versions.js";
import { GET as myReferral } from "../src/app/api/me/referral/route.js";
import { PATCH as patchGrowth } from "../src/app/api/admin/growth/route.js";
import { POST as webhook } from "../src/app/api/payments/webhook/route.js";

function loadEnvFile(name) {
  const file = path.join(process.cwd(), name);
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const stamp = `${Date.now()}-${process.pid}`;
const ids = [];

async function user(label) {
  const row = await prisma.user.create({
    data: {
      email: `growth-${label}-${stamp}@example.com`,
      passwordHash: await hashPassword("growth-pass-1"),
      displayName: label,
      role: label === "admin" ? "admin" : "investor",
    },
  });
  ids.push(row.id);
  return row;
}

describe("referral payment grants", () => {
  let a;
  let b;
  let admin;

  before(async () => {
    assert.ok(process.env.DATABASE_URL, "DATABASE_URL is required");
    a = await user("a");
    b = await user("b");
    admin = await user("admin");
  });

  after(async () => {
    if (!ids.length) return;
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  });

  it("grants once, ignores a repeat confirmation and a later renewal, then reverses a refund", async () => {
    const code = await ensureReferralCode(a.id);
    const self = await bindReferral({ referredId: a.id, referredEmail: a.email, code: code.code });
    assert.equal(self.reason, "self");

    const bound = await bindReferral({ referredId: b.id, referredEmail: b.email, code: code.code });
    assert.equal(bound.bound, true);
    const beforePay = await prisma.referralGrant.count({ where: { referralId: bound.referral.id } });
    assert.equal(beforePay, 0);

    const payment = await createPaymentIntent({ userId: b.id, planKey: "month" });
    assert.equal(Number(payment.amount), 9.9);
    const first = await confirmPayment({ paymentId: payment.id, adminEmail: admin.email });
    const again = await confirmPayment({ paymentId: payment.id, adminEmail: admin.email });
    assert.equal(first.status, "paid");
    assert.equal(again.status, "paid");
    const grants = await prisma.referralGrant.findMany({ where: { paymentId: payment.id } });
    assert.equal(grants.length, 2);
    assert.equal(grants.find((row) => row.role === "referrer").days, 7);
    assert.equal(grants.find((row) => row.role === "referred").days, 3);

    const renewal = await createPaymentIntent({ userId: b.id, planKey: "month" });
    await confirmPayment({ paymentId: renewal.id, adminEmail: admin.email });
    const still = await prisma.referralGrant.count({ where: { referralId: bound.referral.id, status: "granted" } });
    assert.equal(still, 2);

    const referredBefore = await prisma.user.findUnique({ where: { id: b.id } });
    await refundPayment({ paymentId: payment.id, adminEmail: admin.email, reason: "test refund" });
    const referredAfter = await prisma.user.findUnique({ where: { id: b.id } });
    const reversed = await prisma.referralGrant.count({
      where: { paymentId: payment.id, status: "reversed" },
    });
    assert.equal(reversed, 2);
    assert.ok(referredAfter.subscriptionExpiresAt < referredBefore.subscriptionExpiresAt);
    const previous = await readGrowthConfig();
    await writeGrowthConfig({ referrerDays: 11 }, { userId: admin.id, email: admin.email });
    const oldGrant = await prisma.referralGrant.findFirst({ where: { paymentId: payment.id, role: "referrer" } });
    assert.equal(oldGrant.days, 7);
    await writeGrowthConfig(previous, { userId: admin.id, email: admin.email });
    await prisma.investmentScenario.create({
      data: { userId: b.id, lotId: `growth-${stamp}`, inputs: { note: "kept" } },
    });
    await prisma.user.update({
      where: { id: b.id },
      data: { subscriptionExpiresAt: new Date("2020-01-01T00:00:00Z") },
    });
    const kept = await prisma.investmentScenario.findFirst({ where: { userId: b.id, lotId: `growth-${stamp}` } });
    assert.ok(kept);
  });

  it("lets only one of two parallel confirmations extend the term", async () => {
    const payer = await user("parallel");
    const payment = await createPaymentIntent({ userId: payer.id, planKey: "month" });
    const [left, right] = await Promise.all([
      confirmPayment({ paymentId: payment.id, adminEmail: admin.email }),
      confirmPayment({ paymentId: payment.id, adminEmail: admin.email }),
    ]);
    assert.equal(left.status, "paid");
    assert.equal(right.status, "paid");
    const paid = await prisma.payment.count({ where: { id: payment.id, status: "paid" } });
    assert.equal(paid, 1);
    const row = await prisma.user.findUnique({ where: { id: payer.id } });
    const days = Math.round((row.subscriptionExpiresAt - row.subscriptionStartsAt) / 86400000);
    assert.equal(days, 30);
  });

  it("hides other people from the referral desk and refuses a fake webhook", async () => {
    await prisma.legalConsent.createMany({
      data: [
        { userId: a.id, documentType: "terms", version: TERMS_VERSION, locale: "ru" },
        { userId: a.id, documentType: "privacy", version: PRIVACY_VERSION, locale: "ru" },
      ],
    });
    const token = await createSessionToken({ userId: a.id, email: a.email, role: "investor" });
    const response = await withSessionToken(token, () => myReferral());
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(JSON.stringify(body).includes(b.email), false);
    const investorPatch = await withSessionToken(token, () =>
      patchGrowth(new Request("http://localhost/api/admin/growth", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ referrerDays: 1 }),
      }))
    );
    assert.equal(investorPatch.status, 403);
    const hook = await webhook();
    assert.equal(hook.status, 501);
  });
});
