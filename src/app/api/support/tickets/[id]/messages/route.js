/**
 * Новое сообщение в тикете.
 * Инвестор пишет как user, сотрудник админки — как agent.
 * Закрытый тикет не принимает текст, пока его снова не откроют.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent, isAdminRole } from "@/lib/auth/guards";
import { addSupportMessage, getSupportTicket } from "@/lib/db/support";
import { rateLimit } from "@/lib/security/rateLimit";

const MAX_FILE = 300_000;

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

export async function POST(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const gate = rateLimit({
      key: `support-msg:${session.userId}`,
      limit: 20,
      windowMs: 10 * 60 * 1000,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "Слишком много сообщений. Подождите немного." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
      );
    }
    const { id } = await context.params;
    const row = await getSupportTicket(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const staff = isAdminRole(session.role);
    if (!staff && row.userId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (row.status === "closed") {
      return NextResponse.json(
        { error: "Тикет закрыт. Откройте его, чтобы написать снова." },
        { status: 409 }
      );
    }
    const body = await request.json();
    const text = String(body.body || "").trim();
    const file = body.attachment;
    if (!text && !file?.dataUrl) {
      return NextResponse.json({ error: "Пустое сообщение." }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: "Сообщение слишком длинное." }, { status: 400 });
    }
    let attachment = null;
    if (file?.dataUrl) {
      const dataUrl = String(file.dataUrl);
      const mime = /^data:(image\/jpeg|image\/png|image\/webp|application\/pdf);base64,/i.exec(
        dataUrl
      );
      if (!mime || dataUrl.length > MAX_FILE) {
        return NextResponse.json(
          { error: "Можно приложить JPEG, PNG, WebP или PDF до 200 КБ." },
          { status: 400 }
        );
      }
      attachment = {
        dataUrl,
        name: String(file.name || "file").replace(/[^\w.\- ]+/g, "").slice(0, 120) || "file",
        type: mime[1].toLowerCase(),
      };
    }
    const ticket = await addSupportMessage({
      ticketId: id,
      role: staff ? "agent" : "user",
      email: session.email,
      body: text || "Вложение",
      attachment,
    });
    return NextResponse.json({ ticket });
  } catch (e) {
    return apiError(e);
  }
}
