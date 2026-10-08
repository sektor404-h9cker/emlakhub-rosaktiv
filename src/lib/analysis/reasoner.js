/**
 * Разбор карточки: утверждение только вместе с цитатой из Hərrac.
 * Суммы здесь не считаются — их считает Investment Engine.
 */
import { ORIGIN } from "../origin";

function n(v, d = 0) {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
}

function quoteMatch(blob, re) {
  const m = String(blob || "").match(re);
  if (!m) return null;
  const idx = m.index ?? 0;
  const start = Math.max(0, idx - 20);
  const end = Math.min(blob.length, idx + m[0].length + 40);
  return String(blob).slice(start, end).replace(/\s+/g, " ").trim();
}

const SKIP_VISION_IDS = new Set(["no_text_signals"]);

/**
 * @param {object} ctx
 */
export function runReasoner(ctx) {
  const { lot, vision, economics, economicsVsComps, comps, locale } = ctx;
  const az = locale === "az";
  const steps = [];
  let stepNo = 0;

  const push = (s) => {
    stepNo += 1;
    steps.push({ step: stepNo, ...s });
  };

  const notes = String(lot.notes || lot.payload?.notes || "");
  const title = String(lot.titleAz || lot.titleRu || "");
  const params = lot.params || lot.payload?.params || {};
  const blob = `${notes}\n${title}\n${Object.entries(params)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}`;

  const start = n(lot.startPrice);
  const marketKnown = Number.isFinite(Number(lot.marketPrice));
  const marketLot = marketKnown ? n(lot.marketPrice) : null;

  push({
    id: "inventory",
    kind: "fact",
    status: "asserted",
    confidence: 95,
    impactAzn: 0,
    thought: az
      ? "Əvvəlcə Hərrac kartındakı rəsmi rəqəmləri sabitləyirəm. Bu, Turbo/Bina bazarı deyil."
      : "Сначала фиксирую официальные цифры карточки Hərrac. Это не рынок Turbo/Bina.",
    claim: az
      ? `Start ${start.toLocaleString("en-US")} ₼ · Hərrac lot qiyməti ${marketLot == null ? "məlum deyil" : `${marketLot.toLocaleString("en-US")} ₼`}`
      : `Старт ${start.toLocaleString("en-US")} ₼ · цена лота Hərrac ${marketLot == null ? "неизвестна" : `${marketLot.toLocaleString("en-US")} ₼`}`,
    evidence: [
      {
        type: "herrac_price",
        source: "herrac.gov.az",
        quote: `startPrice=${lot.startPrice}; marketPrice=${lot.marketPrice}`,
      },
    ],
  });

  // Объект: комнаты / м² / район / сотки
  const idn = comps?.identity || null;
  if (idn && (idn.kind === "apartment" || idn.kind === "house" || idn.kind === "land" || idn.kind === "commercial")) {
    const bits = [];
    if (idn.kind === "apartment" || idn.kind === "house") {
      if (idn.rooms) bits.push(az ? `${idn.rooms} otaq` : `${idn.rooms} комн`);
      if (idn.areaSqm) bits.push(`${idn.areaSqm} m²`);
      if (idn.floor) bits.push(az ? `${idn.floor}-ci mərtəbə` : `${idn.floor} этаж`);
      if (idn.buildingType) bits.push(String(idn.buildingType));
      if (idn.condition) bits.push(String(idn.condition));
    }
    if (idn.kind === "land" && idn.landHa) bits.push(`${idn.landHa} ha`);
    if (idn.district) bits.push(idn.district);
    else if (idn.city) bits.push(idn.city);

    push({
      id: "object",
      kind: "fact",
      status: bits.length ? "asserted" : "unknown",
      confidence: bits.length >= 2 ? 90 : 60,
      impactAzn: 0,
      thought: az
        ? "Obyektin parametrlərini herrac mətnindən / params-dan oxuyuram."
        : "Параметры объекта читаю из текста/параметров herrac.",
      claim: bits.length
        ? bits.join(" · ")
        : az
          ? "Obyekt parametrləri natamamdır"
          : "Параметры объекта неполные",
      evidence: [
        {
          type: "herrac_object",
          source: "herrac title/params",
          quote: idn.label || title.slice(0, 120),
        },
      ],
    });
  }

  for (const f of vision?.findings || []) {
    if (SKIP_VISION_IDS.has(f.id)) continue;
    if (f.evidence === "honesty") continue;

    const q =
      quoteMatch(blob, NOTE_PATTERNS_RE[f.id]) ||
      f.evidenceQuote ||
      (az ? f.labelAz : f.labelRu);

    const isSoft = f.evidence === "photo_meta" || f.severity === "low";
    push({
      id: `vision_${f.id}`,
      kind: f.severity === "high" ? "risk" : "signal",
      status: isSoft ? "hypothesis" : "asserted",
      confidence:
        f.evidence === "notes_params"
          ? 88
          : f.evidence === "params"
            ? 80
            : 55,
      impactAzn: null,
      origins: {
        signal: ORIGIN.HERRAC,
        cost: ORIGIN.UNKNOWN,
      },
      thought: az
        ? f.whyAz || "Herrac siqnalını saxlayıram, məbləğ təyin etmirəm."
        : f.whyRu || "Сигнал Hərrac сохраняю, сумму не назначаю.",
      claim: az
        ? f.costNoteAz
          ? `Hərrac bildirir: ${f.labelAz}. ${f.costNoteAz}`
          : `Hərrac bildirir: ${f.labelAz}.`
        : f.costNoteRu
          ? `Hərrac сообщает: ${f.labelRu}. ${f.costNoteRu}`
          : `Hərrac сообщает: ${f.labelRu}.`,
      evidence: [
        {
          type: f.evidence || "derived",
          source: "herrac notes/params",
          quote: q,
        },
      ],
    });
  }

  const photoCount = vision?.photoCount || 0;
  push({
    id: "photo_gate",
    kind: "method",
    status: "asserted",
    confidence: 99,
    impactAzn: 0,
    thought: az
      ? "Fotodan pas/vuruq «görmək» üçün piksel modelimiz yoxdur — uydurmuram."
      : "Пиксельной модели «увидеть ржавчину/удар» у нас нет — не выдумываем.",
    claim: az
      ? `${photoCount} foto var · zədələri yalnız mətndə sübut olanda yazırıq`
      : `${photoCount} фото · повреждения пишем только если есть доказательство в тексте`,
    evidence: [
      {
        type: "policy",
        source: "emlak-reasoner-v2",
        quote: "no_unverified_pixel_claims",
      },
    ],
  });

  if (comps?.stats?.medianPrice != null && comps.marketStatus !== "insufficient") {
    const med = comps.stats.medianPrice;
    const label = comps.query?.label || comps.source || "bazar";
    const used = comps.counts?.used ?? comps.stats.sampleSize;
    const level = comps.marketStatusLabelRu || comps.marketStatus;
    push({
      id: "comps",
      kind: "market",
      status: comps.stats.usableForValuation ? "asserted" : "hypothesis",
      confidence: comps.marketStatus === "high" ? 80 : comps.marketStatus === "medium" ? 65 : 45,
      impactAzn: null,
      origins: { market: "market" },
      thought: az
        ? `${comps.source}: «${label}». Tapıldı ${comps.counts?.found ?? "—"}, istifadə ${used}. Etibarlılıq: ${level}.`
        : `${comps.source}: «${label}». Найдено ${comps.counts?.found ?? "—"}, использовано ${used}. Достоверность: ${level}.`,
      claim: az
        ? `Median ${Number(med).toLocaleString("en-US")} ₼ · aralıq ${comps.stats.p25 ?? "—"}–${comps.stats.p75 ?? "—"} · ${used} elan`
        : `Медиана ${Number(med).toLocaleString("en-US")} ₼ · диапазон ${comps.stats.p25 ?? "—"}–${comps.stats.p75 ?? "—"} · ${used} объявлений`,
      evidence: (comps.comps || []).slice(0, 5).map((c) => ({
        type: "comp",
        source: c.url || comps.source,
        quote: `${c.name || c.location || c.id}: ${c.price} AZN`,
      })),
    });
  } else {
    const err = comps?.error || "";
    push({
      id: "comps_missing",
      kind: "market",
      status: "unknown",
      confidence: 40,
      impactAzn: null,
      thought: az
        ? "Etibarlı oxşar elan tapılmadı — yad marka/model qoymuram, yalnız herrac qiyməti ilə işləyirəm."
        : "Надёжных похожих не нашли — чужие марки/модели не подставляем, опираемся на цену herrac.",
      claim: az
        ? err
          ? `Bazar: ${err}`
          : "Oxşar elanlar zəifdir və ya yoxdur"
        : err
          ? `Рынок: ${err}`
          : "Похожих объявлений мало или нет",
      evidence: [
        {
          type: "gap",
          source: comps?.source || "market",
          quote: err || comps?.query?.label || "empty sample",
        },
      ],
    });
  }

  const eco = economicsVsComps || economics;
  const net = eco?.profitStatus === "scenario" ? eco?.lines?.netProfit : null;
  const blocked = eco?.profitBlockedBecause || [];
  const mathClaim = (() => {
    if (net != null) {
      return az
        ? `Ssenari ~${Number(net).toLocaleString("en-US")} ₼. Təmiri investor daxil edib, bu Hərrac faktı deyil.`
        : `Сценарий ~${Number(net).toLocaleString("en-US")} ₼. Ремонт ввёл инвестор, это не факт Hərrac.`;
    }
    if (blocked.includes("market_unconfirmed") && blocked.includes("repair_unknown")) {
      return az
        ? "Yekun xalis qazancı hələ müəyyən etmək olmaz: oxşarların medianı yoxdur və təmirin dəyəri məlum deyil."
        : "Окончательную чистую прибыль пока определить нельзя: нет медианы аналогов и стоимость ремонта неизвестна.";
    }
    if (blocked.includes("repair_unknown")) {
      return az
        ? "Median var, amma yekun xalis qazancı müəyyən etmək olmaz: təmirin dəyəri məlum deyil."
        : "Медиана аналогов есть, но окончательную чистую прибыль определить нельзя: стоимость ремонта неизвестна.";
    }
    return az
      ? "Yekun xalis qazancı hələ müəyyən etmək olmaz."
      : "Окончательную чистую прибыль пока определить нельзя.";
  })();
  push({
    id: "math",
    kind: "math",
    status: net != null ? "hypothesis" : "unknown",
    confidence: net != null ? 70 : 40,
    impactAzn: null,
    origins: {
      netProfit: net != null ? ORIGIN.USER : ORIGIN.UNKNOWN,
      repair: eco?.inputs?.repairOrigin || ORIGIN.UNKNOWN,
      market: eco?.lines?.marketValue != null ? ORIGIN.MARKET : ORIGIN.UNKNOWN,
    },
    thought: az
      ? "Xalis qazanc yalnız siz təmir yazandan və median təsdiqlənəndən sonra ssenari olur."
      : "Чистая прибыль становится сценарием только после вашей цифры ремонта и подтверждённой медианы.",
    claim: mathClaim,
    evidence: [
      {
        type: "formula",
        source: "economics",
        quote: eco?.formulaRu || eco?.formulaAz || "market − bid − costs",
      },
    ],
  });

  const asserted = steps.filter((s) => s.status === "asserted");
  const risks = asserted.filter(
    (s) => s.kind === "risk" || (s.impactAzn != null && s.impactAzn < -500)
  );

  let decision;
  if (net == null) {
    decision = mathClaim;
  } else if (net > 0 && risks.length === 0) {
    decision = az
      ? "Sizin təmir rəqəminizlə ssenari müsbətdir. Bu fakt deyil — yerində baxış lazımdır."
      : "Сценарий с вашей цифрой ремонта положительный. Это не факт — нужен осмотр.";
  } else if (net > 0 && risks.length > 0) {
    decision = az
      ? "Ssenari müsbətdir, amma kritik siqnallar var — behdən əvvəl yoxlayın."
      : "Сценарий положительный, но есть серьёзные сигналы — проверьте до задатка.";
  } else {
    decision = az
      ? "Sizin təmir rəqəminizlə ssenari zəif görünür. Bu Hərrac faktı deyil."
      : "Сценарий с вашей цифрой ремонта выглядит слабым. Это не факт Hərrac.";
  }

  push({
    id: "verdict",
    kind: "verdict",
    status: "asserted",
    confidence: Math.round(
      asserted.reduce((s, x) => s + x.confidence, 0) /
        Math.max(1, asserted.length)
    ),
    impactAzn: null,
    thought: az
      ? "Yekun: yalnız sübutlu addımları birləşdirirəm."
      : "Итог: собираю только то, что можем подтвердить.",
    claim: decision,
    evidence: asserted.slice(0, 5).map((s) => ({
      type: "step",
      source: s.id,
      quote: s.claim,
    })),
  });

  const totalRiskCost = steps
    .filter((s) => s.status === "asserted" && s.impactAzn < 0)
    .reduce((s, x) => s + Math.abs(x.impactAzn || 0), 0);

  return {
    engine: "emlak-reasoner-v3",
    engineNote: az
      ? "Öz mühərrik: sübut → iddia. Təmir məbləğini uydurmuruq. Xarici AI API yoxdur."
      : "Свой движок: доказательство → тезис. Сумму ремонта не выдумываем. Без внешнего AI API.",
    steps,
    summary: {
      decision,
      assertedCount: asserted.length,
      hypothesisCount: steps.filter((s) => s.status === "hypothesis").length,
      unknownCount: steps.filter((s) => s.status === "unknown").length,
      totalRiskCostAzn: totalRiskCost,
      avgConfidence: Math.round(
        steps.reduce((s, x) => s + x.confidence, 0) /
          Math.max(1, steps.length)
      ),
    },
  };
}

const NOTE_PATTERNS_RE = {
  no_keys: /borcluda|у должника/i,
  engine_dead: /mühərrik.*işlək deyil|двигател|işlək deyil|sıradan çıx/i,
  flood: /suda\s*qal|утоплен|затоп|flood|nəm/i,
  flat_tires: /təkər.*sön|спущен|прокол.*шин/i,
  body_damage: /öndən\s*zədə|vuruq|zədə|qəza|поврежд|удар|разбит/i,
  rust: /\bpas\b|ржав|korrozi/i,
  not_in_use: /[İi]stifadə\s*(olunmur|edilmir)|не\s*эксплуат|işləmir|uzun\s*dayan/i,
  storage_fee: /saxlanma|штрафплощад|хранен|AZN\/gün/i,
  not_operating: /fəaliyyət göstərmir|не\s*функционир/i,
  paint: /rənglənm|покраск|boya/i,
  mortgage: /ipotek|ипотек|həbs|арест|yüklənm/i,
  needs_repair: /təmir\s*lazım|требует\s*ремонт|космет/i,
  high_mileage: /Yürüş|пробег|km/i,
  mid_repair: /orta|космет|təmir/i,
  few_photos: /photos=/i,
};
