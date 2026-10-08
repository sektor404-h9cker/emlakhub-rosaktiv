/**
 * =============================================================================
 * ПОДПИСКА Free / PRO - цены AZN и лимиты доступа
 * =============================================================================
 * Файл: src/lib/subscription.js
 *
 * Бизнес-правило (Азербайджан):
 *   Месячный тариф ≤ 15 ₼ - иначе конверсия падает.
 *   Без активного PRO инвестор не видит лоты и разделы терминала.
 *
 * Где хранится в БД (PostgreSQL):
 *   users.subscription_plan / subscription_starts_at / subscription_expires_at
 *   payments.* - журнал транзакций (см. prisma/schema.prisma)
 * =============================================================================
 */

export const PLANS = {
  FREE: "free",
  PRO: "pro",
};

/** Валюта продукта */
export const CURRENCY = "AZN";
export const CURRENCY_SYMBOL = "₼";

/**
 * Тарифы PRO (манат).
 * month  9.90  - якорь &lt; 15 ₼
 * quarter 24.90 - выгоднее помесячки
 * year   79.90 - максимум скидки
 */
export const PLAN_PRICES = {
  month: {
    id: "pro_month",
    days: 30,
    amount: 9.9,
    labelAz: "1 ay",
    labelRu: "1 месяц",
    labelEn: "1 month",
  },
  quarter: {
    id: "pro_quarter",
    days: 90,
    amount: 24.9,
    labelAz: "3 ay",
    labelRu: "3 месяца",
    labelEn: "3 months",
  },
  year: {
    id: "pro_year",
    days: 365,
    amount: 79.9,
    labelAz: "1 il",
    labelRu: "1 год",
    labelEn: "1 year",
  },
};

/**
 * Free = витрина закрыта.
 * Список лотов, карта, сравнение, документы, алерты, избранное - только PRO.
 */
export const FREE_LIMITS = {
  maxLotOpens: 0,
  allowCompare: false,
  allowPortfolio: false,
  allowMap: false,
  allowDocuments: false,
  allowAlerts: false,
  allowWatchlist: false,
  allowBrowseLots: false,
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
};

export function defaultSubscription(plan = PLANS.FREE, days = 0) {
  const now = Date.now();
  const pro = plan === PLANS.PRO && days > 0;
  return {
    plan: pro ? PLANS.PRO : PLANS.FREE,
    startsAt: pro ? now : null,
    expiresAt: pro ? now + days * 86400000 : null,
    source: "system",
    updatedAt: now,
  };
}

export function isProActive(subscription) {
  if (!subscription || subscription.plan !== PLANS.PRO) return false;
  if (!subscription.expiresAt) return true;
  return subscription.expiresAt > Date.now();
}

export function isSubscriptionExpired(subscription) {
  if (!subscription) return false;
  if (subscription.plan !== PLANS.PRO) return false;
  if (!subscription.expiresAt) return false;
  return subscription.expiresAt <= Date.now();
}

export function daysLeft(subscription) {
  if (!isProActive(subscription) || !subscription?.expiresAt) return null;
  return Math.max(
    0,
    Math.ceil((subscription.expiresAt - Date.now()) / 86400000)
  );
}

/** Окно активности для UI: «с … по …» */
export function subscriptionWindow(subscription) {
  const active = isProActive(subscription);
  return {
    active,
    plan: subscription?.plan || PLANS.FREE,
    startsAt: subscription?.startsAt || null,
    expiresAt: subscription?.expiresAt || null,
    source: subscription?.source || null,
  };
}

export function formatExpiry(expiresAt, locale = "ru") {
  if (!expiresAt) {
    if (locale === "az") return "Limitsiz";
    if (locale === "en") return "Unlimited";
    return "Бессрочно";
  }
  const loc =
    locale === "az" ? "az-AZ" : locale === "en" ? "en-GB" : "ru-RU";
  return new Date(expiresAt).toLocaleDateString(loc, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(amount, locale = "ru") {
  const n = Number(amount) || 0;
  const loc =
    locale === "az" ? "az-AZ" : locale === "en" ? "en-GB" : "ru-RU";
  return `${n.toLocaleString(loc, {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })} ${CURRENCY_SYMBOL}`;
}

/** Добавить / убрать дни PRO. При уходе в минус - Free. */
export function adjustSubscriptionDays(subscription, deltaDays) {
  const delta = Number(deltaDays) || 0;
  if (!delta) return subscription || defaultSubscription(PLANS.FREE);

  const now = Date.now();
  let base =
    subscription?.plan === PLANS.PRO && subscription?.expiresAt
      ? Math.max(subscription.expiresAt, now)
      : now;

  if (subscription?.plan === PLANS.PRO && !subscription?.expiresAt) {
    base = now + 365 * 86400000;
  }

  const expiresAt = base + delta * 86400000;
  if (expiresAt <= now) {
    return defaultSubscription(PLANS.FREE);
  }
  return {
    ...(subscription || {}),
    plan: PLANS.PRO,
    startsAt: subscription?.startsAt || now,
    expiresAt,
    source: subscription?.source || "admin",
    updatedAt: now,
  };
}

/** Построить окно подписки из оплаченного тарифа */
export function subscriptionFromPlan(planKey, source = "payment") {
  const price = PLAN_PRICES[planKey] || PLAN_PRICES.month;
  const now = Date.now();
  return {
    plan: PLANS.PRO,
    startsAt: now,
    expiresAt: now + price.days * 86400000,
    source,
    lastPlanId: price.id,
    updatedAt: now,
  };
}
