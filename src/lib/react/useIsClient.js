"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/**
 * false на сервере и на первом клиентском кадре, true после гидрации.
 * useSyncExternalStore не вызывает setState в эффекте и не расходится с SSR.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
