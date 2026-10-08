/**
 * Константы публичного API herrac.gov.az
 * Discovery: POST /gw/os/v1/auctions с телом [] (GET этого адреса отвечает 500)
 * Detail:    GET /gw/os/v1/auctions/details/:id  (стабильно)
 */
export const HERRAC_ORIGIN = "https://herrac.gov.az";
export const HERRAC_GW = `${HERRAC_ORIGIN}/gw`;

/** Категории портала (из /gw/os/v1/lots/categories/filters) */
export const HERRAC_CATEGORIES = {
  auto: "15707206488020125", // Avtomobillər
  apartment: "16057480568139276", // Mənzil
  commercial: "16057480568289305", // Qeyri-yaşayış sahəsi
  house: "16057480568289306", // Fərdi yaşayış evi
  other: "16057480568289307", // Digər
};

/** Дефолт: все публичные категории (как в URL со всеми чекбоксами) */
export const DEFAULT_SYNC_CATEGORY_IDS = [
  HERRAC_CATEGORIES.auto,
  HERRAC_CATEGORIES.apartment,
  HERRAC_CATEGORIES.commercial,
  HERRAC_CATEGORIES.house,
  HERRAC_CATEGORIES.other,
];

export const CATEGORY_TO_MARKET = {
  [HERRAC_CATEGORIES.auto]: "auto",
  [HERRAC_CATEGORIES.apartment]: "estate",
  [HERRAC_CATEGORIES.commercial]: "commercial",
  [HERRAC_CATEGORIES.house]: "estate",
  [HERRAC_CATEGORIES.other]: "other",
};

/**
 * Query-параметры списка = фильтры UI на /auctions
 *
 * | UI | API |
 * |---|---|
 * | Категории | categoryIds |
 * | İlkin / Təkrar | isFirstRound=true\|false (omit = оба) |
 * | Gözləmədə… | includeNotStarted |
 * | Məkana görə axtar | locationSearchValue |
 * | Mətnə görə axtar | nameSearchValue |
 * | Başlama qiyməti | priceFrom / priceTo |
 * | Tarix aralığı | from / to |
 * | Şəhər / Əlavə məlumat / qeyd / ünvan | bodyFilters (JSON) |
 * | Sort | sortColumns |
 */
export const HERRAC_SORT = {
  DATE_DESC: "DATE_DESC", // Əvvəlcə yeni
  DATE_ASC: "DATE_ASC", // Əvvəlcə köhnə
  PRICE_ASC: "PRICE_ASC", // Əvvəlcə ucuz
  PRICE_DESC: "PRICE_DESC", // Əvvəlcə bahalı
};

/** Имена динамических фильтров (id — из filters/details по categoryIds) */
export const HERRAC_BODY_FILTER_NAMES = {
  city: "Əmlakın yerləşdiyi şəhər və ya rayon",
  address: "Əmlakın yerləşdiyi ünvan",
  extraInfo: "Əlavə məlumat",
  extraNote: "Əlavə qeyd",
};

/** Вежливый лимитер — не долбить портал */
export const HERRAC_RATE = {
  minDelayMs: 2800,
  jitterMs: 1800,
  maxRetries: 4,
  retryBaseMs: 4000,
  discoveryCooldownHours: 2,
  maxDetailsPerRun: 48,
  maxListPages: 12,
  pageSize: 24,
};

export const HERRAC_UA =
  "EmlakHub/1.0 (+https://emlakhub.net; auction analytics for investors; contact=admin@emlak.az)";
