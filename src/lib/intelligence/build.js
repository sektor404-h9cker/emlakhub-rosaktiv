/**
 * Emlak Intelligence.
 * Собирает один результат из карточки Hərrac, Market Engine,
 * Investment Engine и того, что ввёл пользователь.
 * Новых денег и новых рыночных цифр здесь нет.
 */
import { INTELLIGENCE_RULES } from "../productRules";
import { runLocalVision } from "../analysis/visionLocal";
import {
  FIELD_LABEL,
  autoIdentity,
  fieldPresent,
  fieldValue,
  intelligenceProfile,
} from "./fields";

const STATUS_LABEL = {
  pending: { ru: "Смотрим рынок", az: "Bazara baxırıq", en: "Checking the market" },
  insufficient_data: { ru: "Рынок не подтверждён", az: "Bazar təsdiqlənməyib", en: "Market is not confirmed" },
  own_scenario: { ru: "Ваш сценарий", az: "Sizin ssenari", en: "Your scenario" },
  potential: { ru: "Есть потенциал", az: "Potensial var", en: "There is potential" },
  fits: { ru: "Подходит под ваши условия", az: "Şərtlərinizə uyğundur", en: "Fits your terms" },
  borderline: { ru: "Погранично", az: "Sərhəddədir", en: "Borderline" },
  above: { ru: "Выше вашего лимита", az: "Limitinizdən yuxarıdır", en: "Above your limit" },
  market_unavailable: { ru: "Рынок временно недоступен", az: "Bazar müvəqqəti əlçatan deyil", en: "Market is temporarily unavailable" },
};

const MARKET_LABEL = {
  loading: { ru: "смотрим", az: "baxırıq", en: "checking" },
  unavailable: { ru: "временно недоступен", az: "müvəqqəti yoxdur", en: "temporarily unavailable" },
  insufficient: { ru: "не подтверждён", az: "təsdiqlənməyib", en: "not confirmed" },
  low: { ru: "низкая", az: "aşağı", en: "low" },
  medium: { ru: "средняя", az: "orta", en: "medium" },
  high: { ru: "высокая", az: "yüksək", en: "high" },
};

const CONFIRMED_SKIP = new Set(["no_text_signals", "few_photos", "high_mileage"]);

export function buildEmlakIntelligence(input = {}) {
  const lot = input.lot || {};
  const comps = input.comps || null;
  const investment = input.investment || null;
  const loading = Boolean(input.marketLoading) && !comps;
  const profile = intelligenceProfile(lot);
  const completeness = buildCompleteness(lot, profile);
  const market = buildMarket(lot, comps, loading, Boolean(input.marketError) && !comps);
  const findings = input.findings || runLocalVision(lot).findings || [];
  const riskState = buildRiskState(lot, findings, profile);
  const dealStatus = decideStatus({ lot, investment, market, loading });
  const scoreEligibility = buildEligibility({ completeness, market, investment, loading });
  const pillars = buildPillars({ completeness, market, investment, riskState, scoreEligibility });
  const emlakScore = scoreEligibility.allowed
    ? composeScore(pillars, investment)
    : null;
  const unknowns = buildUnknowns(completeness, market, riskState, investment);
  const nextActions = buildNextActions({ lot, profile, completeness, market, investment, riskState });
  const why = buildWhy({
    lot,
    market,
    investment,
    dealStatus,
    scoreEligibility,
    emlakScore,
    riskState,
    completeness,
  });

  return {
    profile,
    dataCompleteness: completeness,
    marketConfidence: market,
    riskState,
    dealStatus,
    dealStatusLabel: STATUS_LABEL[dealStatus] || STATUS_LABEL.insufficient_data,
    scoreEligibility,
    emlakScore,
    pillars,
    why,
    unknowns,
    nextActions,
    mainReason: why.status,
    known: buildKnown(lot, completeness, market, investment),
    flow: buildFlow(dealStatus, market, investment),
  };
}

function buildCompleteness(lot, profile) {
  const rows = INTELLIGENCE_RULES.profiles[profile] || INTELLIGENCE_RULES.profiles.other;
  const earned = [];
  const missed = [];
  let score = 0;
  for (const row of rows) {
    const label = FIELD_LABEL[row.id] || { ru: row.id, az: row.id, en: row.id };
    const item = { id: row.id, weight: row.weight, labelRu: label.ru, labelAz: label.az, labelEn: label.en };
    if (fieldPresent(lot, row.id)) {
      earned.push(item);
      score += row.weight;
    } else {
      missed.push(item);
    }
  }
  return {
    profile,
    score,
    minimumForEmlakScore: INTELLIGENCE_RULES.scoreMinCompleteness,
    earned,
    missed,
  };
}

function buildMarket(lot, comps, loading, failed) {
  if (loading) {
    return {
      level: "loading",
      label: MARKET_LABEL.loading,
      reasonRu: "Ждём ответ источника объявлений.",
      reasonAz: "Elan mənbəyinin cavabını gözləyirik.",
      reasonEn: "Waiting for the listing source.",
      counts: null,
      usable: false,
      range: null,
    };
  }
  if (failed || comps?.marketStatus === "unavailable") {
    return {
      level: "unavailable",
      label: MARKET_LABEL.unavailable,
      reasonRu: comps?.marketStatusReasonRu || "Рыночные данные временно недоступны. Попробуйте позже.",
      reasonAz: comps?.marketStatusReasonAz || "Bazar məlumatı müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.",
      reasonEn: comps?.marketStatusReasonEn || "Market data is temporarily unavailable. Try again later.",
      counts: comps?.counts || { found: 0, accepted: 0, rejected: 0, used: 0 },
      usable: false,
      range: null,
    };
  }

  const level = comps?.marketStatus || "insufficient";
  const counts = comps?.counts || { found: 0, accepted: 0, rejected: 0, used: 0 };
  const usable = Boolean(comps?.stats?.usableForValuation) && (level === "high" || level === "medium");
  const stats = comps?.stats || {};
  const range =
    usable && stats.p25 != null && stats.p75 != null
      ? { low: stats.p25, median: stats.medianPrice ?? null, high: stats.p75 }
      : null;
  const reason = marketReason(lot, comps, level, counts);

  return {
    level: MARKET_LABEL[level] ? level : "insufficient",
    label: MARKET_LABEL[level] || MARKET_LABEL.insufficient,
    reasonRu: reason.ru,
    reasonAz: reason.az,
    reasonEn: reason.en,
    counts,
    usable,
    range,
    source: comps?.source || null,
    fetchedAt: comps?.fetchedAt || stats?.fetchedAt || null,
  };
}

function marketReason(lot, comps, level, counts) {
  const engineRu = comps?.marketStatusReasonRu;
  const engineAz = comps?.marketStatusReasonAz;
  const engineEn = comps?.marketStatusReasonEn;
  const found = counts.found ?? 0;
  const identity = autoIdentity(lot);
  const name = [identity.make, identity.model].filter(Boolean).join(" ");
  const yearMissing = (lot.market === "auto" || lot.market === "equipment") && !fieldPresent(lot, "year");

  if (yearMissing && found > 0 && level !== "high" && level !== "medium") {
    return {
      ru: `Нашли ${found}${name ? ` ${name}` : ""}, но год автомобиля в Hərrac не указан. Без года мы не можем надёжно сравнить эти объявления. Рыночную цену не показываем.`,
      az: `${found}${name ? ` ${name}` : ""} elanı tapıldı, amma Hərrac-da il yoxdur. İlsiz bu elanları etibarlı müqayisə edə bilmirik. Bazar qiymətini göstərmirik.`,
      en: `Found ${found}${name ? ` ${name}` : ""}, but Hərrac does not state the year. Without a year these listings cannot be compared reliably. The market price stays hidden.`,
    };
  }
  if (level === "low") {
    return {
      ru: `Использовано ${counts.used ?? 0} объявлений. Для надёжной цены этого мало, поэтому рыночную цену и лимит не показываем.`,
      az: `${counts.used ?? 0} elan istifadə olunub. Etibarlı qiymət üçün bu azdır, ona görə bazar qiymətini və limiti göstərmirik.`,
      en: `Used ${counts.used ?? 0} listings. That is too few for a reliable price, so the market price and the limit stay hidden.`,
    };
  }
  if (engineRu) return { ru: engineRu, az: engineAz || engineRu, en: engineEn || engineRu };
  if (level === "high" || level === "medium") {
    return {
      ru: `Использовано ${counts.used ?? 0} объявлений. Найдено ${found}, отброшено ${counts.rejected ?? 0}.`,
      az: `${counts.used ?? 0} elan istifadə olunub. Tapılan ${found}, atılan ${counts.rejected ?? 0}.`,
      en: `Used ${counts.used ?? 0} listings. Found ${found}, rejected ${counts.rejected ?? 0}.`,
    };
  }
  return {
    ru: "Надёжного рыночного ориентира нет. Цену не показываем.",
    az: "Etibarlı bazar orientiri yoxdur. Qiyməti göstərmirik.",
    en: "There is no reliable market reference. The price stays hidden.",
  };
}

function buildRiskState(lot, findings, profile) {
  const confirmed = [];
  const seenQuotes = new Set();
  for (const finding of findings) {
    if (CONFIRMED_SKIP.has(finding.id)) continue;
    const quote = String(finding.evidenceQuote || "").trim();
    const fromCard = finding.evidence === "notes_params" || finding.evidence === "params";
    const quoteKey = quote.toLocaleLowerCase("az");
    if (!fromCard || !quote || seenQuotes.has(quoteKey)) continue;
    seenQuotes.add(quoteKey);
    const label =
      finding.id === "needs_repair" || finding.id === "mid_repair"
        ? {
            ru: `Состояние в карточке: ${quote}`,
            az: `Kartdakı vəziyyət: ${quote}`,
            en: `Condition in the card: ${quote}`,
          }
        : {
            ru: finding.labelRu || finding.label || finding.id,
            az: finding.labelAz || finding.label || finding.id,
            en: finding.labelEn || finding.label || finding.id,
          };
    confirmed.push({
      id: finding.id,
      labelRu: label.ru,
      labelAz: label.az,
      labelEn: label.en,
      quote,
    });
  }

  const confirmedIds = new Set(confirmed.map((item) => item.id));
  const unknown = [];
  const unconfirmed = [];

  if (profile === "auto") {
    if (!confirmedIds.has("engine_dead")) {
      unknown.push({
        id: "technical_condition",
        labelRu: "Работает ли двигатель, в карточке не сказано. Это не значит, что он сломан.",
        labelAz: "Mühərriyin işlədiyi kartda yazılmayıb. Bu, onun xarab olması demək deyil.",
        labelEn: "The card does not say whether the engine runs. That does not mean it is broken.",
      });
    }
    if (!fieldPresent(lot, "mileage")) {
      unknown.push({
        id: "mileage_unknown",
        labelRu: "Пробег не указан.",
        labelAz: "Yürüş yazılmayıb.",
        labelEn: "Mileage is not stated.",
      });
    }
    if (!fieldPresent(lot, "year")) {
      unknown.push({
        id: "year_unknown",
        labelRu: "Год автомобиля не указан.",
        labelAz: "Avtomobilin ili yazılmayıb.",
        labelEn: "The vehicle year is not stated.",
      });
    }
    if (!String(lot.vin || "").trim()) {
      unknown.push({
        id: "vin_unknown",
        labelRu: "В карточке нет VIN или номера кузова.",
        labelAz: "Kartda VIN və ya ban nömrəsi yoxdur.",
        labelEn: "The card has no VIN or body number.",
      });
    }
    if (!confirmedIds.has("body_damage") && !confirmedIds.has("rust")) {
      unconfirmed.push({
        id: "hidden_body",
        labelRu: "Скрытые повреждения по фото не читаем, в тексте их нет.",
        labelAz: "Gizli zədəni fotodan oxumuruq, mətndə də yoxdur.",
        labelEn: "Hidden damage is not read from photos, and the text does not mention it.",
      });
    }
  } else {
    if (!fieldPresent(lot, "encumbrance")) {
      unknown.push({
        id: "encumbrance_unknown",
        labelRu: "Обременение в карточке не названо. Это не значит, что его нет.",
        labelAz: "Yüklülük kartda yazılmayıb. Bu, onun olmaması demək deyil.",
        labelEn: "The card does not name an encumbrance. That does not mean there is none.",
      });
    }
    unconfirmed.push({
      id: "on_site",
      labelRu: "Фактическое состояние на месте карточка не подтверждает.",
      labelAz: "Yerindəki vəziyyəti kart təsdiqləmir.",
      labelEn: "The card does not confirm the condition on site.",
    });
  }

  if (!fieldPresent(lot, "inspection")) {
    unknown.push({
      id: "inspection_unknown",
      labelRu: "Условия осмотра в карточке не указаны.",
      labelAz: "Baxış şərti kartda yazılmayıb.",
      labelEn: "Inspection terms are not stated in the card.",
    });
  }

  return { confirmed, unconfirmed, unknown };
}

function decideStatus({ lot, investment, market, loading }) {
  if (loading) return "pending";
  if (market.level === "unavailable") return "market_unavailable";
  if (investment?.saleSource === "user" && investment?.priced && investment?.atBid?.profit != null) {
    return "own_scenario";
  }

  const priced = Boolean(
    investment?.limitReady && investment?.atBid?.status && investment?.saleSource !== "user"
  );
  if (market.usable && priced) {
    if (investment.atBid.status === "good") return "fits";
    if (investment.atBid.status === "borderline") return "borderline";
    if (investment.atBid.status === "above") return "above";
  }

  const start = finite(lot.startPrice);
  const low = market.range?.low;
  if (market.usable && !investment?.limitReady && start != null && low != null && start < low) {
    return "potential";
  }

  return "insufficient_data";
}

function buildEligibility({ completeness, market, investment, loading }) {
  const reasons = [];
  if (loading) {
    reasons.push({
      id: "market_loading",
      ru: "Рынок ещё загружается.",
      az: "Bazar hələ yüklənir.",
      en: "The market is still loading.",
    });
  } else if (market.level === "unavailable") {
    reasons.push({
      id: "market_unavailable",
      ru: "Источник объявлений не ответил. Без него оценку не ставим.",
      az: "Elan mənbəyi cavab vermədi. Onsuz qiymət qoymuruq.",
      en: "The listing source did not respond. Without it there is no valuation.",
    });
  } else if (!market.usable) {
    reasons.push({
      id: "market_unconfirmed",
      ru: market.reasonRu,
      az: market.reasonAz,
      en: market.reasonEn,
    });
  }
  if (completeness.score < INTELLIGENCE_RULES.scoreMinCompleteness) {
    const missing = completeness.missed.map((item) => item.labelRu).join(", ");
    const missingAz = completeness.missed.map((item) => item.labelAz).join(", ");
    const missingEn = completeness.missed.map((item) => item.labelEn).join(", ");
    reasons.push({
      id: "completeness",
      ru: `Полнота данных ${completeness.score} из 100. Для оценки нужно хотя бы ${INTELLIGENCE_RULES.scoreMinCompleteness}. Не хватает: ${missing}.`,
      az: `Məlumat tamlığı 100-dən ${completeness.score}. Qiymət üçün ən azı ${INTELLIGENCE_RULES.scoreMinCompleteness} lazımdır. Çatışmır: ${missingAz}.`,
      en: `Data completeness is ${completeness.score} of 100. A score needs at least ${INTELLIGENCE_RULES.scoreMinCompleteness}. Missing: ${missingEn}.`,
    });
  }
  if (investment?.saleSource === "user") {
    reasons.push({
      id: "user_scenario",
      ru: "Emlak Score не использует вашу предполагаемую цену. Оценка считается только по подтверждённому рынку.",
      az: "Emlak Score sizin ehtimal etdiyiniz qiyməti işlətmir. Qiymət yalnız təsdiqli bazara görədir.",
      en: "Emlak Score does not use your expected price. The score uses only a confirmed market.",
    });
  } else if (!investment?.limitReady) {
    const block = investment?.blockedText?.[0] || investment?.desiredBlockedText?.[0];
    reasons.push({
      id: "economics",
      ru: block?.ru || "Экономику сделки посчитать нельзя: не хватает рынка или ваших расходов.",
      az: block?.az || "Sövdələşmənin iqtisadiyyatını hesablamaq olmur: bazar və ya sizin xərclər çatmır.",
      en: block?.en || "The deal economics cannot be calculated: the market or your costs are missing.",
    });
  }

  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

function buildPillars({ completeness, market, investment, riskState, scoreEligibility }) {
  const marketPoints = INTELLIGENCE_RULES.marketPoints[market.level] ?? null;
  const economicsStatus = investment?.limitReady ? investment.atBid?.status : null;
  const economicsPoints = INTELLIGENCE_RULES.economicsPoints[economicsStatus] ?? null;

  return {
    completeness: {
      id: "completeness",
      labelRu: "Полнота данных",
      labelAz: "Məlumatın tamlığı",
      labelEn: "Data completeness",
      value: completeness.score,
      earned: completeness.earned,
      missed: completeness.missed,
    },
    market: {
      id: "market",
      labelRu: "Надёжность рынка",
      labelAz: "Bazarın etibarlılığı",
      labelEn: "Market confidence",
      value: market.usable ? marketPoints : null,
      level: market.level,
      label: market.label,
      reasonRu: market.reasonRu,
      reasonAz: market.reasonAz,
      reasonEn: market.reasonEn,
      counts: market.counts,
    },
    riskTransparency: {
      id: "risk",
      labelRu: "Прозрачность рисков",
      labelAz: "Risk şəffaflığı",
      labelEn: "Risk transparency",
      value: null,
      confirmed: riskState.confirmed,
      unconfirmed: riskState.unconfirmed,
      unknown: riskState.unknown,
      noteRu:
        "Это не оценка опасности. Подтверждено только то, что написано в карточке. Пустое поле остаётся неизвестностью.",
      noteAz:
        "Bu, təhlükə qiyməti deyil. Təsdiq yalnız kartda yazılandır. Boş sahə naməlum qalır.",
      noteEn:
        "This is not a danger score. Only what the card states is confirmed. An empty field stays unknown.",
    },
    economics: {
      id: "economics",
      labelRu: "Экономика сделки",
      labelAz: "Sövdələşmənin iqtisadiyyatı",
      labelEn: "Deal economics",
      value: scoreEligibility.reasons.some((item) => item.id === "market_loading")
        ? null
        : economicsPoints,
      ready: Boolean(investment?.limitReady),
      status: economicsStatus,
      blocked: investment?.blockedText || [],
      formulaRu: investment?.formulaRu || null,
      formulaAz: investment?.formulaAz || null,
      formulaEn: investment?.formulaEn || null,
    },
  };
}

function composeScore(pillars, investment) {
  const weights = INTELLIGENCE_RULES.scoreWeights;
  const status = investment?.atBid?.status;
  const economics = INTELLIGENCE_RULES.economicsPoints[status];
  const market = pillars.market.value;
  const completeness = pillars.completeness.value;
  if (economics == null || market == null || completeness == null) return null;
  const raw =
    completeness * weights.completeness +
    market * weights.market +
    economics * weights.economics;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function buildUnknowns(completeness, market, riskState, investment) {
  const items = [];
  for (const row of completeness.missed) {
    items.push({ id: row.id, ru: `Не указано: ${row.labelRu}.`, az: `Yazılmayıb: ${row.labelAz}.`, en: `Not stated: ${row.labelEn}.` });
  }
  for (const row of riskState.unknown) {
    if (items.some((item) => item.id === row.id || item.id === row.id.replace("_unknown", ""))) continue;
    items.push({ id: row.id, ru: row.labelRu, az: row.labelAz, en: row.labelEn });
  }
  if (!market.usable && market.level !== "loading") {
    items.push({
      id: "market_price",
      ru: "Рыночная цена не подтверждена.",
      az: "Bazar qiyməti təsdiqlənməyib.",
      en: "The market price is not confirmed.",
    });
  }
  if (investment && !investment.priced) {
    items.push({
      id: "expenses",
      ru: "Ваши расходы ещё не введены. Пустое поле не считается нулём.",
      az: "Sizin xərclər hələ daxil edilməyib. Boş sahə sıfır sayılmır.",
      en: "Your costs are not entered yet. An empty field is not treated as zero.",
    });
  }
  return items;
}

function buildNextActions({ lot, profile, completeness, market, investment, riskState }) {
  const actions = [];
  const missed = new Set(completeness.missed.map((item) => item.id));

  if (profile === "auto" && missed.has("year")) {
    actions.push({
      id: "ask_year",
      ru: "Уточните год автомобиля. Без него сопоставимые объявления не отбираются.",
      az: "Avtomobilin ilini dəqiqləşdirin. Onsuz uyğun elanlar seçilmir.",
      en: "Confirm the vehicle year. Without it, comparable listings are not selected.",
    });
  }
  if (profile === "auto" && missed.has("mileage")) {
    actions.push({
      id: "ask_mileage",
      ru: "Уточните пробег.",
      az: "Yürüşü dəqiqləşdirin.",
      en: "Confirm the mileage.",
    });
  }
  if (profile === "auto" && !String(lot.vin || "").trim()) {
    actions.push({
      id: "ask_vin",
      ru: "Проверьте VIN или номер кузова, если он доступен на осмотре или в документах.",
      az: "VIN və ya ban nömrəsini baxışda və ya sənəddə varsa yoxlayın.",
      en: "Check the VIN or body number if it is available at inspection or in the documents.",
    });
  }
  if (missed.has("inspection") || riskState.unknown.some((item) => item.id === "inspection_unknown")) {
    actions.push({
      id: "ask_inspection",
      ru: "Уточните, можно ли осмотреть лот, и на каких условиях.",
      az: "Lotu baxmaq olub-olmadığını və şərtlərini dəqiqləşdirin.",
      en: "Check whether the lot can be inspected, and on what terms.",
    });
  }
  if (market.level === "loading") {
    actions.push({
      id: "wait_market",
      ru: "Дождитесь ответа источника объявлений. Пока его нет, рыночную цену не подставляем.",
      az: "Elan mənbəyinin cavabını gözləyin. Cavab yoxdursa, bazar qiyməti qoymuruq.",
      en: "Wait for the listing source. Until it answers, no market price is filled in.",
    });
  } else if (market.level === "unavailable") {
    actions.push({
      id: "wait_market",
      ru: "Проверьте источник ещё раз позже. Пока он молчит, рыночную цену не подставляем.",
      az: "Mənbəni bir az sonra yenidən yoxlayın. Susduqca bazar qiyməti qoymuruq.",
      en: "Check the source again later. While it is silent, no market price is filled in.",
    });
  } else if (!market.usable && investment?.saleSource !== "user") {
    actions.push({
      id: "enter_own_price",
      ru: "Укажите предполагаемую цену продажи и расходы. Калькулятор посчитает ваш сценарий и не назовёт его рыночной оценкой.",
      az: "Gözlənilən satış qiymətini və xərcləri yazın. Kalkulyator sizin ssenarinizi hesablayacaq və bunu bazar qiyməti adlandırmayacaq.",
      en: "Enter an expected sale price and the costs. The calculator will price your scenario and will not call it a market valuation.",
    });
  }
  if (market.usable && !investment?.limitReady) {
    actions.push({
      id: "enter_costs",
      ru: "Введите расходы и желаемую прибыль, если хотите лимит под ваши условия. Пока их нет, показываем только потенциал.",
      az: "Şərtlərinizə görə limit istəyirsinizsə, xərcləri və istədiyiniz qazancı yazın. Onlar yoxdursa, yalnız potensialı göstəririk.",
      en: "Enter costs and the profit you want if you need a limit for your terms. Until then, only the potential is shown.",
    });
  }
  if (market.usable && investment?.limitReady) {
    actions.push({
      id: "review_bid",
      ru: "Сверьте ставку с лимитом и откройте карточку на Hərrac перед задатком.",
      az: "Stavkanı limitlə tutuşdurun və behdən əvvəl Hərrac kartını açın.",
      en: "Compare the bid with the limit and open the Hərrac card before paying the deposit.",
    });
  }
  return actions;
}

function buildWhy({ lot, market, investment, dealStatus, scoreEligibility, emlakScore, riskState, completeness }) {
  const start = finite(lot.startPrice);
  const median = market.range?.median;
  const low = market.range?.low;
  let statusRu = market.reasonRu;
  let statusAz = market.reasonAz;
  let statusEn = market.reasonEn;

  if (dealStatus === "potential" && start != null && median != null) {
    const gap = Math.round(median - start);
    const repairKnown = investment?.costs?.repair?.origin === "user";
    statusRu = repairKnown
      ? `Рыночный ориентир ${azn(median)}, старт ${azn(start)}. Разница до расходов ${azn(gap)}. Лимит под ваши условия появится, когда будет желаемая прибыль.`
      : `Рыночный ориентир ${azn(median)}, старт ${azn(start)}. Разница до расходов ${azn(gap)}. Ремонт ещё не указан.`;
    statusAz = repairKnown
      ? `Bazar orientiri ${azn(median)}, start ${azn(start)}. Xərclərdən əvvəl fərq ${azn(gap)}. Şərtlərinizə görə limit istədiyiniz qazanc yazılanda görünəcək.`
      : `Bazar orientiri ${azn(median)}, start ${azn(start)}. Xərclərdən əvvəl fərq ${azn(gap)}. Təmir hələ yazılmayıb.`;
    statusEn = repairKnown
      ? `Market reference ${azn(median)}, start ${azn(start)}. Gap before costs ${azn(gap)}. A limit for your terms appears once the profit you want is entered.`
      : `Market reference ${azn(median)}, start ${azn(start)}. Gap before costs ${azn(gap)}. Repair is not entered yet.`;
  } else if (dealStatus === "fits" || dealStatus === "borderline" || dealStatus === "above") {
    statusRu = investment?.limitSentenceRu || statusRu;
    statusAz = investment?.limitSentenceAz || statusAz;
    statusEn = investment?.limitSentenceEn || statusEn;
  } else if (dealStatus === "own_scenario") {
    const profit = investment?.atBid?.profit;
    const sale = investment?.saleAnchor?.amount;
    statusRu = `Ваш сценарий: продажа ${sale != null ? azn(sale) : "—"}, результат ${profit != null ? azn(profit) : "—"}. Рынок эту цену не подтвердил. ${market.reasonRu}`;
    statusAz = `Sizin ssenari: satış ${sale != null ? azn(sale) : "—"}, nəticə ${profit != null ? azn(profit) : "—"}. Bazar bu qiyməti təsdiqləməyib. ${market.reasonAz}`;
    statusEn = `Your scenario: sale ${sale != null ? azn(sale) : "—"}, result ${profit != null ? azn(profit) : "—"}. The market has not confirmed this price. ${market.reasonEn}`;
  } else if (dealStatus === "insufficient_data" && market.usable && !investment?.priced) {
    statusRu = `Рынок подтверждён${low != null ? `: ${azn(market.range.low)}–${azn(market.range.high)}` : ""}. Стартовая цена не ниже этого диапазона, а расходы не введены, поэтому потенциал не заявляем.`;
    statusAz = `Bazar təsdiqlənib${low != null ? `: ${azn(market.range.low)}–${azn(market.range.high)}` : ""}. Start qiyməti bu aralıqdan aşağı deyil, xərclər isə yazılmayıb, ona görə potensial demirik.`;
    statusEn = `The market is confirmed${low != null ? `: ${azn(market.range.low)}–${azn(market.range.high)}` : ""}. The start price is not below that range, and costs are not entered, so no potential is claimed.`;
  } else if (dealStatus === "market_unavailable") {
    statusRu = market.reasonRu;
    statusAz = market.reasonAz;
    statusEn = market.reasonEn;
  } else if (completeness.missed[0] && !market.usable) {
    statusRu = market.reasonRu;
    statusAz = market.reasonAz;
    statusEn = market.reasonEn;
  }

  const scoreRu = scoreEligibility.allowed
    ? `Оценка ${emlakScore} из 100: полнота ${completeness.score}, рынок «${market.label.ru}», экономика по вашему лимиту. Неизвестные риски в эту цифру не входят.`
    : scoreEligibility.reasons[0]?.ru || "Оценка не рассчитана.";
  const scoreAz = scoreEligibility.allowed
    ? `Qiymət 100-dən ${emlakScore}: tamlıq ${completeness.score}, bazar «${market.label.az}», iqtisadiyyat sizin limitə görə. Naməlum risklər bu rəqəmə girmir.`
    : scoreEligibility.reasons[0]?.az || "Qiymət hesablanmayıb.";
  const scoreEn = scoreEligibility.allowed
    ? `Score ${emlakScore} of 100: completeness ${completeness.score}, market “${market.label.en}”, economics from your limit. Unknown risks are not inside this number.`
    : scoreEligibility.reasons[0]?.en || "The score is not calculated.";

  const riskRu = riskState.confirmed.length
    ? `Подтверждено текстом Hərrac: ${riskState.confirmed.map((item) => `«${item.quote}»`).join("; ")}.`
    : "Подтверждённого дефекта в тексте карточки нет.";
  const riskAz = riskState.confirmed.length
    ? `Hərrac mətni ilə təsdiqlənib: ${riskState.confirmed.map((item) => `«${item.quote}»`).join("; ")}.`
    : "Kartın mətnində təsdiqli qüsur yoxdur.";
  const riskEn = riskState.confirmed.length
    ? `Confirmed by the Hərrac text: ${riskState.confirmed.map((item) => `“${item.quote}”`).join("; ")}.`
    : "The card text has no confirmed defect.";

  return {
    status: { ru: statusRu, az: statusAz, en: statusEn },
    score: { ru: scoreRu, az: scoreAz, en: scoreEn },
    market: { ru: market.reasonRu, az: market.reasonAz, en: market.reasonEn },
    limit: {
      ru: investment?.limitReady
        ? investment.limitSentenceRu
        : investment?.desiredBlockedText?.[0]?.ru || investment?.blockedText?.[0]?.ru || "Лимит не посчитан: нет подтверждённого рынка или ваших цифр.",
      az: investment?.limitReady
        ? investment.limitSentenceAz
        : investment?.desiredBlockedText?.[0]?.az || investment?.blockedText?.[0]?.az || "Limit hesablanmayıb: təsdiqli bazar və ya sizin rəqəmlər yoxdur.",
      en: investment?.limitReady
        ? investment.limitSentenceEn
        : investment?.desiredBlockedText?.[0]?.en || investment?.blockedText?.[0]?.en || "The limit is not calculated: there is no confirmed market or your figures.",
    },
    risks: { ru: riskRu, az: riskAz, en: riskEn },
  };
}

function buildKnown(lot, completeness, market, investment) {
  const items = completeness.earned.slice(0, 5).map((row) => {
    const value = fieldValue(lot, row.id);
    return {
      id: row.id,
      ru: value ? `${row.labelRu}: ${value}` : row.labelRu,
      az: value ? `${row.labelAz}: ${value}` : row.labelAz,
      en: value ? `${row.labelEn}: ${value}` : row.labelEn,
    };
  });
  const start = finite(lot.startPrice);
  if (start != null) {
    items.unshift({ id: "start", ru: `Старт ${azn(start)}`, az: `Start ${azn(start)}`, en: `Start ${azn(start)}` });
  }
  if (market.usable && market.range) {
    items.push({
      id: "market_range",
      ru: `Рынок ${azn(market.range.low)}–${azn(market.range.high)}`,
      az: `Bazar ${azn(market.range.low)}–${azn(market.range.high)}`,
      en: `Market ${azn(market.range.low)}–${azn(market.range.high)}`,
    });
  }
  if (investment?.limitReady && investment.maxBid?.amount != null) {
    items.push({
      id: "limit",
      ru: `Ваш лимит ${azn(investment.maxBid.amount)}`,
      az: `Sizin limit ${azn(investment.maxBid.amount)}`,
      en: `Your limit ${azn(investment.maxBid.amount)}`,
    });
  }
  return items;
}

function buildFlow(dealStatus, market, investment) {
  const showCalculation = dealStatus === "fits" || dealStatus === "borderline" || dealStatus === "above";
  if (market.level === "loading") {
    return {
      showCalculation: false,
      noteRu: "Смотрим рынок. Расходы можно ввести заранее, но лимит появится только после подтверждённого ориентира и ваших цифр.",
      noteAz: "Bazara baxırıq. Xərcləri əvvəlcədən yazmaq olar, amma limit təsdiqli orientirdən və sizin rəqəmlərdən sonra görünəcək.",
      noteEn: "Checking the market. Costs can be entered early, but the limit appears only after a confirmed reference and your figures.",
    };
  }
  if (showCalculation) {
    return {
      showCalculation: true,
      noteRu: "Лимит посчитан из рыночного ориентира и цифр, которые вы ввели.",
      noteAz: "Limit bazar orientirindən və sizin yazdığınız rəqəmlərdən hesablanıb.",
      noteEn: "The limit is calculated from the market reference and the figures you entered.",
    };
  }
  if (market.usable && !investment?.priced) {
    return {
      showCalculation: false,
      noteRu: "Рынок подтверждён. Расходы можно ввести заранее, но лимит покажем только когда цифры будут названы.",
      noteAz: "Bazar təsdiqlənib. Xərcləri əvvəlcədən yazmaq olar, amma limiti rəqəmlər deyilənə qədər göstərmirik.",
      noteEn: "The market is confirmed. Costs can be entered early, but the limit is shown only once the figures are named.",
    };
  }
  if (investment?.saleSource === "user" && investment?.priced) {
    return {
      showCalculation: true,
      noteRu: "Это ваш сценарий. Цена продажи указана вами и не подтверждена рынком.",
      noteAz: "Bu sizin ssenarinizdir. Satış qiymətini siz yazmısınız, bazar onu təsdiqləməyib.",
      noteEn: "This is your scenario. You entered the sale price, and the market has not confirmed it.",
    };
  }
  if (!market.usable && investment && costsTouched(investment)) {
    return {
      showCalculation: false,
      noteRu: "Расходы уже введены. Укажите предполагаемую цену продажи, чтобы посчитать свой сценарий. Рынок её не подтвердил.",
      noteAz: "Xərclər artıq yazılıb. Öz ssenarinizi hesablamaq üçün gözlənilən satış qiymətini yazın. Bazar onu təsdiqləməyib.",
      noteEn: "Costs are already entered. Enter an expected sale price to calculate your scenario. The market has not confirmed it.",
    };
  }
  return {
    showCalculation: false,
    noteRu: "Рынок не подтверждён. Укажите свою предполагаемую цену продажи и расходы — посчитаем ваш сценарий. Это не оценка Emlak Hub.",
    noteAz: "Bazar təsdiqlənməyib. Öz gözlənilən satış qiymətinizi və xərcləri yazın — ssenarinizi hesablayacağıq. Bu, Emlak Hub qiyməti deyil.",
    noteEn: "The market is not confirmed. Enter your expected sale price and the costs, and we will calculate your scenario. This is not an Emlak Hub valuation.",
  };
}

function costsTouched(investment) {
  const repair = investment.costs?.repair?.origin;
  const other = investment.costs?.other?.origin;
  return repair === "user" || other === "user" || investment.desired?.origin === "user";
}

function finite(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function azn(value) {
  const number = finite(value);
  if (number == null) return "—";
  return `${Math.round(number).toLocaleString("ru-RU")} ₼`;
}

export { STATUS_LABEL, MARKET_LABEL };
