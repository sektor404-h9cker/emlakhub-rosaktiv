/**
 * Общие данные админки (не localStorage).
 * GET — любой вошедший пользователь (инвестору нужен баннер обслуживания).
 * PUT — только сотрудник.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { isAdminRole, requireAdmin, requireSession } from "@/lib/auth/guards";
import { readPlatformState, writePlatformState } from "@/lib/db/platform";
import { listUsers } from "@/lib/db/users";

function unavailable() {
  return NextResponse.json(
    { error: "База временно недоступна. Попробуйте позже." },
    { status: 503 }
  );
}

function stripShared(ops) {
  if (!ops || typeof ops !== "object" || Array.isArray(ops)) return {};
  const { payments, tickets, adminLots, users, ...rest } = ops;
  void payments;
  void tickets;
  void adminLots;
  void users;
  return rest;
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false, canWrite: false });
  }
  try {
    const session = requireSession(await getSessionFromCookies());
    const canWrite = isAdminRole(session.role);
    const state = await readPlatformState();
    const users = canWrite ? await listUsers() : [];
    return NextResponse.json({
      configured: true,
      canWrite,
      system: state.system,
      ops: state.ops,
      users,
    });
  } catch (e) {
    if (e.status === 401 || e.status === 403) {
      return NextResponse.json({ configured: true, canWrite: false });
    }
    console.error("[platform]", e);
    return unavailable();
  }
}

export async function PUT(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена." },
      { status: 503 }
    );
  }
  try {
    await requireAdmin(await getSessionFromCookies());
    const body = await request.json();
    const system =
      body?.system && typeof body.system === "object" ? body.system : {};
    const ops = stripShared(body?.ops);
    const raw = JSON.stringify({ system, ops });
    if (raw.length > 1_500_000) {
      return NextResponse.json(
        { error: "Слишком большой объём настроек." },
        { status: 400 }
      );
    }
    await writePlatformState({ system, ops });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.status) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[platform]", e);
    return unavailable();
  }
}
