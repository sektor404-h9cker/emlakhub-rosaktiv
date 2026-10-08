"use client";

import { useSyncExternalStore } from "react";
import { say } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const KEY = "eh_first_steps_seen";
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function seenNow() {
  return window.localStorage.getItem(KEY) === "1";
}

export default function FirstSteps() {
  const { locale } = useLocale();
  const s = (az, ru, en) => say(locale, az, ru, en);
  const seen = useSyncExternalStore(subscribe, seenNow, () => true);

  if (seen) return null;

  const steps = [
    s("Addım 1. Lot seçin.", "Шаг 1. Выберите лот.", "Step 1. Choose a lot."),
    s("Addım 2. Bazar oriyentirinə və risklərə baxın.", "Шаг 2. Посмотрите ориентир рынка и риски.", "Step 2. Look at the market reference and the risks."),
    s("Addım 3. Öz xərclərinizi yazın.", "Шаг 3. Укажите свои расходы.", "Step 3. Enter your costs."),
    s("Addım 4. Alış həddini və mümkün nəticəni görün.", "Шаг 4. Узнайте предел покупки и возможный результат.", "Step 4. See the buy limit and the possible result."),
  ];

  return (
    <section className="mb-4 rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[14px] font-semibold text-white">
          {s("Emlak Hub-u bir dəqiqəyə", "Emlak Hub за 60 секунд", "Emlak Hub in 60 seconds")}
        </h2>
        <button
          type="button"
          className="text-[12px] text-[#94a3b8]"
          onClick={() => {
            window.localStorage.setItem(KEY, "1");
            emit();
          }}
        >
          {s("Bağla", "Закрыть", "Close")}
        </button>
      </div>
      <ol className="mt-3 space-y-1 text-[13px] text-[#cbd5e1]">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
