/**
 * Подписка Free / PRO — лимиты и хелперы
 */

export const PLANS = {
  FREE: "free",
  PRO: "pro",
};

export const PLAN_PRICES = {
  month: { id: "pro_month", days: 30, amount: 49, labelAz: "1 ay", labelRu: "1 месяц" },
  quarter: { id: "pro_quarter", days: 90, amount: 119, labelAz: "3 ay", labelRu: "3 месяца" },
  year: { id: "pro_year", days: 365, amount: 399, labelAz: "1 il", labelRu: "1 год" },
};

/** Бесплатно: список виден, открыть можно только N карточек */
export const FREE_LIMITS = {
  maxLotOpens: 2,
  allowCompare: false,
  allowPortfolio: false,
  allowMap: false,
  allowDocuments: false,
  allowAlerts: false,
  allowWatchlist: true, // избранное можно, но без глубокого анализа
};

export function defaultSubscription(plan = PLANS.FREE, days = 0) {
  const now = Date.now();
  return {
    plan,
    expiresAt: plan === PLANS.PRO && days > 0 ? now + days * 86400000 : null,
    source: "demo",
    updatedAt: now,
  };
}

export function isProActive(subscription) {
  if (!subscription || subscription.plan !== PLANS.PRO) return false;
  if (!subscription.expiresAt) return true; // бессрочный PRO (админы)
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
  return Math.max(0, Math.ceil((subscription.expiresAt - Date.now()) / 86400000));
}

export function formatExpiry(expiresAt, locale = "ru") {
  if (!expiresAt) return locale === "az" ? "Limitsiz" : "Бессрочно";
  return new Date(expiresAt).toLocaleDateString(locale === "az" ? "az-AZ" : "ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
