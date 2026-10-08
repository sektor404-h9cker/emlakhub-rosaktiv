/**
 * Утилиты для карточек лотов (форма одинакова для API и legacy demo)
 */

export function lotTitle(lot, locale) {
  if (!lot) return "";
  if (locale === "az") return lot.titleAz || lot.titleRu || lot.titleEn || lot.id;
  if (locale === "en") return lot.titleEn || lot.titleRu || lot.titleAz || lot.id;
  return lot.titleRu || lot.titleAz || lot.titleEn || lot.id;
}

export function lotType(lot, locale) {
  if (!lot) return "";
  if (locale === "az") return lot.typeAz || lot.market;
  if (locale === "en") return lot.typeEn || lot.typeRu || lot.market;
  return lot.typeRu || lot.market;
}

export function lotAiSummary(lot, locale) {
  if (!lot) return "";
  if (locale === "az") return lot.aiSummaryAz;
  if (locale === "en") return lot.aiSummaryEn || lot.aiSummaryRu;
  return lot.aiSummaryRu;
}

export function lotCity(lot, locale) {
  if (!lot) return "";
  if (locale === "az") return lot.cityAz;
  if (locale === "en") return lot.cityEn || lot.cityRu;
  return lot.cityRu;
}

export function lotDistrict(lot, locale) {
  if (!lot) return "";
  if (locale === "az") return lot.districtAz;
  if (locale === "en") return lot.districtEn || lot.districtRu;
  return lot.districtRu;
}
