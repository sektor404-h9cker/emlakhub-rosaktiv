"use client";

/**
 * =============================================================================
 * GuidedTour — пошаговый гид «за руку» по терминалу
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { TOUR_STEPS } from "@/data/guideCopy";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useTerminalPanel } from "@/context/TerminalPanelContext";

export default function GuidedTour({ enabled = true }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const router = useRouter();
  const pathname = usePathname();
  const {
    tourOpen,
    tourStep,
    onboardingDone,
    setTourStep,
    closeTour,
    completeTour,
    startTour,
    hydrated,
  } = useTerminalPanel();

  const [bootstrapped, setBootstrapped] = useState(false);

  /* Первый заход инвестора — открыть гид */
  useEffect(() => {
    if (!enabled || !hydrated || bootstrapped) return;
    setBootstrapped(true);
    if (!onboardingDone && !pathname?.startsWith("/admin")) {
      const timer = setTimeout(() => startTour(), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [enabled, hydrated, bootstrapped, onboardingDone, pathname, startTour]);

  const step = TOUR_STEPS[tourStep] || TOUR_STEPS[0];
  const total = TOUR_STEPS.length;
  const isLast = tourStep >= total - 1;

  useEffect(() => {
    if (!tourOpen || !step?.href) return;
    if (pathname !== step.href) {
      router.push(step.href);
    }
  }, [tourOpen, tourStep, step?.href, pathname, router]);

  if (!enabled || !tourOpen || !step) return null;

  const title = locale === "az" ? step.titleAz : step.titleRu;
  const body = locale === "az" ? step.bodyAz : step.bodyRu;
  const doText = locale === "az" ? step.doAz : step.doRu;

  const goNext = () => {
    if (isLast) {
      completeTour();
      router.push("/profile");
      return;
    }
    setTourStep(tourStep + 1);
  };

  const goBack = () => {
    if (tourStep > 0) setTourStep(tourStep - 1);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="pointer-events-none fixed inset-0 z-[90]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="pointer-events-none absolute inset-0 bg-black/45" />

        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="pointer-events-auto absolute bottom-5 left-1/2 w-[min(92vw,440px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/15 bg-[#0c1018] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)] sm:bottom-8 sm:left-[calc(248px+((100vw-248px)/2))]"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#93c5fd]">
              <Compass size={15} />
              {t.tourLabel}
              <span className="font-mono text-[11px] text-[#64748b]">
                {tourStep + 1}/{total}
              </span>
            </div>
            <button
              type="button"
              onClick={closeTour}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] hover:bg-white/5 hover:text-white"
              aria-label={t.tourSkip}
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-4 py-4">
            <h3 className="text-[17px] font-semibold tracking-tight text-white">
              {title}
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-[#94a3b8]">
              {body}
            </p>
            <p className="mt-3 rounded-xl border border-[#2563eb]/25 bg-[#2563eb]/10 px-3 py-2 text-[12px] leading-relaxed text-[#bfdbfe]">
              {doText}
            </p>

            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-[#2563eb] transition-all"
                style={{ width: `${((tourStep + 1) / total) * 100}%` }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={goBack}
                disabled={tourStep === 0}
                className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] text-[#94a3b8] disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft size={14} />
                {t.tourBack}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={completeTour}
                  className="rounded-xl px-3 py-2 text-[12px] text-[#64748b] hover:text-white"
                >
                  {t.tourSkip}
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#2563eb] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  {isLast ? t.tourFinish : t.tourNext}
                  {!isLast ? <ChevronRight size={14} /> : null}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
