"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";

const STEPS = [
  { az: "Lot siyahısı pars olunur", ru: "Список лотов парсится" },
  { az: "Vision + NLP riskləri çıxarır", ru: "Vision + NLP выделяют риски" },
  { az: "Marja kalkulyatoru hesablayır", ru: "Калькулятор считает маржу" },
  { az: "Modalda qərar və yoxlama", ru: "Решение и чек-лист в модалке" },
];

export default function HowItWorksPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);

  return (
    <div className="mx-auto max-w-[720px]">
      <h2 className="text-[20px] font-semibold text-white">{t.howTitle}</h2>
      <p className="mt-1 text-[13px] text-[#64748b]">{t.howHint}</p>
      <ol className="mt-6 space-y-3">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className="flex gap-3 rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[12px] font-semibold text-white">
              {i + 1}
            </span>
            <span className="text-[14px] text-[#cbd5e1]">
              {locale === "az" ? s.az : s.ru}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
