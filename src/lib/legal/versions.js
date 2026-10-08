/** Bump these when the public text changes enough to ask for consent again. */
export const TERMS_VERSION = "2026-10-07";
export const PRIVACY_VERSION = "2026-10-07";
export const DISCLAIMER_VERSION = "2026-10-07";

export const LEGAL_LOCALES = ["az", "ru", "en"];

export function legalLocale(value) {
  const code = String(value || "").toLowerCase();
  return LEGAL_LOCALES.includes(code) ? code : "az";
}
