"use client";

/**
 * ============================================================================
 * InteractiveSandbox — светлая «тихая роскошь»
 * ============================================================================
 * Авто: Porsche · Недвижимость: квартира (жилой интерьер)
 * Рамки — тонкие, тёплые; без чёрного «терминала»
 * ============================================================================
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { useLandingDeal } from "./LandingDealContext";

const ASSETS = {
  auto: {
    /** Чёрный Porsche · горы — на весь кадр */
    photo: "/landing/porsche-black-mountains.jpg",
    alt: "Porsche - чёрный, горы",
    objectPosition: "center center",
    objectFit: "cover",
    stageBg: "#1a1f28",
    scanLabel: { ru: "Осмотр кузова", az: "Kuzov yoxlaması" },
    doneLabel: { ru: "Оценка готова", az: "Qiymətləndirmə hazırdır" },
    defects: [
      {
        id: "bumper",
        x: 48,
        y: 58,
        w: 26,
        h: 18,
        cost: 2800,
        label: { ru: "Бампер", az: "Bamper" },
      },
      {
        id: "fender",
        x: 14,
        y: 38,
        w: 36,
        h: 28,
        cost: 2500,
        label: { ru: "Крыло", az: "Qanad" },
      },
      {
        id: "intake",
        x: 6,
        y: 52,
        w: 16,
        h: 20,
        cost: 3100,
        label: { ru: "Воздухозаборник", az: "Hava qəbuledici" },
      },
    ],
  },
  estate: {
    /** Светлая жилая квартира — как лот на рынке Баку */
    photo:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2200&auto=format&fit=crop",
    alt: "Квартира",
    objectPosition: "center center",
    scanLabel: { ru: "Осмотр квартиры", az: "Mənzil yoxlaması" },
    doneLabel: { ru: "Оценка готова", az: "Qiymətləndirmə hazırdır" },
    defects: [
      {
        id: "floor",
        x: 18,
        y: 68,
        w: 28,
        h: 14,
        cost: 6200,
        label: { ru: "Пол · износ", az: "Döşəmə" },
      },
      {
        id: "window",
        x: 58,
        y: 22,
        w: 22,
        h: 28,
        cost: 7100,
        label: { ru: "Окна · уплотнение", az: "Pəncərə" },
      },
      {
        id: "wall",
        x: 8,
        y: 30,
        w: 16,
        h: 22,
        cost: 5200,
        label: { ru: "Стены · отделка", az: "Divar" },
      },
    ],
  },
};

const SCAN_MS = 3000;
const SETTLE_MS = 350;

export default function InteractiveSandbox({ locale = "ru" }) {
  const ru = locale === "ru";
  const reduce = useReducedMotion();
  const {
    assetClass,
    setAssetClass,
    marketPrice,
    reportDefectsTotal,
    demoLot,
  } = useLandingDeal();

  const asset = ASSETS[assetClass] || ASSETS.auto;
  const defects = asset.defects;

  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const timeoutRef = useRef(0);
  const startedRef = useRef(false);
  const assetRef = useRef(assetClass);

  const [phase, setPhase] = useState("idle");
  const [scanX, setScanX] = useState(0);
  const [revealed, setRevealed] = useState(0);

  const visible = useMemo(() => defects.slice(0, revealed), [defects, revealed]);
  const defectsTotal = useMemo(
    () => visible.reduce((a, d) => a + d.cost, 0),
    [visible]
  );
  const realValue = marketPrice - defectsTotal;

  useEffect(() => {
    reportDefectsTotal(defectsTotal);
  }, [defectsTotal, reportDefectsTotal]);

  const runScan = (list) => {
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timeoutRef.current);
    const items = list || defects;

    setPhase("scanning");
    setScanX(0);
    setRevealed(0);

    if (reduce) {
      setScanX(100);
      setRevealed(items.length);
      setPhase("done");
      return;
    }

    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / SCAN_MS);
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const x = eased * 100;
      setScanX(x);
      setRevealed(items.filter((d) => d.x + d.w / 2 <= x).length);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        timeoutRef.current = window.setTimeout(() => setPhase("done"), SETTLE_MS);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          runScan(ASSETS[assetRef.current].defects);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useEffect(() => {
    if (assetRef.current === assetClass) return;
    assetRef.current = assetClass;
    startedRef.current = true;
    runScan(ASSETS[assetClass].defects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetClass]);

  return (
    <div ref={rootRef} className="relative w-full max-w-full">
      {/* Табы */}
      <div className="mb-4 flex rounded-full border border-slate-200/90 bg-white/95 p-1 shadow-[0_10px_40px_-18px_rgba(20,20,20,0.18)] backdrop-blur-sm">
        {(["auto", "estate"]).map((key) => {
          const active = assetClass === key;
          const label =
            key === "auto"
              ? ru
                ? "Автомобили"
                : "Avtomobillər"
              : ru
                ? "Недвижимость"
                : "Daşınmaz əmlak";
          return (
            <button
              key={key}
              type="button"
              onClick={() => key !== assetClass && setAssetClass(key)}
              className={[
                "eh-btn flex-1 rounded-full px-2 py-2.5 text-[11px] font-semibold tracking-tight sm:px-3 sm:text-[13px]",
                active
                  ? "bg-slate-900 text-white shadow-[0_10px_28px_-10px_rgba(20,20,20,0.55)]"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="eh-card-static overflow-hidden rounded-[1.35rem] border-slate-200/80 bg-white sm:rounded-[1.6rem]">
        {/* Светлый HUD */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/80 px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <div className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400 sm:text-[10px]">
              {ru ? "Проверка лота · до ставки" : "Lot yoxlaması · təklifdən əvvəl"}
            </div>
            <div className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-slate-900 sm:text-[14px]">
              {demoLot.title}
            </div>
          </div>
          <button
            type="button"
            onClick={() => runScan(defects)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
          >
            <RotateCcw size={12} />
            {ru ? "Ещё раз" : "Yenidən"}
          </button>
        </div>

        {/* Фото */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]"
          style={{ background: asset.stageBg || "#f4f2ed" }}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={asset.photo}
              src={asset.photo}
              alt={asset.alt}
              draggable={false}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 h-full w-full"
              style={{
                objectFit: asset.objectFit || "cover",
                objectPosition: asset.objectPosition || "center",
              }}
            />
          </AnimatePresence>

          {/* Край кадра */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                assetClass === "auto"
                  ? "linear-gradient(180deg, rgba(15,23,42,0.08) 0%, transparent 28%, transparent 62%, rgba(15,23,42,0.22) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 65%, rgba(15,23,42,0.12) 100%)",
            }}
          />

          {/* Скан — тонкая золотая линия */}
          <AnimatePresence>
            {phase === "scanning" && (
              <motion.div
                key="scan"
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-20"
                style={{ left: `${scanX}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-y-0 w-px -translate-x-1/2"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, #c4a46b 20%, #e8d5b0 50%, #c4a46b 80%, transparent 100%)",
                    boxShadow: "0 0 20px 1px rgba(196,164,107,0.45)",
                  }}
                />
                <div
                  className="absolute inset-y-0 -left-20 w-20"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(196,164,107,0.1))",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Рамки дефектов — тонкие, светлые */}
          {defects.map((d, i) => {
            const on = i < revealed;
            const labelAbove = d.y > 32;
            return (
              <motion.div
                key={`${assetClass}-${d.id}`}
                initial={false}
                animate={{ opacity: on ? 1 : 0, scale: on ? 1 : 0.97 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute z-10"
                style={{
                  left: `${d.x}%`,
                  top: `${d.y}%`,
                  width: `${d.w}%`,
                  height: `${d.h}%`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-md"
                  style={{
                    border: "1.5px solid rgba(255,255,255,0.95)",
                    boxShadow:
                      "0 0 0 1px rgba(15,23,42,0.12), 0 8px 24px -8px rgba(15,23,42,0.35)",
                    background: "rgba(255,255,255,0.08)",
                  }}
                />
                {/* Углы — editorial look */}
                <span className="absolute -left-px -top-px h-2.5 w-2.5 border-l-2 border-t-2 border-[#c4a46b]" />
                <span className="absolute -right-px -top-px h-2.5 w-2.5 border-r-2 border-t-2 border-[#c4a46b]" />
                <span className="absolute -bottom-px -left-px h-2.5 w-2.5 border-b-2 border-l-2 border-[#c4a46b]" />
                <span className="absolute -bottom-px -right-px h-2.5 w-2.5 border-b-2 border-r-2 border-[#c4a46b]" />

                <div
                  className={[
                    "absolute z-10 max-w-[160px] truncate rounded-full px-2.5 py-1 text-[10px] font-medium tracking-tight text-slate-900 shadow-md sm:text-[11px]",
                    labelAbove ? "-top-8 left-0" : "left-0 top-full mt-1.5",
                  ].join(" ")}
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    border: "1px solid rgba(15,23,42,0.06)",
                  }}
                >
                  {ru ? d.label.ru : d.label.az}
                  <span className="ml-1.5 font-mono tabular-nums text-slate-500">
                    −{d.cost.toLocaleString("en-US")}
                  </span>
                </div>
              </motion.div>
            );
          })}

          <div className="absolute bottom-3 left-3 z-20 sm:bottom-4 sm:left-4">
            <div className="rounded-full border border-white/60 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-md">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
                {phase === "scanning"
                  ? ru
                    ? asset.scanLabel.ru
                    : asset.scanLabel.az
                  : phase === "done"
                    ? ru
                      ? asset.doneLabel.ru
                      : asset.doneLabel.az
                    : ru
                      ? "Ожидание"
                      : "Gözləmə"}
              </span>
              <span className="ml-2 font-mono text-[10px] tabular-nums text-slate-800">
                {revealed}/{defects.length}
              </span>
            </div>
          </div>
        </div>

        {/* Формула — светлая */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white">
          <ValueCell
            label={ru ? "Рыночная цена" : "Bazar qiyməti"}
            value={marketPrice}
            tone="muted"
          />
          <ValueCell
            label={
              assetClass === "auto"
                ? ru
                  ? "Ремонт"
                  : "Təmir"
                : ru
                  ? "Восстановление"
                  : "Bərpa"
            }
            value={-defectsTotal}
            tone="warn"
          />
          <ValueCell
            label={ru ? "После ремонта" : "Təmirdən sonra"}
            value={realValue}
            tone="accent"
          />
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] tracking-wide text-slate-400">
        {ru
          ? `${marketPrice.toLocaleString("en-US")} − ${defectsTotal.toLocaleString("en-US")} = ${realValue.toLocaleString("en-US")} ₼`
          : `${marketPrice.toLocaleString("en-US")} − ${defectsTotal.toLocaleString("en-US")} = ${realValue.toLocaleString("en-US")} ₼`}
      </p>
    </div>
  );
}

function ValueCell({ label, value, tone }) {
  const color =
    tone === "warn"
      ? "text-amber-800"
      : tone === "accent"
        ? "text-slate-900"
        : "text-slate-700";

  return (
    <div
      className={[
        "min-w-0 px-3 py-4 sm:px-4",
        tone === "accent" ? "bg-slate-50/80" : "",
      ].join(" ")}
    >
      <div className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        className={`font-mono-num mt-1 text-[15px] font-semibold tabular-nums sm:text-[18px] ${color}`}
      >
        {value < 0 ? "−" : ""}₼ {Math.abs(value).toLocaleString("en-US")}
      </motion.div>
    </div>
  );
}
