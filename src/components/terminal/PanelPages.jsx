"use client";

/**
 * =============================================================================
 * PanelPages — watchlist / compare / portfolio / map / documents / alerts / academy
 * =============================================================================
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  FileText,
  BellRing,
  CheckSquare,
  Star,
} from "lucide-react";
import {
  DEMO_LOTS,
  getLotById,
  lotCity,
  lotDistrict,
  lotTitle,
  lotType,
} from "@/data/demoLots";
import {
  ACADEMY_CHECKLIST,
  ACADEMY_LESSONS,
  DEAL_STAGES,
  DEMO_DOCUMENTS,
} from "@/data/demoPanel";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import LotDetailModal from "./LotDetailModal";
import SectionGuide from "./SectionGuide";
import LotsMap from "./LotsMap";

/* ---------- shared ---------- */

function PageHeader({ title, hint }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-semibold text-white">{title}</h2>
      <p className="mt-1 text-[13px] text-[#64748b]">{hint}</p>
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-14 text-center text-[13px] text-[#64748b]">
      {children}
    </p>
  );
}

function LotMiniCard({ lot, locale, t, onOpen, actions }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
      <button type="button" onClick={() => onOpen(lot.id)} className="block w-full text-left">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lot.photo} alt={lotTitle(lot, locale)} className="h-full w-full object-cover" />
        </div>
        <div className="p-3.5">
          <div className="text-[11px] uppercase tracking-[0.12em] text-[#64748b]">
            {lotType(lot, locale)} · {lotDistrict(lot, locale)}
          </div>
          <div className="mt-1 truncate text-[14px] font-medium text-white">
            {lotTitle(lot, locale)}
          </div>
          <div className="mt-3 flex justify-between font-mono text-[13px] tabular-nums">
            <span className="text-white">{t.score} {lot.score}</span>
            <span className="text-emerald-400">
              +₼ {lot.expectedProfit.toLocaleString("en-US")}
            </span>
          </div>
        </div>
      </button>
      {actions ? <div className="flex gap-2 border-t border-white/10 p-3">{actions}</div> : null}
    </div>
  );
}

/* ---------- Watchlist ---------- */

export function WatchlistPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { watchlist, toggleWatch, toggleCompare, isCompared, addDealFromLot } =
    useTerminalPanel();
  const [activeLotId, setActiveLotId] = useState(null);
  const lots = watchlist.map(getLotById).filter(Boolean);
  const activeLot = getLotById(activeLotId);

  return (
    <div className="mx-auto max-w-[1280px]">
      <SectionGuide section="watchlist" />
      <PageHeader title={t.watchTitle} hint={t.watchHint} />
      {lots.length === 0 ? (
        <EmptyState>
          {t.watchEmpty}{" "}
          <Link href="/dashboard" className="text-[#60a5fa] hover:underline">
            → {t.navTerminal}
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <LotMiniCard
              key={lot.id}
              lot={lot}
              locale={locale}
              t={t}
              onOpen={setActiveLotId}
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => toggleCompare(lot.id)}
                    className="eh-panel-btn flex-1"
                  >
                    {isCompared(lot.id) ? t.inCompare : t.addToCompare}
                  </button>
                  <button
                    type="button"
                    onClick={() => addDealFromLot(lot.id, lot.startPrice)}
                    className="eh-panel-btn flex-1"
                  >
                    {t.addToPortfolio}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWatch(lot.id)}
                    className="eh-panel-btn"
                    aria-label="unwatch"
                  >
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                  </button>
                </>
              }
            />
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

/* ---------- Compare ---------- */

export function ComparePage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { compare, clearCompare, toggleCompare } = useTerminalPanel();
  const lots = compare.map(getLotById).filter(Boolean);

  const rows = [
    {
      key: "type",
      label: locale === "az" ? "Tip" : "Тип",
      get: (l) => lotType(l, locale),
    },
    {
      key: "city",
      label: locale === "az" ? "Şəhər" : "Город",
      get: (l) => `${lotCity(l, locale)} · ${lotDistrict(l, locale)}`,
    },
    {
      key: "start",
      label: t.startPrice,
      get: (l) => `₼ ${l.startPrice.toLocaleString("en-US")}`,
    },
    {
      key: "market",
      label: t.marketValue,
      get: (l) => `₼ ${l.marketPrice.toLocaleString("en-US")}`,
    },
    {
      key: "margin",
      label: t.avgMargin,
      get: (l) => `${l.expectedMarginPct}%`,
    },
    {
      key: "profit",
      label: t.profit,
      get: (l) => `+₼ ${l.expectedProfit.toLocaleString("en-US")}`,
    },
    { key: "score", label: t.score, get: (l) => String(l.score) },
    {
      key: "opp",
      label: t.opportunityScore,
      get: (l) => String(l.opportunityScore),
    },
    {
      key: "repair",
      label: t.repairLabel,
      get: (l) => `₼ ${l.repairCost.toLocaleString("en-US")}`,
    },
    {
      key: "risk",
      label: locale === "az" ? "Hüquqi risk" : "Юр. риск",
      get: (l) => {
        const high = (l.legalRisks || []).filter((r) => r.level === "high").length;
        if (high) return locale === "az" ? `High ×${high}` : `High ×${high}`;
        const med = (l.legalRisks || []).filter((r) => r.level === "med").length;
        if (med) return `Med ×${med}`;
        return "Low";
      },
    },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      <SectionGuide section="compare" />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={t.compareTitle} hint={t.compareHint} />
        {lots.length ? (
          <button type="button" onClick={clearCompare} className="eh-panel-btn">
            {t.compareClear}
          </button>
        ) : null}
      </div>

      {lots.length < 2 ? (
        <EmptyState>
          {t.compareEmpty}{" "}
          <Link href="/dashboard" className="text-[#60a5fa] hover:underline">
            → {t.navTerminal}
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0c12]">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                  —
                </th>
                {lots.map((lot) => (
                  <th key={lot.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[10px] text-[#93c5fd]">
                          {lot.registryNo}
                        </div>
                        <div className="mt-1 max-w-[180px] text-[13px] font-medium text-white">
                          {lotTitle(lot, locale)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleCompare(lot.id)}
                        className="text-[#64748b] hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b border-white/[0.06]">
                  <td className="px-4 py-2.5 text-[#64748b]">{row.label}</td>
                  {lots.map((lot) => (
                    <td key={lot.id} className="px-4 py-2.5 font-mono tabular-nums text-[#e2e8f0]">
                      {row.get(lot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------- Portfolio ---------- */

export function PortfolioPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { deals, setDealStage } = useTerminalPanel();
  const [activeLotId, setActiveLotId] = useState(null);
  const activeLot = getLotById(activeLotId);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(DEAL_STAGES.map((s) => [s.id, []]));
    for (const d of deals) {
      if (map[d.stage]) map[d.stage].push(d);
      else map.explore.push(d);
    }
    return map;
  }, [deals]);

  const activeCount = deals.filter((d) => d.stage !== "result").length;
  const auctionCount = byStage.auction.length;
  const totalBid = deals.reduce((s, d) => s + (d.bid || 0), 0);

  return (
    <div className="mx-auto max-w-[1400px]">
      <SectionGuide section="portfolio" />

      <div className="mb-5">
        <h2 className="text-[22px] font-semibold tracking-tight text-white">
          {t.portfolioTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#94a3b8]">
          {t.portfolioHintLong}
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <PortfolioKpi
          label={t.portfolioKpiActive}
          value={String(activeCount)}
          tone="blue"
        />
        <PortfolioKpi
          label={t.portfolioKpiAuction}
          value={String(auctionCount)}
          tone="amber"
        />
        <PortfolioKpi
          label={t.portfolioKpiCapital}
          value={`₼ ${totalBid.toLocaleString("en-US")}`}
          tone="green"
        />
      </div>

      <div className="mb-4 hidden items-center gap-1 overflow-x-auto pb-1 text-[11px] text-[#64748b] md:flex">
        {DEAL_STAGES.map((stage, i) => (
          <div key={stage.id} className="flex items-center gap-1">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"
              style={{ borderColor: `${stage.accent}44` }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: stage.accent }}
              />
              {locale === "az" ? stage.az : stage.ru}
            </span>
            {i < DEAL_STAGES.length - 1 ? (
              <span className="px-0.5 text-[#334155]">→</span>
            ) : null}
          </div>
        ))}
      </div>

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
        {DEAL_STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex w-[min(280px,82vw)] shrink-0 flex-col rounded-2xl border border-white/10 bg-[#0a0c12] lg:w-auto"
          >
            <div
              className="rounded-t-2xl border-b border-white/[0.06] px-3 py-3"
              style={{
                background: `linear-gradient(180deg, ${stage.accent}18, transparent)`,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: stage.accent }}
                  />
                  <span className="text-[13px] font-semibold text-white">
                    {locale === "az" ? stage.az : stage.ru}
                  </span>
                </div>
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#94a3b8]">
                  {byStage[stage.id].length}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-[#64748b]">
                {locale === "az" ? stage.hintAz : stage.hintRu}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 p-2.5">
              {byStage[stage.id].length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-[12px] text-[#475569]">
                  {t.portfolioEmptyCol}
                </div>
              ) : (
                byStage[stage.id].map((deal) => {
                  const lot = getLotById(deal.lotId);
                  if (!lot) return null;
                  return (
                    <div
                      key={deal.id}
                      className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0f14] transition hover:border-white/20"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveLotId(lot.id)}
                        className="block w-full text-left"
                      >
                        <div className="relative aspect-[16/9] overflow-hidden bg-[#111]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={lot.photo}
                            alt={lotTitle(lot, locale)}
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 pb-2 pt-8">
                            <div className="font-mono text-[10px] text-[#93c5fd]">
                              {lot.registryNo}
                            </div>
                          </div>
                        </div>
                        <div className="p-2.5">
                          <div className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
                            {lotTitle(lot, locale)}
                          </div>
                          <div className="mt-2 flex items-end justify-between gap-2">
                            <div>
                              <div className="text-[10px] text-[#64748b]">
                                {t.bidLabel}
                              </div>
                              <div className="font-mono text-[13px] tabular-nums text-emerald-400">
                                ₼ {deal.bid.toLocaleString("en-US")}
                              </div>
                            </div>
                            <div className="text-right font-mono text-[12px] text-[#94a3b8]">
                              {t.score} {lot.score}
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] leading-snug text-[#64748b]">
                            {locale === "az" ? deal.noteAz : deal.noteRu}
                          </p>
                        </div>
                      </button>
                      <div className="border-t border-white/[0.06] px-2.5 py-2">
                        <label className="block">
                          <span className="mb-1 block text-[10px] uppercase tracking-[0.12em] text-[#475569]">
                            {t.portfolioMove}
                          </span>
                          <select
                            value={deal.stage}
                            onChange={(e) =>
                              setDealStage(deal.id, e.target.value)
                            }
                            className="eh-term-input py-1.5 text-[11px]"
                          >
                            {DEAL_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {locale === "az" ? s.az : s.ru}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <LotDetailModal
        lot={activeLot}
        open={Boolean(activeLot)}
        onClose={() => setActiveLotId(null)}
      />
    </div>
  );
}

function PortfolioKpi({ label, value, tone }) {
  const toneCls =
    tone === "green"
      ? "text-emerald-400"
      : tone === "amber"
        ? "text-amber-400"
        : "text-[#60a5fa]";
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3.5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748b]">
        {label}
      </div>
      <div
        className={`mt-2 font-mono text-[22px] font-semibold tabular-nums tracking-tight sm:text-[26px] ${toneCls}`}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------- Map ---------- */

export function MapPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const [activeLotId, setActiveLotId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const activeLot = getLotById(activeLotId);
  const focusLot = getLotById(focusId) || activeLot;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9.5rem)] max-w-[1400px] flex-col sm:min-h-[calc(100dvh-11rem)]">
      <div className="shrink-0">
        <SectionGuide section="map" />
        <PageHeader title={t.mapTitle} hint={t.mapHint} />
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_300px]">
        <LotsMap
          locale={locale}
          selectedId={focusId || activeLotId}
          onSelect={(id) => {
            setFocusId(id);
            setActiveLotId(id);
          }}
          className="h-[min(58vh,520px)] min-h-[260px] w-full rounded-2xl border border-white/10 sm:h-[min(62vh,560px)] lg:h-auto lg:min-h-[440px]"
        />

        <div className="flex max-h-[420px] flex-col rounded-2xl border border-white/10 bg-[#0a0c12] lg:max-h-none">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              {focusLot
                ? t.openLot
                : locale === "az"
                  ? "Lot seçin"
                  : "Выберите лот"}
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-[#64748b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
                Auto
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
                Estate
              </span>
              <span className="ml-auto font-mono tabular-nums text-[#475569]">
                {DEMO_LOTS.length}
              </span>
            </div>
          </div>

          {focusLot ? (
            <div className="border-b border-white/[0.06] p-4">
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={focusLot.photo}
                  alt={lotTitle(focusLot, locale)}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
              <div className="mt-3 font-mono text-[10px] text-[#93c5fd]">
                {focusLot.registryNo}
              </div>
              <div className="mt-1 text-[15px] font-medium text-white">
                {lotTitle(focusLot, locale)}
              </div>
              <p className="mt-1 text-[12px] text-[#64748b]">
                {lotCity(focusLot, locale)} · {lotDistrict(focusLot, locale)}
              </p>
              <div className="mt-3 flex justify-between text-[13px]">
                <span className="text-[#94a3b8]">
                  {t.score} {focusLot.score}
                </span>
                <span className="font-mono text-emerald-400">
                  +₼ {focusLot.expectedProfit.toLocaleString("en-US")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveLotId(focusLot.id)}
                className="mt-4 w-full rounded-xl bg-[#2563eb] py-2.5 text-[13px] font-semibold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.9)]"
              >
                {t.openLot}
              </button>
            </div>
          ) : null}

          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {DEMO_LOTS.map((lot) => {
              const on = focusId === lot.id;
              return (
                <li key={lot.id}>
                  <button
                    type="button"
                    onClick={() => setFocusId(lot.id)}
                    className={[
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] transition",
                      on
                        ? "bg-[#2563eb]/20 text-white"
                        : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-white",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "h-2 w-2 shrink-0 rounded-full",
                        lot.market === "estate" ? "bg-emerald-400" : "bg-sky-400",
                      ].join(" ")}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {lotTitle(lot, locale)}
                    </span>
                    <MapPin size={12} className="shrink-0 opacity-60" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <LotDetailModal
        lot={activeLot}
        open={Boolean(activeLot)}
        onClose={() => setActiveLotId(null)}
      />
    </div>
  );
}

/* ---------- Documents ---------- */

export function DocumentsPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const [activeLotId, setActiveLotId] = useState(null);
  const activeLot = getLotById(activeLotId);

  const statusLabel = {
    ready: t.docsReady,
    pending: t.docsPending,
    review: t.docsReview,
  };
  const statusCls = {
    ready: "text-emerald-400 bg-emerald-500/10",
    pending: "text-amber-400 bg-amber-500/10",
    review: "text-sky-400 bg-sky-500/10",
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <SectionGuide section="documents" />
      <PageHeader title={t.docsTitle} hint={t.docsHint} />
      <div className="space-y-2">
        {DEMO_DOCUMENTS.map((doc) => {
          const lot = getLotById(doc.lotId);
          return (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3.5"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[#94a3b8]">
                  <FileText size={16} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-white">
                    {locale === "az" ? doc.titleAz : doc.titleRu}
                  </div>
                  <div className="mt-0.5 text-[12px] text-[#64748b]">
                    {lot ? lotTitle(lot, locale) : doc.lotId} · {doc.pages} стр.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    statusCls[doc.status],
                  ].join(" ")}
                >
                  {statusLabel[doc.status]}
                </span>
                {lot ? (
                  <button
                    type="button"
                    onClick={() => setActiveLotId(lot.id)}
                    className="eh-panel-btn"
                  >
                    {t.openLot}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <LotDetailModal
        lot={activeLot}
        open={Boolean(activeLot)}
        onClose={() => setActiveLotId(null)}
      />
    </div>
  );
}

/* ---------- Alerts ---------- */

export function AlertsPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { alerts, toggleAlert } = useTerminalPanel();

  return (
    <div className="mx-auto max-w-[720px]">
      <SectionGuide section="alerts" />
      <PageHeader title={t.alertsTitle} hint={t.alertsHint} />
      <div className="space-y-2">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-4"
          >
            <div className="flex items-start gap-3">
              <BellRing
                size={18}
                className={a.enabled ? "text-[#60a5fa]" : "text-[#475569]"}
              />
              <div>
                <div className="text-[14px] font-medium text-white">
                  {locale === "az" ? a.titleAz : a.titleRu}
                </div>
                <div className="mt-0.5 text-[12px] text-[#64748b]">
                  {locale === "az" ? a.detailAz : a.detailRu}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleAlert(a.id)}
              className={[
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                a.enabled
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-white/5 text-[#64748b]",
              ].join(" ")}
            >
              {a.enabled ? t.alertsOn : t.alertsOff}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Academy ---------- */

export function AcademyContent() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const [done, setDone] = useState(() => new Set());

  const toggle = (i) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-[860px] space-y-8">
      <SectionGuide section="academy" />
      <PageHeader title={t.academyTitle} hint={t.academyHint} />

      <section>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
          {t.academyLessons}
        </h3>
        <div className="space-y-2">
          {ACADEMY_LESSONS.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-[#2563eb]/20 px-2 py-0.5 font-mono text-[11px] text-[#93c5fd]">
                  {lesson.level}
                </span>
                <span className="text-[11px] text-[#64748b]">{lesson.duration}</span>
              </div>
              <h4 className="mt-2 text-[15px] font-semibold text-white">
                {locale === "az" ? lesson.titleAz : lesson.titleRu}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#94a3b8]">
                {locale === "az" ? lesson.bodyAz : lesson.bodyRu}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
          {t.academyChecklist}
        </h3>
        <div className="space-y-2">
          {ACADEMY_CHECKLIST.map((item, i) => {
            const checked = done.has(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggle(i)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition",
                  checked
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-white/10 bg-[#0a0c12] text-[#cbd5e1] hover:border-white/20",
                ].join(" ")}
              >
                <CheckSquare
                  size={16}
                  className={checked ? "text-emerald-400" : "text-[#475569]"}
                />
                {locale === "az" ? item.az : item.ru}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* end panel pages */
