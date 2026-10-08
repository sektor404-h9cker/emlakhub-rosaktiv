/**
 * Saved investment scenarios for the signed-in user only.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import prisma from "@/lib/db/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent } from "@/lib/auth/guards";

function money(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ scenarios: [], configured: false }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const rows = await prisma.investmentScenario.findMany({
      where: { userId: session.userId },
      orderBy: { calculatedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({
      scenarios: rows.map((row) => ({
        lotId: row.lotId,
        inputs: row.inputs,
        maxBid: money(row.maxBid),
        marketReference: money(row.marketReference),
        calculatedAt: row.calculatedAt,
        formulaVersion: row.formulaVersion,
      })),
    });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[scenarios]", err);
    return NextResponse.json(
      { error: "Не удалось загрузить расчёты." },
      { status: status >= 500 ? 503 : status }
    );
  }
}
