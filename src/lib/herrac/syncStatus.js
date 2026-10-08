import prisma from "@/lib/db/prisma";

const ROW_ID = "main";

export function safeSyncError(err) {
  const raw = String(err?.message || err || "sync failed");
  return raw.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]").replace(/\s+/g, " ").slice(0, 180);
}

export async function readSyncState() {
  const row = await prisma.herracSyncState.findUnique({ where: { id: ROW_ID } });
  if (!row) {
    return {
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastFullSyncAt: null,
      status: "idle",
      outcome: null,
      catalogStatus: null,
      detailStatus: null,
      discoveredNew: 0,
      received: 0,
      created: 0,
      updated: 0,
      failed: 0,
      error: null,
    };
  }
  return {
    lastAttemptAt: row.lastAttemptAt,
    lastSuccessAt: row.lastSuccessAt,
    lastFullSyncAt: row.lastFullSyncAt,
    status: row.status,
    outcome: row.outcome,
    catalogStatus: row.catalogStatus,
    detailStatus: row.detailStatus,
    discoveredNew: row.discoveredNew,
    received: row.received,
    created: row.created,
    updated: row.updated,
    failed: row.failed,
    error: row.error,
  };
}

export async function markSyncAttempt() {
  const now = new Date();
  await prisma.herracSyncState.upsert({
    where: { id: ROW_ID },
    create: {
      id: ROW_ID,
      lastAttemptAt: now,
      status: "running",
      error: null,
    },
    update: {
      lastAttemptAt: now,
      status: "running",
      error: null,
    },
  });
}

/**
 * SUCCESS — список сверен и карточки, которые нужно было взять, взяты.
 * PARTIAL — полезные обновления есть, но новые лоты целиком не подтверждены.
 * FAILED — полезного результата нет.
 * BLOCKED_OR_RESTRICTED — 401, 403 или 429, и полезных данных нет. HTTP 500 сюда не входит.
 */
export function classifySyncOutcome(report = {}) {
  const discovery = report.discovery || {};
  const details = report.details || {};
  const http = Number(discovery.status || 0);
  const listOk = Boolean(discovery.ok && discovery.complete && !discovery.truncated);
  const detailsUseful = Number(details.upserted || 0) > 0;
  const detailErrors = Array.isArray(details.errors) ? details.errors.length : 0;
  const detailTried = Number(details.fetched || 0) + detailErrors > 0;
  const restricted = http === 401 || http === 403 || http === 429;
  const detailStatus = detailsUseful ? "available" : detailTried ? "unavailable" : "unknown";

  if (restricted && !listOk && !detailsUseful) {
    return {
      outcome: "blocked_or_restricted",
      mode: "unavailable",
      catalogStatus: "restricted",
      detailStatus,
    };
  }
  if (listOk && detailErrors === 0 && !report.detailCapped) {
    return {
      outcome: "success",
      mode: "full",
      catalogStatus: "available",
      detailStatus: detailTried || detailsUseful ? "available" : "unknown",
    };
  }
  if (discovery.ok && (discovery.truncated || report.detailCapped || detailErrors > 0)) {
    return {
      outcome: "partial",
      mode: "partial",
      catalogStatus: discovery.complete ? "available" : "incomplete",
      detailStatus,
    };
  }
  if (discovery.attempted && !discovery.ok && detailsUseful) {
    return {
      outcome: "partial",
      mode: "partial",
      catalogStatus: "unavailable",
      detailStatus: "available",
    };
  }
  if (!discovery.attempted && detailsUseful) {
    return {
      outcome: "partial",
      mode: "partial",
      catalogStatus: "skipped",
      detailStatus: "available",
    };
  }
  return {
    outcome: "failed",
    mode: "unavailable",
    catalogStatus: discovery.attempted ? "unavailable" : "unknown",
    detailStatus,
  };
}

export function syncRunBlocked(state, now = Date.now()) {
  if (!state || state.status !== "running" || !state.lastAttemptAt) return false;
  const age = now - new Date(state.lastAttemptAt).getTime();
  return Number.isFinite(age) && age >= 0 && age < 15 * 60 * 1000;
}

export async function markSyncFinished(counts, err) {
  const failed = Number(counts?.failed || 0);
  const outcome = err
    ? "failed"
    : counts?.outcome || (failed > 0 ? "failed" : "success");
  const useful = outcome === "success" || outcome === "partial";
  const now = new Date();
  const error = err
    ? safeSyncError(err)
    : outcome === "success"
      ? null
      : counts?.error
        ? safeSyncError(counts.error)
        : null;
  const data = {
    status: outcome,
    outcome,
    catalogStatus: counts?.catalogStatus || null,
    detailStatus: counts?.detailStatus || null,
    discoveredNew: Number(counts?.discoveredNew || 0),
    received: Number(counts?.received || 0),
    created: Number(counts?.created || 0),
    updated: Number(counts?.updated || 0),
    failed,
    error,
  };
  if (useful) data.lastSuccessAt = now;
  if (outcome === "success") data.lastFullSyncAt = now;
  await prisma.herracSyncState.upsert({
    where: { id: ROW_ID },
    create: {
      id: ROW_ID,
      lastAttemptAt: now,
      lastSuccessAt: useful ? now : null,
      lastFullSyncAt: outcome === "success" ? now : null,
      ...data,
    },
    update: data,
  });
  return readSyncState();
}

export function syncHealth(sync) {
  if (!sync || (!sync.lastAttemptAt && sync.status === "idle")) {
    return { level: "gray", key: "not_configured" };
  }
  const error = String(sync.error || "");
  const outcome = sync.outcome || sync.status;
  if (sync.status === "running") return { level: "amber", key: "running" };
  if (outcome === "blocked_or_restricted") return { level: "red", key: "restricted" };
  if (/429/.test(error) && outcome !== "partial" && outcome !== "success") {
    return { level: "amber", key: "rate_limit" };
  }
  if (outcome === "partial") return { level: "amber", key: "partial" };
  if (sync.status === "failed" || outcome === "failed") return { level: "red", key: "down" };
  if ((outcome === "success" || sync.status === "ok") && (sync.lastFullSyncAt || sync.lastSuccessAt)) {
    const age = Date.now() - new Date(sync.lastSuccessAt).getTime();
    if (Number.isFinite(age) && age > 6 * 60 * 60 * 1000) return { level: "amber", key: "slow" };
    return { level: "green", key: "ok" };
  }
  return { level: "gray", key: "not_configured" };
}
