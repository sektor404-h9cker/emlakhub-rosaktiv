"use client";

/**
 * =============================================================================
 * InvestorDashboard — сетка лотов + KPI + модалка детализации
 * =============================================================================
 * Навигация рынков здесь — фильтр списка (не сайдбар приложения).
 * Клик по лоту → LotDetailModal.
 * =============================================================================
 */

import { useMemo, useState } from "react";
import {
  Database,
  TrendingUp,
  AlertTriangle,
  Search,
  Bookmark,
  GitCompare,
} from "lucide-react";
import { DEMO_LOTS, lotTitle, lotType } from "@/data/demoLots";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import LotDetailModal from "./LotDetailModal";
import SectionGuide from "./SectionGuide";

export default function InvestorDashboard() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const {
    isWatched,
    toggleWatch,
    isCompared,
    toggleCompare,
    onboardingDone,
    startTour,
  } = useTerminalPanel();

  const [market, setMarket] = useState("all");
  const [query, setQuery] = useState("");
  const [activeLotId, setActiveLotId] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEMO_LOTS.filter((lot) => {
      if (market !== "all" && lot.market !== market) return false;
      if (!q) return true;
      const hay = `${lot.id} ${lot.registryNo} ${lot.titleAz} ${lot.titleRu}`.toLowerCase();
      return hay.includes(q);
    });
  }, [market, query]);

  const avgMargin = useMemo(() => {
    if (!filtered.length) return 0;
    return (
      filtered.reduce((s, l) => s + l.expectedMarginPct, 0) / filtered.length
    );
  }, [filtered]);

  const activeLot = DEMO_LOTS.find((l) => l.id === activeLotId) || null;

  return (
    <div className="mx-auto max-w-[1280px] space-y-5">
      <SectionGuide section="dashboard" />

      {!onboardingDone ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-[13px] leading-relaxed text-[#fde68a]">
          {t.welcomeBanner}{" "}
          <button
            type="button"
            onClick={startTour}
            className="font-semibold text-white underline underline-offset-2"
          >
            {t.tourRestart}
          </button>
        </div>
      ) : null}

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <Pill>{t.beta}</Pill>
        <Pill>
          {t.aiSynced}: {DEMO_LOTS.length} / {DEMO_LOTS.length}
        </Pill>
        <Pill>
          {t.mlSync}: 7 {locale === "az" ? "dəq əvvəl" : "мин назад"}
        </Pill>
      </div>

      {/* KPI */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi
          label={t.activeLots}
          value={String(DEMO_LOTS.length)}
          icon={Database}
          tone="blue"
        />
        <Kpi
          label={t.avgMargin}
          value={`~${avgMargin.toFixed(0)}%`}
          icon={TrendingUp}
          tone="green"
        />
        <Kpi
          label={t.last24h}
          value={`+${DEMO_LOTS.length} ${t.newLabel}`}
          icon={AlertTriangle}
          tone="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[16px] font-semibold text-white">{t.bestLots}</h2>
          <p className="mt-0.5 text-[12px] text-[#64748b]">
            {t.allLots} · {filtered.length}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="eh-term-input pl-9 text-[13px]"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
            {[
              { key: "all", label: t.marketAll },
              { key: "auto", label: t.marketAuto },
              { key: "estate", label: t.marketEstate },
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMarket(m.key)}
                className={[
                  "rounded-lg px-3 py-1.5 text-[12px] font-medium transition",
                  market === m.key
                    ? "bg-[#2563eb] text-white"
                    : "text-[#94a3b8] hover:text-white",
                ].join(" ")}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lot grid */}
      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-12 text-center text-[13px] text-[#64748b]">
          {t.emptyLots}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => (
            <div
              key={lot.id}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12] transition hover:border-[#2563eb]/40 hover:shadow-[0_20px_50px_-28px_rgba(37,99,235,0.55)]"
            >
              <button
                type="button"
                onClick={() => setActiveLotId(lot.id)}
                className="w-full text-left"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={lot.photo}
                    alt={lotTitle(lot, locale)}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                    <div className="font-mono text-[10px] tracking-wide text-[#93c5fd]">
                      {lot.registryNo || lot.id}
                    </div>
                  </div>
                </div>
                <div className="p-3.5 pb-2">
                  <div className="text-[11px] uppercase tracking-[0.12em] text-[#64748b]">
                    {lotType(lot, locale)}
                  </div>
                  <div className="mt-1 truncate text-[14px] font-medium text-white">
                    {lotTitle(lot, locale)}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-[#64748b]">{t.score}</div>
                      <div className="font-mono text-[15px] tabular-nums text-white">
                        {lot.score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#64748b]">{t.profit}</div>
                      <div className="font-mono text-[15px] tabular-nums text-emerald-400">
                        +₼ {lot.expectedProfit.toLocaleString("en-US")}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              <div className="flex gap-2 border-t border-white/[0.06] px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleWatch(lot.id)}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition",
                    isWatched(lot.id)
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-white/[0.03] text-[#94a3b8] hover:text-white",
                  ].join(" ")}
                >
                  <Bookmark
                    size={13}
                    className={isWatched(lot.id) ? "fill-current" : ""}
                  />
                  {t.navWatchlist}
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(lot.id)}
                  className={[
                    "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition",
                    isCompared(lot.id)
                      ? "bg-[#2563eb]/20 text-[#93c5fd]"
                      : "bg-white/[0.03] text-[#94a3b8] hover:text-white",
                  ].join(" ")}
                >
                  <GitCompare size={13} />
                  {isCompared(lot.id) ? t.inCompare : t.addToCompare}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LotDetailModal
        lot={activeLot}
        open={Boolean(activeLot)}
        onClose={() => setActiveLotId(null)}
      />
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-[#94a3b8]">
      {children}
    </span>
  );
}

function Kpi({ label, value, icon: Icon, tone }) {
  const toneCls =
    tone === "green"
      ? "text-emerald-400"
      : tone === "red"
        ? "text-rose-400"
        : "text-[#60a5fa]";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748b]">
          {label}
        </div>
        <Icon size={18} className={toneCls} strokeWidth={1.6} />
      </div>
      <div className="mt-3 font-mono text-[28px] font-semibold tabular-nums tracking-tight text-white sm:text-[32px]">
        {value}
      </div>
    </div>
  );
}
