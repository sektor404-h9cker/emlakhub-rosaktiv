/**
 * Admin action: every existing JWT stops working, including the caller's.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import {
  clearSessionCookie,
  getSessionFromCookies,
  revokeAllSessions,
} from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/guards";
import prisma from "@/lib/db/prisma";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    await revokeAllSessions();
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: "Revoke all sessions",
        level: "warn",
      },
    });
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[sessions/revoke]", err);
    return NextResponse.json(
      { error: status >= 500 ? "Не удалось отозвать сессии." : err.message || "Forbidden" },
      { status: status >= 500 ? 503 : status }
    );
  }
}
