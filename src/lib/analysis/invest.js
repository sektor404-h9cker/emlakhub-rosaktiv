/**
 * Investment Engine.
 *
 * Принимает ориентир Market Engine и ввод инвестора.
 * Рыночная цена — не обещание продажи: это p25, медиана или p75 из comps.
 *
 * Прибыль не считается, если рынок слабый (low), данных мало (insufficient)
 * или источник не ответил (unavailable). Иначе лимит ставки опирался бы
 * на выборку, которой нельзя верить.
 *
 * Потенциальная прибыль = ориентир − ставка − ремонт − прочие − сбор Hərrac − продажа.
 * ROI = прибыль / (ставка + ремонт + прочие + сбор Hərrac + продажа).
 *
 * Желаемая прибыль суммой:
 *   максимальная ставка = ориентир − ремонт − прочие − сбор − продажа − прибыль.
 * Желаемая прибыль процентом (ROI на капитал):
 *   максимальная ставка = ориентир / (1 + ROI) − ремонт − прочие − сбор − продажа.
 *
 * herrac_fact — сбор и задаток из карточки. Задаток в прибыль не входит.
 * user — ремонт, прочие, желаемая прибыль, изменённый процент продажи. Пустое поле — unknown, не ноль.
 * assumption — стандартные 3% на продажу, пока инвестор их не трогал.
 * Поле repairCost намеренно не читается: старая смета не должна попасть в формулу.
 */
import { ORIGIN } from "../origin";
import { INVEST_RULES } from "../productRules";

export const BORDERLINE_BAND = INVEST_RULES.borderlineBand;
export const DEFAULT_SELL_PCT = INVEST_RULES.defaultSellPct;

const BLOCK_TEXT = {
  market_low: {
    ru: "Достоверность рынка низкая. Ориентир показан, максимальную ставку и прибыль по нему не считаем.",
    az: "Bazar etibarlılığı aşağıdır. Orientir göstərilir, maksimum stavka və qazanc hesablanmır.",
    en: "Market confidence is low. The reference is shown, but the maximum bid and profit are not calculated from it.",
  },
  market_unconfirmed: {
    ru: "Рынок не подтверждён. Укажите предполагаемую цену продажи, если хотите посчитать свой сценарий.",
    az: "Bazar təsdiqlənməyib. Öz ssenarinizi hesablamaq üçün gözlənilən satış qiymətini yazın.",
    en: "The market is not confirmed. Enter an expected sale price if you want your own scenario calculated.",
  },
  market_unavailable: {
    ru: "Рыночные данные временно недоступны. Попробуйте позже.",
    az: "Bazar məlumatı müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.",
    en: "Market data is temporarily unavailable. Try again later.",
  },
  sale_anchor_missing: {
    ru: "Для выбранного сценария продажи в Market Engine нет границы.",
    az: "Seçilmiş satış ssenarisi üçün Market Engine həddi yoxdur.",
    en: "Market Engine has no bound for the selected sale scenario.",
  },
  repair_unknown: {
    ru: "Укажите расходы на ремонт или выберите «Не знаю».",
    az: "Təmir xərcini yazın və ya «Bilmirəm» seçin.",
    en: "Enter the repair cost, or choose “I don’t know”.",
  },
  repair_invalid: {
    ru: "Ремонт должен быть числом от нуля и выше.",
    az: "Təmir sıfır və ya müsbət rəqəm olmalıdır.",
    en: "Repair must be a number of zero or more.",
  },
  other_unknown: {
    ru: "Укажите дополнительные расходы или подтвердите, что их нет.",
    az: "Əlavə xərcləri yazın və ya olmadığını təsdiqləyin.",
    en: "Enter the extra costs, or confirm that there are none.",
  },
  other_invalid: {
    ru: "Прочие расходы должны быть числом от нуля и выше.",
    az: "Digər xərclər sıfır və ya müsbət rəqəm olmalıdır.",
    en: "Other costs must be a number of zero or more.",
  },
  desired_unknown: {
    ru: "Желаемая прибыль не указана. Без неё максимальную ставку не считаем.",
    az: "İstənilən qazanc yazılmayıb. Onsuz maksimum stavka hesablanmır.",
    en: "Desired profit is not entered. Without it the maximum bid is not calculated.",
  },
  desired_invalid: {
    ru: "Желаемая прибыль должна быть числом от нуля и выше.",
    az: "İstənilən qazanc sıfır və ya müsbət rəqəm olmalıdır.",
    en: "Desired profit must be a number of zero or more.",
  },
  goal_unreachable: {
    ru: "При этих расходах выбранная прибыль недостижима даже при ставке 0 ₼. Максимальную ставку не показываем.",
    az: "Bu xərclərlə seçilmiş qazanc 0 ₼ təklifdə belə mümkün deyil. Maksimum stavkanı göstərmirik.",
    en: "With these costs the chosen profit is impossible even at a 0 ₼ bid. The maximum bid is not shown.",
  },
  sell_invalid: {
    ru: "Процент расходов на продажу должен быть от 0 до 100.",
    az: "Satış xərci faizi 0 ilə 100 arasında olmalıdır.",
    en: "The resale cost percent must be between 0 and 100.",
  },
  user_sale_unknown: {
    ru: "Укажите предполагаемую цену продажи.",
    az: "Gözlənilən satış qiymətini yazın.",
    en: "Enter the expected sale price.",
  },
  user_sale_invalid: {
    ru: "Предполагаемая цена продажи должна быть числом больше нуля.",
    az: "Gözlənilən satış qiyməti sıfırdan böyük rəqəm olmalıdır.",
    en: "The expected sale price must be a number above zero.",
  },
};

const LABEL_EN = {
  "Нижняя граница рынка": "Market low",
  "Медиана рынка": "Market median",
  "Верхняя граница рынка": "Market high",
  Ремонт: "Repair",
  "Прочие расходы": "Other costs",
  "Сбор Hərrac": "Hərrac fee",
  "Максимальная ставка": "Maximum bid",
  "Выбранная прибыль": "Chosen profit",
  "Прибыль на максимальной ставке при выбранном ROI": "Profit at the maximum bid for the chosen ROI",
  "Потенциальная прибыль при текущей ставке": "Potential profit at the current bid",
  "ROI при текущей ставке": "ROI at the current bid",
  "Капитал при текущей ставке: ставка + ремонт + прочие + сбор + продажа":
    "Capital at the current bid: bid + repair + other + fee + resale",
  "Старт Hərrac": "Hərrac start",
  "Ваш лимит": "Your limit",
  "Ставка для сравнения": "Bid used for comparison",
};

function round2(v) {
  return Math.round(Number(v) * 100) / 100;
}

function finiteOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseUser(v) {
  if (v == null || String(v).trim() === "") return { value: null, state: "empty" };
  const n = Number(String(v).trim().replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { value: null, state: "invalid" };
  return { value: round2(n), state: "ok" };
}

function groupManat(n) {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(Math.round(Number(n)));
  const grouped = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${grouped}`;
}

function enLabel(labelRu, extra = {}) {
  return extra.labelEn || LABEL_EN[labelRu] || labelRu;
}

function line(id, amount, origin, labelRu, labelAz, extra = {}) {
  return {
    id,
    amount: amount == null ? null : round2(amount),
    origin,
    unit: "AZN",
    labelRu,
    labelAz,
    labelEn: enLabel(labelRu, extra),
    derived: false,
    ...extra,
  };
}

function derivedLine(id, amount, origins, labelRu, labelAz, extra = {}) {
  return {
    id,
    amount: amount == null ? null : round2(amount),
    origin: null,
    origins,
    unit: extra.unit || "AZN",
    labelRu,
    labelAz,
    labelEn: enLabel(labelRu, extra),
    derived: true,
    ...extra,
  };
}

function anchorFor(scenario, low, median, high) {
  if (scenario === "conservative") {
    return {
      key: "conservative",
      amount: low,
      labelRu: "Консервативный ориентир (нижняя граница рынка)",
      labelAz: "Ehtiyatlı orientir (bazarın aşağı həddi)",
      labelEn: "Conservative reference (market low)",
    };
  }
  if (scenario === "optimistic") {
    return {
      key: "optimistic",
      amount: high,
      labelRu: "Оптимистичный ориентир (верхняя граница рынка)",
      labelAz: "Optimist orientir (bazarın yuxarı həddi)",
      labelEn: "Optimistic reference (market high)",
    };
  }
  return {
    key: "market",
    amount: median,
    labelRu: "Рыночный ориентир (медиана)",
    labelAz: "Bazar orientiri (median)",
    labelEn: "Market reference (median)",
  };
}

function statusFor(bid, maxBid) {
  if (maxBid == null || bid == null || !Number.isFinite(bid)) return null;
  if (bid > maxBid) return "above";
  const band = Math.max(Math.abs(maxBid) * BORDERLINE_BAND, 1);
  if (maxBid - bid <= band) return "borderline";
  return "good";
}

function statusCopy(status) {
  if (status === "good") {
    return {
      ru: "ВЫГОДНО",
      az: "SƏRFƏLİ",
      hintRu: "Ставка ниже вашего лимита, выбранная прибыль сохраняется.",
      hintAz: "Stavka limitdən aşağıdır, seçdiyiniz qazanc qalır.",
    };
  }
  if (status === "borderline") {
    return {
      ru: "ПОГРАНИЧНО",
      az: "HƏDDƏ",
      hintRu: "Ставка у самого лимита: запас меньше 3% от максимальной ставки.",
      hintAz: "Stavka limitin yanındadır: ehtiyat maksimum stavkanın 3%-indən azdır.",
    };
  }
  if (status === "above") {
    return {
      ru: "ВЫШЕ ВАШЕГО ЛИМИТА",
      az: "LİMİTİNİZDƏN YUXARI",
      hintRu: "Эта ставка уже не даёт выбранную прибыль.",
      hintAz: "Bu stavka seçdiyiniz qazancı vermir.",
    };
  }
  return null;
}

function limitSentence(maxBid) {
  if (maxBid == null) return { ru: null, az: null, en: null };
  if (maxBid < 0) {
    return {
      ru: "При ваших условиях даже ставка 0 ₼ не обеспечивает выбранную прибыль.",
      az: "Sizin şərtlərinizlə hətta 0 ₼ stavka seçdiyiniz qazancı vermir.",
      en: "On your terms, even a 0 ₼ bid does not deliver the profit you chose.",
    };
  }
  const n = groupManat(maxBid);
  return {
    ru: `При ваших условиях покупка выше ${n} ₼ не обеспечивает выбранную прибыль.`,
    az: `Sizin şərtlərinizlə ${n} ₼-dən yuxarı alış seçdiyiniz qazancı vermir.`,
    en: `On your terms, a purchase above ${n} ₼ does not deliver the profit you chose.`,
  };
}

function resultAt(bid, sale, fixed, maxBid) {
  if (bid == null || sale == null || fixed == null) return null;
  const capital = round2(bid + fixed);
  const profit = round2(sale - capital);
  const roiPct = capital > 0 ? round2((profit / capital) * 100) : null;
  const status = statusFor(bid, maxBid);
  return {
    bid: round2(bid),
    capital,
    profit,
    roiPct,
    status,
    statusText: statusCopy(status),
  };
}

function ladderBids(start, maxBid) {
  if (maxBid == null) return [];
  const points = [];
  const push = (bid, role) => {
    if (bid == null || !Number.isFinite(bid)) return;
    const amount = round2(Math.max(0, bid));
    if (points.some((p) => Math.abs(p.amount - amount) < 0.5)) return;
    points.push({ amount, role });
  };
  if (start != null && start >= 0) push(start, "start");
  if (maxBid > 0 && start != null && start >= 0 && start < maxBid) {
    push((start + maxBid) / 2, "between");
  }
  if (maxBid > 0) push(maxBid, "limit");
  if (maxBid > 0) {
    push(maxBid + Math.max(maxBid * INVEST_RULES.ladderAbovePct, 100), "above");
  }
  return points.sort((a, b) => a.amount - b.amount);
}

/**
 * @param {object} input
 * @param {string} [input.marketStatus]
 * @param {boolean} [input.usableForValuation]
 * @param {number|null} [input.marketLow]
 * @param {number|null} [input.marketMedian]
 * @param {number|null} [input.marketHigh]
 * @param {"conservative"|"market"|"optimistic"} [input.saleScenario]
 * @param {number|string|null} [input.repair]
 * @param {number|string|null} [input.other]
 * @param {number|null} [input.herracFee]
 * @param {number|null} [input.deposit]
 * @param {number|null} [input.startPrice]
 * @param {number|string|null} [input.bid]
 * @param {"pct"|"amount"} [input.desiredMode]
 * @param {number|string|null} [input.desired]
 * @param {boolean} [input.sellEnabled]
 * @param {number|string|null} [input.sellPct]
 * @param {boolean} [input.sellTouched]
 * @param {number|string|null} [input.userSale] цена продажи, которую ввёл инвестор. Не рынок.
 */
export function computeInvestment(input = {}) {
  const marketStatus = input.marketStatus || "insufficient";
  const usable = Boolean(input.usableForValuation);
  const low = finiteOrNull(input.marketLow);
  const median = finiteOrNull(input.marketMedian);
  const high = finiteOrNull(input.marketHigh);
  const scenario = input.saleScenario || "market";
  const anchor = anchorFor(scenario, low, median, high);

  const repairParsed = parseUser(input.repair);
  const otherParsed = parseUser(input.other);
  const desiredParsed = parseUser(input.desired);
  const desiredMode = input.desiredMode === "amount" ? "amount" : "pct";
  const fee = finiteOrNull(input.herracFee);
  const feeOk = fee != null && fee >= 0 ? round2(fee) : null;
  const deposit = finiteOrNull(input.deposit);
  const depositOk = deposit != null && deposit >= 0 ? round2(deposit) : null;
  const start = finiteOrNull(input.startPrice);
  const startOk = start != null && start >= 0 ? round2(start) : null;

  const sellEnabled = input.sellEnabled !== false;
  const sellParsed = parseUser(
    input.sellPct == null || input.sellPct === ""
      ? sellEnabled
        ? DEFAULT_SELL_PCT
        : 0
      : input.sellPct
  );
  const sellPctOk =
    sellParsed.state === "ok" && sellParsed.value <= 100 ? sellParsed.value : null;
  const sellTouched = Boolean(input.sellTouched);
  const sellOrigin =
    !sellEnabled || sellTouched ? ORIGIN.USER : ORIGIN.ASSUMPTION;

  const marketBlocked = [];
  if (marketStatus === "unavailable") {
    marketBlocked.push("market_unavailable");
  } else if (!usable) {
    marketBlocked.push(marketStatus === "low" ? "market_low" : "market_unconfirmed");
  } else if (anchor.amount == null || anchor.amount <= 0) {
    marketBlocked.push("sale_anchor_missing");
  }

  const userSaleParsed = parseUser(input.userSale);
  const userSale =
    userSaleParsed.state === "ok" && userSaleParsed.value > 0 ? userSaleParsed.value : null;

  const saleBasis = input.saleBasis === "user" ? "user" : "market";
  const userMeta = {
    key: "user",
    amount: userSale,
    labelRu: "Предполагаемая цена продажи, указанная вами",
    labelAz: "Sizin yazdığınız gözlənilən satış qiyməti",
    labelEn: "Expected sale price you entered",
  };

  let saleSource = null;
  let sale = null;
  let saleMeta = anchor;
  if (saleBasis === "user") {
    if (userSale != null) {
      saleSource = "user";
      sale = userSale;
      saleMeta = userMeta;
    }
  } else if (marketBlocked.length === 0) {
    saleSource = "market";
    sale = round2(anchor.amount);
  } else if (userSale != null) {
    saleSource = "user";
    sale = userSale;
    saleMeta = userMeta;
  }

  const costBlocked = [];
  if (repairParsed.state === "empty") costBlocked.push("repair_unknown");
  if (repairParsed.state === "invalid") costBlocked.push("repair_invalid");
  if (otherParsed.state === "empty") costBlocked.push("other_unknown");
  if (otherParsed.state === "invalid") costBlocked.push("other_invalid");
  if (sellEnabled && sellParsed.state !== "ok") costBlocked.push("sell_invalid");
  if (sellEnabled && sellParsed.state === "ok" && sellParsed.value > 100) {
    costBlocked.push("sell_invalid");
  }

  const blocked = [];
  if (sale == null) {
    if (saleBasis !== "user") blocked.push(...marketBlocked);
    if (userSaleParsed.state === "invalid" || (userSaleParsed.state === "ok" && userSale == null)) {
      blocked.push("user_sale_invalid");
    } else if (saleBasis === "user" || marketBlocked.length) {
      blocked.push("user_sale_unknown");
    }
  }
  blocked.push(...costBlocked);

  const priced = sale != null && costBlocked.length === 0;
  const sellAmount =
    sale != null && sellEnabled && sellPctOk != null ? round2(sale * (sellPctOk / 100)) : null;

  const repair = repairParsed.state === "ok" ? repairParsed.value : null;
  const other = otherParsed.state === "ok" ? otherParsed.value : null;

  const fixed = priced
    ? round2(repair + other + (feeOk ?? 0) + (sellAmount ?? 0))
    : null;

  const desiredBlocked = [];
  if (desiredParsed.state === "empty") desiredBlocked.push("desired_unknown");
  if (desiredParsed.state === "invalid") desiredBlocked.push("desired_invalid");
  const desiredReady = desiredBlocked.length === 0;
  let limitReady = priced && desiredReady;

  let maxBid = null;
  let targetProfit = null;
  if (limitReady) {
    if (desiredMode === "amount") {
      targetProfit = desiredParsed.value;
      maxBid = round2(sale - fixed - targetProfit);
    } else {
      const roi = desiredParsed.value / 100;
      maxBid = round2(sale / (1 + roi) - fixed);
      targetProfit = round2(sale - (maxBid + fixed));
    }
    if (!(maxBid > 0)) {
      maxBid = null;
      targetProfit = null;
      limitReady = false;
      desiredBlocked.push("goal_unreachable");
    }
  }

  const saleOrigin =
    saleSource === "user" ? ORIGIN.USER : saleSource === "market" ? ORIGIN.MARKET : ORIGIN.UNKNOWN;

  function collectedOrigins(includeDesired) {
    const origins = [saleOrigin, ORIGIN.USER];
    if (feeOk != null) origins.push(ORIGIN.HERRAC);
    if (sellEnabled) origins.push(sellOrigin);
    if (includeDesired) origins.push(ORIGIN.USER);
    return [...new Set(origins)];
  }

  const bidParsed = parseUser(input.bid);
  const bid = bidParsed.state === "ok" ? bidParsed.value : null;
  const atBid = priced ? resultAt(bid, sale, fixed, limitReady ? maxBid : null) : null;

  const ladder = priced
    ? ladderBids(startOk, limitReady ? maxBid : null).map((point) => {
        const row = resultAt(point.amount, sale, fixed, limitReady ? maxBid : null);
        const bidOrigin =
          point.role === "start"
            ? ORIGIN.HERRAC
            : point.role === "limit"
              ? null
              : null;
        return {
          role: point.role,
          bid: line(
            "ladderBid",
            point.amount,
            bidOrigin || (point.role === "start" ? ORIGIN.HERRAC : null),
            point.role === "start"
              ? "Старт Hərrac"
              : point.role === "limit"
                ? "Ваш лимит"
                : "Ставка для сравнения",
            point.role === "start" ? "Hərrac startı" : "Müqayisə stavkası",
            point.role === "start"
              ? {}
              : { derived: true, origin: null, origins: collectedOrigins(true) }
          ),
          profit: row?.profit ?? null,
          roiPct: row?.roiPct ?? null,
          capital: row?.capital ?? null,
          status: row?.status ?? null,
          statusText: row?.statusText ?? null,
        };
      })
    : [];

  const sentence = limitSentence(maxBid);

  const marketLines = [
    line(
      "marketLow",
      low,
      low == null ? ORIGIN.UNKNOWN : ORIGIN.MARKET,
      "Нижняя граница рынка",
      "Bazarın aşağı həddi"
    ),
    line(
      "marketMedian",
      median,
      median == null ? ORIGIN.UNKNOWN : ORIGIN.MARKET,
      "Медиана рынка",
      "Bazar medianı"
    ),
    line(
      "marketHigh",
      high,
      high == null ? ORIGIN.UNKNOWN : ORIGIN.MARKET,
      "Верхняя граница рынка",
      "Bazarın yuxarı həddi"
    ),
  ];

  const saleLine = line(
    "saleAnchor",
    sale,
    sale == null ? ORIGIN.UNKNOWN : saleOrigin,
    saleMeta.labelRu,
    saleMeta.labelAz,
    { scenario: saleMeta.key, labelEn: saleMeta.labelEn }
  );

  const costLines = [
    line(
      "repair",
      repair,
      repair == null ? ORIGIN.UNKNOWN : ORIGIN.USER,
      "Ремонт",
      "Təmir",
      { included: repair != null && priced }
    ),
    line(
      "other",
      other,
      other == null ? ORIGIN.UNKNOWN : ORIGIN.USER,
      "Прочие расходы",
      "Digər xərclər",
      { included: other != null && priced }
    ),
    line(
      "herracFee",
      feeOk,
      feeOk == null ? ORIGIN.UNKNOWN : ORIGIN.HERRAC,
      feeOk == null
        ? "Сбор Hərrac в карточке не указан и в расчёт не входит"
        : "Сбор Hərrac",
      feeOk == null
        ? "Hərrac haqqı kartda yoxdur və hesaba daxil deyil"
        : "Hərrac haqqı",
      {
        included: feeOk != null && priced,
        labelEn:
          feeOk == null
            ? "The Hərrac fee is not in the card and is left out of the calculation"
            : "Hərrac fee",
      }
    ),
    line(
      "sellCost",
      sellEnabled ? sellAmount : 0,
      sellEnabled ? sellOrigin : ORIGIN.USER,
      sellEnabled
        ? `Расходы на продажу, ${sellPctOk ?? "—"}% от ${saleSource === "user" ? "вашей цены" : "ориентира"}`
        : "Расходы на продажу отключены вами",
      sellEnabled
        ? `Satış xərci, ${saleSource === "user" ? "sizin qiymətin" : "orientirin"} ${sellPctOk ?? "—"}%-i`
        : "Satış xərci sizin tərəfinizdən söndürülüb",
      {
        included: Boolean(priced && sellEnabled && sellAmount != null),
        pct: sellEnabled ? sellPctOk : 0,
        enabled: sellEnabled,
        labelEn: sellEnabled
          ? `Resale cost, ${sellPctOk ?? "—"}% of ${saleSource === "user" ? "your price" : "the reference"}`
          : "You turned resale cost off",
      }
    ),
    line(
      "deposit",
      depositOk,
      depositOk == null ? ORIGIN.UNKNOWN : ORIGIN.HERRAC,
      depositOk == null
        ? "Задаток в карточке не указан и в расчёт не входит"
        : "Задаток Hərrac. В прибыль не входит: это не расход сверх ставки.",
      depositOk == null
        ? "Beh kartda yoxdur və hesaba daxil deyil"
        : "Hərrac behi. Qazanca daxil deyil.",
      {
        included: false,
        labelEn:
          depositOk == null
            ? "The deposit is not in the card and is left out of the calculation"
            : "Hərrac deposit. It is not part of profit: it is not a cost on top of the bid.",
      }
    ),
  ];

  const profitOrigins = collectedOrigins(false);
  const limitOrigins = collectedOrigins(true);

  const derived = [
    derivedLine(
      "maxBid",
      maxBid,
      limitOrigins,
      "Максимальная ставка",
      "Maksimum stavka"
    ),
    derivedLine(
      "targetProfit",
      targetProfit,
      limitOrigins,
      desiredMode === "pct"
        ? "Прибыль на максимальной ставке при выбранном ROI"
        : "Выбранная прибыль",
      "Seçilmiş qazanc"
    ),
    derivedLine(
      "profit",
      atBid?.profit ?? null,
      profitOrigins,
      "Потенциальная прибыль при текущей ставке",
      "Cari stavkada potensial qazanc"
    ),
    derivedLine(
      "roi",
      atBid?.roiPct ?? null,
      profitOrigins,
      "ROI при текущей ставке",
      "Cari stavkada ROI",
      { unit: "PCT" }
    ),
    derivedLine(
      "capital",
      atBid?.capital ?? null,
      profitOrigins,
      "Капитал при текущей ставке: ставка + ремонт + прочие + сбор + продажа",
      "Cari kapital"
    ),
  ];

  const knownPieces = [];
  if (repair != null) knownPieces.push(repair);
  if (other != null) knownPieces.push(other);
  if (feeOk != null) knownPieces.push(feeOk);
  if (sellEnabled && sellAmount != null) knownPieces.push(sellAmount);
  if (!sellEnabled && priced) knownPieces.push(0);
  const knownCosts = knownPieces.length
    ? round2(knownPieces.reduce((sum, amount) => sum + amount, 0))
    : null;

  return {
    currency: "AZN",
    priced,
    limitReady,
    saleBasis,
    saleSource,
    purchase: bid,
    knownCosts,
    blockedBecause: blocked,
    blockedText: blocked.map((id) => ({ id, ...BLOCK_TEXT[id] })),
    desiredBlockedBecause: priced ? desiredBlocked : [],
    desiredBlockedText: priced
      ? desiredBlocked.map((id) => ({ id, ...BLOCK_TEXT[id] }))
      : [],
    marketStatus,
    usableForValuation: usable,
    saleScenario: saleMeta.key,
    saleAnchor: saleLine,
    market: {
      low: marketLines[0],
      median: marketLines[1],
      high: marketLines[2],
    },
    costs: {
      repair: costLines[0],
      other: costLines[1],
      herracFee: costLines[2],
      sellCost: costLines[3],
      deposit: costLines[4],
    },
    desired: {
      mode: desiredMode,
      pct: desiredMode === "pct" && desiredReady ? desiredParsed.value : null,
      amount: desiredMode === "amount" && desiredReady ? desiredParsed.value : null,
      origin: desiredReady ? ORIGIN.USER : ORIGIN.UNKNOWN,
    },
    fixedCosts: fixed,
    maxBid: derived[0],
    targetProfit: derived[1],
    atBid,
    ladder: ladder.map((row) => ({
      role: row.role,
      bid: row.bid.amount,
      bidOrigin: row.role === "start" ? ORIGIN.HERRAC : null,
      bidDerived: row.role !== "start",
      bidOrigins: row.role === "start" ? [ORIGIN.HERRAC] : limitOrigins,
      profit: row.profit,
      roiPct: row.roiPct,
      capital: row.capital,
      status: row.status,
      statusText: row.statusText,
    })),
    limitSentenceRu: sentence.ru,
    limitSentenceAz: sentence.az,
    limitSentenceEn: sentence.en,
    statusRule: {
      above: "ставка > максимальной ставки",
      borderline: "ставка не выше лимита, но запас меньше 3% лимита",
      good: "ставка ниже лимита больше чем на 3%",
      band: BORDERLINE_BAND,
    },
    formulaRu:
      desiredMode === "pct"
        ? "Максимальная ставка = Ориентир / (1 + желаемый ROI) − ремонт − прочие − сбор Hərrac − расходы на продажу"
        : "Максимальная ставка = Ориентир − ремонт − прочие − сбор Hərrac − расходы на продажу − желаемая прибыль",
    formulaAz:
      desiredMode === "pct"
        ? "Maksimum stavka = Orientir / (1 + ROI) − təmir − digər − Hərrac haqqı − satış xərci"
        : "Maksimum stavka = Orientir − təmir − digər − Hərrac haqqı − satış xərci − istənilən qazanc",
    formulaEn:
      desiredMode === "pct"
        ? "Maximum bid = Reference / (1 + desired ROI) − repair − other − Hərrac fee − resale cost"
        : "Maximum bid = Reference − repair − other − Hərrac fee − resale cost − desired profit",
    profitFormulaRu:
      "Потенциальная прибыль = Ориентир − ставка − ремонт − прочие − сбор Hərrac − расходы на продажу",
    roiFormulaRu:
      "ROI = потенциальная прибыль / (ставка + ремонт + прочие + сбор Hərrac + расходы на продажу)",
    lines: [...marketLines, saleLine, ...costLines, ...derived],
  };
}

export function marketInputFromComps(comps) {
  const stats = comps?.stats || null;
  return {
    marketStatus: comps?.marketStatus || "insufficient",
    usableForValuation: Boolean(stats?.usableForValuation),
    marketLow: stats?.p25 ?? null,
    marketMedian: stats?.medianPrice ?? null,
    marketHigh: stats?.p75 ?? null,
    source: comps?.source || null,
    fetchedAt: comps?.fetchedAt || stats?.fetchedAt || null,
  };
}
