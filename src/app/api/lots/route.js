/**
 * GET  /api/lots — published (PRO) или все (?admin=1)
 * POST /api/lots — создать (admin)
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  requireSession,
  requireProUser,
  requireAdmin,
  isAdminRole,
} from "@/lib/auth/guards";
import {
  listPublishedLots,
  listAllLots,
  createLot,
} from "@/lib/db/lots";

function apiError(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[lots]", err);
  const error =
    status >= 500
      ? "База временно недоступна. Попробуйте позже."
      : err.message || "Request failed";
  return NextResponse.json(
    { error, lots: [], unavailable: status >= 500 },
    { status: status >= 500 ? 503 : status }
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminView = searchParams.get("admin") === "1";

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { lots: [], configured: false, error: "База не настроена." },
      { status: 503 }
    );
  }

  try {
    const session = requireSession(await getSessionFromCookies());
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (adminView && isAdminRole(session.role)) {
      const lots = await listAllLots();
      return NextResponse.json({ lots, configured: true });
    }

    requireProUser(user);
    const lots = await listPublishedLots();
    return NextResponse.json({ lots, configured: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const body = await request.json();
    const lot = await createLot(body);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `Lot created: ${lot.registryNo || lot.id}`,
        level: "info",
      },
    });
    return NextResponse.json({ lot });
  } catch (e) {
    return apiError(e);
  }
}
