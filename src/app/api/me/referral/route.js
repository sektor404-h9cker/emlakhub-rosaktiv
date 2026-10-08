import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent } from "@/lib/auth/guards";
import { referralSummary } from "@/lib/growth/desk";
import { readGrowthConfig } from "@/lib/growth/service";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const [summary, config] = await Promise.all([
      referralSummary(session.userId),
      readGrowthConfig(),
    ]);
    return NextResponse.json({
      configured: true,
      automatic: false,
      program: {
        enabled: config.referralEnabled,
        referrerDays: config.referrerDays,
        referredDays: config.referredDays,
      },
      ...summary,
    });
  } catch (err) {
    const status = err.status || 500;
    return NextResponse.json({ error: err.message || "Request failed" }, { status });
  }
}
