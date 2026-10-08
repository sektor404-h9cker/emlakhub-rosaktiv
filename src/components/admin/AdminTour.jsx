"use client";

/**
 * AdminTour - короткий онбординг по админке
 */

import { useState, useSyncExternalStore } from "react";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";

const STEPS = {
  az: [
    "Solda menyu: istifadəçilər, maliyyə, dəstək, tapşırıqlar.",
    "Təhlükəsizlikdə rollar və live loglar var.",
    "Tapşırıqlarda şöbə və deadline təyin edin.",
    "Dil AZ / RU / EN yuxarıda dəyişilir və saxlanır.",
  ],
  ru: [
    "Слева меню: пользователи, финансы, поддержка, задачи.",
    "В безопасности - роли и live-логи.",
    "В задачах назначайте отдел и дедлайн.",
    "Язык AZ / RU / EN сверху - сохраняется автоматически.",
  ],
  en: [
    "Left menu: users, finance, support, tasks.",
    "Security has roles and live logs.",
    "Assign department and deadline in Tasks.",
    "Language AZ / RU / EN in the header is saved.",
  ],
};

const KEY = "eh_admin_tour_done";
const tourListeners = new Set();

function tourDone() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

function subscribeTour(onStoreChange) {
  tourListeners.add(onStoreChange);
  return () => tourListeners.delete(onStoreChange);
}

function markTourDone() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
  tourListeners.forEach((listener) => listener());
}

export default function AdminTour() {
  const { t, locale } = useAdminI18n();
  const done = useSyncExternalStore(subscribeTour, tourDone, () => true);
  const [forced, setForced] = useState(false);
  const [closed, setClosed] = useState(false);
  const [step, setStep] = useState(0);
  const steps = STEPS[locale] || STEPS.ru;
  const open = forced || (!done && !closed);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setStep(0);
          setClosed(false);
          setForced(true);
        }}
        className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad] hover:text-white"
      >
        {t.tourStart}
      </button>
    );
  }

  const last = step >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1018] p-5 shadow-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">
          {t.tourStart} · {step + 1}/{steps.length}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-white">
          {steps[step]}
        </p>
        <div className="mt-5 flex justify-between gap-2">
          <button
            type="button"
            className="text-[12px] text-[#64748b]"
            onClick={() => {
              markTourDone();
              setForced(false);
              setClosed(true);
            }}
          >
            {t.tourSkip}
          </button>
          <button
            type="button"
            className="rounded-xl bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
            onClick={() => {
              if (last) {
                markTourDone();
                setForced(false);
                setClosed(true);
              } else setStep((s) => s + 1);
            }}
          >
            {last ? t.tourDone : t.tourNext}
          </button>
        </div>
      </div>
    </div>
  );
}
