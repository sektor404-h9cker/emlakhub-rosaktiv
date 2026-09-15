"use client";

/**
 * HerracNextSteps — чеклист официальных шагов после решения в Hub
 */

import { ExternalLink, CheckCircle2 } from "lucide-react";
import { HERRAC_URL } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";

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
      {showCta ? (
        <a
          href={HERRAC_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-3 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#1d4ed8]"
        >
          {t.openOnHerrac}
          <ExternalLink size={14} />
        </a>
      ) : null}
    </div>
  );
}
