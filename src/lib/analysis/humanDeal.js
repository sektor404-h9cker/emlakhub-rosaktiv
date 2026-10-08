/**
 * Человеческие подписи поверх уже посчитанного Investment Engine.
 * Новых денег здесь нет: только выбор фразы по готовым полям.
 */

export function gapBetweenStartAndMarket(start, median) {
  if (start == null || median == null) return null;
  const a = Number(start);
  const b = Number(median);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) * 100) / 100;
}

export function asksStillOpen(blockedBecause = []) {
  const order = [
    "user_sale_unknown",
    "user_sale_invalid",
    "repair_unknown",
    "repair_invalid",
    "other_unknown",
    "other_invalid",
    "desired_unknown",
    "desired_invalid",
    "market_unavailable",
    "market_low",
    "market_unconfirmed",
    "sale_anchor_missing",
  ];
  return order.filter((id) => blockedBecause.includes(id));
}

/**
 * @returns {"loss"|"above"|"borderline"|"interesting"|"missing"|"no_market"|"pending"}
 */
export function humanOutcome({
  usableForValuation,
  limitReady,
  atBid,
  blockedBecause = [],
  saleSource,
} = {}) {
  const profit = atBid?.profit;
  if (profit != null && Number(profit) < 0) return "loss";
  if (atBid?.status === "above") return "above";
  if (atBid?.status === "borderline") return "borderline";
  if (limitReady && atBid?.status === "good") return "interesting";
  if (usableForValuation === false && saleSource !== "user") return "no_market";
  if (
    blockedBecause.includes("repair_unknown") ||
    blockedBecause.includes("other_unknown") ||
    blockedBecause.includes("desired_unknown") ||
    blockedBecause.includes("user_sale_unknown")
  ) {
    return "missing";
  }
  if (!limitReady) return profit != null ? "pending" : "missing";
  return "pending";
}

export function ladderTone(row) {
  if (row?.profit != null && Number(row.profit) < 0) return "loss";
  if (row?.status === "above") return "above";
  if (row?.status === "borderline") return "thin";
  if (row?.status === "good") return "room";
  return "plain";
}
