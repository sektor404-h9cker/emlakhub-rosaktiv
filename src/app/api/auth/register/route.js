/**
 * POST /api/auth/register — новый инвестор (Free, без PRO)
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { hashPassword, isKnownDevPassword } from "@/lib/auth/password";
import { clientAddress, rateLimit } from "@/lib/security/rateLimit";
import { legalLocale, PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal/versions";
import {
  createSessionToken,
  setSessionCookie,
} from "@/lib/auth/session";
import { mapUserToProfile } from "@/lib/db/userMapper";
import { ROLES } from "@/lib/roles";
import { PLANS } from "@/lib/subscription";
import { bindReferral, ensureReferralCode } from "@/lib/growth/service";

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured" },
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
  const displayName = String(body.displayName || "").trim().slice(0, 80);
  const locale = legalLocale(body.locale);

  const gate = rateLimit({
    key: `register:${clientAddress(request)}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { error: "Слишком много регистраций с этого адреса. Попробуйте позже." },
      { status: 429, headers: { "Retry-After": String(gate.retryAfter) } }
    );
  }

  if (body.acceptLegal !== true) {
    return NextResponse.json(
      { error: "Нужно принять соглашение и политику конфиденциальности." },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "production" && isKnownDevPassword(password)) {
    return NextResponse.json({ error: "Выберите другой пароль." }, { status: 400 });
  }

  if (!email || password.length < 8) {
    return NextResponse.json(
      { error: "Email and password (min 8 chars) required" },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || email.split("@")[0],
        role: ROLES.INVESTOR,
        subscriptionPlan: PLANS.FREE,
      },
    });
    await tx.legalConsent.createMany({
      data: [
        {
          userId: created.id,
          documentType: "terms",
          version: TERMS_VERSION,
          locale,
        },
        {
          userId: created.id,
          documentType: "privacy",
          version: PRIVACY_VERSION,
          locale,
        },
      ],
    });
    await tx.auditLog.create({
      data: {
        actorId: created.id,
        actorEmail: created.email,
      action: "User registered",
      level: "info",
      meta: { terms: TERMS_VERSION, privacy: PRIVACY_VERSION, locale },
      },
    });
    await ensureReferralCode(created.id, tx);
    const ref = String(body.ref || "").trim();
    if (ref) {
      const bound = await bindReferral({
        db: tx,
        referredId: created.id,
        referredEmail: email,
        code: ref,
        signals: { ip: clientAddress(request) },
      });
      await tx.auditLog.create({
        data: {
          actorId: created.id,
          actorEmail: created.email,
          action: bound.bound ? "referral_bound" : "referral_rejected",
          level: bound.bound ? "info" : "warn",
          meta: { reason: bound.reason || "bound", suspicious: Boolean(bound.referral?.suspicious) },
        },
      });
    }
    return created;
  });

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    ok: true,
    profile: { ...mapUserToProfile(user), consentCurrent: true },
  });
}
