/**
 * Тикеты поддержки.
 * Инвестор видит свои. Сотрудник админки видит все.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent, isAdminRole } from "@/lib/auth/guards";
import { createSupportTicket, listSupportTickets } from "@/lib/db/support";
import { rateLimit } from "@/lib/security/rateLimit";

const TOPICS = new Set(["legal", "deposit", "lot", "access", "other"]);

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

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { tickets: [], configured: false, error: "База не настроена." },
      { status: 503 }
    );
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const tickets = await listSupportTickets({
      userId: session.userId,
      all: isAdminRole(session.role),
    });
    return NextResponse.json({ tickets, configured: true });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена.", configured: false },
      { status: 503 }
    );
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const gate = rateLimit({
      key: `support:${session.userId}`,
      limit: 8,
      windowMs: 10 * 60 * 1000,
    });
    if (!gate.ok) {
      return NextResponse.json(
        { error: "Слишком много обращений. Подождите немного." },
        { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
      );
    }
    const body = await request.json();
    const subject = String(body.subject || "").trim();
    const text = String(body.body || "").trim();
    if (!subject || !text) {
      return NextResponse.json(
        { error: "Нужны тема и сообщение." },
        { status: 400 }
      );
    }
    if (subject.length > 200 || text.length > 4000) {
      return NextResponse.json(
        { error: "Сообщение слишком длинное." },
        { status: 400 }
      );
    }
    const topic = TOPICS.has(body.topic) ? body.topic : "other";
    const lotId = String(body.lotId || "").trim().slice(0, 80) || null;
    const ticket = await createSupportTicket({
      userId: session.userId,
      email: session.email,
      subject,
      topic,
      lotId,
      body: text,
    });
    return NextResponse.json({ ticket });
  } catch (e) {
    return apiError(e);
  }
}
