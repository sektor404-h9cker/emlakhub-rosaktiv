export const FORMULA_VERSION = "invest-v1";

const CHOICES = new Set([
  "unknown",
  "none",
  "zero",
  "1000",
  "2000",
  "amount",
]);

function choice(value, fallback) {
  return CHOICES.has(value) ? value : fallback;
}

function shortText(value, max = 24) {
  return String(value ?? "").slice(0, max);
}

export function sanitizeScenarioInputs(raw) {
  const src = raw && typeof raw === "object" ? raw : {};
  return {
    repairChoice: choice(src.repairChoice, "unknown"),
    repairAmount: shortText(src.repairAmount),
    reserveChoice: choice(src.reserveChoice, "unknown"),
    reserveAmount: shortText(src.reserveAmount),
    extraChoice: choice(src.extraChoice, "unknown"),
    extraAmount: shortText(src.extraAmount),
    paperworkChoice: choice(src.paperworkChoice, "unknown"),
    paperworkAmount: shortText(src.paperworkAmount),
    commissionChoice: choice(src.commissionChoice, "unknown"),
    commissionAmount: shortText(src.commissionAmount),
    prepChoice: choice(src.prepChoice, "unknown"),
    prepAmount: shortText(src.prepAmount),
    desiredChoice: choice(src.desiredChoice, "unknown"),
    desiredAmount: shortText(src.desiredAmount),
    desiredPct: shortText(src.desiredPct),
    sellOn: src.sellOn !== false,
    sellPct: shortText(src.sellPct || "3"),
    sellTouched: Boolean(src.sellTouched),
    bidText: shortText(src.bidText),
    bidTouched: Boolean(src.bidTouched),
    userSaleAmount: shortText(src.userSaleAmount, 16),
    saleBasis: src.saleBasis === "user" ? "user" : "market",
    saleScenario: ["conservative", "market", "optimistic"].includes(src.saleScenario)
      ? src.saleScenario
      : "market",
  };
}

export function moneyOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 1e12) return null;
  return Math.round(n * 100) / 100;
}
