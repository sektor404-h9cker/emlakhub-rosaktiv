"use client";

/**
 * =============================================================================
 * LotDetailModal — карточка лота поверх дашборда (как на макете)
 * =============================================================================
 * Фото · AI · юнит-экономика со слайдером · цены · чек-лист
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Search,
  BarChart3,
  Scale,
  Gavel,
  Flag,
  GitCompare,
  Briefcase,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { lotAiSummary, lotTitle } from "@/data/demoLots";
import { HERRAC_URL } from "@/lib/constants";
import VisionOverlay from "./VisionOverlay";
import TermHint from "./TermHint";
import HerracNextSteps from "./HerracNextSteps";

const STAGES = [
  { id: "explore", icon: Search, labelKey: "stageExplore" },
  { id: "analysis", icon: BarChart3, labelKey: "stageAnalysis" },
  { id: "decision", icon: Scale, labelKey: "stageDecision" },
  { id: "auction", icon: Gavel, labelKey: "stageAuction" },
  { id: "result", icon: Flag, labelKey: "stageResult" },
];

export default function LotDetailModal({ lot, open, onClose }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const {
    isWatched,
    toggleWatch,
    isCompared,
    toggleCompare,
    addDealFromLot,
  } = useTerminalPanel();
  const [stage, setStage] = useState("explore");
  const [showCalc, setShowCalc] = useState(true);
  const [mounted, setMounted] = useState(false);

  const market = lot?.marketPrice || 0;
  const start = lot?.startPrice || Math.round(market * 0.85);
  const [bid, setBid] = useState(start);
  const [repairAdj, setRepairAdj] = useState(lot?.repairCost || 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lot) {
      setBid(lot.startPrice || Math.round((lot.marketPrice || 0) * 0.85));
      setRepairAdj(lot.repairCost || 0);
      setStage("explore");
      setShowCalc(true);
    }
  }, [lot?.id]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const deposit = Math.round(bid * 0.1);
  const feeLive = Math.round(bid * 0.03);
  const profit = market - bid - repairAdj - feeLive;

  const applyScenario = (kind) => {
    if (kind === "safe") setBid(Math.round(start * 0.92));
    else if (kind === "agg") setBid(Math.min(market, Math.round(start * 1.08)));
    else setBid(start);
  };

  if (!lot || !mounted) return null;

  const watched = isWatched(lot.id);
  const compared = isCompared(lot.id);

  // Portal в body: иначе fixed «уезжает» внутри overflow/transform shell
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close backdrop"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 grid max-h-[92dvh] w-full max-w-[1100px] overflow-hidden rounded-3xl border border-white/10 bg-[#0a0c12] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.85)] lg:grid-cols-[380px_1fr] lg:grid-rows-1"
          >
            {/* LEFT */}
            <div className="flex min-h-0 max-h-[42dvh] flex-col border-b border-white/10 lg:max-h-[92dvh] lg:border-b-0 lg:border-r lg:border-white/10">
              <div className="relative aspect-[16/11] shrink-0 overflow-hidden bg-[#111]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lot.photo}
                  alt={lotTitle(lot, locale)}
                  className="h-full w-full object-cover"
                />
                <VisionOverlay defects={lot.defects || []} />
                <div className="absolute bottom-2 left-2 z-20 inline-flex items-center rounded-lg bg-black/70 px-2 py-1 text-[10px] font-medium text-[#e8d5b0] backdrop-blur-sm">
                  {t.visionLabel}
                  <TermHint text={t.tipVision} />
                </div>
              </div>

              <div className="eh-modal-scroll relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
                <div className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0d1524] p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      size={18}
                      className={lot.redFlags ? "text-amber-400" : "text-emerald-400"}
                    />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                        {t.aiAnalysis}
                      </div>
                      <p className="mt-1 text-[12px] leading-relaxed text-[#94a3b8]">
                        {lot.redFlags
                          ? lotAiSummary(lot, locale)
                          : t.noRedFlags}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-end justify-between border-t border-white/5 pt-3">
                    <span className="inline-flex items-center text-[11px] text-[#64748b]">
                      {t.opportunityScore}
                      <TermHint text={t.tipScore} />
                    </span>
                    <span className="font-mono text-[22px] tabular-nums text-white">
                      {lot.opportunityScore ?? lot.score}
                      <span className="text-[13px] text-[#64748b]">/100</span>
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#64748b]">
                    {t.scoreExplain}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
                        {t.estProfit}
                        <TermHint text={t.tipProfit} />
                      </div>
                      <div
                        className={[
                          "mt-1 font-mono text-[28px] font-semibold tabular-nums",
                          profit >= 0 ? "text-emerald-400" : "text-rose-400",
                        ].join(" ")}
                      >
                        {profit >= 0 ? "+" : "−"}₼{" "}
                        {Math.abs(profit).toLocaleString("en-US")}
                      </div>
                      <p className="mt-1.5 max-w-[220px] text-[11px] leading-relaxed text-[#64748b]">
                        {t.profitExplain}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCalc((v) => !v)}
                      className="rounded-lg border border-[#3b82f6]/50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#60a5fa] transition hover:bg-[#2563eb]/15"
                    >
                      {t.calcDetail}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-[12px]">
                    <Row label={t.marketValue} value={`~₼ ${market.toLocaleString("en-US")}`} />
                    <Row
                      label={t.auctionPrice}
                      value={`−₼ ${bid.toLocaleString("en-US")}`}
                    />
                    <Row
                      label={t.auctionFee}
                      value={`−₼ ${feeLive.toLocaleString("en-US")}`}
                    />
                    <Row
                      label={t.repairLabel}
                      value={`−₼ ${repairAdj.toLocaleString("en-US")}`}
                    />
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-[#94a3b8]">{t.predictedProfit}</span>
                      <span
                        className={[
                          "font-mono font-semibold tabular-nums",
                          profit >= 0 ? "text-emerald-400" : "text-rose-400",
                        ].join(" ")}
                      >
                        ₼ {profit.toLocaleString("en-US")}
                      </span>
                    </div>
                  </div>

                  {showCalc ? (
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                        {t.offerCalc}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: "safe", label: t.scenarioSafe },
                          { id: "base", label: t.scenarioBase },
                          { id: "agg", label: t.scenarioAgg },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => applyScenario(s.id)}
                            className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-medium text-[#94a3b8] hover:border-[#2563eb]/50 hover:text-white"
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                      <div>
                        <div className="mb-1.5 flex justify-between text-[11px] text-[#64748b]">
                          <span>{t.bidLabel}</span>
                          <span className="font-mono text-white">
                            ₼ {bid.toLocaleString("en-US")}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={Math.round(start * 0.7)}
                          max={market}
                          step={100}
                          value={bid}
                          onChange={(e) => setBid(Number(e.target.value))}
                          className="eh-term-range w-full"
                        />
                      </div>
                      <div>
                        <div className="mb-1.5 flex justify-between text-[11px] text-[#64748b]">
                          <span>{t.repairLabel}</span>
                          <span className="font-mono text-white">
                            ₼ {repairAdj.toLocaleString("en-US")}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max((lot.repairCost || 0) * 2, 5000)}
                          step={100}
                          value={repairAdj}
                          onChange={(e) => setRepairAdj(Number(e.target.value))}
                          className="eh-term-range w-full"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex min-h-0 max-h-[50dvh] flex-col lg:max-h-[92dvh]">
              <div className="shrink-0 border-b border-white/[0.06] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex rounded-full bg-[#1d4ed8]/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    {t.registryNo} {lot.registryNo || lot.id}
                  </span>
                  <h2 className="mt-3 max-w-xl text-[22px] font-semibold leading-snug tracking-tight text-white sm:text-[26px]">
                    {lotTitle(lot, locale)}
                  </h2>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleWatch(lot.id)}
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10",
                      watched ? "text-amber-400" : "text-[#94a3b8] hover:text-white",
                    ].join(" ")}
                    title={t.navWatchlist}
                  >
                    <Bookmark size={16} className={watched ? "fill-current" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompare(lot.id)}
                    className={[
                      "flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px]",
                      compared
                        ? "border-[#2563eb]/50 bg-[#2563eb]/15 text-[#93c5fd]"
                        : "border-white/10 text-[#94a3b8] hover:text-white",
                    ].join(" ")}
                  >
                    <GitCompare size={14} />
                    {compared ? t.inCompare : t.addToCompare}
                  </button>
                  <button
                    type="button"
                    onClick={() => addDealFromLot(lot.id, bid)}
                    className="flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-2.5 text-[11px] text-[#94a3b8] hover:text-white"
                  >
                    <Briefcase size={14} />
                    {t.addToPortfolio}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#94a3b8] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STAGES.map((s) => {
                  const Icon = s.icon;
                  const active = stage === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id)}
                      className={[
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] transition",
                        active
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 text-[#64748b] hover:text-white",
                      ].join(" ")}
                    >
                      <Icon size={12} />
                      {t[s.labelKey]}
                    </button>
                  );
                })}
              </div>
              </div>

              <div className="eh-modal-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <PriceCard
                  label={t.startPrice}
                  value={start}
                  accent="orange"
                />
                <PriceCard
                  label={
                    <span className="inline-flex items-center">
                      {t.deposit}
                      <TermHint text={t.tipDeposit} />
                    </span>
                  }
                  value={deposit}
                  accent="blue"
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#4c1d95]/40 bg-[#12081f] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-lg">
                    <div className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#c4b5fd]">
                      <span className="rounded bg-[#7c3aed] px-1.5 py-0.5 text-[9px] font-bold text-white">
                        AI
                      </span>
                      {t.marketAi}
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#94a3b8]">
                      {lotAiSummary(lot, locale)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-[#a78bfa]/40 px-3 py-1.5 text-[11px] font-medium text-[#c4b5fd] hover:bg-[#7c3aed]/15"
                  >
                    {t.fullAi}
                  </button>
                </div>
              </div>

              {/* NLP риски */}
              {lot.legalRisks?.length ? (
                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                    {t.risksTitle}
                  </div>
                  {lot.legalRisks.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-[12px] text-[#94a3b8]"
                    >
                      <span
                        className={[
                          "mr-2 inline-block h-1.5 w-1.5 rounded-full",
                          r.level === "high"
                            ? "bg-rose-400"
                            : r.level === "med"
                              ? "bg-amber-400"
                              : "bg-emerald-400",
                        ].join(" ")}
                      />
                      {locale === "az" ? r.textAz : r.textRu}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-4">
                <HerracNextSteps showCta={false} />
              </div>
              </div>

              <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0c12]/95 px-5 py-4 backdrop-blur-sm sm:px-6">
                <p className="mb-3 text-center text-[11px] leading-relaxed text-[#64748b]">
                  {t.herracDisclaimer}
                </p>
                <a
                  href={HERRAC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(37,99,235,0.9)] transition hover:bg-[#1d4ed8]"
                >
                  {t.openOnHerrac}
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[#94a3b8]">
      <span>{label}</span>
      <span className="font-mono tabular-nums text-[#cbd5e1]">{value}</span>
    </div>
  );
}

function PriceCard({ label, value, accent }) {
  const bar =
    accent === "orange" ? "bg-orange-400" : "bg-[#3b82f6]";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] p-4 pl-5">
      <span className={`absolute bottom-3 left-0 top-3 w-[3px] rounded-full ${bar}`} />
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {label}
      </div>
      <div className="mt-2 font-mono text-[24px] font-semibold tabular-nums text-white sm:text-[28px]">
        ₼ {value.toLocaleString("en-US")}
      </div>
    </div>
  );
}
