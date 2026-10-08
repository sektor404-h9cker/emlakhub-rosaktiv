/**
 * Платежи и активация PRO — только сервер
 */
import prisma from "@/lib/db/prisma";
import {
  PLANS,
  PAYMENT_STATUS,
} from "@/lib/subscription";
import {
  applyReferralReward,
  recordProductEvent,
  resolvePlan,
  reverseGrantsForPayment,
} from "@/lib/growth/service";
import { boundedExpiry, nextExpiry, pullExpiry } from "@/lib/growth/rules";

export async function listPaymentsForUser(userId) {
  return prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
  });
}

export async function listAllPayments(limit = 100) {
  return prisma.payment.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true, displayName: true } } },
  });
}

export async function createPaymentIntent({ userId, planKey }) {
  const price = await resolvePlan(planKey);
  const row = await prisma.payment.create({
    data: {
      userId,
      amount: price.amount,
      currency: "AZN",
      planId: price.id,
      planDays: price.days,
      status: PAYMENT_STATUS.PENDING,
      provider: "manual",
      note: "Awaiting confirmation",
    },
    include: { user: { select: { email: true } } },
  });
  await recordProductEvent(null, {
    userId,
    type: "payment_created",
    payload: { paymentId: row.id, planId: price.id, amount: price.amount },
  });
  return row;
}

/** Подтверждение оплаты один раз. Повтор и параллельный запрос срок не удлиняют. */
export async function confirmPayment({ paymentId, adminEmail }) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    if (payment.status === PAYMENT_STATUS.PAID) return payment;
    if (payment.status !== PAYMENT_STATUS.PENDING) {
      const err = new Error("Платёж уже закрыт.");
      err.status = 409;
      throw err;
    }

    const now = new Date();
    const user = payment.user;
    const activeNow =
      user.subscriptionPlan === PLANS.PRO &&
      user.subscriptionExpiresAt &&
      user.subscriptionExpiresAt > now;
    const activeFrom = activeNow ? user.subscriptionExpiresAt : now;
    const activeTo = nextExpiry(activeNow ? user.subscriptionExpiresAt : null, now, payment.planDays);
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: PAYMENT_STATUS.PENDING },
      data: {
        status: PAYMENT_STATUS.PAID,
        activeFrom,
        activeTo,
        confirmedByEmail: adminEmail || null,
        confirmedAt: now,
        provider: payment.provider || "manual",
      },
    });
    if (claimed.count !== 1) {
      return tx.payment.findUnique({
        where: { id: paymentId },
        include: { user: { select: { email: true } } },
      });
    }
    await tx.user.update({
      where: { id: user.id },
      data: {
        subscriptionPlan: PLANS.PRO,
        subscriptionStartsAt: activeNow ? user.subscriptionStartsAt || now : now,
        subscriptionExpiresAt: activeTo,
      },
    });
    await applyReferralReward(tx, { payment, now });
    await recordProductEvent(tx, {
      userId: user.id,
      type: "payment_confirmed",
      payload: { paymentId, planId: payment.planId, amount: String(payment.amount) },
    });
    return tx.payment.findUnique({
      where: { id: paymentId },
      include: { user: { select: { email: true } } },
    });
  });
}

/** Возврат снимает оплаченные дни и бонус, начисленный этой оплатой. */
export async function refundPayment({ paymentId, adminEmail, reason }) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });
    if (!payment) {
      const err = new Error("Payment not found");
      err.status = 404;
      throw err;
    }
    if (payment.status === PAYMENT_STATUS.REFUNDED) return payment;
    if (payment.status !== PAYMENT_STATUS.PAID) {
      const err = new Error("Вернуть можно только подтверждённый платёж.");
      err.status = 409;
      throw err;
    }
    const now = new Date();
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: PAYMENT_STATUS.PAID },
      data: {
        status: PAYMENT_STATUS.REFUNDED,
        refundedAt: now,
        refundReason: String(reason || "refund").slice(0, 240),
        confirmedByEmail: adminEmail || payment.confirmedByEmail,
      },
    });
    if (claimed.count !== 1) {
      return tx.payment.findUnique({ where: { id: paymentId } });
    }
    await reverseGrantsForPayment(tx, { paymentId, reason, now });
    const user = await tx.user.findUnique({ where: { id: payment.userId } });
    if (user) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionExpiresAt: boundedExpiry(
            user.subscriptionStartsAt,
            pullExpiry(user.subscriptionExpiresAt, payment.planDays)
          ),
        },
      });
    }
    await recordProductEvent(tx, {
      userId: payment.userId,
      type: "payment_refunded",
      payload: { paymentId, reason: reason || "refund" },
    });
    await tx.auditLog.create({
      data: {
        actorEmail: adminEmail || null,
        action: "payment_refunded",
        level: "warn",
        meta: { paymentId, reason: reason || "refund" },
      },
    });
    return tx.payment.findUnique({
      where: { id: paymentId },
      include: { user: { select: { email: true } } },
    });
  });
}
