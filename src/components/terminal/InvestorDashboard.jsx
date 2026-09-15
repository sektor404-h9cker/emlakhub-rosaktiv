"use client";

/**
 * =============================================================================
 * InvestorDashboard — сетка лотов + KPI + модалка детализации
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
  SlidersHorizontal,
  X,
} from "lucide-react";
import { DEMO_LOTS, lotTitle, lotType, lotCity } from "@/data/demoLots";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import LotDetailModal from "./LotDetailModal";
import SectionGuide from "./SectionGuide";
import SimplePath from "./SimplePath";
import TermHint from "./TermHint";

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
    prefs,
  } = useTerminalPanel();

  const [market, setMarket] = useState(
    prefs?.focus === "auto" || prefs?.focus === "estate" ? prefs.focus : "all"
  );
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("score");
  const [wishScore, setWishScore] = useState(false);
  const [wishSafe, setWishSafe] = useState(false);
  const [wishCity, setWishCity] = useState("all");
  const [activeLotId, setActiveLotId] = useState(null);

  const cities = useMemo(() => {
    const set = new Set(
      DEMO_LOTS.map((l) => (locale === "az" ? l.cityAz : l.cityRu)).filter(Boolean)
    );
    return Array.from(set);
  }, [locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = DEMO_LOTS.filter((lot) => {
      if (market !== "all" && lot.market !== market) return false;
      if (wishScore && lot.score < 60) return false;
      if (wishSafe) {
        const high = (lot.legalRisks || []).some((r) => r.level === "high");
        if (high || lot.redFlags) return false;
      }
      if (wishCity !== "all") {
        const city = locale === "az" ? lot.cityAz : lot.cityRu;
        if (city !== wishCity) return false;
      }
      if (!q) return true;
      const hay = `${lot.id} ${lot.registryNo} ${lot.titleAz} ${lot.titleRu} ${lot.cityAz} ${lot.cityRu}`.toLowerCase();
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      if (sort === "profit") return b.expectedProfit - a.expectedProfit;
      if (sort === "price") return a.startPrice - b.startPrice;
      return b.score - a.score;
    });
    return list;
  }, [market, query, sort, wishScore, wishSafe, wishCity, locale]);

  const avgMargin = useMemo(() => {
    if (!filtered.length) return 0;
    return (
      filtered.reduce((s, l) => s + l.expectedMarginPct, 0) / filtered.length
    );
  }, [filtered]);

  const activeLot = DEMO_LOTS.find((l) => l.id === activeLotId) || null;
  const filtersOn = wishScore || wishSafe || wishCity !== "all" || sort !== "score";

  const clearWishes = () => {
    setWishScore(false);
    setWishSafe(false);
    setWishCity("all");
    setSort("score");
    setQuery("");
    setMarket("all");
  };

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

      <SimplePath />

      <div className="grid gap-3 sm:grid-cols-3">
        <Kpi label={t.activeLots} value={String(DEMO_LOTS.length)} icon={Database} tone="blue" />
        <Kpi
          label={
            <>
              {t.avgMargin}
              <TermHint text={t.tipMargin} />
            </>
          }
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

      {/* Search + wishes */}
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c12]">
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-3 sm:flex-row sm:items-center sm:p-4">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748b]"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="eh-term-input h-11 w-full rounded-xl border-white/10 bg-[#05070b] pl-10 pr-10 text-[14px]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white"
                aria-label="clear"
              >
                <X size={14} />
              </button>
            ) : null}
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
                  "rounded-lg px-3 py-2 text-[12px] font-medium transition",
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

        <div className="flex flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            <SlidersHorizontal size={12} />
            {t.wishTitle}
          </span>

          <WishChip active={wishScore} onClick={() => setWishScore((v) => !v)}>
            {t.wishScore}
          </WishChip>
          <WishChip active={wishSafe} onClick={() => setWishSafe((v) => !v)}>
            {t.wishSafe}
          </WishChip>

          {cities.map((city) => (
            <WishChip
              key={city}
              active={wishCity === city}
              onClick={() => setWishCity((c) => (c === city ? "all" : city))}
            >
              {city}
            </WishChip>
          ))}

          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline-block" />

          <span className="text-[11px] text-[#64748b]">{t.sortLabel}</span>
          {[
            { id: "score", label: t.sortScore },
            { id: "profit", label: t.sortProfit },
            { id: "price", label: t.sortPrice },
          ].map((s) => (
            <WishChip
              key={s.id}
              active={sort === s.id}
              onClick={() => setSort(s.id)}
              soft
            >
              {s.label}
            </WishChip>
          ))}

          {filtersOn || query || market !== "all" ? (
            <button
              type="button"
              onClick={clearWishes}
              className="ml-auto text-[12px] text-[#93c5fd] hover:text-white"
            >
              {t.clearFilters}
            </button>
          ) : null}
        </div>
      </section>

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold text-white">{t.bestLots}</h2>
          <p className="mt-0.5 text-[12px] text-[#64748b]">
            {t.foundLots}: {filtered.length}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-[#0a0c12]/80 px-6 py-12 text-center">
          <p className="text-[14px] text-[#94a3b8]">{t.emptyLots}</p>
          <button
            type="button"
            onClick={clearWishes}
            className="mt-4 inline-flex rounded-xl border border-white/10 px-4 py-2 text-[13px] text-[#93c5fd] hover:bg-white/[0.04]"
          >
            {t.clearFilters}
          </button>
        </div>
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
                    {lotType(lot, locale)} · {lotCity(lot, locale)}
                  </div>
                  <div className="mt-1 truncate text-[14px] font-medium text-white">
                    {lotTitle(lot, locale)}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-[#64748b]">
                        {t.score}
                        <TermHint text={t.tipScore} />
                      </div>
                      <div className="font-mono text-[15px] tabular-nums text-white">
                        {lot.score}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[#64748b]">
                        {t.profit}
                        <TermHint text={t.tipProfit} />
                      </div>
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

function WishChip({ active, onClick, children, soft }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
        active
          ? soft
            ? "border-[#2563eb]/40 bg-[#2563eb]/15 text-[#93c5fd]"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          : "border-white/10 bg-white/[0.02] text-[#94a3b8] hover:border-white/20 hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
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
        <div className="flex items-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748b]">
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
