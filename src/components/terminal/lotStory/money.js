export function money(n) {
  if (n == null || n === "" || !Number.isFinite(Number(n))) return "—";
  const value = Math.round(Number(n));
  const sign = value < 0 ? "−" : "";
  const grouped = Math.abs(value).toLocaleString("ru-RU");
  return `${sign}${grouped} ₼`;
}

export function moneyRange(low, high) {
  if (low == null || high == null) return null;
  if (!Number.isFinite(Number(low)) || !Number.isFinite(Number(high))) return null;
  return `${money(low)} – ${money(high)}`;
}
