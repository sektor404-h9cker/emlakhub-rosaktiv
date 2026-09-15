"use client";

/**
 * =============================================================================
 * SectionGuide — понятная подсказка; можно скрыть (раздел / все)
 * =============================================================================
 */

import { Lightbulb, ArrowRight, HelpCircle, EyeOff } from "lucide-react";
import { SECTION_GUIDE } from "@/data/guideCopy";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";

export default function SectionGuide({ section }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { startTour, prefs, setShowGuides } = useTerminalPanel();
  const g = SECTION_GUIDE[section];

  if (!g || prefs?.showGuides === false) return null;

  const why = locale === "az" ? g.whyAz : g.whyRu;
  const next = locale === "az" ? g.nextAz : g.nextRu;
  const tip = locale === "az" ? g.tipAz : g.tipRu;

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-[#2563eb]/25 bg-gradient-to-br from-[#0d1524] via-[#0b1018] to-[#0a0c12]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
          <HelpCircle size={14} />
          {t.guideWhy}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={startTour}
            className="text-[11px] font-medium text-[#60a5fa] hover:text-white"
          >
            {t.tourRestart}
          </button>
          <button
            type="button"
            onClick={() => setShowGuides(false)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[11px] text-[#94a3b8] transition hover:border-white/20 hover:text-white"
            title={t.guideHideAllHint}
          >
            <EyeOff size={12} />
            {t.guideHide}
          </button>
        </div>
      </div>
      <div className="space-y-3 px-4 py-3.5">
        <p className="text-[14px] leading-relaxed text-[#e2e8f0]">{why}</p>
        <div className="flex items-start gap-2 text-[13px] text-[#94a3b8]">
          <ArrowRight size={14} className="mt-0.5 shrink-0 text-[#2563eb]" />
          <span>
            <span className="font-medium text-[#cbd5e1]">{t.guideNext}: </span>
            {next}
          </span>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-white/[0.03] px-3 py-2 text-[12px] text-[#94a3b8]">
          <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <span>{tip}</span>
        </div>
        <p className="text-[11px] text-[#475569]">{t.guideHideAllHint}</p>
      </div>
    </div>
  );
}
