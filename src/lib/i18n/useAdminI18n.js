"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getAdminDict } from "@/lib/i18n/adminDict";

export function useAdminI18n() {
  const { locale, setLocale } = useLocale();
  const t = getAdminDict(locale);
  return { locale, setLocale, t };
}
