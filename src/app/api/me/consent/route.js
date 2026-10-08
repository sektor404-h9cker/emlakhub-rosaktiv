/**
 * Current legal consent. Older rows are kept.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/guards";
import { readConsentState, recordCurrentConsent } from "@/lib/legal/consent";

function fail(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[consent]", err);
  return NextResponse.json(
    { error: status >= 500 ? "Не удалось сохранить согласие." : err.message },
    { status: status >= 500 ? 503 : status }
  );
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const session = requireSession(await getSessionFromCookies());
    const consent = await readConsentState(session.userId);
    return NextResponse.json({ consent });
  } catch (err) {
    return fail(err);
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = requireSession(await getSessionFromCookies());
    const body = await request.json();
    if (body.acceptLegal !== true) {
      return NextResponse.json(
        { error: "Нужно принять соглашение и политику конфиденциальности." },
        { status: 400 }
      );
    }
    const consent = await recordCurrentConsent(session.userId, body.locale);
    return NextResponse.json({ ok: true, consent });
  } catch (err) {
    return fail(err);
  }
}
