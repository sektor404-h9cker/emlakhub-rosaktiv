"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useIsClient } from "@/lib/react/useIsClient";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Briefcase, ExternalLink, GitCompare, X } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { lotTitle } from "@/lib/lots/helpers";
import { HERRAC_URL } from "@/lib/constants";
import { HERRAC_ORIGIN } from "@/lib/herrac/constants";
import { runLocalVision } from "@/lib/analysis/visionLocal";
import { computeInvestment, marketInputFromComps } from "@/lib/analysis/invest";
import { buildEmlakIntelligence } from "@/lib/intelligence/build";
import { fetchLotAnalysis } from "@/lib/api/client";
import LotStory from "./lotStory/LotStory";
import { emptyAnswers, foldCosts, foldUserSale } from "./lotStory/foldCosts";
import { useStoryMode } from "./lotStory/useStoryMode";
import { line, say } from "@/lib/i18n/copy";

const STEPS = [
  { id: "story-what", ru: "Объект", az: "Obyekt", en: "Object" },
  { id: "story-market", ru: "Рынок", az: "Bazar", en: "Market" },
  { id: "story-risks", ru: "Риски", az: "Risklər", en: "Risks" },
  { id: "story-costs", ru: "Расходы", az: "Xərclər", en: "Costs" },
  { id: "story-limit", ru: "Решение", az: "Qərar", en: "Decision" },
];

export default function LotDetailModal({ lot, open, onClose }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const az = locale === "az";
  const { isWatched, toggleWatch, isCompared, toggleCompare, addDealFromLot } = useTerminalPanel();
  const mounted = useIsClient();
  const dialogRef = useRef(null);
  const openerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const reducedHook = useReducedMotion();
  const [mode, setMode] = useStoryMode();
  const [answers, setAnswers] = useState(emptyAnswers);
  const [loadedScenarioFor, setLoadedScenarioFor] = useState("");
  const [savedMarket, setSavedMarket] = useState(null);
  const savedInputsRef = useRef("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seenLotId, setSeenLotId] = useState(lot?.id);

  if (lot?.id !== seenLotId) {
    setSeenLotId(lot?.id);
    setAnswers(emptyAnswers());
    setLoadedScenarioFor("");
    setSavedMarket(null);
    setReport(null);
    setError("");
    setLoading(Boolean(lot?.id));
  }

  const scenarioReady = Boolean(open && lot?.id && loadedScenarioFor === lot.id);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open || !lot?.id) return undefined;
    let cancelled = false;
    const id = lot.id;
    fetch(`/api/me/scenarios/${encodeURIComponent(id)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.scenario?.inputs && typeof data.scenario.inputs === "object") {
          const next = { ...emptyAnswers(), ...data.scenario.inputs };
          savedInputsRef.current = JSON.stringify(next);
          setAnswers(next);
          setSavedMarket(
            data.scenario.marketReference == null ? null : Number(data.scenario.marketReference)
          );
        } else {
          savedInputsRef.current = "";
          setSavedMarket(null);
        }
        setLoadedScenarioFor(id);
      })
      .catch(() => {
        if (!cancelled) setLoadedScenarioFor(id);
      });
    return () => {
      cancelled = true;
    };
  }, [open, lot?.id]);

  useEffect(() => {
    if (!open || !mounted) return undefined;
    const current = document.activeElement;
    if (
      current instanceof HTMLElement &&
      current !== document.body &&
      !dialogRef.current?.contains(current)
    ) {
      openerRef.current = current;
    }
    const root = dialogRef.current;
    const bodyOverflow = document.body.style.overflow;
    const pageScrollers = [...document.querySelectorAll(".eh-terminal .overflow-y-auto")];
    const scrollerOverflow = pageScrollers.map((el) => el.style.overflow);
    document.body.style.overflow = "hidden";
    pageScrollers.forEach((el) => {
      el.style.overflow = "hidden";
    });

    const focusable = () =>
      root
        ? [...root.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])")].filter(
            (el) => el.tabIndex !== -1 && el.getClientRects().length > 0
          )
        : [];

    const frame = window.requestAnimationFrame(() => {
      const nodes = focusable();
      (nodes[0] || root)?.focus?.();
    });

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const nodes = focusable();
      if (!nodes.length) {
        e.preventDefault();
        root.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = bodyOverflow;
      pageScrollers.forEach((el, index) => {
        el.style.overflow = scrollerOverflow[index];
      });
      const card = lot?.id
        ? document.querySelector(`[data-lot-open="${CSS.escape(String(lot.id))}"]`)
        : null;
      const opener = openerRef.current;
      const openerIsLot =
        opener instanceof HTMLElement &&
        document.contains(opener) &&
        opener.getAttribute("data-lot-open") === String(lot?.id);
      const target = openerIsLot
        ? opener
        : card || (opener instanceof HTMLElement && document.contains(opener) ? opener : null);
      if (target instanceof HTMLElement) target.focus();
    };
  }, [open, mounted, lot?.id]);

  useEffect(() => {
    if (!open || !lot?.id) return undefined;
    let cancelled = false;
    fetchLotAnalysis(lot.id, locale)
      .then((data) => {
        if (!cancelled) setReport(data.report || null);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, lot?.id, locale]);

  const startKnown =
    lot?.startPrice != null &&
    lot.startPrice !== "" &&
    Number.isFinite(Number(lot.startPrice));
  const start = startKnown ? Number(lot.startPrice) : null;
  const herracLotPrice = Number(lot?.marketPrice);
  const herracPriceKnown = Number.isFinite(herracLotPrice) && herracLotPrice > 0;
  const deposit =
    lot?.deposit != null && Number.isFinite(Number(lot.deposit)) ? Number(lot.deposit) : null;
  const fee = lot?.fee ?? lot?.payload?.fee ?? null;

  const folded = foldCosts(lot?.market, answers);
  const bidValue = answers.bidTouched ? answers.bidText : startKnown ? String(start) : "";
  const result = useMemo(
    () =>
      computeInvestment({
        ...marketInputFromComps(report?.comps),
        saleScenario: mode === "simple" ? "market" : answers.saleScenario,
        repair: folded.repair,
        other: folded.other,
        herracFee: fee,
        deposit,
        startPrice: start,
        bid: bidValue,
        desiredMode: folded.desiredMode,
        desired: folded.desired,
        sellEnabled: answers.sellOn,
        sellPct: answers.sellPct,
        sellTouched: answers.sellTouched,
        userSale: foldUserSale(answers),
        saleBasis: answers.saleBasis,
      }),
    [
      report,
      mode,
      folded.repair,
      folded.other,
      folded.desiredMode,
      folded.desired,
      answers,
      fee,
      deposit,
      start,
      bidValue,
    ]
  );

  const liveMarket = result?.market?.median?.amount;
  const marketMoved =
    savedMarket != null &&
    liveMarket != null &&
    Math.abs(Number(savedMarket) - Number(liveMarket)) > 1;

  useEffect(() => {
    if (!open || !lot?.id || !scenarioReady) return undefined;
    const serialized = JSON.stringify(answers);
    const touched = serialized !== JSON.stringify(emptyAnswers());
    if (!touched && savedMarket == null) return undefined;
    if (serialized === savedInputsRef.current) return undefined;
    const handle = setTimeout(() => {
      fetch(`/api/me/scenarios/${encodeURIComponent(lot.id)}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputs: answers,
          maxBid: result?.limitReady ? result?.maxBid?.amount ?? null : null,
          marketReference: liveMarket ?? null,
        }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          savedInputsRef.current = serialized;
          if (data?.scenario) {
            setSavedMarket(
              data.scenario.marketReference == null
                ? null
                : Number(data.scenario.marketReference)
            );
          }
        })
        .catch(() => {});
    }, 700);
    return () => clearTimeout(handle);
  }, [
    open,
    lot?.id,
    scenarioReady,
    answers,
    savedMarket,
    result?.limitReady,
    result?.maxBid?.amount,
    liveMarket,
  ]);

  const vision = useMemo(() => (lot ? runLocalVision(lot) : null), [lot]);
  const defects = (vision?.findings || []).filter(
    (item) =>
      item.id !== "no_text_signals" &&
      (item.evidence === "notes_params" || item.evidence === "params")
  );
  const intel = useMemo(
    () =>
      buildEmlakIntelligence({
        lot,
        comps: report?.comps || null,
        investment: result,
        marketLoading: loading && !report?.comps,
        marketError: Boolean(error) && !report?.comps,
        findings: vision?.findings,
      }),
    [lot, report, result, loading, error, vision]
  );

  if (!lot || !mounted) return null;

  const watched = isWatched(lot.id);
  const compared = isCompared(lot.id);
  const herracHref = herracLotHref(lot);
  const reduceMotion =
    reducedHook === true ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fade = reduceMotion ? { duration: 0 } : { duration: 0.28 };
  const panelTransition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] };
  const patch = (partial) => setAnswers((prev) => ({ ...prev, ...partial }));
  const retry = () => {
    setLoading(true);
    setError("");
    fetchLotAnalysis(lot.id, locale)
      .then((data) => setReport(data.report || null))
      .catch((e) => setError(e.message || "failed"))
      .finally(() => setLoading(false));
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden overscroll-none p-2 sm:p-6 lg:p-10"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={fade}
        >
          <div className="absolute inset-0 touch-none bg-black/75 backdrop-blur-sm" />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lot-dialog-title"
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            transition={panelTransition}
            className="relative z-10 mx-auto flex max-h-[96dvh] min-w-0 w-full max-w-[880px] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b0d12]"
          >
            <div className="shrink-0 border-b border-white/[0.06] bg-[#0b0d12] px-4 py-2 sm:px-6">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div id="lot-dialog-title" className="truncate text-[15px] font-semibold text-white">
                    {lotTitle(lot, locale)}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#64748b]">
                    {t.registryNo} {lot.registryNo || lot.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleWatch(lot.id)}
                  className={[
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10",
                    watched ? "text-amber-400" : "text-[#94a3b8]",
                  ].join(" ")}
                  title={t.navWatchlist}
                >
                  <Bookmark size={16} className={watched ? "fill-current" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompare(lot.id)}
                  className={[
                    "hidden h-9 items-center gap-1.5 rounded-xl border px-2.5 text-[11px] sm:flex",
                    compared
                      ? "border-white/30 text-white"
                      : "border-white/10 text-[#94a3b8]",
                  ].join(" ")}
                >
                  <GitCompare size={14} />
                  {compared ? t.inCompare : t.addToCompare}
                </button>
                <button
                  type="button"
                  onClick={() => addDealFromLot(lot.id, start)}
                  className="hidden h-9 items-center gap-1.5 rounded-xl border border-white/10 px-2.5 text-[11px] text-[#94a3b8] md:flex"
                >
                  <Briefcase size={14} />
                  {t.addToPortfolio}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 text-[#94a3b8]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mt-2 flex gap-4 text-[12px]">
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  className={mode === "simple" ? "text-white" : "text-[#57534e]"}
                >
                  {say(locale, "Sadə", "Просто", "Simple")}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("pro")}
                  className={mode === "pro" ? "text-white" : "text-[#57534e]"}
                >
                  {say(locale, "Peşəkar", "Профессионально", "Professional")}
                </button>
              </div>

            </div>

            <div className="eh-modal-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <nav className="sticky top-0 z-10 hidden border-b border-white/[0.06] bg-[#0b0d12]/95 px-6 py-2 backdrop-blur sm:block">
                <div className="mx-auto flex max-w-[720px] items-center gap-4 text-[12px]">
                  {STEPS.map((step, index) => (
                    <span key={step.id} className="inline-flex items-center gap-4">
                      {index > 0 ? <span className="text-[#3f3f46]">|</span> : null}
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById(step.id)?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          })
                        }
                        className="text-[#a8a29e] hover:text-white"
                      >
                        {line(locale, step)}
                      </button>
                    </span>
                  ))}
                </div>
              </nav>

              <motion.div
                key={mode}
                initial={reduceMotion ? false : { opacity: 0.72 }}
                animate={{ opacity: 1 }}
                transition={reduceMotion ? { duration: 0 } : { duration: 0.22 }}
              >
              {marketMoved ? (
                <p className="mb-4 text-[13px] leading-relaxed text-amber-100/90">
                  {az
                    ? "Bazar son hesablamanızdan sonra yenilənib. Rəqəmləri yenidən yoxlayın."
                    : locale === "en"
                      ? "The market moved after your last calculation. Recalculate when you are ready."
                      : "Рынок обновился после вашего последнего расчёта. Пересчитайте, когда будете готовы."}
                </p>
              ) : null}
              <LotStory
                az={az}
                locale={locale}
                lot={lot}
                mode={mode}
                report={report}
                loading={loading}
                error={error}
                onRetry={retry}
                answers={answers}
                patch={patch}
                result={result}
                defects={defects}
                start={start}
                startKnown={startKnown}
                deposit={deposit}
                fee={fee != null && Number.isFinite(Number(fee)) ? Number(fee) : null}
                herracPrice={herracLotPrice}
                herracPriceKnown={herracPriceKnown}
                intel={intel}
              />
              </motion.div>
            </div>

            <div className="shrink-0 border-t border-white/[0.06] bg-[#0b0d12] px-4 py-2 sm:px-6">
              <a
                href={herracHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mx-auto flex w-full max-w-[720px] items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-3 py-2 text-[13px] font-medium text-white hover:bg-[#1d4ed8]"
              >
                {t.openOnHerrac}
                <ExternalLink size={15} />
              </a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

function herracLotHref(lot) {
  if (typeof lot?.herracUrl === "string" && lot.herracUrl.includes("/auctions/")) {
    return lot.herracUrl;
  }
  const id = String(lot?.registryNo || lot?.herracId || "");
  if (/^\d{8,}$/.test(id)) return `${HERRAC_ORIGIN}/auctions/${id}/lot`;
  return HERRAC_URL;
}

