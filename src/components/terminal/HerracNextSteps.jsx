"use client";

/**
 * HerracNextSteps — шаги + чеклист до ставки (знания AZ-аукционов)
 */

import { ExternalLink, CheckCircle2, Scale } from "lucide-react";
import { HERRAC_URL } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import {
  HERRAC_PRE_BID_CHECKLIST,
  HERRAC_LEGAL_PILLARS,
  HERRAC_SOURCES,
} from "@/lib/herrac/knowledge";
import { line, say } from "@/lib/i18n/copy";

export default function HerracNextSteps({ className = "", showCta = true }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const steps = [t.herracStep1, t.herracStep2, t.herracStep3, t.herracStep4];

  return (
    <div
      className={[
        "rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.07] to-transparent p-4",
        className,
      ].join(" ")}
    >
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200/90">
        {t.herracNextTitle}
      </div>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[#94a3b8]">
        {t.herracNextHint}
      </p>
      <ul className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12px] leading-snug text-[#cbd5e1]"
          >
            <CheckCircle2
              size={14}
              className="mt-0.5 shrink-0 text-amber-400/80"
            />
            <span>
              <span className="mr-1.5 font-mono text-[10px] text-[#64748b]">
                {i + 1}.
              </span>
              {s}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
          <Scale size={12} />
          {say(locale, "Təklifdən əvvəl", "До ставки", "Before you bid")}
        </div>
        <ul className="mt-2 space-y-1.5">
          {HERRAC_PRE_BID_CHECKLIST.map((c, i) => (
            <li key={i} className="text-[11px] leading-snug text-[#94a3b8]">
              · {line(locale, c)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 space-y-1.5">
        {HERRAC_LEGAL_PILLARS.map((p) => (
          <div key={p.id} className="rounded-lg bg-black/20 px-2.5 py-2">
            <div className="text-[11px] font-medium text-[#e2e8f0]">
              {line(locale, { az: p.titleAz, ru: p.titleRu, en: p.titleEn })}
            </div>
            <div className="mt-0.5 text-[10px] text-[#64748b]">
              {line(locale, { az: p.hintAz, ru: p.hintRu, en: p.hintEn })}
            </div>
          </div>
        ))}
      </div>

      {showCta ? (
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={HERRAC_URL || HERRAC_SOURCES.gov}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-3 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1d4ed8]"
          >
            {t.openOnHerrac}
            <ExternalLink size={14} />
          </a>
          <a
            href={HERRAC_SOURCES.eHerrac}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center text-[11px] text-[#64748b] hover:text-[#93c5fd]"
          >
            {say(locale, "eherrac.com · icra hərracları", "eherrac.com · торги по исполнению", "eherrac.com · enforcement auctions")}
          </a>
        </div>
      ) : null}
    </div>
  );
}
