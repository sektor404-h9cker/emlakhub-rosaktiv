"use client";

/**
 * ============================================================================
 * LocaleProvider — живой переключатель языка для всего marketing-слоя
 * ============================================================================
 * Почему client-компонент:
 * - Язык меняется мгновенно без перезагрузки → ощущение «терминала»,
 *   а не статичной брошюры. Это удерживает внимание и повышает CTR CTA.
 *
 * Почему храним в localStorage:
 * - Возврат инвестора с тем же языком = меньше трения на пути к логину.
 * ============================================================================
 */

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getDictionary } from "./dictionary";

const LocaleContext = createContext({
  locale: "ru",
  setLocale: () => {},
  t: getDictionary("ru"),
});

export function LocaleProvider({ children, defaultLocale = "ru" }) {
  const [locale, setLocale] = useState(defaultLocale);

  // Восстанавливаем язык после гидрации — без «мигания» SSR/CSR
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("eh_locale");
      if (saved === "az" || saved === "ru") setLocale(saved);
    } catch {
      /* private mode / SSR — игнорируем */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("eh_locale", locale);
      document.documentElement.lang = locale === "az" ? "az" : "ru";
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getDictionary(locale),
    }),
    [locale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
