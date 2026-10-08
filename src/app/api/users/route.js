/**
 * GET  /api/users — список (admin); ?role=investor|admin|…
 * POST /api/users — создать пользователя (admin)
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/guards";
import { listUsers, createUser } from "@/lib/db/users";
import prisma from "@/lib/db/prisma";

function apiError(err) {
  return NextResponse.json(
    { error: err.message || "Server error" },
    { status: err.status || 500 }
  );
}

export async function GET(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ users: [], configured: false });
  }
  try {
    await requireAdmin(await getSessionFromCookies());
    const role = new URL(request.url).searchParams.get("role") || undefined;
    const users = await listUsers({ role: role || undefined });
    return NextResponse.json({ configured: true, users });
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
    const profile = await createUser(body);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `User created: ${profile.email} (${profile.role})`,
        level: "warn",
      },
    });
    return NextResponse.json({ user: profile });
  } catch (e) {
    return apiError(e);
  }
}
