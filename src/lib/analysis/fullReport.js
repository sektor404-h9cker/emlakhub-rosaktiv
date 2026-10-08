/**
 * Полный отчёт по лоту: экономика + Vision + Reasoner + comps + правила
 */
import { computeEconomics } from "./economics";
import { runLocalVision } from "./visionLocal";
import { runReasoner } from "./reasoner";
import { compsForEstateLot } from "@/lib/markets/bina";
import { compsForAutoLot } from "@/lib/markets/turbo";
import {
  hiddenRulesForMarket,
  risksForMarket,
  MARKET_WARNINGS,
} from "@/lib/herrac/knowledge";

function isAutoLike(market) {
  return market === "auto" || market === "equipment";
}

function isEstateLike(market) {
  return (
    market === "estate" ||
    market === "commercial" ||
    market === "land"
  );
}

/**
 * @param {object} lot
 * @param {{ locale?: string, skipComps?: boolean }} [opts]
 */
export async function buildLotIntelligence(lot, opts = {}) {
  const locale = opts.locale === "az" ? "az" : "ru";
  const market = lot.market || "other";

  const vision = runLocalVision(lot);
  const repairUser = opts.repairUser ?? null;
  const economics = computeEconomics(lot, { repairUser });

  let comps = {
    ok: false,
    skipped: true,
    comps: [],
    stats: null,
    source: null,
  };

  if (!opts.skipComps) {
    try {
      if (isAutoLike(market)) {
        comps = await compsForAutoLot(lot);
      } else if (isEstateLike(market)) {
        comps = await compsForEstateLot(lot);
      }
    } catch (e) {
      console.error("[analysis/comps]", e);
      comps = {
        ok: false,
        marketStatus: "unavailable",
        marketStatusReasonRu: "Рыночные данные временно недоступны. Попробуйте позже.",
        marketStatusReasonAz: "Bazar məlumatı müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.",
        marketStatusReasonEn: "Market data is temporarily unavailable. Try again later.",
        error: "Рыночные данные временно недоступны. Попробуйте позже.",
        comps: [],
        stats: null,
      };
    }
  }

  let economicsVsComps = null;
  const median = comps?.stats?.usableForValuation ? comps.stats.medianPrice : null;
  if (median) {
    economicsVsComps = computeEconomics(lot, {
      repairUser,
      marketOverride: median,
      marketRange: {
        low: comps.stats.p25,
        high: comps.stats.p75,
        median,
        sampleSize: comps.stats.sampleSize,
      },
    });
  }

  const reasoning = runReasoner({
    lot,
    vision,
    economics,
    economicsVsComps,
    comps,
    locale,
  });

  const warnings = [
    ...hiddenRulesForMarket(market, locale),
    ...(isAutoLike(market) ? MARKET_WARNINGS.turbo : []),
    ...(isEstateLike(market) ? MARKET_WARNINGS.bina : []),
    ...(comps?.warnings || []),
  ].map((w) => ({
    id: w.id || undefined,
    level: w.level,
    text: w.text || (locale === "az" ? w.az : w.ru),
  }));

  const verdictStep = reasoning.steps.find((s) => s.id === "verdict");
  const eco = economicsVsComps || economics;

  return {
    generatedAt: new Date().toISOString(),
    lotId: lot.id,
    registryNo: lot.registryNo,
    market,
    identity: comps?.identity || comps?.query || null,
    vision,
    reasoning,
    economics,
    economicsVsComps,
    comps,
    risks: risksForMarket(market, locale),
    warnings,
    headline:
      verdictStep?.claim ||
      eco.disclaimerRu ||
      (locale === "az"
        ? "Yekun xalis qazancı hələ müəyyən etmək olmaz"
        : "Окончательную чистую прибыль пока определить нельзя"),
    accuracyNote:
      locale === "az"
        ? "Sübutsuz iddia yazmırıq. 100% dəqiqlik mümkün deyil — sənəd və yerində baxış."
        : "Без доказательств ничего не утверждаем. 100% точности нет — документы и осмотр на месте.",
  };
}
