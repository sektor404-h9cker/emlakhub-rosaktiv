const STAGES = new Set(["explore", "analysis", "decision", "auction", "result"]);

function idList(value, limit = 200) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const id = String(item || "").trim().slice(0, 80);
    if (!id || out.includes(id)) continue;
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}

function deals(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.id || "").trim().slice(0, 80);
    const lotId = String(item.lotId || "").trim().slice(0, 80);
    if (!id || !lotId) continue;
    const stage = STAGES.has(item.stage) ? item.stage : "explore";
    const bid =
      item.bid == null || item.bid === ""
        ? null
        : Number.isFinite(Number(item.bid))
          ? Number(item.bid)
          : null;
    out.push({
      id,
      lotId,
      stage,
      bid,
      noteAz: String(item.noteAz || "").slice(0, 240),
      noteRu: String(item.noteRu || "").slice(0, 240),
      updatedAt: String(item.updatedAt || "").slice(0, 40),
    });
    if (out.length >= 200) break;
  }
  return out;
}

export function sanitizeWorkspace(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    watchlist: idList(source.watchlist),
    compare: idList(source.compare, 3),
    deals: deals(source.deals),
    alerts: Array.isArray(source.alerts) ? source.alerts.slice(0, 50) : [],
  };
}
