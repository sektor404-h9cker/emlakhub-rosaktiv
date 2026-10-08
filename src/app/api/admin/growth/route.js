import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin, canManagePayments } from "@/lib/auth/guards";
import { growthReport } from "@/lib/growth/desk";
import { reverseGrantById, writeGrowthConfig } from "@/lib/growth/service";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    if (!canManagePayments(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const report = await growthReport();
    return NextResponse.json({ configured: true, automatic: false, ...report });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Request failed" }, { status: err.status || 500 });
  }
}

export async function PATCH(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    if (!canManagePayments(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    if (body.reverseGrantId) {
      const grant = await reverseGrantById({
        grantId: String(body.reverseGrantId),
        reason: body.reason || "admin",
        actor: session,
      });
      return NextResponse.json({ grant });
    }
    const patch = {};
    if (body.referralEnabled != null) patch.referralEnabled = Boolean(body.referralEnabled);
    if (body.referrerDays != null) patch.referrerDays = body.referrerDays;
    if (body.referredDays != null) patch.referredDays = body.referredDays;
    if (body.prices && typeof body.prices === "object") patch.prices = body.prices;
    const config = await writeGrowthConfig(patch, session);
    return NextResponse.json({ config });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Request failed" }, { status: err.status || 500 });
  }
}
