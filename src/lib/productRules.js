/**
 * Правила продукта. Секреты и адреса сервисов живут в .env, не здесь.
 *
 * Меняйте пороги только в этом файле. Market Engine и Investment Engine
 * читают их отсюда, чтобы ±4 года и 3% не разъехались по разным модулям.
 */

export const MARKET_RULES = {
  /** Год объявления принимаем, если он в этом окне от года лота. */
  yearAccept: 4,
  /** Окно запроса к Turbo шире окна приёмки, чтобы отказ по году был виден. */
  yearFetchPad: 8,
  /** Пробег близок по отношению… */
  mileageRatioMin: 0.55,
  mileageRatioMax: 1.8,
  /** …или по абсолютной разнице, км. */
  mileageAbsKm: 40000,
  /** Двигатель сравниваем, только если известен у обоих. Допуск, литры. */
  engineLitersTolerance: 0.45,
  /** Площадь квартиры и дома относительно лота. */
  areaLo: 0.8,
  areaHi: 1.25,
  /** Земля относительно площади лота. Строже, чем квартира. */
  landAreaLo: 0.7,
  landAreaHi: 1.4,
  /** Выброс цены: забор Тьюки. Меньше minPricesForOutlier цен не режем. */
  tukeyK: 1.5,
  minPricesForOutlier: 4,
  /** Если IQR = 0, границы = медиана ± эта доля. */
  zeroIqrBand: 0.35,
  /**
   * Минимум прошедших объявлений и пороги достоверности.
   * high и medium можно передавать в калькулятор. low и insufficient — нельзя.
   */
  confidence: {
    auto: { min: 3, medium: 5, high: 8 },
    apartment: { min: 3, medium: 5, high: 8 },
    house: { min: 3, medium: 5, high: 8 },
    land: { min: 4, medium: 6, high: 8 },
    commercial: { min: 4, medium: 6, high: 8 },
  },
};

export const INVEST_RULES = {
  /**
   * Допущение расходов на последующую продажу, % от ориентира.
   * Включено по умолчанию, подписано как assumption, инвестор может сменить или выключить.
   */
  defaultSellPct: 3,
  /**
   * Статус «погранично»: ставка не выше лимита, но запас меньше этой доли лимита.
   * Это не расход и не рыночная цена.
   */
  borderlineBand: 0.03,
  /** На сколько выше лимита показать учебную ставку в лестнице сценариев. */
  ladderAbovePct: 0.1,
};

export const MARKET_STATUS = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INSUFFICIENT: "insufficient",
  UNAVAILABLE: "unavailable",
};

export const UNAVAILABLE_TEXT = {
  ru: "Рыночные данные временно недоступны. Попробуйте позже.",
  az: "Bazar məlumatı müvəqqəti əlçatan deyil. Bir az sonra yenidən cəhd edin.",
  en: "Market data is temporarily unavailable. Try again later.",
};

/**
 * Emlak Intelligence. Веса полноты живут только здесь.
 * Сумма весов каждого профиля — 100.
 * Emlak Score считается только если полнота не ниже порога,
 * рынок пригоден для оценки и лимит инвестора уже посчитан.
 */
export const INTELLIGENCE_RULES = {
  scoreMinCompleteness: 55,
  scoreWeights: {
    completeness: 0.4,
    market: 0.35,
    economics: 0.25,
  },
  marketPoints: {
    high: 100,
    medium: 70,
  },
  economicsPoints: {
    good: 100,
    borderline: 55,
    above: 25,
  },
  profiles: {
    auto: [
      { id: "model", weight: 12 },
      { id: "year", weight: 16 },
      { id: "mileage", weight: 10 },
      { id: "engine", weight: 8 },
      { id: "description", weight: 8 },
      { id: "photos", weight: 6 },
      { id: "identifier", weight: 10 },
      { id: "dates", weight: 8 },
      { id: "deposit", weight: 5 },
      { id: "fee", weight: 5 },
      { id: "place", weight: 8 },
      { id: "documents", weight: 4 },
    ],
    apartment: [
      { id: "area", weight: 14 },
      { id: "rooms", weight: 10 },
      { id: "floor", weight: 6 },
      { id: "address", weight: 12 },
      { id: "district", weight: 8 },
      { id: "cadastral", weight: 8 },
      { id: "purpose", weight: 6 },
      { id: "encumbrance", weight: 6 },
      { id: "dates", weight: 6 },
      { id: "deposit", weight: 5 },
      { id: "fee", weight: 5 },
      { id: "inspection", weight: 6 },
      { id: "photos", weight: 4 },
      { id: "documents", weight: 4 },
    ],
    house: [
      { id: "area", weight: 16 },
      { id: "address", weight: 14 },
      { id: "district", weight: 10 },
      { id: "cadastral", weight: 8 },
      { id: "purpose", weight: 8 },
      { id: "encumbrance", weight: 6 },
      { id: "dates", weight: 8 },
      { id: "deposit", weight: 6 },
      { id: "fee", weight: 6 },
      { id: "inspection", weight: 6 },
      { id: "photos", weight: 6 },
      { id: "documents", weight: 6 },
    ],
    land: [
      { id: "area", weight: 16 },
      { id: "address", weight: 14 },
      { id: "district", weight: 10 },
      { id: "purpose", weight: 10 },
      { id: "cadastral", weight: 8 },
      { id: "encumbrance", weight: 8 },
      { id: "dates", weight: 8 },
      { id: "deposit", weight: 6 },
      { id: "fee", weight: 6 },
      { id: "photos", weight: 6 },
      { id: "documents", weight: 8 },
    ],
    commercial: [
      { id: "area", weight: 16 },
      { id: "address", weight: 14 },
      { id: "district", weight: 10 },
      { id: "purpose", weight: 8 },
      { id: "cadastral", weight: 8 },
      { id: "encumbrance", weight: 6 },
      { id: "dates", weight: 8 },
      { id: "deposit", weight: 6 },
      { id: "fee", weight: 6 },
      { id: "inspection", weight: 4 },
      { id: "photos", weight: 6 },
      { id: "documents", weight: 8 },
    ],
    other: [
      { id: "description", weight: 20 },
      { id: "photos", weight: 15 },
      { id: "dates", weight: 20 },
      { id: "place", weight: 15 },
      { id: "deposit", weight: 15 },
      { id: "fee", weight: 15 },
    ],
  },
};
