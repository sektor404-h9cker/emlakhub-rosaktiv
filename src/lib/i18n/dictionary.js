/**
 * ============================================================================
 * СЛОВАРИ ПЛАТФОРМЫ (AZ / RU)
 * ============================================================================
 * Почему два языка сразу в hero:
 * - Digital Emlak Hub = Азербайджан, RosAktiv Hub = русскоязычный рынок.
 * - Переключатель на первом экране снимает когнитивный барьер «это не для меня»
 *   и повышает доверие международной аудитории (B2B-конверсия).
 *
 * Архитектурно словари живут в /lib — их будут переиспользовать
 * и лендинг (маркетинг), и будущий дашборд (продукт).
 * ============================================================================
 */

export const DICTIONARY = {
  az: {
    brandPrimary: "DIGITAL EMLAK",
    brandSecondary: "HUB",
    navTerminal: "Terminal",
    langHint: "Dil",
    eyebrow: "Dövlət əmlakının rəqəmsal idarəetməsi",
    headline: "Gizli marja. Şəffaf qərar.",
    subhead:
      "Dövlət hərraclarında daşınmaz əmlak və avtomobilləri bir ekranda oxuyun: bazar qiyməti, risklər və xalis mənfəət — investisiyadan əvvəl.",
    pillars: [
      { label: "Marja", text: "Unit-iqtisadiyyat bir baxışda" },
      { label: "Şəffaflıq", text: "Due diligence əvvəlcədən" },
      { label: "Analitika", text: "Vision + NLP + bazar" },
    ],
    cta: "Sistemə daxil ol",
    ctaHint: "Bağlı investor terminalı",
    dualBrand:
      "Azərbaycanda — Digital Emlak Hub. Rusiya üçün — RosAktiv Hub.",
    status: "Institusional terminal · Canlı bazar analitikası",
  },
  ru: {
    brandPrimary: "DIGITAL EMLAK",
    brandSecondary: "HUB",
    navTerminal: "Терминал",
    langHint: "Язык",
    eyebrow: "B2B аналитический терминал",
    headline: "Скрытая маржа. Прозрачное решение.",
    subhead:
      "Читайте государственные аукционы недвижимости и авто на одном экране: рыночная цена, риски и чистая прибыль - до входа в сделку.",
    pillars: [
      { label: "Маржа", text: "Юнит-экономика с первого взгляда" },
      { label: "Прозрачность", text: "Due diligence до депозита" },
      { label: "Аналитика", text: "Vision + NLP + рынок" },
    ],
    cta: "Войти в систему",
    ctaHint: "Закрытый терминал инвестора",
    dualBrand:
      "В Азербайджане - Digital Emlak Hub. Для России - RosAktiv Hub.",
    status: "Enterprise terminal · Live market intelligence",
  },
};

/**
 * Безопасно достаём словарь.
 * Fallback на RU — язык «международного инвестора» по умолчанию.
 */
export function getDictionary(locale = "ru") {
  return DICTIONARY[locale] || DICTIONARY.ru;
}
