/**
 * PATCH  /api/users/[id] — обновить
 * DELETE /api/users/[id] — удалить
 * POST   /api/users/[id]/wipe — стереть чувствительные поля
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/guards";
import {
  updateUser,
  deleteUser,
  wipeUserSensitive,
  getUserById,
} from "@/lib/db/users";
import prisma from "@/lib/db/prisma";

function apiError(err) {
  return NextResponse.json(
    { error: err.message || "Server error" },
    { status: err.status || 500 }
  );
}

export async function GET(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    const body = await request.json();
    const user = await updateUser(id, body);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `User updated: ${user.email}`,
        level: "info",
      },
    });
    return NextResponse.json({ user });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    await deleteUser(id);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `User deleted: ${id}`,
        level: "warn",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
