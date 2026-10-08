/**
 * Статус и уровень тикета. Удалить обращение может только сотрудник.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent, isAdminRole } from "@/lib/auth/guards";
import {
  deleteSupportTicket,
  getSupportTicket,
  updateSupportTicket,
} from "@/lib/db/support";

function apiError(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[support]", err);
  const error =
    status >= 500
      ? "Поддержка временно недоступна. Попробуйте позже."
      : err.message || "Request failed";
  return NextResponse.json(
    { error, unavailable: status >= 500 },
    { status: status >= 500 ? 503 : status }
  );
}

async function loadOwned(id, session) {
  const row = await getSupportTicket(id);
  if (!row) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  const staff = isAdminRole(session.role);
  if (!staff && row.userId !== session.userId) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  return { row, staff };
}

export async function PATCH(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const { id } = await context.params;
    const { staff } = await loadOwned(id, session);
    const body = await request.json();
    const patch = {};
    if (body.status != null) {
      const status = String(body.status);
      const allowed = staff
        ? ["open", "waiting", "closed"]
        : ["open", "closed"];
      if (!allowed.includes(status)) {
        return NextResponse.json({ error: "Неизвестный статус." }, { status: 400 });
      }
      patch.status = status;
    }
    if (body.level != null) {
      if (!staff) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const level = String(body.level);
      if (level !== "L1" && level !== "L2") {
        return NextResponse.json({ error: "Неизвестный уровень." }, { status: 400 });
      }
      patch.level = level;
    }
    if (!patch.status && !patch.level) {
      return NextResponse.json({ error: "Нечего менять." }, { status: 400 });
    }
    const ticket = await updateSupportTicket(id, patch);
    return NextResponse.json({ ticket });
  } catch (e) {
    return apiError(e);
  }
}

export async function DELETE(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    if (!isAdminRole(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const row = await getSupportTicket(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await deleteSupportTicket(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
