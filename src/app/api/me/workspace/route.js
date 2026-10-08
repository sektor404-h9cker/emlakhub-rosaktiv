/**
 * Per-user watchlist, compare, portfolio, alerts.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import prisma from "@/lib/db/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent } from "@/lib/auth/guards";
import { sanitizeWorkspace } from "@/lib/workspace/shape";

function fail(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[workspace]", err);
  return NextResponse.json(
    { error: status >= 500 ? "Не удалось сохранить данные. Попробуйте ещё раз." : err.message },
    { status: status >= 500 ? 503 : status }
  );
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false, workspace: null }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const row = await prisma.userWorkspace.findUnique({
      where: { userId: session.userId },
    });
    if (!row) return NextResponse.json({ workspace: null });
    return NextResponse.json({
      workspace: {
        watchlist: row.watchlist,
        compare: row.compare,
        deals: row.deals,
        alerts: row.alerts,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    return fail(err);
  }
}

export async function PUT(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const body = await request.json();
    const data = sanitizeWorkspace(body);
    const row = await prisma.userWorkspace.upsert({
      where: { userId: session.userId },
      create: { userId: session.userId, ...data },
      update: data,
    });
    return NextResponse.json({
      ok: true,
      workspace: {
        watchlist: row.watchlist,
        compare: row.compare,
        deals: row.deals,
        alerts: row.alerts,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    return fail(err);
  }
}
