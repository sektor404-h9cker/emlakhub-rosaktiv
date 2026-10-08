import crypto from "crypto";
import prisma from "@/lib/db/prisma";
import { PLAN_PRICES, PLANS } from "@/lib/subscription";
import {
  bonusForPayment,
  boundedExpiry,
  nextExpiry,
  normalizeGrowth,
  pullExpiry,
  referralBindDecision,
} from "./rules";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeReferralCode() {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i += 1) code += ALPHABET[bytes[i] % ALPHABET.length];
  return code;
}

export async function readGrowthConfig(db = prisma) {
  const row = await db.platformState.findUnique({ where: { id: "main" } });
  const system = row?.system && typeof row.system === "object" ? row.system : {};
  return normalizeGrowth(system.growth);
}

export async function writeGrowthConfig(patch, actor) {
  const current = await prisma.platformState.findUnique({ where: { id: "main" } });
  const system = current?.system && typeof current.system === "object" ? current.system : {};
  const growth = normalizeGrowth({ ...(system.growth || {}), ...patch });
  const nextSystem = { ...system, growth };
  await prisma.platformState.upsert({
    where: { id: "main" },
    create: { id: "main", system: nextSystem, ops: current?.ops || {} },
    update: { system: nextSystem },
  });
  await prisma.auditLog.create({
    data: {
      actorId: actor?.userId || null,
      actorEmail: actor?.email || null,
      action: "growth_config_updated",
      level: "warn",
      meta: growth,
    },
  });
  return growth;
}

export async function resolvePlan(planKey, db = prisma) {
  const base = PLAN_PRICES[planKey] || PLAN_PRICES.month;
  const config = await readGrowthConfig(db);
  const over = config.prices?.[planKey] || config.prices?.[base.id];
  if (!over) return { ...base, currency: "AZN" };
  const amount = Number(over.amount);
  const days = Number(over.days);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 500) return { ...base, currency: "AZN" };
  return {
    ...base,
    amount: Math.round(amount * 100) / 100,
    days: Number.isFinite(days) && days >= 1 && days <= 400 ? Math.round(days) : base.days,
    currency: "AZN",
  };
}

export async function ensureReferralCode(userId, db = prisma) {
  const existing = await db.referralCode.findUnique({ where: { userId } });
  if (existing) return existing;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.referralCode.create({
        data: { userId, code: makeReferralCode() },
      });
    } catch (err) {
      if (err?.code !== "P2002") throw err;
    }
  }
  const err = new Error("Не удалось выдать реферальный код.");
  err.status = 500;
  throw err;
}

export async function bindReferral({ referredId, referredEmail, code, signals, db = prisma }) {
  const normalized = String(code || "").trim().toUpperCase();
  if (!normalized) return { bound: false, reason: "empty" };
  const owner = await db.referralCode.findUnique({
    where: { code: normalized },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!owner) return { bound: false, reason: "unknown_code" };
  const decision = referralBindDecision({
    referrerId: owner.userId,
    referredId,
    referrerEmail: owner.user.email,
    referredEmail,
  });
  if (!decision.ok) return { bound: false, reason: decision.reason };
  const existing = await db.referral.findUnique({ where: { referredId } });
  if (existing) return { bound: false, reason: "already_bound" };
  const recent = await db.referral.count({
    where: {
      referrerId: owner.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  const suspicious = recent >= 5;
  const row = await db.referral.create({
    data: {
      referrerId: owner.userId,
      referredId,
      status: "awaiting_payment",
      suspicious,
      signals: signals || null,
    },
  });
  return { bound: true, referral: row };
}

async function addDays(tx, user, days, now) {
  const before = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const after = nextExpiry(before, now, days);
  const active = before && before.getTime() > now.getTime();
  await tx.user.update({
    where: { id: user.id },
    data: {
      subscriptionPlan: PLANS.PRO,
      subscriptionStartsAt: active ? user.subscriptionStartsAt || now : now,
      subscriptionExpiresAt: after,
    },
  });
  return { before, after };
}

async function grantDays(tx, { referral, user, role, days, paymentId, now }) {
  if (!days) return null;
  const key = `${paymentId}:${role}`;
  const existing = await tx.referralGrant.findUnique({ where: { idempotencyKey: key } });
  if (existing) return existing;
  const fresh = await tx.user.findUnique({ where: { id: user.id } });
  const span = await addDays(tx, fresh, days, now);
  return tx.referralGrant.create({
    data: {
      referralId: referral.id,
      userId: user.id,
      role,
      days,
      paymentId,
      status: "granted",
      idempotencyKey: key,
      expiresBefore: span.before,
      expiresAfter: span.after,
    },
  });
}

export async function applyReferralReward(tx, { payment, now }) {
  const referral = await tx.referral.findUnique({ where: { referredId: payment.userId } });
  if (!referral) return { rewarded: false, reason: "no_referral" };
  const config = await readGrowthConfig(tx);
  const bonus = bonusForPayment({
    enabled: config.referralEnabled,
    status: referral.status,
    referrerDays: config.referrerDays,
    referredDays: config.referredDays,
  });
  if (!bonus) return { rewarded: false, reason: referral.status };
  const referred = await tx.user.findUnique({ where: { id: referral.referredId } });
  const referrer = await tx.user.findUnique({ where: { id: referral.referrerId } });
  await grantDays(tx, {
    referral,
    user: referred,
    role: "referred",
    days: bonus.referredDays,
    paymentId: payment.id,
    now,
  });
  await grantDays(tx, {
    referral,
    user: referrer,
    role: "referrer",
    days: bonus.referrerDays,
    paymentId: payment.id,
    now,
  });
  await tx.referral.update({
    where: { id: referral.id },
    data: { status: "rewarded", rewardPaymentId: payment.id },
  });
  await tx.productEvent.create({
    data: {
      userId: referrer.id,
      type: "referral_bonus",
      delivery: "not_sent",
      payload: { paymentId: payment.id, days: bonus.referrerDays, role: "referrer" },
    },
  });
  return { rewarded: true };
}

export async function reverseGrantsForPayment(tx, { paymentId, reason, now }) {
  const grants = await tx.referralGrant.findMany({
    where: { paymentId, status: "granted" },
  });
  for (const grant of grants) {
    const user = await tx.user.findUnique({ where: { id: grant.userId } });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionExpiresAt: boundedExpiry(
            user.subscriptionStartsAt,
            pullExpiry(user.subscriptionExpiresAt, grant.days)
          ),
        },
      });
    }
    await tx.referralGrant.update({
      where: { id: grant.id },
      data: { status: "reversed", reverseReason: reason || "refund", reversedAt: now },
    });
  }
  if (grants.length) {
    await tx.referral.updateMany({
      where: { rewardPaymentId: paymentId },
      data: { status: "cancelled" },
    });
  }
  return grants.length;
}

export async function reverseGrantById({ grantId, reason, actor }) {
  return prisma.$transaction(async (tx) => {
    const grant = await tx.referralGrant.findUnique({ where: { id: grantId } });
    if (!grant) {
      const err = new Error("Начисление не найдено");
      err.status = 404;
      throw err;
    }
    if (grant.status === "reversed") return grant;
    const user = await tx.user.findUnique({ where: { id: grant.userId } });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionExpiresAt: boundedExpiry(
            user.subscriptionStartsAt,
            pullExpiry(user.subscriptionExpiresAt, grant.days)
          ),
        },
      });
    }
    const updated = await tx.referralGrant.update({
      where: { id: grant.id },
      data: {
        status: "reversed",
        reverseReason: String(reason || "admin").slice(0, 240),
        reversedAt: new Date(),
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor?.userId || null,
        actorEmail: actor?.email || null,
        action: "referral_grant_reversed",
        level: "warn",
        meta: { grantId, reason, days: grant.days },
      },
    });
    return updated;
  });
}

export async function recordProductEvent(tx, { userId, type, payload }) {
  const db = tx || prisma;
  return db.productEvent.create({
    data: {
      userId: userId || null,
      type,
      payload: payload || null,
      delivery: "not_sent",
    },
  });
}
