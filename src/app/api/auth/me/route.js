/**
 * GET /api/auth/me — текущий пользователь из cookie
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { mapUserToProfile } from "@/lib/db/userMapper";
import { readConsentState } from "@/lib/legal/consent";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ profile: null, configured: false, unavailable: false });
  }

  try {
    const session = await getSessionFromCookies();
    if (!session?.userId) {
      return NextResponse.json({ profile: null, configured: true, unavailable: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user || user.blocked) {
      return NextResponse.json({ profile: null, configured: true, unavailable: false });
    }

    const consent = await readConsentState(user.id);
    return NextResponse.json({
      configured: true,
      unavailable: false,
      profile: { ...mapUserToProfile(user), consentCurrent: consent.current },
    });
  } catch (e) {
    console.error("[auth/me]", e);
    return NextResponse.json(
      {
        profile: null,
        configured: true,
        unavailable: true,
        error: "База временно недоступна. Попробуйте позже.",
      },
      { status: 503 }
    );
  }
}
