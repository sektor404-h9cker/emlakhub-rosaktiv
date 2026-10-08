"use client";

import { useSyncExternalStore } from "react";

const KEY = "eh_lot_story_mode";
const EVENT = "eh-lot-mode";

function subscribe(onStoreChange) {
  const notify = () => onStoreChange();
  window.addEventListener("storage", notify);
  window.addEventListener(EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(EVENT, notify);
  };
}

function read() {
  return window.localStorage.getItem(KEY) === "pro" ? "pro" : "simple";
}

export function useStoryMode() {
  const mode = useSyncExternalStore(subscribe, read, () => "simple");
  const setMode = (next) => {
    window.localStorage.setItem(KEY, next === "pro" ? "pro" : "simple");
    window.dispatchEvent(new Event(EVENT));
  };
  return [mode, setMode];
}
