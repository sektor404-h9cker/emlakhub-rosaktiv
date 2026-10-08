/**
 * PATCH / DELETE /api/lots/[id]
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin } from "@/lib/auth/guards";
import { updateLot, deleteLot, getLotById } from "@/lib/db/lots";

function apiError(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[lots/id]", err);
  const error =
    status >= 500
      ? "База временно недоступна. Попробуйте позже."
      : err.message || "Request failed";
  return NextResponse.json(
    { error, unavailable: status >= 500 },
    { status: status >= 500 ? 503 : status }
  );
}

export async function GET(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена.", configured: false },
      { status: 503 }
    );
  }
  try {
    await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    const lot = await getLotById(id);
    if (!lot) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ lot });
  } catch (e) {
    return apiError(e);
  }
}

export async function PATCH(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена.", configured: false },
      { status: 503 }
    );
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    const body = await request.json();
    const lot = await updateLot(id, body);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `Lot updated: ${lot.id} → ${lot.status}`,
        level: "info",
      },
    });
    return NextResponse.json({ lot });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена.", configured: false },
      { status: 503 }
    );
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    const { id } = await context.params;
    await deleteLot(id);
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `Lot deleted: ${id}`,
        level: "warn",
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
