/**
 * GET /api/lots/[id]/analysis — полный интеллект-отчёт (PRO / admin)
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireSession, requireProUser, isAdminRole } from "@/lib/auth/guards";
import { mapLotRow } from "@/lib/db/lots";
import { buildLotIntelligence } from "@/lib/analysis/fullReport";
import { ORIGIN } from "@/lib/origin";

export async function GET(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "База не настроена.", configured: false },
      { status: 503 }
    );
  }
  try {
    const session = requireSession(await getSessionFromCookies());
    if (!isAdminRole(session.role)) {
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      requireProUser(user);
    }

    const { id } = await context.params;
    const row = await prisma.lot.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const lot = mapLotRow(row);
    const url = new URL(request.url);
    const locale = url.searchParams.get("locale") === "az" ? "az" : "ru";
    const skipComps = url.searchParams.get("skipComps") === "1";

    const report = await buildLotIntelligence(lot, { locale, skipComps });

    // Кэш intel — только по явному ?persist=1.
    // Раньше запись затирала photos/params (flatten lot.payload).
    const persist = url.searchParams.get("persist") === "1";
    if (persist) {
      try {
        const prev =
          row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
            ? row.payload
            : {};
        const keepPhotos = Array.isArray(prev.photos) ? prev.photos : [];
        const keepPhoto = prev.photo || keepPhotos[0] || null;
        await prisma.lot.update({
          where: { id: row.id },
          data: {
            payload: {
              ...prev,
              photo: keepPhoto,
              photos: keepPhotos,
              defects: report.vision?.defects || prev.defects || [],
              repairCost: null,
              repairCostOrigin: ORIGIN.UNKNOWN,
              lastIntelAt: report.generatedAt,
              lastIntelHeadline: report.headline,
              expectedProfit: null,
              expectedMarginPct: null,
              moneyAudit: {
                profitStatus:
                  report.economicsVsComps?.profitStatus ||
                  report.economics?.profitStatus ||
                  "unknown",
                repairOrigin: ORIGIN.UNKNOWN,
                netProfit: null,
              },
            },
          },
        });
      } catch {
        /* ignore cache write */
      }
    }

    return NextResponse.json({ report });
  } catch (e) {
    console.error("[analysis]", e);
    const status = e.status || 500;
    const safe =
      status === 401 || status === 403 || status === 404
        ? e.message
        : "Не удалось посчитать лот. Попробуйте позже.";
    return NextResponse.json({ error: safe }, { status });
  }
}
