/**
 * Инкрементальный синк herrac → Postgres.
 * Discovery (list) редко; detail — точечно по новым / срочным / устаревшим.
 */
import prisma from "@/lib/db/prisma";
import { upsertLotByRegistry } from "@/lib/db/lots";
import {
  DEFAULT_SYNC_CATEGORY_IDS,
  HERRAC_RATE,
} from "./constants";
import { discoverAuctions, fetchAuctionDetail } from "./client";
import { classifyDiscovered } from "./classify";
import { mapHerracDetailToLot } from "./mapLot";
import { classifySyncOutcome, markSyncAttempt, readSyncState, syncRunBlocked } from "./syncStatus";

const META_KEY = "herrac_sync_meta";
let syncActive = false;

export function tryBeginSync() {
  if (syncActive) return false;
  syncActive = true;
  return true;
}

export function endSync() {
  syncActive = false;
}

async function readMeta() {
  const row = await prisma.auditLog.findFirst({
    where: { action: META_KEY },
    orderBy: { createdAt: "desc" },
  });
  return row?.meta && typeof row.meta === "object" ? row.meta : {};
}

async function writeMeta(meta, actorEmail = "system@herrac-sync") {
  await prisma.auditLog.create({
    data: {
      actorEmail,
      action: META_KEY,
      level: "info",
      meta,
    },
  });
}

function hoursSince(iso) {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return Infinity;
  return (Date.now() - t) / 3600000;
}

function endingSoon(validUntil, hours = 48) {
  if (!validUntil) return false;
  const end = new Date(validUntil).getTime();
  if (!Number.isFinite(end)) return false;
  const left = end - Date.now();
  return left > 0 && left <= hours * 3600000;
}

/**
 * @param {{
 *   categoryIds?: string[],
 *   forceDiscovery?: boolean,
 *   seedIds?: string[],
 *   maxDetails?: number,
 *   actorEmail?: string,
 * }} [opts]
 */
export async function syncHerracLots(opts = {}) {
  const lockedHere = !opts.alreadyLocked;
  if (lockedHere && !tryBeginSync()) {
    const err = new Error("sync already running");
    err.code = "SYNC_IN_PROGRESS";
    throw err;
  }
  try {
    return await runSync(opts);
  } finally {
    if (lockedHere) endSync();
  }
}

async function runSync(opts) {
  const current = await readSyncState();
  if (syncRunBlocked(current)) {
    const err = new Error("sync already running");
    err.code = "SYNC_IN_PROGRESS";
    throw err;
  }
  await markSyncAttempt();
  const categoryIds = opts.categoryIds || DEFAULT_SYNC_CATEGORY_IDS;
  const maxDetails = opts.maxDetails ?? HERRAC_RATE.maxDetailsPerRun;
  const actorEmail = opts.actorEmail || "system@herrac-sync";
  const startedAt = new Date().toISOString();
  const requestLog = [];
  const report = {
    startedAt,
    discovery: { attempted: false, ok: false, found: 0, complete: false, truncated: false, error: null },
    details: { fetched: 0, upserted: 0, skipped: 0, errors: [] },
    classify: { fresh: 0, changed: 0, unchanged: 0, absent: 0 },
    journal: [],
    events: requestLog,
    mode: "incremental",
  };

  const meta = await readMeta();
  const lastDiscoveryAt = meta.lastDiscoveryAt || null;
  const shouldDiscover =
    opts.forceDiscovery ||
    hoursSince(lastDiscoveryAt) >= HERRAC_RATE.discoveryCooldownHours;

  /** @type {Map<string, { id: string, slug?: string, priority: number }>} */
  const queue = new Map();

  const bump = (id, priority, slug) => {
    if (!id) return;
    const prev = queue.get(id);
    if (!prev || priority > prev.priority) {
      queue.set(id, { id, slug: slug || prev?.slug, priority });
    }
  };

  // 1) Seed IDs (bootstrap / ручной дожим)
  for (const raw of opts.seedIds || []) {
    bump(String(raw), 90);
  }

  // 2) Лёгкий список. Карточку берём только для новых и изменившихся.
  let disc = null;
  if (shouldDiscover) {
    report.discovery.attempted = true;
    report.journal.push({ at: new Date().toISOString(), ru: "Проверяем список лотов", az: "Lot siyahısını yoxlayırıq", en: "Checking the lot list" });
    disc = await discoverAuctions({
      categoryIds,
      includeNotStarted: true,
      log: requestLog,
      retries: opts.listRetries ?? 2,
      ...(opts.listFilters || {}),
    });
    report.discovery.ok = disc.ok;
    report.discovery.found = disc.items.length;
    report.discovery.complete = disc.complete;
    report.discovery.truncated = disc.truncated;
    report.discovery.error = disc.error || null;
    report.journal.push({
      at: new Date().toISOString(),
      ru: `Получено ${disc.items.length} записей`,
      az: `${disc.items.length} qeyd alındı`,
      en: `Received ${disc.items.length} records`,
    });
    if (disc.complete) {
      await writeMeta(
        {
          ...meta,
          lastDiscoveryAt: startedAt,
          lastDiscoveryCount: disc.items.length,
          lastDiscoveryCategories: categoryIds,
        },
        actorEmail
      );
    }
  } else {
    report.discovery.skippedReason = `cooldown ${HERRAC_RATE.discoveryCooldownHours}h (last ${lastDiscoveryAt})`;
  }

  // 3) Уже известные лоты из БД (source=herrac)
  const existing = await prisma.lot.findMany({
    where: { registryNo: { not: null } },
    select: { id: true, registryNo: true, payload: true, updatedAt: true },
  });

  for (const row of existing) {
    const id = row.registryNo || row.payload?.herracId;
    if (!id) continue;
    const p = row.payload && typeof row.payload === "object" ? row.payload : {};
    if (p.source && p.source !== "herrac") continue;

    let priority = 20;
    const photos = Array.isArray(p.photos) ? p.photos : [];
    const missingPhotos = photos.length === 0 && !p.photo;
    if (missingPhotos) priority = 98; // анализ мог затереть payload — срочно восстановить
    else if (endingSoon(p.validUntil, 48)) priority = 95;
    else if (hoursSince(p.syncedAt) >= 20) priority = 50;
    else if (hoursSince(row.updatedAt?.toISOString?.() || row.updatedAt) >= 20)
      priority = 45;
    else priority = 10; // свежий — низкий приоритет

    bump(String(id), priority, p.herracUrl?.split("/")?.pop());
  }

  const existingById = new Map();
  for (const row of existing) {
    const id = String(row.registryNo || row.payload?.herracId || "");
    if (!id) continue;
    const p = row.payload && typeof row.payload === "object" ? row.payload : {};
    if (p.source && p.source !== "herrac") continue;
    existingById.set(id, {
      dbId: row.id,
      source: p.source || "herrac",
      listFingerprint: p.listFingerprint || null,
      payload: p,
    });
  }

  if (disc?.items?.length) {
    const classified = classifyDiscovered(existingById, disc.items, { complete: disc.complete });
    report.classify = {
      fresh: classified.fresh,
      changed: classified.changed,
      unchanged: classified.unchanged,
      absent: disc.complete ? classified.absent.length : 0,
    };
    for (const item of classified.needDetail) {
      const priority = item.reason === "new" ? 100 : 80;
      bump(item.id, priority, item.slug);
      const queued = queue.get(item.id);
      if (queued) queued.fingerprint = item.fingerprint;
    }
    if (disc.complete) {
      for (const id of classified.absent) {
        const prev = existingById.get(id);
        if (!prev?.dbId) continue;
        const now = new Date().toISOString();
        await prisma.lot.update({
          where: { id: prev.dbId },
          data: {
            payload: {
              ...prev.payload,
              activeList: "absent_from_active_list",
              absentSince: prev.payload.absentSince || now,
              sourceLastSeenAt: prev.payload.sourceLastSeenAt || null,
            },
          },
        });
      }
    }
    for (const item of disc.items) {
      const id = String(item.id || item.auctionId || "");
      const prev = existingById.get(id);
      const fp = classified.needDetail.find((row) => row.id === id);
      if (fp || !prev?.dbId) continue;
      const now = new Date().toISOString();
      await prisma.lot.update({
        where: { id: prev.dbId },
        data: {
          payload: {
            ...prev.payload,
            sourceLastSeenAt: now,
            activeList: "seen",
            listFingerprint: prev.listFingerprint,
          },
        },
      });
    }
  }

  // Сортировка по приоритету, лимит detail
  const actionable = [...queue.values()]
    .filter((item) => item.priority > 15)
    .sort((a, b) => b.priority - a.priority);
  const ordered = actionable.slice(0, maxDetails);
  report.detailCapped = actionable.length > ordered.length;

  let created = 0;
  let updated = 0;
  for (const item of ordered) {
    // свежие с низким приоритетом можно пропустить если уже синкнуты < 12ч
    if (item.priority <= 15) {
      report.details.skipped += 1;
      continue;
    }
    try {
      const detail = await fetchAuctionDetail(item.id, { log: requestLog });
      // фильтр категорий: если detail вне целевых — всё равно сохраняем, но помечаем market
      const mapped = mapHerracDetailToLot(detail, { slug: item.slug });
      // только auto+apartment по умолчанию: если category не в списке и не seed — skip
      if (
        categoryIds.length &&
        detail.categoryId &&
        !categoryIds.map(String).includes(String(detail.categoryId)) &&
        !(opts.seedIds || []).map(String).includes(item.id)
      ) {
        // техника в «Avtomobillər» всё равно category auto id — ок
        report.details.skipped += 1;
        continue;
      }
      const existed = mapped.registryNo
        ? await prisma.lot.findFirst({
            where: { registryNo: String(mapped.registryNo) },
            select: { id: true, payload: true },
          })
        : null;
      const prevPayload = existed?.payload && typeof existed.payload === "object" ? existed.payload : {};
      const now = new Date().toISOString();
      const sourceUpdated = detail.updatedAt || detail.updateDate || detail.modifiedAt || null;
      mapped.payload = {
        ...(mapped.payload || {}),
        sourceFirstSeenAt: prevPayload.sourceFirstSeenAt || now,
        sourceLastSeenAt: now,
        lastSyncedAt: now,
        sourceUpdatedAt: sourceUpdated ? String(sourceUpdated) : prevPayload.sourceUpdatedAt || null,
        listFingerprint: item.fingerprint || prevPayload.listFingerprint || null,
        activeList: "seen",
      };
      await upsertLotByRegistry(mapped);
      const title = mapped.titleRu || mapped.titleAz || item.id;
      report.journal.push({
        at: now,
        ru: existed ? `Обновлён лот ${title}` : `Новый лот: ${title}`,
        az: existed ? `Lot yeniləndi: ${title}` : `Yeni lot: ${title}`,
        en: existed ? `Updated lot ${title}` : `New lot: ${title}`,
      });
      if (existed) updated += 1;
      else created += 1;
      report.details.fetched += 1;
      report.details.upserted += 1;
    } catch (e) {
      report.details.errors.push({
        id: item.id,
        message: e.message || String(e),
      });
    }
  }

  const judged = classifySyncOutcome(report);
  report.mode = judged.mode;
  report.outcome = judged.outcome;
  report.catalogStatus = judged.catalogStatus;
  report.detailStatus = judged.detailStatus;
  report.counts = {
    received: report.discovery.attempted ? report.discovery.found : ordered.length,
    created,
    updated,
    unchanged: report.classify.unchanged,
    closed: report.classify.absent,
    failed: report.details.errors.length,
    discoveredNew: report.classify.fresh,
    outcome: judged.outcome,
    catalogStatus: judged.catalogStatus,
    detailStatus: judged.detailStatus,
    error:
      judged.outcome === "success"
        ? null
        : report.discovery.error || report.details.errors[0]?.message || null,
  };
  const closing =
    judged.outcome === "partial" && judged.catalogStatus === "unavailable"
      ? {
          ru: "Известные лоты обновлены. Полнота новых поступлений не проверена",
          az: "Məlum lotlar yeniləndi. Yeni lotların tamlığı yoxlanmayıb",
          en: "Known lots were updated. New arrivals were not fully checked",
        }
      : judged.outcome === "success"
        ? {
            ru: `Полный список сверен. Новых: ${report.classify.fresh}. Без изменений: ${report.classify.unchanged}`,
            az: `Tam siyahı yoxlandı. Yeni: ${report.classify.fresh}. Dəyişməyən: ${report.classify.unchanged}`,
            en: `The full list was checked. New: ${report.classify.fresh}. Unchanged: ${report.classify.unchanged}`,
          }
        : {
            ru: `Проверка завершилась со статусом ${judged.outcome}. Новые лоты не подтверждены`,
            az: `Yoxlama ${judged.outcome} statusu ilə bitdi. Yeni lotlar təsdiqlənmədi`,
            en: `The check finished as ${judged.outcome}. New lots were not confirmed`,
          };
  report.journal.push({ at: new Date().toISOString(), ...closing });

  if (report.journal.length > 40) {
    report.journal = [...report.journal.slice(0, 36), ...report.journal.slice(-3)];
  }
  report.finishedAt = new Date().toISOString();
  await prisma.auditLog.create({
    data: {
      actorEmail,
      action: "herrac_sync_run",
      level: report.outcome === "success" ? "info" : "warn",
      meta: report,
    },
  });

  return report;
}
