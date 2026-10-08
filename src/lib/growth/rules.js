/**
 * Правила роста. Дни и цены здесь не читаются из браузера.
 */

export const DEFAULT_GROWTH = {
  referralEnabled: true,
  referrerDays: 7,
  referredDays: 3,
};

export function clampDays(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(90, Math.round(n)));
}

export function normalizeGrowth(raw) {
  const growth = raw && typeof raw === "object" ? raw : {};
  return {
    referralEnabled: growth.referralEnabled !== false,
    referrerDays: clampDays(growth.referrerDays, DEFAULT_GROWTH.referrerDays),
    referredDays: clampDays(growth.referredDays, DEFAULT_GROWTH.referredDays),
    prices: growth.prices && typeof growth.prices === "object" ? growth.prices : null,
  };
}

export function nextExpiry(currentExpires, now, days) {
  const extra = Math.max(0, Number(days) || 0);
  const current = currentExpires ? new Date(currentExpires) : null;
  const base = current && current.getTime() > now.getTime() ? current : now;
  return new Date(base.getTime() + extra * 86400000);
}

export function pullExpiry(currentExpires, days) {
  if (!currentExpires) return null;
  const extra = Math.max(0, Number(days) || 0);
  return new Date(new Date(currentExpires).getTime() - extra * 86400000);
}

/** Срок не уходит раньше начала оплаченного окна. */
export function boundedExpiry(startsAt, expiresAt) {
  if (!expiresAt) return expiresAt;
  const end = new Date(expiresAt);
  if (startsAt && end.getTime() < new Date(startsAt).getTime()) return new Date(startsAt);
  return end;
}

export function referralBindDecision({ referrerId, referredId, referrerEmail, referredEmail }) {
  if (!referrerId || !referredId) return { ok: false, reason: "missing" };
  if (referrerId === referredId) return { ok: false, reason: "self" };
  const a = String(referrerEmail || "").trim().toLowerCase();
  const b = String(referredEmail || "").trim().toLowerCase();
  if (a && b && a === b) return { ok: false, reason: "self" };
  return { ok: true };
}

export function bonusForPayment({ enabled, status, referrerDays, referredDays }) {
  if (!enabled) return null;
  if (status === "rewarded" || status === "cancelled") return null;
  return {
    referrerDays: clampDays(referrerDays, DEFAULT_GROWTH.referrerDays),
    referredDays: clampDays(referredDays, DEFAULT_GROWTH.referredDays),
  };
}
