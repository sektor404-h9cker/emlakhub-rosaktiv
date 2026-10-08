"use client";

/**
 * Язык лендинга и терминала. Выбор хранится локально: это настройка браузера, не данные команды.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { getDictionary } from "./dictionary";

const KEY = "eh_locale";
const listeners = new Set();

function readLocale() {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === "az" || saved === "ru" || saved === "en") return saved;
  } catch {
    /* private mode */
  }
  return null;
}

function subscribe(onStoreChange) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function LocaleProvider({ children, defaultLocale = "ru" }) {
  const locale = useSyncExternalStore(
    subscribe,
    () => readLocale() || defaultLocale,
    () => defaultLocale
  );

  const setLocale = useCallback((next) => {
    if (next !== "az" && next !== "ru" && next !== "en") return;
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
    emit();
  }, []);

  useEffect(() => {
    document.documentElement.lang =
      locale === "az" ? "az" : locale === "en" ? "en" : "ru";
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t: getDictionary(locale),
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

const LocaleContext = createContext({
  locale: "ru",
  setLocale: () => {},
  t: getDictionary("ru"),
});

export function useLocale() {
  return useContext(LocaleContext);
}
