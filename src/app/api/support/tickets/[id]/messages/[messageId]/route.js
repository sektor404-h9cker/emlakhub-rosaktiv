/**
 * Правка и удаление своего сообщения. Сотрудник может править ответ агента.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent, isAdminRole } from "@/lib/auth/guards";
import {
  deleteSupportMessage,
  getSupportTicket,
  updateSupportMessage,
} from "@/lib/db/support";

function apiError(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[support]", err);
  const error =
    status >= 500
      ? "Поддержка временно недоступна. Попробуйте позже."
      : err.message || "Request failed";
  return NextResponse.json({ error, unavailable: status >= 500 }, { status: status >= 500 ? 503 : status });
}

function canTouch(message, session, staff) {
  if (staff && message.authorRole === "agent") return true;
  return message.authorEmail === session.email;
}

export async function PATCH(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const { id, messageId } = await context.params;
    const row = await getSupportTicket(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const staff = isAdminRole(session.role);
    if (!staff && row.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const message = row.messages.find((m) => m.id === messageId);
    if (!message || !canTouch(message, session, staff)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json();
    const text = String(body.body || "").trim();
    if (!text || text.length > 4000) {
      return NextResponse.json({ error: "Пустое сообщение." }, { status: 400 });
    }
    await updateSupportMessage(id, messageId, text);
    return NextResponse.json({ ok: true });
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
    const { id, messageId } = await context.params;
    const row = await getSupportTicket(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const staff = isAdminRole(session.role);
    if (!staff && row.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const message = row.messages.find((m) => m.id === messageId);
    if (!message || !canTouch(message, session, staff)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await deleteSupportMessage(id, messageId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
