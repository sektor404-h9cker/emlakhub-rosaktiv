/**
 * =============================================================================
 * Типы лотов Hərrac / госаукционы Азербайджана
 * =============================================================================
 * Не только авто и квартиры: земли, коммерция, спецтехника, прочее имущество.
 * Источник правды market в БД: lots.market
 * =============================================================================
 */

export const LOT_MARKETS = {
  auto: {
    id: "auto",
    labelAz: "Avtomobil",
    labelRu: "Автомобиль",
    labelEn: "Vehicle",
    mapColor: "#38bdf8",
  },
  estate: {
    id: "estate",
    labelAz: "Mənzil / bina",
    labelRu: "Квартира / здание",
    labelEn: "Apartment / building",
    mapColor: "#34d399",
  },
  land: {
    id: "land",
    labelAz: "Torpaq",
    labelRu: "Земля",
    labelEn: "Land",
    mapColor: "#a3e635",
  },
  commercial: {
    id: "commercial",
    labelAz: "Kommersiya",
    labelRu: "Коммерция",
    labelEn: "Commercial",
    mapColor: "#fbbf24",
  },
  equipment: {
    id: "equipment",
    labelAz: "Texnika / avadanlıq",
    labelRu: "Техника / оборудование",
    labelEn: "Equipment",
    mapColor: "#c084fc",
  },
  other: {
    id: "other",
    labelAz: "Digər",
    labelRu: "Прочее",
    labelEn: "Other",
    mapColor: "#94a3b8",
  },
};

export const LOT_MARKET_IDS = Object.keys(LOT_MARKETS);

export function marketMeta(marketId) {
  return LOT_MARKETS[marketId] || LOT_MARKETS.other;
}

export function marketLabel(marketId, locale = "ru") {
  const m = marketMeta(marketId);
  if (locale === "az") return m.labelAz;
  if (locale === "en") return m.labelEn;
  return m.labelRu;
}

export function marketMapColor(marketId) {
  return marketMeta(marketId).mapColor;
}
