/**
 * Сравнение списка Hərrac с уже сохранёнными лотами.
 * Не решает, закрыт ли аукцион: отсутствие в неполном списке ничего не значит.
 */

export function listFingerprint(item) {
  if (!item || typeof item !== "object") return null;
  const price =
    item.initialPrice ??
    item.startPrice ??
    item.price ??
    item.lotPrice ??
    item.currentPrice ??
    item.lastBidPrice ??
    item.lastBid ??
    null;
  const status = item.status ?? item.auctionStatus ?? item.herracStatus ?? null;
  const end = item.validUntil ?? item.endDate ?? item.endAt ?? null;
  if (price == null && status == null && end == null) return null;
  return JSON.stringify({
    price: price == null ? null : String(price),
    status: status == null ? null : String(status),
    end: end == null ? null : String(end),
  });
}

/**
 * @param {Map<string, { listFingerprint?: string|null, source?: string }>} existingById
 * @param {object[]} items
 * @param {{ complete?: boolean }} [opts]
 */
export function classifyDiscovered(existingById, items, opts = {}) {
  const seen = new Set();
  const needDetail = [];
  let fresh = 0;
  let changed = 0;
  let unchanged = 0;

  for (const item of items || []) {
    const id = String(item?.id || item?.auctionId || "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const prev = existingById.get(id);
    const fp = listFingerprint(item);
    if (!prev) {
      fresh += 1;
      needDetail.push({ id, reason: "new", fingerprint: fp, slug: item.slug });
      continue;
    }
    if (fp && prev.listFingerprint && prev.listFingerprint === fp) {
      unchanged += 1;
      continue;
    }
    changed += 1;
    needDetail.push({
      id,
      reason: fp ? "changed" : "unchecked",
      fingerprint: fp,
      slug: item.slug,
    });
  }

  const absent = [];
  if (opts.complete) {
    for (const [id, prev] of existingById) {
      if (seen.has(id)) continue;
      if (prev?.source && prev.source !== "herrac") continue;
      absent.push(id);
    }
  }

  return { fresh, changed, unchanged, absent, needDetail };
}
