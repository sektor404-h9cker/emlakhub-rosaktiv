"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

/**
 * На сервере анимация включена. После гидрации читаем системную настройку.
 * useSyncExternalStore не расходится с первым кадром и не зовёт setState в эффекте.
 */
export function useCalmMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}
