/**
 * Единые метки происхождения суммы.
 * Других значений в проекте быть не должно: ни "herrac", ни "fact", ни "demo".
 *
 * herrac_fact — цифра из карточки Hərrac
 * market      — цифра Market Engine (Turbo / Bina)
 * assumption  — наше правило, его можно выключить или заменить
 * user        — инвестор ввёл сам, включая явный 0
 * unknown     — данных нет; в формулу не подставляем ноль
 */

export const ORIGIN = {
  HERRAC: "herrac_fact",
  MARKET: "market",
  ASSUMPTION: "assumption",
  USER: "user",
  UNKNOWN: "unknown",
};

export const ORIGIN_VALUES = Object.values(ORIGIN);

const LABEL = {
  [ORIGIN.HERRAC]: { ru: "Факт Hərrac", az: "Hərrac faktı", en: "Hərrac fact" },
  [ORIGIN.MARKET]: { ru: "Рыночные данные", az: "Bazar məlumatı", en: "Market data" },
  [ORIGIN.ASSUMPTION]: { ru: "Допущение Emlak Hub", az: "Emlak Hub fərziyyəsi", en: "Emlak Hub assumption" },
  [ORIGIN.USER]: { ru: "Введено вами", az: "Siz daxil etdiniz", en: "Entered by you" },
  [ORIGIN.UNKNOWN]: { ru: "Неизвестно", az: "Məlum deyil", en: "Unknown" },
};

export function originLabel(origin, locale = "ru") {
  const row = LABEL[origin] || LABEL[ORIGIN.UNKNOWN];
  if (locale === "az") return row.az;
  if (locale === "en") return row.en;
  return row.ru;
}

export function isOrigin(value) {
  return ORIGIN_VALUES.includes(value);
}
