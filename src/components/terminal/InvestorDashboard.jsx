"use client";

/**
 * =============================================================================
 * InvestorDashboard - сетка лотов + KPI + модалка детализации
 * =============================================================================
 */

import { useMemo, useState } from "react";
import { useLots } from "@/hooks/useLots";
import {
  Search,
  Bookmark,
  GitCompare,
  SlidersHorizontal,
  X,
  Clock,
  Images,
} from "lucide-react";
import { lotTitle, lotType, lotCity } from "@/lib/lots/helpers";
import {
  formatAuctionWhen,
  isUpcomingLot,
  lotPhotoCount,
  lotPhotos,
} from "@/lib/lots/photos";
import { LOT_MARKETS, marketLabel } from "@/lib/lots/markets";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { mediaUrl, herracDirectUrl } from "@/lib/lots/mediaUrl";
import { money } from "./lotStory/money";
import LotDetailModal from "./LotDetailModal";
import { useAuth } from "@/context/AuthContext";

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
  const { tryOpenLot } = useAuth();
  const { lots, loading: lotsLoading, error: lotsError } = useLots({ enabled: true });

  const [market, setMarket] = useState(
    prefs?.focus === "auto" || prefs?.focus === "estate" ? prefs.focus : "all"
  );
  const [query, setQuery] = useState("");
  const [wishSafe, setWishSafe] = useState(false);
  const [wishCity, setWishCity] = useState("all");
  const [phase, setPhase] = useState("all");
  const [activeLotId, setActiveLotId] = useState(null);

  const cities = useMemo(() => {
    const set = new Set(
      lots.map((l) => (locale === "az" ? l.cityAz : l.cityRu)).filter(Boolean)
    );
    return Array.from(set);
  }, [locale, lots]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = lots.filter((lot) => {
      if (market !== "all" && lot.market !== market) return false;
      if (wishSafe) {
        const high = (lot.legalRisks || []).some((r) => r.level === "high");
        if (high || lot.redFlags) return false;
      }
      if (wishCity !== "all") {
        const city = locale === "az" ? lot.cityAz : lot.cityRu;
        if (city !== wishCity) return false;
      }
      if (phase === "upcoming" && !isUpcomingLot(lot)) return false;
      if (phase === "live" && isUpcomingLot(lot)) return false;
      if (!q) return true;
      const hay = `${lot.id} ${lot.registryNo} ${lot.titleAz} ${lot.titleRu} ${lot.cityAz} ${lot.cityRu}`.toLowerCase();
      return hay.includes(q);
    });

    list = [...list].sort((a, b) => {
      const av = a.startPrice == null ? Number.POSITIVE_INFINITY : Number(a.startPrice);
      const bv = b.startPrice == null ? Number.POSITIVE_INFINITY : Number(b.startPrice);
      return av - bv;
    });
    return list;
  }, [market, query, wishSafe, wishCity, phase, locale, lots]);

  const activeLot = lots.find((l) => l.id === activeLotId) || null;
  const filtersOn = wishSafe || wishCity !== "all" || phase !== "all";

  const clearWishes = () => {
    setWishSafe(false);
    setWishCity("all");
    setPhase("all");
    setQuery("");
    setMarket("all");
  };

  return (
    <div className="mx-auto max-w-[1280px] space-y-4">
      {!onboardingDone ? (
        <p className="text-[13px] leading-relaxed text-[#a8a29e]">
          {t.welcomeBanner}{" "}
          <button
            type="button"
            onClick={startTour}
            className="text-white underline underline-offset-2"
          >
            {t.tourRestart}
          </button>
        </p>
      ) : null}

      <section className="min-w-0">
        <div className="flex min-w-0 flex-col gap-3">
          <label className="eh-search group flex min-h-11 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-white/[0.08] bg-transparent transition focus-within:border-white/25">
            <span className="flex w-10 shrink-0 items-center justify-center text-[#78716c]">
              <Search size={16} strokeWidth={1.8} aria-hidden />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[14px] text-white outline-none placeholder:text-[#64748b]"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="m-1.5 flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-[#94a3b8] hover:bg-white/[0.06] hover:text-white"
                aria-label="clear"
              >
                <X size={15} />
              </button>
            ) : (
              <span className="hidden shrink-0 items-center self-center pr-3 text-[11px] text-[#475569] sm:inline-flex">
                ⌘K
              </span>
            )}
          </label>
          <div className="flex w-full min-w-0 flex-wrap gap-1.5">
            {[
              { key: "all", label: t.marketAll },
              ...Object.keys(LOT_MARKETS).map((key) => ({
                key,
                label: marketLabel(key, locale),
              })),
            ].map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMarket(m.key)}
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-[12px] transition",
                  market === m.key
                    ? "bg-white text-[#0b0d12]"
                    : "text-[#a8a29e] hover:text-white",
                ].join(" ")}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            <SlidersHorizontal size={12} />
            {t.wishTitle}
          </span>

          <WishChip active={wishSafe} onClick={() => setWishSafe((v) => !v)}>
            {t.wishSafe}
          </WishChip>

          <span className="mx-1 hidden h-4 w-px bg-white/10 sm:inline-block" />
          <span className="text-[11px] text-[#64748b]">{t.filterPhase}</span>
          {[
            { id: "all", label: t.filterAllPhases },
            { id: "live", label: t.filterLive },
            { id: "upcoming", label: t.filterUpcoming },
          ].map((p) => (
            <WishChip
              key={p.id}
              active={phase === p.id}
              onClick={() => setPhase(p.id)}
              soft
            >
              {p.label}
            </WishChip>
          ))}

          {cities.map((city) => (
            <WishChip
              key={city}
              active={wishCity === city}
              onClick={() => setWishCity((c) => (c === city ? "all" : city))}
            >
              {city}
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

      <p className="text-[12px] text-[#78716c]">
        {t.foundLots}: {filtered.length}
      </p>

      {lotsLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <div className="eh-skel aspect-[16/10] rounded-lg" />
              <div className="eh-skel h-3 w-24 rounded" />
              <div className="eh-skel h-4 w-4/5 rounded" />
              <div className="eh-skel h-5 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : lotsError ? (
        <p className="py-10 text-[14px] text-[#a8a29e]">{lotsError}</p>
      ) : filtered.length === 0 ? (
        <div className="py-8">
          <p className="text-[18px] font-medium text-white">
            {lots.length === 0
              ? locale === "az"
                ? "Hələ lot yoxdur"
                : "Лотов пока нет"
              : t.emptyLots}
          </p>
          <button
            type="button"
            onClick={clearWishes}
            className="mt-4 text-[13px] text-[#93c5fd] hover:text-white"
          >
            {t.clearFilters}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lot) => {
            const herracPrice = Number(lot.marketPrice);
            const herracOk = Number.isFinite(herracPrice) && herracPrice > 0;
            return (
            <div
              key={lot.id}
              className="group flex min-w-0 flex-col overflow-hidden border-b border-white/[0.06] pb-4 transition duration-200 hover:-translate-y-0.5 sm:border-b-0"
            >
              <button
                type="button"
                onClick={() => {
                  const res = tryOpenLot(lot.id);
                  if (res.ok) setActiveLotId(lot.id);
                }}
                data-lot-open={lot.id}
                className="flex min-w-0 w-full flex-1 flex-col text-left"
              >
                <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-[#111]">
                  {lot.photo || lotPhotos(lot)[0] ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={mediaUrl(lot.photo || lotPhotos(lot)[0])}
                      alt={lotTitle(lot, locale)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      decoding="async"
                      data-fallback={herracDirectUrl(lot.photo || lotPhotos(lot)[0]) || ""}
                      onError={(e) => {
                        const el = e.currentTarget;
                        const fb = el.getAttribute("data-fallback");
                        if (fb && el.src !== fb && !el.src.includes(encodeURIComponent(fb))) {
                          el.src = fb;
                          return;
                        }
                        el.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-3 text-center font-mono text-[10px] uppercase tracking-widest text-[#64748b]">
                      <span className="line-clamp-2 break-all">
                        {lot.registryNo || lot.id}
                      </span>
                    </div>
                  )}
                  <div className="absolute left-2 top-2 flex max-w-[calc(100%-1rem)] flex-wrap gap-1">
                    {isUpcomingLot(lot) ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-sky-500/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        <Clock size={10} />
                        {t.lotUpcoming}
                      </span>
                    ) : (
                      <span className="rounded-md bg-emerald-500/85 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                        {t.lotLive}
                      </span>
                    )}
                    {lotPhotoCount(lot) > 1 ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[9px] text-white backdrop-blur-sm">
                        <Images size={10} />
                        {lotPhotoCount(lot)}
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                    <div className="truncate font-mono text-[10px] tracking-wide text-[#93c5fd]">
                      {lot.registryNo || lot.id}
                    </div>
                    {isUpcomingLot(lot) && lot.startAt ? (
                      <div className="mt-0.5 truncate text-[10px] text-sky-200/90">
                        {t.lotStarts}: {formatAuctionWhen(lot.startAt, locale)}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-3.5 pb-2">
                  <div className="truncate text-[11px] uppercase tracking-[0.12em] text-[#64748b]">
                    {lotType(lot, locale)} · {lotCity(lot, locale)}
                  </div>
                  <div
                    className="mt-1 line-clamp-2 min-h-[2.5rem] text-[14px] font-medium leading-snug text-white"
                    title={lotTitle(lot, locale)}
                  >
                    {lotTitle(lot, locale)}
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <div className="min-w-0 shrink-0">
                      <div className="text-[10px] text-[#64748b]">{t.startPrice}</div>
                      <div className="eh-num font-mono text-[18px] text-white">
                        {money(lot.startPrice)}
                      </div>
                    </div>
                    {herracOk ? (
                      <div className="min-w-0 flex-1 text-right">
                        <div className="text-[10px] text-[#64748b]">
                          {locale === "az" ? "Hərrac lot qiyməti" : "Цена лота Hərrac"}
                        </div>
                        <div className="eh-num font-mono text-[15px] leading-tight text-[#e7e5e4]">
                          {money(herracPrice)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
              <div className="mt-auto flex gap-2 px-3 py-2 opacity-100 transition duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                <button
                  type="button"
                  onClick={() => toggleWatch(lot.id)}
                  className={[
                    "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition",
                    isWatched(lot.id)
                      ? "bg-amber-500/15 text-amber-300"
                      : "bg-white/[0.03] text-[#94a3b8] hover:text-white",
                  ].join(" ")}
                >
                  <Bookmark
                    size={13}
                    className={`shrink-0 ${isWatched(lot.id) ? "fill-current" : ""}`}
                  />
                  <span className="truncate">{t.navWatchlist}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(lot.id)}
                  className={[
                    "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] transition",
                    isCompared(lot.id)
                      ? "bg-[#2563eb]/20 text-[#93c5fd]"
                      : "bg-white/[0.03] text-[#94a3b8] hover:text-white",
                  ].join(" ")}
                >
                  <GitCompare size={13} className="shrink-0" />
                  <span className="truncate">
                    {isCompared(lot.id) ? t.inCompare : t.addToCompare}
                  </span>
                </button>
              </div>
            </div>
            );
          })}
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

