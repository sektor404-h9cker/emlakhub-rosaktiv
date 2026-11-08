/**
 * POST /api/admin/herrac/sync
 * Admin session ИЛИ заголовок x-cron-secret = CRON_SECRET
 *
 * Body (optional):
 * {
 *   forceDiscovery?: boolean,
 *   seedIds?: string[],
 *   maxDetails?: number,
 *   categoryIds?: string[]
 * }
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import prisma from "@/lib/db/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isAdminRole } from "@/lib/auth/guards";
import { endSync, syncHerracLots, tryBeginSync } from "@/lib/herrac/sync";
import { assertCurrentConsent } from "@/lib/legal/consent";
import {
  markSyncFinished,
  readSyncState,
  syncHealth,
  syncRunBlocked,
} from "@/lib/herrac/syncStatus";

export const maxDuration = 300;

async function authorize(request, session) {
  const cronSecret = process.env.CRON_SECRET;
  const header = request.headers.get("x-cron-secret");
  if (cronSecret && header && header === cronSecret) {
    return { ok: true, via: "cron", email: "cron@emlak-hub" };
  }
  if (session?.userId && isAdminRole(session.role)) {
    await assertCurrentConsent(session.userId);
    return { ok: true, via: "admin", email: session.email || "admin" };
  }
  return { ok: false };
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const session = await getSessionFromCookies();
  const auth = await authorize(request, session);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (syncRunBlocked(await readSyncState())) {
    return NextResponse.json({ error: "Sync already running" }, { status: 409 });
  }

  const opts = {
    forceDiscovery: Boolean(body.forceDiscovery),
    seedIds: Array.isArray(body.seedIds) ? body.seedIds.map(String) : [],
    maxDetails: body.maxDetails != null ? Number(body.maxDetails) : undefined,
    categoryIds: Array.isArray(body.categoryIds)
      ? body.categoryIds.map(String)
      : undefined,
    actorEmail: auth.email,
  };

  if (body.wait === true) {
    try {
      const report = await syncHerracLots(opts);
      const sync = await markSyncFinished(report.counts, null);
      return NextResponse.json({ ok: true, via: auth.via, report, sync });
    } catch (e) {
      return finishSyncError(e);
    }
  }

  if (!tryBeginSync()) {
    return NextResponse.json({ error: "Sync already running" }, { status: 409 });
  }

  const run = syncHerracLots({ ...opts, alreadyLocked: true })
    .then(async (report) => {
      await markSyncFinished(report.counts, null);
    })
    .catch(async (e) => {
      console.error("[herrac/sync]", e);
      try {
        await markSyncFinished(
          { received: 0, created: 0, updated: 0, failed: 1, outcome: "failed" },
          e
        );
      } catch (statusErr) {
        console.error("[herrac/sync status]", statusErr);
      }
    })
    .finally(() => {
      endSync();
    });
  void run;

  return NextResponse.json(
    { ok: true, started: true, via: auth.via },
    { status: 202 }
  );
}

async function finishSyncError(e) {
  if (e?.code === "SYNC_IN_PROGRESS") {
    return NextResponse.json({ error: "Sync already running" }, { status: 409 });
  }
  console.error("[herrac/sync]", e);
  try {
    await markSyncFinished({ received: 0, created: 0, updated: 0, failed: 1 }, e);
  } catch (statusErr) {
    console.error("[herrac/sync status]", statusErr);
  }
  return NextResponse.json(
    { error: "Hərrac временно недоступен. Попробуйте позже." },
    { status: 503 }
  );
}

export async function GET(request) {
  // лёгкий статус для админки / cron ping
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false });
  }
  const session = await getSessionFromCookies();
  const auth = await authorize(request, session);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sync = await readSyncState();
  const rows = await prisma.auditLog.findMany({
    where: { action: "herrac_sync_run" },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { createdAt: true, level: true, meta: true },
  });
  const history = rows.map((row) => {
    const meta = row.meta && typeof row.meta === "object" ? row.meta : {};
    const counts = meta.counts || {};
    return {
      startedAt: meta.startedAt || row.createdAt,
      finishedAt: meta.finishedAt || null,
      received: counts.received ?? 0,
      created: counts.created ?? 0,
      updated: counts.updated ?? 0,
      unchanged: counts.unchanged ?? meta.classify?.unchanged ?? 0,
      closed: counts.closed ?? meta.classify?.absent ?? 0,
      failed: counts.failed ?? 0,
      status: meta.outcome || (row.level === "warn" || (counts.failed || 0) > 0 ? "warn" : "ok"),
      durationMs:
        meta.startedAt && meta.finishedAt
          ? new Date(meta.finishedAt).getTime() - new Date(meta.startedAt).getTime()
          : null,
    };
  });
  const latest = rows[0]?.meta && typeof rows[0].meta === "object" ? rows[0].meta : {};
  return NextResponse.json({
    configured: true,
    scheduled: false,
    sync,
    health: syncHealth(sync),
    history,
    journal: Array.isArray(latest.journal) ? latest.journal.slice(-40) : [],
    events: Array.isArray(latest.events) ? latest.events.slice(-80) : [],
    hint: "POST runs one sync. A clock is not configured in this app.",
  });
}
