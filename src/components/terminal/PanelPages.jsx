"use client";

/**
 * =============================================================================
 * PanelPages - watchlist / compare / portfolio / map / documents / alerts / academy
 * =============================================================================
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  FileText,
  BellRing,
  CheckSquare,
  Star,
  GitCompare,
} from "lucide-react";
import {
  lotCity,
  lotDistrict,
  lotTitle,
  lotType,
} from "@/lib/lots/helpers";
import { formatAuctionWhen } from "@/lib/lots/photos";
import { useLots } from "@/hooks/useLots";
import {
  ACADEMY_CHECKLIST,
  ACADEMY_LESSONS,
  DEAL_STAGES,
  DEMO_DOCUMENTS,
} from "@/data/demoPanel";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { fetchLotAnalysis } from "@/lib/api/client";
import { computeInvestment, marketInputFromComps } from "@/lib/analysis/invest";
import { buildEmlakIntelligence } from "@/lib/intelligence/build";
import { money } from "./lotStory/money";
import { useSavedScenarios } from "@/hooks/useSavedScenarios";
import LotDetailModal from "./LotDetailModal";
import LotsMap from "./LotsMap";

function usePanelLots() {
  const { lots, loading } = useLots({ enabled: true });
  const getLotById = (id) => lots.find((l) => l.id === id) || null;
  return { lots, loading, getLotById };
}

function fmtMoney(n) {
  return money(n);
}

/* ---------- shared ---------- */

function EmptyState({ title, hint, href, cta, mark }) {
  return (
    <div className="eh-fade-in max-w-md py-8">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-[#d6d3d1]">
        {mark || <Star size={18} strokeWidth={1.5} />}
      </div>
      <p className="text-[22px] font-semibold tracking-tight text-white">{title}</p>
      {hint ? (
        <p className="mt-2 text-[14px] leading-relaxed text-[#a8a29e]">{hint}</p>
      ) : null}
      {href && cta ? (
        <Link
          href={href}
          className="eh-press mt-6 inline-flex items-center justify-center rounded-lg bg-[#2563eb] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#1d4ed8]"
        >
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function LotMiniCard({ lot, locale, t, onOpen, actions, limitLabel }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
      <button type="button" data-lot-open={lot.id} onClick={() => onOpen(lot.id)} className="block w-full text-left">
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
          <div className="mt-3 flex justify-between gap-3 font-mono text-[13px] tabular-nums">
            <span className="text-white">
              {t.startPrice} {fmtMoney(lot.startPrice)}
            </span>
            {limitLabel ? (
              <span className="text-right text-[#a8a29e]">{limitLabel}</span>
            ) : null}
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
  const { getLotById } = usePanelLots();
  const scenarios = useSavedScenarios();
  const [activeLotId, setActiveLotId] = useState(null);
  const lots = watchlist.map(getLotById).filter(Boolean);
  const activeLot = getLotById(activeLotId);

  return (
    <div className="mx-auto max-w-[1280px]">
      {lots.length === 0 ? (
        <EmptyState
          title={say(locale, "Сохраняйте интересные лоты", "Maraqlı lotları saxlayın", "Save lots you care about")}
          hint={say(
            locale,
            "Они появятся здесь, чтобы вы могли вернуться, сравнить рынок и принять решение.",
            "Onlar burada görünəcək ki, bazara qayıdıb müqayisə edə və qərar verəsiniz.",
            "They will show up here so you can come back, compare the market and decide."
          )}
          href="/dashboard"
          cta={say(locale, "Открыть терминал", "Terminalı aç", "Open the terminal")}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {lots.map((lot) => (
            <LotMiniCard
              key={lot.id}
              lot={lot}
              locale={locale}
              t={t}
              limitLabel={
                scenarios[lot.id]?.maxBid == null
                  ? null
                  : `${locale === "az" ? "Limit" : locale === "en" ? "Your limit" : "Ваш лимит"} ${money(scenarios[lot.id].maxBid)}`
              }
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

function say(locale, ru, az, en = ru) {
  if (locale === "az") return az;
  if (locale === "en") return en;
  return ru;
}

function field(locale, row, azKey, ruKey, enKey) {
  if (!row) return "";
  if (locale === "az") return row[azKey] || row[ruKey] || "";
  if (locale === "en") return row[enKey] || row[ruKey] || "";
  return row[ruKey] || row[azKey] || "";
}

function knownStart(lot) {
  const value = Number(lot?.startPrice);
  return Number.isFinite(value) ? value : null;
}

function useCompareIntel(lots, locale) {
  const ids = lots.map((lot) => lot.id).join("|");
  const lotsRef = useRef(lots);
  const [pack, setPack] = useState({ ids: "", slots: {} });

  useEffect(() => {
    lotsRef.current = lots;
  }, [lots]);

  useEffect(() => {
    const current = lotsRef.current;
    if (!ids) return undefined;
    let cancelled = false;

    const scenarioPromise = fetch("/api/me/scenarios", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { scenarios: [] }))
      .catch(() => ({ scenarios: [] }));

    Promise.all([
      scenarioPromise,
      ...current.map(async (lot) => {
        const start = knownStart(lot);
        try {
          const data = await fetchLotAnalysis(lot.id, locale);
          const comps = data?.report?.comps || null;
          const investment = computeInvestment({
            ...marketInputFromComps(comps),
            startPrice: start,
            bid: start == null ? "" : String(start),
            herracFee: lot.fee ?? lot.payload?.fee ?? null,
            deposit: Number.isFinite(Number(lot.deposit)) ? Number(lot.deposit) : null,
          });
          const intel = buildEmlakIntelligence({
            lot,
            comps,
            investment,
            marketLoading: false,
          });
          return [lot.id, { loading: false, intel, investment }];
        } catch {
          const intel = buildEmlakIntelligence({
            lot,
            comps: null,
            investment: null,
            marketLoading: false,
            marketError: true,
          });
          return [lot.id, { loading: false, intel, investment: null, error: true }];
        }
      }),
    ]).then(([scenarioData, ...entries]) => {
      if (cancelled) return;
      const saved = {};
      for (const row of scenarioData.scenarios || []) saved[row.lotId] = row;
      const slots = Object.fromEntries(
        entries.map(([id, slot]) => [id, { ...slot, saved: saved[id] || null }])
      );
      setPack({ ids, slots });
    });

    return () => {
      cancelled = true;
    };
  }, [ids, locale]);

  return pack.ids === ids ? pack.slots : {};
}

function compareCells(lot, slot, locale) {
  const waiting = say(locale, "Смотрим рынок", "Bazara baxırıq", "Checking the market");
  const marketNo = say(locale, "Рынок не подтверждён", "Bazar təsdiqlənməyib", "Market is not confirmed");
  const thin = say(locale, "Недостаточно данных", "Kifayət qədər məlumat yoxdur", "Not enough data");
  const limitNo = say(locale, "Лимит ещё не рассчитан", "Limit hələ hesablanmayıb", "Limit is not calculated yet");
  const down = say(locale, "Рынок временно недоступен", "Bazar müvəqqəti əlçatan deyil", "Market is temporarily unavailable");
  if (!slot || slot.loading) {
    return {
      status: waiting,
      market: waiting,
      marketSub: "",
      gap: waiting,
      limit: waiting,
      risk: waiting,
      complete: waiting,
    };
  }
  const intel = slot.intel;
  const market = intel?.marketConfidence;
  const start = knownStart(lot);
  const range = market?.usable ? market.range : null;
  const reason = field(locale, market, "reasonAz", "reasonRu", "reasonEn");

  let marketMain = marketNo;
  let marketSub = reason || "";
  if (market?.level === "unavailable" || slot.error) {
    marketMain = down;
  } else if (range?.median != null) {
    marketMain = money(range.median);
    marketSub =
      range.low != null && range.high != null
        ? `${money(range.low)} – ${money(range.high)}`
        : reason || "";
  } else if ((intel?.dataCompleteness?.score ?? 0) < 55 && market?.level === "insufficient") {
    marketMain = thin;
  }

  let gap = market?.usable ? marketNo : marketMain;
  if (range?.median != null && start != null) {
    gap = money(start - range.median);
  }

  const savedBid = slot.saved?.maxBid;
  const currentMedian = slot.investment?.market?.median?.amount;
  const stale =
    slot.saved?.marketReference != null &&
    currentMedian != null &&
    Math.abs(Number(slot.saved.marketReference) - Number(currentMedian)) > 1;
  const staleNote =
    locale === "az"
      ? "Bazar son hesablamanızdan sonra yenilənib"
      : locale === "en"
        ? "The market moved after your last calculation"
        : "Рынок обновился после вашего последнего расчёта";
  const limit =
    savedBid == null
      ? limitNo
      : stale
        ? `${money(savedBid)} · ${staleNote}`
        : money(savedBid);

  const confirmed = intel?.riskState?.confirmed?.length || 0;
  const risk = confirmed
    ? say(locale, `${confirmed} в тексте Hərrac`, `${confirmed} Hərrac mətnində`, `${confirmed} in the Hərrac text`)
    : intel?.why?.risks
      ? field(locale, intel.why.risks, "az", "ru", "en")
      : thin;

  const score = intel?.dataCompleteness?.score;
  const complete =
    score == null ? thin : score < 55 ? `${score} · ${thin}` : String(score);

  return {
    status: field(locale, intel?.dealStatusLabel, "az", "ru", "en"),
    market: marketMain,
    marketSub,
    gap,
    limit,
    risk,
    complete,
  };
}

export function ComparePage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { compare, clearCompare, toggleCompare } = useTerminalPanel();
  const { getLotById } = usePanelLots();
  const lots = compare.map(getLotById).filter(Boolean);
  const slots = useCompareIntel(lots.length >= 2 ? lots : [], locale);
  const cells = lots.map((lot) => compareCells(lot, slots[lot.id], locale));

  const rows = [
    { key: "market", label: say(locale, "Рынок", "Bazar", "Market"), get: (cell) => cell.market, sub: (cell) => cell.marketSub },
    { key: "gap", label: say(locale, "Старт − ориентир", "Start − orientir", "Start − guide"), get: (cell) => cell.gap },
    { key: "limit", label: say(locale, "Ваш лимит", "Sizin limit", "Your limit"), get: (cell) => cell.limit },
    { key: "risk", label: say(locale, "Риск", "Risk", "Risk"), get: (cell) => cell.risk },
    { key: "complete", label: say(locale, "Полнота данных", "Məlumat tamlığı", "Data completeness"), get: (cell) => cell.complete },
  ];

  return (
    <div className="mx-auto max-w-[1100px]">
      {lots.length >= 2 ? (
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={clearCompare} className="eh-panel-btn">
            {t.compareClear}
          </button>
        </div>
      ) : null}

      {lots.length < 2 ? (
        <EmptyState
          title={t.compareEmpty}
          hint={t.compareEmptyHint}
          href="/dashboard"
          cta={t.compareEmptyCta}
          mark={<GitCompare size={18} strokeWidth={1.5} />}
        />
      ) : (
        <div className={`grid gap-8 ${lots.length > 2 ? "lg:grid-cols-3" : "sm:grid-cols-2"}`}>
          {lots.map((lot, index) => {
            const cell = cells[index];
            const when = lot.startAt || lot.validUntil;
            return (
              <article key={lot.id} className="min-w-0 border-t border-white/[0.08] pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {lot.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={lot.photo} alt="" className="mb-3 h-28 w-full rounded-md object-cover" />
                    ) : null}
                    <h2 className="text-[16px] font-medium leading-snug text-white">
                      {lotTitle(lot, locale)}
                    </h2>
                    <p className="mt-1 text-[12px] text-[#a8a29e]">
                      {lotType(lot, locale)} · {lotCity(lot, locale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleCompare(lot.id)}
                    className="shrink-0 text-[12px] text-[#78716c] hover:text-white"
                  >
                    {say(locale, "Убрать", "Çıxar", "Remove")}
                  </button>
                </div>
                <p className="mt-4 text-[13px] text-[#e7e5e4]">{cell.status}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
                  {say(locale, "Старт", "Start", "Start")}
                </p>
                <p className="eh-num mt-1 font-mono text-[28px] text-white">{fmtMoney(lot.startPrice)}</p>
                <p className="mt-1 text-[12px] text-[#a8a29e]">
                  {when ? formatAuctionWhen(when, locale) : say(locale, "Дата Hərrac не указана", "Hərrac tarixi yoxdur", "Hərrac date is not stated")}
                </p>
                <dl className="mt-5 space-y-3">
                  {rows.map((row) => {
                    const value = row.get(cell);
                    const peer = cells.map((item) => row.get(item));
                    const standsOut = new Set(peer).size > 1;
                    return (
                      <div key={row.key} className="border-t border-white/[0.06] pt-3">
                        <dt className="text-[11px] uppercase tracking-[0.14em] text-[#78716c]">{row.label}</dt>
                        <dd className={["eh-num mt-1 text-[14px] leading-snug", standsOut ? "text-white" : "text-[#a8a29e]"].join(" ")}>
                          {value}
                        </dd>
                        {row.sub && row.sub(cell) ? (
                          <p className="mt-1 text-[12px] leading-relaxed text-[#78716c]">{row.sub(cell)}</p>
                        ) : null}
                      </div>
                    );
                  })}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Portfolio ---------- */

export function PortfolioPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { deals, setDealStage, removeDeal } = useTerminalPanel();
  const scenarios = useSavedScenarios();
  const { getLotById } = usePanelLots();
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
  const knownBids = deals
    .map((deal) => Number(deal.bid))
    .filter((value) => Number.isFinite(value));
  const totalBid = knownBids.reduce((sum, value) => sum + value, 0);

  return (
    <div className="mx-auto max-w-[1400px]">
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
          value={knownBids.length ? money(totalBid) : "—"}
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
              {field(locale, stage, "az", "ru", "en")}
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
            className="flex w-[min(260px,82vw)] shrink-0 flex-col border-t border-white/[0.08] pt-3 lg:w-auto"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              const id = event.dataTransfer.getData("text/plain");
              if (id) setDealStage(id, stage.id);
            }}
          >
            <div
              className="px-1 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: stage.accent }}
                  />
                  <span className="text-[13px] font-semibold text-white">
                    {field(locale, stage, "az", "ru", "en")}
                  </span>
                </div>
                <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-[#94a3b8]">
                  {byStage[stage.id].length}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-snug text-[#64748b]">
                {field(locale, stage, "hintAz", "hintRu", "hintEn")}
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 p-2.5">
              {byStage[stage.id].length === 0 ? (
                <p className="px-1 py-3 text-[12px] text-[#57534e]">
                  {t.portfolioEmptyCol}
                  {stage.id === "explore" ? (
                    <>
                      {" "}
                      <Link href="/dashboard" className="text-[#93c5fd] hover:text-white">
                        {t.portfolioEmptyCta}
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : (
                byStage[stage.id].map((deal) => {
                  const lot = getLotById(deal.lotId);
                  if (!lot) {
                    return (
                      <div key={deal.id} className="border-b border-white/[0.06] px-1 py-3">
                        <p className="text-[12px] text-[#a8a29e]">{deal.lotId}</p>
                        <button
                          type="button"
                          onClick={() => removeDeal(deal.id)}
                          className="mt-2 text-[12px] text-[#f0b4b4] hover:text-white"
                        >
                          {t.portfolioRemove}
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={deal.id}
                      className="eh-fade-in overflow-hidden border-b border-white/[0.06] pb-3"
                    >
                      <div
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", deal.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                      <button
                        type="button"
                        data-lot-open={lot.id}
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
                              <div className="eh-num font-mono text-[13px] text-white">
                                {money(deal.bid)}
                              </div>
                              <div className="mt-1 text-[11px] text-[#a8a29e]">
                                {scenarios[deal.lotId]?.maxBid == null
                                  ? locale === "az"
                                    ? "Limit hələ yoxdur"
                                    : locale === "en"
                                      ? "No saved limit"
                                      : "Лимит ещё не сохранён"
                                  : `${locale === "az" ? "Limit" : locale === "en" ? "Your limit" : "Ваш лимит"} ${money(scenarios[deal.lotId].maxBid)}`}
                              </div>
                            </div>
                            <div className="eh-num text-right font-mono text-[12px] text-[#a8a29e]">
                              {fmtMoney(lot.startPrice)}
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] leading-snug text-[#64748b]">
                            {field(locale, deal, "noteAz", "noteRu", "noteEn")}
                          </p>
                        </div>
                      </button>
                      </div>
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
                                {field(locale, s, "az", "ru", "en")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={() => removeDeal(deal.id)}
                          className="mt-2 text-[12px] text-[#a8a29e] hover:text-[#f0b4b4]"
                        >
                          {t.portfolioRemove}
                        </button>
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
  const { lots: allLots, getLotById } = usePanelLots();
  const [activeLotId, setActiveLotId] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [panKey, setPanKey] = useState(0);
  const activeLot = getLotById(activeLotId);
  const focusLot = getLotById(focusId) || activeLot;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9.5rem)] max-w-[1400px] flex-col sm:min-h-[calc(100dvh-11rem)]">
      <div className="shrink-0">
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1fr_300px]">
        <LotsMap
          locale={locale}
          lots={allLots}
          selectedId={focusId}
          panKey={panKey}
          onSelect={(id) => {
            setFocusId(id);
            setActiveLotId(id);
          }}
          onHover={setHoverId}
          className="h-[min(58vh,520px)] min-h-[260px] w-full overflow-hidden rounded-lg border border-white/[0.08] sm:h-[min(62vh,560px)] lg:h-auto lg:min-h-[440px]"
        />

        <div className="flex max-h-[420px] flex-col lg:max-h-none">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
              {focusLot ? t.openLot : t.mapPickLot}
            </div>
            <div className="mt-2 flex gap-3 text-[11px] text-[#64748b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                {t.mapLegendAuto}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t.mapLegendEstate}
              </span>
              <span className="ml-auto font-mono tabular-nums text-[#475569]">
                {allLots.length}
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
              <p className="mt-1 text-[12px] text-[#a8a29e]">
                {lotCity(focusLot, locale)}
              </p>
              <p className="mt-1 text-[12px] text-[#f5d0a9]">
                {say(locale, "Приблизительное расположение", "Təxmini yerləşmə", "Approximate location")}
              </p>
              <div className="mt-3 flex justify-between text-[13px]">
                <span className="text-[#94a3b8]">
                  {t.startPrice} {fmtMoney(focusLot.startPrice)}
                </span>
              </div>
              <button
                type="button"
                data-lot-open={focusLot.id}
                onClick={() => setActiveLotId(focusLot.id)}
                className="eh-press mt-4 w-full rounded-lg bg-[#2563eb] py-2 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
              >
                {t.openLot}
              </button>
            </div>
          ) : null}

          <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
            {allLots.map((lot) => {
              const on = focusId === lot.id;
              const hot = hoverId === lot.id;
              return (
                <li key={lot.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setFocusId(lot.id);
                      setPanKey((n) => n + 1);
                    }}
                    className={[
                      "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[12px] transition",
                      on
                        ? "bg-white/[0.08] text-white"
                        : hot
                          ? "bg-white/[0.04] text-white"
                          : "text-[#a8a29e] hover:bg-white/[0.04] hover:text-white",
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
  const { lots, loading, getLotById } = usePanelLots();
  const [activeLotId, setActiveLotId] = useState(null);
  const activeLot = getLotById(activeLotId);
  const docs = DEMO_DOCUMENTS;

  const statusLabel = {
    ready: t.docsReady,
    pending: t.docsPending,
    review: t.docsReview,
  };

  return (
    <div className="mx-auto max-w-[760px]">
      {loading && !lots.length ? (
        <div className="space-y-4" aria-hidden>
          <div className="eh-skel h-4 w-40 rounded" />
          <div className="eh-skel h-3 w-full rounded" />
          <div className="eh-skel h-3 w-4/5 rounded" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          title={say(locale, "Документов по лотам пока нет", "Lotlar üzrə sənəd hələ yoxdur", "No lot documents yet")}
          hint={say(
            locale,
            "Здесь появятся кадастр, выписки и заметки проверки, когда они будут привязаны к лоту. Сейчас список пуст — мы не показываем чужие файлы.",
            "Kadastr, çıxarış və yoxlama qeydləri lota bağlananda burada görünəcək. Siyahı boşdur — başqasının faylını göstərmirik.",
            "Cadastre, extracts and inspection notes will appear here when they are tied to a lot. The list is empty — we do not show someone else’s files."
          )}
          href="/dashboard"
          cta={say(locale, "Открыть терминал", "Terminalı aç", "Open the terminal")}
          mark={<FileText size={18} strokeWidth={1.5} />}
        />
      ) : (
        <ul>
          {docs.map((doc) => {
            const lot = getLotById(doc.lotId);
            return (
              <li key={doc.id} className="flex flex-wrap items-baseline justify-between gap-3 border-b border-white/[0.08] py-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium text-white">
                    {field(locale, doc, "titleAz", "titleRu", "titleEn")}
                  </div>
                  <div className="mt-1 text-[13px] text-[#a8a29e]">
                    {lot ? lotTitle(lot, locale) : doc.lotId}
                    {doc.pages ? ` · ${doc.pages}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-[#d6d3d1]">{statusLabel[doc.status] || doc.status}</span>
                  {lot ? (
                    <button
                      type="button"
                      data-lot-open={lot.id}
                      onClick={() => setActiveLotId(lot.id)}
                      className="text-[12px] text-[#93c5fd] hover:text-white"
                    >
                      {t.openLot}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
  const { alerts, toggleAlert, hydrated } = useTerminalPanel();
  const on = alerts.filter((item) => item.enabled).length;

  return (
    <div className="mx-auto max-w-[720px]">
      {!hydrated ? (
        <div className="space-y-4" aria-hidden>
          <div className="eh-skel h-4 w-32 rounded" />
          <div className="eh-skel h-3 w-full rounded" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title={say(locale, "Алертов пока нет", "Xəbərdarlıq hələ yoxdur", "No alerts yet")}
          hint={say(
            locale,
            "Когда появится правило — новый лот, смена цены или дата Hərrac — оно будет одной строкой здесь. Сейчас следить не за чем.",
            "Qayda olanda — yeni lot, qiymət və ya Hərrac tarixi — burada bir sətir olacaq. İndi izləyəcək bir şey yoxdur.",
            "When a rule appears — a new lot, a price change or a Hərrac date — it will be one line here. There is nothing to watch yet."
          )}
          href="/dashboard"
          cta={say(locale, "Смотреть лоты", "Lotlara bax", "Browse lots")}
          mark={<BellRing size={18} strokeWidth={1.5} />}
        />
      ) : (
        <>
          <p className="mb-2 text-[13px] text-[#a8a29e]">
            {say(locale, `Включено ${on} из ${alerts.length}`, `${alerts.length} qaydadan ${on} aktiv`, `${on} of ${alerts.length} on`)}
          </p>
          <ul>
            {alerts.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-4 border-b border-white/[0.08] py-4">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium text-white">
                    {field(locale, item, "titleAz", "titleRu", "titleEn")}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#a8a29e]">
                    {field(locale, item, "detailAz", "detailRu", "detailEn")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAlert(item.id)}
                  aria-pressed={item.enabled}
                  className={[
                    "eh-press shrink-0 rounded-full px-3 py-1.5 text-[12px] transition",
                    item.enabled ? "bg-white text-[#0b0d12]" : "text-[#a8a29e] hover:text-white",
                  ].join(" ")}
                >
                  {item.enabled ? t.alertsOn : t.alertsOff}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
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
    <div className="mx-auto max-w-[720px]">
      <p className="text-[13px] text-[#a8a29e]">
        {say(
          locale,
          `${done.size} из ${ACADEMY_CHECKLIST.length} проверок отмечено`,
          `${ACADEMY_CHECKLIST.length} yoxlamadan ${done.size} qeyd olunub`,
          `${done.size} of ${ACADEMY_CHECKLIST.length} checks marked`
        )}
      </p>

      <section className="mt-8">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-[#78716c]">{t.academyLessons}</h2>
        <ol className="mt-2">
          {ACADEMY_LESSONS.map((lesson) => (
            <li key={lesson.id} className="border-b border-white/[0.08] py-5">
              <div className="text-[12px] text-[#78716c]">
                {lesson.level} · {lesson.duration}
              </div>
              <h3 className="mt-1 text-[18px] font-medium tracking-tight text-white">
                {field(locale, lesson, "titleAz", "titleRu", "titleEn")}
              </h3>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#a8a29e]">
                {field(locale, lesson, "bodyAz", "bodyRu", "bodyEn")}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-[13px] uppercase tracking-[0.14em] text-[#78716c]">{t.academyChecklist}</h2>
        <ul className="mt-2">
          {ACADEMY_CHECKLIST.map((item, i) => {
            const checked = done.has(i);
            return (
              <li key={item.ru} className="border-b border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={checked}
                  className="flex w-full items-start gap-3 py-3.5 text-left"
                >
                  <CheckSquare
                    size={16}
                    className={checked ? "mt-0.5 shrink-0 text-white" : "mt-0.5 shrink-0 text-[#57534e]"}
                  />
                  <span className={checked ? "text-[14px] text-white" : "text-[14px] text-[#d6d3d1]"}>
                    {field(locale, item, "az", "ru", "en")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

/* end panel pages */
