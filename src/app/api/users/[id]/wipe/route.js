import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/guards";
import { wipeUserSensitive } from "@/lib/db/users";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/security/rateLimit";

export async function POST(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const gate = rateLimit({
      key: `admin-wipe:${session.userId}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "Слишком много опасных действий. Подождите." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
      );
    }
    const { id } = await context.params;
    const user = await wipeUserSensitive(id);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `User wipe: ${user.email}`,
        level: "warn",
      },
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: e.status || 500 }
    );
  }
}
