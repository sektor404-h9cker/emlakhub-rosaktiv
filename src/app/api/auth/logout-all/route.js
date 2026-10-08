/**
 * Invalidates every session of the current user, including this cookie.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import {
  clearSessionCookie,
  getSessionFromCookies,
  revokeUserSessions,
} from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/guards";

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = requireSession(await getSessionFromCookies());
    await revokeUserSessions(session.userId);
    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[logout-all]", err);
    return NextResponse.json(
      { error: status >= 500 ? "Не удалось завершить сессии." : err.message },
      { status: status >= 500 ? 503 : status }
    );
  }
}
