import prisma from "@/lib/db/prisma";
import { PLANS } from "@/lib/subscription";
import { ensureReferralCode, readGrowthConfig } from "./service";

const STATUS_LABEL = {
  registered: { az: "Qeydiyyatdan keçdi", ru: "Зарегистрировался", en: "Registered" },
  awaiting_payment: { az: "İlk ödənişi gözləyir", ru: "Ожидает первую оплату", en: "Waiting for the first payment" },
  rewarded: { az: "Bonus yazılıb", ru: "Бонус начислен", en: "Bonus added" },
  cancelled: { az: "Bonus ləğv edilib", ru: "Бонус отменён", en: "Bonus cancelled" },
};

export async function referralSummary(userId) {
  const code = await ensureReferralCode(userId);
  const rows = await prisma.referral.findMany({
    where: { referrerId: userId },
    orderBy: { createdAt: "desc" },
    include: { grants: true },
  });
  const bonusDays = rows
    .flatMap((row) => row.grants)
    .filter((grant) => grant.userId === userId && grant.status === "granted")
    .reduce((sum, grant) => sum + grant.days, 0);
  return {
    code: code.code,
    invited: rows.length,
    paid: rows.filter((row) => row.status === "rewarded").length,
    waiting: rows.filter((row) => row.status === "registered" || row.status === "awaiting_payment").length,
    bonusDays,
    history: rows.map((row) => ({
      at: row.createdAt,
      status: row.status,
      label: STATUS_LABEL[row.status] || STATUS_LABEL.registered,
      days: row.grants
        .filter((grant) => grant.userId === userId && grant.status === "granted")
        .reduce((sum, grant) => sum + grant.days, 0),
    })),
  };
}

export async function growthReport() {
  const now = new Date();
  const week = new Date(now.getTime() - 7 * 86400000);
  const month = new Date(now.getTime() - 30 * 86400000);
  const [users, weekUsers, monthUsers, proUsers, paid, referrals, rewarded, grants, config] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: week } } }),
    prisma.user.count({ where: { createdAt: { gte: month } } }),
    prisma.user.count({
      where: { subscriptionPlan: PLANS.PRO, subscriptionExpiresAt: { gt: now } },
    }),
    prisma.payment.findMany({ where: { status: "paid" }, select: { amount: true, createdAt: true, userId: true } }),
    prisma.referral.count(),
    prisma.referral.count({ where: { status: "rewarded" } }),
    prisma.referralGrant.aggregate({ where: { status: "granted" }, _sum: { days: true } }),
    readGrowthConfig(),
  ]);
  const revenue = paid.reduce((sum, row) => sum + Number(row.amount), 0);
  const newPayments = paid.filter((row) => row.createdAt >= month).length;
  const ordered = [...paid].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const firstPaid = new Set();
  let renewals = 0;
  for (const row of ordered) {
    if (firstPaid.has(row.userId)) renewals += 1;
    else firstPaid.add(row.userId);
  }
  const payers = new Set(paid.map((row) => row.userId));
  const expired = await prisma.user.count({
    where: { subscriptionPlan: PLANS.PRO, subscriptionExpiresAt: { lte: now } },
  });
  const createdPayments = await prisma.payment.findMany({
    select: { userId: true },
    distinct: ["userId"],
  });
  const suspicious = await prisma.referral.findMany({
    where: { suspicious: true },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, status: true, createdAt: true, signals: true },
  });
  const ledger = await prisma.referralGrant.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    select: {
      id: true,
      role: true,
      days: true,
      status: true,
      createdAt: true,
      paymentId: true,
      reverseReason: true,
    },
  });
  return {
    config,
    metrics: {
      registered: users,
      new7: weekUsers,
      new30: monthUsers,
      activePro: proUsers,
      revenue: Math.round(revenue * 100) / 100,
      newPayments,
      renewals,
      expired,
      referralSignups: referrals,
      referralPayments: rewarded,
      bonusDays: grants._sum.days || 0,
    },
    funnel: {
      registered: users,
      chosePlan: createdPayments.length,
      confirmedPayment: payers.size,
    },
    suspicious,
    ledger,
  };
}
