/**
 * One saved scenario. User input stays separate from Hərrac facts.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import prisma from "@/lib/db/prisma";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent } from "@/lib/auth/guards";
import {
  FORMULA_VERSION,
  moneyOrNull,
  sanitizeScenarioInputs,
} from "@/lib/scenarios/shape";

function present(row) {
  if (!row) return null;
  return {
    lotId: row.lotId,
    inputs: row.inputs,
    maxBid: row.maxBid == null ? null : Number(row.maxBid),
    marketReference: row.marketReference == null ? null : Number(row.marketReference),
    calculatedAt: row.calculatedAt,
    formulaVersion: row.formulaVersion,
  };
}

export async function GET(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ scenario: null }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const { lotId: rawId } = await context.params;
    const lotId = String(rawId || "").slice(0, 80);
    const row = await prisma.investmentScenario.findUnique({
      where: { userId_lotId: { userId: session.userId, lotId } },
    });
    return NextResponse.json({ scenario: present(row) });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[scenario]", err);
    return NextResponse.json(
      { error: "Не удалось загрузить расчёт." },
      { status: status >= 500 ? 503 : status }
    );
  }
}

export async function PUT(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "База не настроена." }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const { lotId: rawId } = await context.params;
    const lotId = String(rawId || "").trim().slice(0, 80);
    if (!lotId) {
      return NextResponse.json({ error: "Нужен лот." }, { status: 400 });
    }
    const body = await request.json();
    const inputs = sanitizeScenarioInputs(body?.inputs);
    const maxBid = moneyOrNull(body?.maxBid);
    const marketReference = moneyOrNull(body?.marketReference);
    const row = await prisma.investmentScenario.upsert({
      where: { userId_lotId: { userId: session.userId, lotId } },
      create: {
        userId: session.userId,
        lotId,
        inputs,
        maxBid,
        marketReference,
        formulaVersion: FORMULA_VERSION,
      },
      update: {
        inputs,
        maxBid,
        marketReference,
        formulaVersion: FORMULA_VERSION,
        calculatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, scenario: present(row) });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[scenario]", err);
    return NextResponse.json(
      { error: "Не удалось сохранить расчёт." },
      { status: status >= 500 ? 503 : status }
    );
  }
}
