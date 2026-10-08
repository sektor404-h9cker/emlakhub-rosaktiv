/**
 * Экономика сделки без выдуманных расходов.
 *
 * Чистая прибыль появляется только как сценарий:
 * есть медиана аналогов и инвестор сам ввёл ремонт.
 * Каждая сумма несёт origin — это след для аудита.
 */

import { ORIGIN } from "../origin";

export { ORIGIN, originLabel } from "../origin";

function n(v, fallback = null) {
  if (v == null || v === "") return fallback;
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function round2(v) {
  return Math.round(Number(v) * 100) / 100;
}

function userRepair(v) {
  if (v == null || v === "") return null;
  const x = Number(v);
  if (!Number.isFinite(x) || x < 0) return null;
  return round2(x);
}

function entry(id, origin, amount, labelRu, labelAz) {
  return {
    id,
    origin,
    amount: amount == null ? null : round2(amount),
    unit: "AZN",
    labelRu,
    labelAz,
  };
}

/**
 * opts.repair и lot.repairCost намеренно игнорируются.
 * Автоматическая смета ремонта в прибыль не входит.
 *
 * @param {object} lot
 * @param {{
 *   bid?: number,
 *   repairUser?: number|null,
 *   marketOverride?: number|null,
 *   marketRange?: { low?: number, high?: number, median?: number, sampleSize?: number }|null,
 *   sellCostPct?: number,
 *   holdDays?: number,
 * }} [opts]
 */
export function computeEconomics(lot, opts = {}) {
  const start = n(lot?.startPrice, 0);
  const herracPrice = n(lot?.marketPrice ?? lot?.payload?.marketPrice);

  const depositRaw = n(lot?.deposit ?? lot?.payload?.deposit);
  const depositIsFact = depositRaw != null && depositRaw >= 0;
  const deposit = depositIsFact ? depositRaw : null;

  const feeRaw = n(lot?.fee ?? lot?.payload?.fee);
  const feeIsFact = feeRaw != null && feeRaw >= 0;
  const fee = feeIsFact ? feeRaw : null;

  const marketFromComps =
    opts.marketOverride != null &&
    Number.isFinite(Number(opts.marketOverride)) &&
    Number(opts.marketOverride) > 0
      ? round2(opts.marketOverride)
      : null;

  const range = opts.marketRange || null;
  const repair = userRepair(opts.repairUser);

  const sellPct =
    opts.sellCostPct == null || opts.sellCostPct === ""
      ? null
      : n(opts.sellCostPct);
  const sellCost =
    marketFromComps != null && sellPct != null
      ? round2(marketFromComps * sellPct)
      : null;

  const holdDays = n(opts.holdDays);
  const storagePerDay = n(lot?.payload?.storagePerDay);
  const storage =
    storagePerDay != null && holdDays != null
      ? round2(holdDays * storagePerDay)
      : null;

  const bid = opts.bid != null ? n(opts.bid, start) : start;
  const spreadVsHerrac =
    herracPrice != null ? round2(herracPrice - start) : null;
  const spreadVsMedian =
    marketFromComps != null ? round2(marketFromComps - start) : null;

  const blocked = [];
  if (marketFromComps == null) blocked.push("market_unconfirmed");
  if (repair == null) blocked.push("repair_unknown");

  const canScenario = blocked.length === 0;
  const netProfit = canScenario
    ? round2(
        marketFromComps -
          bid -
          repair -
          (sellCost || 0) -
          (storage || 0) -
          (fee || 0)
      )
    : null;

  const ledger = [
    entry("start", ORIGIN.HERRAC, start, "Стартовая цена", "Başlanğıc qiymət"),
    entry(
      "herracLotPrice",
      herracPrice == null ? ORIGIN.UNKNOWN : ORIGIN.HERRAC,
      herracPrice,
      "Цена лота в карточке Hərrac",
      "Hərrac kartındakı lot qiyməti"
    ),
    entry(
      "spreadVsHerracPrice",
      spreadVsHerrac == null ? ORIGIN.UNKNOWN : ORIGIN.HERRAC,
      spreadVsHerrac,
      "Разница цены лота Hərrac и старта. Это не чистая прибыль.",
      "Hərrac lot qiyməti ilə startın fərqi. Bu xalis qazanc deyil."
    ),
    entry(
      "marketLow",
      range?.low != null ? ORIGIN.MARKET : ORIGIN.UNKNOWN,
      range?.low ?? null,
      "Нижняя граница аналогов (p25)",
      "Oxşarların aşağı həddi (p25)"
    ),
    entry(
      "marketHigh",
      range?.high != null ? ORIGIN.MARKET : ORIGIN.UNKNOWN,
      range?.high ?? null,
      "Верхняя граница аналогов (p75)",
      "Oxşarların yuxarı həddi (p75)"
    ),
    entry(
      "marketMedian",
      marketFromComps == null ? ORIGIN.UNKNOWN : ORIGIN.MARKET,
      marketFromComps,
      "Медиана аналогов",
      "Oxşarların medianı"
    ),
    entry(
      "spreadVsMedian",
      spreadVsMedian == null ? ORIGIN.UNKNOWN : ORIGIN.MARKET,
      spreadVsMedian,
      "Медиана − старт",
      "Median − start"
    ),
    entry(
      "repair",
      repair == null ? ORIGIN.UNKNOWN : ORIGIN.USER,
      repair,
      repair == null
        ? "Стоимость ремонта неизвестна"
        : "Ремонт ввёл инвестор",
      repair == null ? "Təmirin dəyəri məlum deyil" : "Təmiri investor daxil etdi"
    ),
    entry(
      "sellCost",
      sellCost == null ? ORIGIN.UNKNOWN : ORIGIN.ASSUMPTION,
      sellCost,
      sellCost == null
        ? "Расходы на продажу не заданы и в сценарий не входят"
        : `Расходы на продажу: допущение ${Math.round(sellPct * 100)}% от медианы`,
      sellCost == null
        ? "Satış xərci yazılmayıb və ssenariyə daxil deyil"
        : `Satış xərci: medianın ${Math.round(sellPct * 100)}%-i fərziyyədir`
    ),
    entry(
      "deposit",
      depositIsFact ? ORIGIN.HERRAC : ORIGIN.ASSUMPTION,
      deposit,
      depositIsFact
        ? "Задаток из карточки Hərrac. В прибыль не входит: это не расход сверх ставки."
        : "Задаток в карточке не указан и в расчёт не входит",
      depositIsFact
        ? "Beh Hərrac kartından. Qazanca daxil deyil."
        : "Beh kartda yoxdur və hesaba daxil deyil"
    ),
    entry(
      "fee",
      feeIsFact ? ORIGIN.HERRAC : ORIGIN.ASSUMPTION,
      fee,
      feeIsFact
        ? "Сбор из карточки Hərrac"
        : "Сбор в карточке не указан и в расчёт не входит",
      feeIsFact
        ? "Haqq Hərrac kartından"
        : "Haqq kartda yoxdur və hesaba daxil deyil"
    ),
    entry(
      "storage",
      storage == null ? ORIGIN.UNKNOWN : ORIGIN.ASSUMPTION,
      storage,
      storage == null
        ? "Хранение в расчёт не входит: нет ставки или числа дней от вас"
        : `Хранение: ставка из лота × ${holdDays} дней, которые задали вы`,
      storage == null
        ? "Saxlanma hesaba daxil deyil"
        : `Saxlanma: lotdakı tarif × sizin ${holdDays} gününüz`
    ),
    entry(
      "netProfit",
      canScenario ? ORIGIN.USER : ORIGIN.UNKNOWN,
      netProfit,
      canScenario
        ? "Сценарий: медиана − ставка − ваш ремонт − допущения. Не факт Hərrac."
        : "Окончательную чистую прибыль пока определить нельзя",
      canScenario
        ? "Ssenari: median − stavka − sizin təmiriniz − fərziyyələr. Hərrac faktı deyil."
        : "Yekun xalis qazancı hələ müəyyən etmək olmaz"
    ),
  ];

  return {
    currency: "AZN",
    profitStatus: canScenario ? "scenario" : "unknown",
    profitBlockedBecause: canScenario ? [] : blocked,
    ledger,
    inputs: {
      bid,
      market: marketFromComps,
      herracPrice,
      repair,
      repairOrigin: repair == null ? ORIGIN.UNKNOWN : ORIGIN.USER,
      fee,
      feeOrigin: feeIsFact ? ORIGIN.HERRAC : ORIGIN.UNKNOWN,
      deposit,
      depositOrigin: depositIsFact ? ORIGIN.HERRAC : ORIGIN.UNKNOWN,
      sellCostPct: sellPct,
      sellCostOrigin: sellCost == null ? ORIGIN.UNKNOWN : ORIGIN.ASSUMPTION,
      holdDays,
      storagePerDay,
    },
    lines: {
      marketValue: marketFromComps,
      herracLotPrice: herracPrice,
      auctionBid: bid,
      grossSpread: spreadVsMedian,
      spreadVsHerrac,
      repair,
      sellCost: sellCost == null ? null : -sellCost,
      storage: storage == null ? null : -storage,
      participationFee: fee == null ? null : -fee,
      netProfit,
    },
    marketView: {
      start,
      herracLotPrice: herracPrice,
      low: range?.low ?? null,
      high: range?.high ?? null,
      median: marketFromComps,
      spreadVsMedian,
      sampleSize: range?.sampleSize ?? null,
    },
    marginPct:
      canScenario && marketFromComps > 0
        ? round2((netProfit / marketFromComps) * 100)
        : null,
    grade: null,
    formulaAz:
      "Ssenari = Median − Stavka − Sizin təmiriniz − Satış xərci (yazılıbsa) − Saxlanma (gün yazılıbsa) − Hərrac haqqı (kartda varsa)",
    formulaRu:
      "Сценарий = Медиана − Ставка − Ваш ремонт − Расходы на продажу (если заданы) − Хранение (если заданы дни) − Сбор Hərrac (если он есть в карточке)",
    disclaimerAz:
      "Xalis qazanc yalnız siz təmir rəqəmi yazandan və median təsdiqlənəndən sonra ssenari kimi görünür.",
    disclaimerRu:
      "Чистая прибыль появляется только как сценарий: после вашей цифры ремонта и подтверждённой медианы аналогов.",
  };
}
