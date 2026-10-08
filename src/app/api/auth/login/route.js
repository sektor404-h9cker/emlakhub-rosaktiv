/**
 * POST /api/auth/login — email + password → httpOnly session
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { isKnownDevPassword, verifyPassword } from "@/lib/auth/password";
import { clientAddress, rateLimit } from "@/lib/security/rateLimit";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { mapUserToProfile } from "@/lib/db/userMapper";
import { readConsentState } from "@/lib/legal/consent";

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured", configured: false, unavailable: false },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const gate = rateLimit({
    key: `login:${clientAddress(request)}:${email}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток. Подождите и попробуйте снова." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  if (process.env.NODE_ENV === "production" && isKnownDevPassword(password)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email } });
  } catch (e) {
    console.error("[auth/login]", e);
    return NextResponse.json(
      {
        error: "База временно недоступна. Попробуйте позже.",
        configured: true,
        unavailable: true,
      },
      { status: 503 }
    );
  }

  if (!user || user.blocked) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });
  await setSessionCookie(token);

  const consent = await readConsentState(user.id);
  return NextResponse.json({
    ok: true,
    profile: { ...mapUserToProfile(user), consentCurrent: consent.current },
  });
}
