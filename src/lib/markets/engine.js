/**
 * Market Engine — отбор аналогов Turbo.az и Bina.az.
 *
 * Рыночная цена — это медиана прошедших проверку объявлений, не гарантия продажи.
 * Пороги (год, пробег, число аналогов, Тьюки) лежат в src/lib/productRules.js.
 * Слабый рынок (low / insufficient) и недоступный источник (unavailable)
 * не передаются в Investment Engine.
 */
import { median, percentile } from "./http";
import { MARKET_RULES, MARKET_STATUS, UNAVAILABLE_TEXT } from "../productRules";

export { MARKET_STATUS, UNAVAILABLE_TEXT };

const STATUS_LABEL = {
  high: { ru: "Высокая", az: "Yüksək" },
  medium: { ru: "Средняя", az: "Orta" },
  low: { ru: "Низкая", az: "Aşağı" },
  insufficient: { ru: "Недостаточно данных", az: "Kifayət qədər məlumat yoxdur" },
  unavailable: { ru: "Источник недоступен", az: "Mənbə əlçatan deyil" },
};

const REASON = {
  other_model: { ru: "другая модель", az: "başqa model" },
  other_make: { ru: "другая марка", az: "başqa marka" },
  year_far: { ru: "слишком другой год", az: "il çox fərqlidir" },
  year_missing: { ru: "год в объявлении не указан", az: "elanda il yoxdur" },
  mileage_far: { ru: "слишком другой пробег", az: "yürüş çox fərqlidir" },
  mileage_missing: {
    ru: "пробег в объявлении не указан",
    az: "elanda yürüş yoxdur",
  },
  engine_mismatch: { ru: "другой двигатель", az: "başqa mühərrik" },
  price_outlier_high: {
    ru: "аномальная цена (выше правила Тьюки)",
    az: "anomaliya qiymət (Tukey həddindən yuxarı)",
  },
  price_outlier_low: {
    ru: "аномальная цена (ниже правила Тьюки)",
    az: "anomaliya qiymət (Tukey həddindən aşağı)",
  },
  other_district: {
    ru: "не соответствует району",
    az: "rayon uyğun gəlmir",
  },
  other_type: {
    ru: "не соответствует типу объекта",
    az: "obyekt tipi uyğun gəlmir",
  },
  area_far: { ru: "слишком другая площадь", az: "sahə çox fərqlidir" },
  area_missing: {
    ru: "площадь в объявлении не указана",
    az: "elanda sahə yoxdur",
  },
  rooms_far: { ru: "другое число комнат", az: "otaq sayı başqadır" },
  rooms_missing: {
    ru: "число комнат в объявлении не указано",
    az: "elanda otaq sayı yoxdur",
  },
  floor_far: { ru: "этаж слишком отличается", az: "mərtəbə çox fərqlidir" },
  repair_mismatch: { ru: "другое состояние ремонта", az: "təmir vəziyyəti başqadır" },
  stale: { ru: "объявление старше девяти месяцев", az: "elan doqquz aydan köhnədir" },
  no_price: { ru: "нет цены", az: "qiymət yoxdur" },
};

export function reasonText(code, locale = "ru") {
  const row = REASON[code] || {
    ru: "не прошло проверку",
    az: "yoxlamadan keçmədi",
  };
  return locale === "az" ? row.az : row.ru;
}

export function statusText(status, locale = "ru") {
  const row = STATUS_LABEL[status] || STATUS_LABEL.insufficient;
  return locale === "az" ? row.az : row.ru;
}

/**
 * Пробег близок, если отношение 0.55–1.8 или абсолютная разница ≤ 40 000 км.
 * @returns {boolean|null} null — сравнить нельзя
 */
export function mileageIsClose(lotKm, cardKm) {
  if (!Number.isFinite(lotKm) || lotKm <= 0) return null;
  if (!Number.isFinite(cardKm) || cardKm <= 0) return null;
  const ratio = cardKm / lotKm;
  const abs = Math.abs(cardKm - lotKm);
  return (
    (ratio >= MARKET_RULES.mileageRatioMin && ratio <= MARKET_RULES.mileageRatioMax) ||
    abs <= MARKET_RULES.mileageAbsKm
  );
}

/** Год близок: окно из productRules.yearAccept. */
export const YEAR_ACCEPT = MARKET_RULES.yearAccept;

/**
 * Tukey 1.5·IQR. При IQR = 0 — медиана ±35%.
 * Меньше 4 цен: выбросы не режем, выборка слишком мала для интервала.
 */
export function applyPriceOutliers(items) {
  const rejected = [];
  const priced = [];
  for (const item of items) {
    if (!Number.isFinite(item.price) || item.price <= 0) {
      rejected.push(markRejected(item, "no_price"));
    } else {
      priced.push(item);
    }
  }

  if (priced.length < MARKET_RULES.minPricesForOutlier) {
    return {
      kept: priced,
      rejected,
      fence: null,
    };
  }

  const prices = priced.map((i) => i.price).sort((a, b) => a - b);
  const q1 = percentile(prices, 25);
  const q3 = percentile(prices, 75);
  const iqr = q3 - q1;
  const med = median(prices);
  let lo;
  let hi;
  let rule;
  if (iqr > 0) {
    lo = q1 - MARKET_RULES.tukeyK * iqr;
    hi = q3 + MARKET_RULES.tukeyK * iqr;
    rule = "tukey_1_5_iqr";
  } else {
    lo = med * (1 - MARKET_RULES.zeroIqrBand);
    hi = med * (1 + MARKET_RULES.zeroIqrBand);
    rule = "median_pm_35_when_iqr_0";
  }

  const kept = [];
  for (const item of priced) {
    if (item.price < lo) {
      rejected.push(
        markRejected(item, "price_outlier_low", { rule, lo, hi })
      );
    } else if (item.price > hi) {
      rejected.push(
        markRejected(item, "price_outlier_high", { rule, lo, hi })
      );
    } else {
      kept.push(item);
    }
  }

  return { kept, rejected, fence: { lo, hi, q1, q3, iqr, median: med, rule } };
}

function markRejected(item, code, extra) {
  return {
    ...item,
    rejectReason: code,
    rejectReasonRu: reasonText(code, "ru"),
    rejectReasonAz: reasonText(code, "az"),
    rejectDetail: extra || null,
  };
}

export function tagReject(item, code, extra) {
  return markRejected(item, code, extra);
}

/**
 * @param {{
 *   used: number,
 *   kind: string,
 *   modelResolved?: boolean,
 *   yearKnown?: boolean,
 *   mileageKnown?: boolean,
 *   districtKnown?: boolean,
 *   areaKnown?: boolean,
 *   roomsKnown?: boolean,
 * }} input
 */
export function rateSample(input) {
  const kind = input.kind || "other";
  const used = input.used || 0;
  const band =
    MARKET_RULES.confidence[kind] || MARKET_RULES.confidence.apartment;
  const strict = kind === "land" || kind === "commercial";
  const min = band.min;

  if (kind === "auto" && !input.modelResolved) {
    return finish(
      "insufficient",
      "Точная модель не определена. Поиск по одной марке не делаем.",
      "The exact model is not identified. A search across the whole make is not used."
    );
  }
  if (kind === "auto" && !input.yearKnown) {
    return finish(
      "insufficient",
      "Год автомобиля не указан. Без него близкий год не отобрать, рыночную цену не даём.",
      "The vehicle year is not stated. Without it a close year cannot be selected, so there is no market price."
    );
  }
  if (kind !== "auto" && !input.districtKnown) {
    return finish(
      "insufficient",
      "Район не определён. Весь город в оценку не подмешиваем.",
      "The district is not identified. The whole city is not mixed into the estimate."
    );
  }
  if (kind === "apartment" && (!input.areaKnown || !input.roomsKnown)) {
    return finish(
      "insufficient",
      "У квартиры нет площади или числа комнат — сравнивать не с чем.",
      "The apartment has no area or room count, so there is nothing to compare."
    );
  }
  if ((kind === "house" || strict) && !input.areaKnown) {
    return finish(
      "insufficient",
      "Нет площади объекта — для этого типа оценка без неё не строится.",
      "The property has no area. This type is not valued without it."
    );
  }
  if (used < min) {
    return finish(
      "insufficient",
      `После проверки подошло ${used}. Для оценки нужно минимум ${min} сопоставимых объявления.`,
      `After checks, ${used} matched. A valuation needs at least ${min} comparable listings.`
    );
  }

  let level = MARKET_STATUS.LOW;
  if (kind === "auto") {
    if (used >= band.high && input.yearKnown && input.mileageKnown) level = MARKET_STATUS.HIGH;
    else if (used >= band.medium && input.yearKnown) level = MARKET_STATUS.MEDIUM;
    else level = MARKET_STATUS.LOW;
    if (!input.yearKnown && level === MARKET_STATUS.HIGH) level = MARKET_STATUS.MEDIUM;
    if (!input.mileageKnown && level === MARKET_STATUS.HIGH) level = MARKET_STATUS.MEDIUM;
  } else if (strict) {
    if (used >= band.high && input.areaKnown && input.districtKnown) level = MARKET_STATUS.HIGH;
    else if (used >= band.medium) level = MARKET_STATUS.MEDIUM;
    else level = MARKET_STATUS.LOW;
  } else if (used >= band.high && input.areaKnown && (kind !== "apartment" || input.roomsKnown)) {
    level = MARKET_STATUS.HIGH;
  } else if (used >= band.medium) {
    level = MARKET_STATUS.MEDIUM;
  }

  const why =
    level === MARKET_STATUS.HIGH
      ? `Использовано ${used} объявлений той же модели/района, год и размер достаточно близки.`
      : level === MARKET_STATUS.MEDIUM
        ? `Использовано ${used} объявлений. Выборки хватает для ориентира, но не для высокой достоверности.`
        : `Использовано ${used}. Оценка показана, но в расчёт прибыли не берётся: аналогов мало.`;
  const whyEn =
    level === MARKET_STATUS.HIGH
      ? `Used ${used} listings of the same model or district, with a close year and size.`
      : level === MARKET_STATUS.MEDIUM
        ? `Used ${used} listings. The sample is enough for a reference, not for high confidence.`
        : `Used ${used}. A figure is shown, but it is not used for profit: there are too few comparables.`;

  return finish(level, why, whyEn);
}

function finish(level, reasonRu, reasonEn) {
  return {
    marketStatus: level,
    marketStatusReasonRu: reasonRu,
    marketStatusReasonAz:
      level === "insufficient"
        ? "Kifayət qədər müqayisəli elan yoxdur."
        : level === "high"
          ? "Çoxlu yaxın elan var."
          : level === "medium"
            ? "Orta həcmli yaxın seçim."
            : "Az elan. Qiymət göstərilir, qazanc hesabına girmir.",
    marketStatusReasonEn: reasonEn || reasonRu,
    usableForValuation: level === "high" || level === "medium",
  };
}

export function summarizePrices(items) {
  const prices = items.map((i) => i.price).filter((n) => Number.isFinite(n) && n > 0);
  if (!prices.length) {
    return {
      medianPrice: null,
      p25: null,
      p75: null,
      min: null,
      max: null,
      sampleSize: 0,
    };
  }
  const sorted = [...prices].sort((a, b) => a - b);
  return {
    medianPrice: median(sorted),
    p25: percentile(sorted, 25),
    p75: percentile(sorted, 75),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    sampleSize: sorted.length,
  };
}

export function buildEvidence({
  source,
  objectText,
  identityText,
  found,
  rejected,
  used,
  usedItems,
  priceStats,
  marketStatus,
}) {
  return [
    {
      id: "object",
      titleRu: "Объект Hərrac",
      titleAz: "Hərrac obyekti",
      textRu: objectText || "—",
      textAz: objectText || "—",
    },
    {
      id: "identity",
      titleRu: "Что определили",
      titleAz: "Nə müəyyən etdik",
      textRu: identityText || "—",
      textAz: identityText || "—",
    },
    {
      id: "found",
      titleRu: `${source} найдено`,
      titleAz: `${source} tapıldı`,
      count: found,
    },
    {
      id: "rejected",
      titleRu: "Отброшено",
      titleAz: "Atıldı",
      count: rejected,
    },
    {
      id: "used",
      titleRu: "Использовано",
      titleAz: "İstifadə olundu",
      count: used,
    },
    {
      id: "prices",
      titleRu: "Цены использованных объявлений",
      titleAz: "İstifadə olunan elanların qiymətləri",
      prices: (usedItems || []).map((i) => i.price),
    },
    {
      id: "median",
      titleRu: "Медиана",
      titleAz: "Median",
      amount: marketStatus === "insufficient" ? null : priceStats?.medianPrice ?? null,
    },
    {
      id: "range",
      titleRu: "Рыночный диапазон",
      titleAz: "Bazar aralığı",
      low: marketStatus === "insufficient" ? null : priceStats?.p25 ?? null,
      high: marketStatus === "insufficient" ? null : priceStats?.p75 ?? null,
    },
  ];
}
