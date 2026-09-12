"use client";

/**
 * LanguageSwitch (AZ / RU)
 * variant="light" — для белого премиум-лендинга
 * variant="dark"  — для графитового терминала
 */

import { useLocale } from "@/lib/i18n/LocaleProvider";

const OPTIONS = [
  { id: "az", label: "AZ" },
  { id: "ru", label: "RU" },
];

export default function LanguageSwitch({ variant = "light" }) {
  const { locale, setLocale, t } = useLocale();
  const light = variant === "light";

  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label={t.langHint}>
      <div
        className={[
          "flex rounded-full p-0.5 border",
          light
            ? "border-slate-200 bg-slate-50"
            : "border-[var(--eh-border)] bg-black/25 backdrop-blur-md",
        ].join(" ")}
      >
        {OPTIONS.map((opt) => {
          const active = locale === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLocale(opt.id)}
              aria-pressed={active}
              className={[
                "min-w-[2.5rem] px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] rounded-full transition-all duration-300",
                active
                  ? light
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-[var(--eh-cyan-soft)] text-[var(--eh-cyan)]"
                  : light
                    ? "text-slate-500 hover:text-slate-800"
                    : "text-[var(--eh-titanium)] hover:text-[var(--eh-titanium-bright)]",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
