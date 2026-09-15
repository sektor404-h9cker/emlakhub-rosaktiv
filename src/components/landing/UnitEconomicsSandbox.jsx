"use client";

/**
 * ============================================================================
 * UnitEconomicsSandbox — мини-терминал сделки (тихая роскошь)
 * ============================================================================
 * Тот же Porsche-кейс, что в Hero. Клиент крутит ставку / рынок / ремонт
 * и видит каскад: скрытые риски → чистая маржа.
 * ============================================================================
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useLandingDeal } from "./LandingDealContext";

const FEE_PCT = 0.05;

const SLIDER_TONES = {
  slate: { fill: "#1e293b", thumb: "#0f172a" },
  sand: { fill: "#a8926a", thumb: "#8a7349" },
};

const PRESET_META = {
  conservative: {
    ru: "Консервативный",
    az: "Konservativ",
    hintRu: "Запас по прибыли",
    hintAz: "Qazanc ehtiyatı",
  },
  optimal: {
    ru: "Оптимальный",
    az: "Optimal",
    hintRu: "Баланс",
    hintAz: "Balans",
  },
  aggressive: {
    ru: "Агрессивный",
    az: "Aqressiv",
    hintRu: "Близко к рынку",
    hintAz: "Bazara yaxın",
  },
};

function Slider({ label, value, min, max, step, onChange, tone = "slate", hint }) {
  const colors = SLIDER_TONES[tone] || SLIDER_TONES.slate;
  const span = Math.max(1, max - min);
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
          {hint}
        </span>
        <span className="font-mono-num text-[15px] font-semibold tabular-nums text-slate-900">
          {value.toLocaleString("en-US")} ₼
        </span>
      </div>
      <div className="relative h-[3px] rounded-full bg-slate-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: colors.fill }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          aria-label={label}
        />
        <span
          aria-hidden
          className="absolute -top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: colors.thumb }}
        />
      </div>
    </div>
  );
}

function FeesTip({ ru }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label="fees"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-slate-400 hover:text-slate-700"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-slate-600 shadow-lg"
        >
          {ru
            ? "5% от ставки: госпошлина и нотариус."
            : "Təklifin 5%-i: dövlət rüsumu və notarius."}
        </span>
      )}
    </span>
  );
}

export default function UnitEconomicsSandbox({ locale = "ru" }) {
  const ru = locale === "ru";
  const {
    marketPrice,
    bid,
    repairCost,
    activePreset,
    setMarketPrice,
    setBid,
    setRepairManual,
    applyPreset,
    demoLot,
    assetClass,
  } = useLandingDeal();

  const isEstate = assetClass === "estate";
  const marketMax = isEstate ? 350000 : 120000;
  const marketMin = isEstate ? 50000 : 30000;
  const bidMin = isEstate ? 20000 : 10000;
  const repairMax = isEstate ? 60000 : 25000;
  const repairLabel = ru
    ? isEstate
      ? "Восстановление"
      : "Ремонт"
    : isEstate
      ? "Bərpa"
      : "Təmir";

  const fees = useMemo(() => Math.round(bid * FEE_PCT), [bid]);
  const invested = bid + fees + repairCost;
  const profit = marketPrice - bid - fees - repairCost;
  const roi = invested > 0 ? (profit / invested) * 100 : 0;
  const healthy = profit >= 0;

  return (
    <div className="eh-card-static overflow-hidden rounded-[1.35rem] border-slate-200/80">
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-[#141414] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            {ru ? "Пример · до ставки" : "Nümunə · təklifdən əvvəl"}
          </div>
          <h3 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.02em] text-[#e8dcc6] sm:text-[30px]">
            {demoLot.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-white/45">
            {demoLot.id} ·{" "}
            {ru
              ? "смета с главного экрана"
              : "əsas ekrandakı smeta"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            {ru ? "Ваша прибыль" : "Sizin qazancınız"}
          </div>
          <motion.div
            key={profit}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 1 }}
            className={`font-mono-num text-[28px] font-semibold tabular-nums sm:text-[34px] ${
              healthy ? "text-[#e8dcc6]" : "text-[#d4a574]"
            }`}
          >
            {profit >= 0 ? "+" : "−"}
            {Math.abs(profit).toLocaleString("en-US")} ₼
          </motion.div>
          <div
            className={`font-mono text-[12px] tabular-nums ${
              healthy ? "text-white/50" : "text-[#d4a574]/70"
            }`}
          >
            ROI {roi >= 0 ? "+" : ""}
            {roi.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2">
        {/* Controls */}
        <div className="space-y-7 border-b border-slate-200 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
              {ru ? "Какой размер ставки" : "Təklif nə qədər olsun"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(PRESET_META).map((id) => {
                const meta = PRESET_META[id];
                const active = activePreset === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => applyPreset(id)}
                    className={[
                      "eh-btn rounded-xl border px-2.5 py-2.5 text-left",
                      active
                        ? "border-slate-900 bg-slate-900 text-white shadow-[0_12px_28px_-12px_rgba(20,20,20,0.5)]"
                        : "border-slate-200 bg-slate-50/80 text-slate-700 hover:border-slate-300 hover:bg-white hover:shadow-[0_14px_36px_-18px_rgba(20,20,20,0.18)]",
                    ].join(" ")}
                  >
                    <div className="text-[12px] font-semibold tracking-tight">
                      {ru ? meta.ru : meta.az}
                    </div>
                    <div
                      className={`mt-0.5 text-[10px] ${
                        active ? "text-white/55" : "text-slate-400"
                      }`}
                    >
                      {ru ? meta.hintRu : meta.hintAz}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Slider
            label={ru ? "Рыночная цена" : "Bazar qiyməti"}
            value={marketPrice}
            min={marketMin}
            max={marketMax}
            step={isEstate ? 500 : 100}
            onChange={setMarketPrice}
          />
          <Slider
            label={ru ? "Ставка на аукционе" : "Hərrac təklifi"}
            value={bid}
            min={bidMin}
            max={marketPrice}
            step={isEstate ? 500 : 100}
            onChange={setBid}
          />
          <Slider
            label={repairLabel}
            value={repairCost}
            min={0}
            max={repairMax}
            step={100}
            onChange={setRepairManual}
            tone="sand"
          />
        </div>

        {/* Cascade */}
        <div className="bg-slate-50/60 p-5 sm:p-8">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
            {ru ? "Как считается" : "Necə hesablanır"}
          </div>

          <CascadeLine
            label={ru ? "Рыночная цена" : "Bazar qiyməti"}
            value={marketPrice}
            sign=""
          />
          <CascadeLine
            label={ru ? "Ставка" : "Təklif"}
            value={bid}
            sign="−"
            dim
          />
          <CascadeLine
            label={
              <span className="inline-flex items-center gap-1.5">
                {ru ? "Налоги и сборы 5%" : "Vergi və rüsumlar 5%"}
                <FeesTip ru={ru} />
              </span>
            }
            value={fees}
            sign="−"
            dim
          />
          <CascadeLine
            label={
              ru
                ? isEstate
                  ? "Ремонт / восстановление"
                  : "Ремонт"
                : isEstate
                  ? "Təmir / bərpa"
                  : "Təmir"
            }
            value={repairCost}
            sign="−"
            accent
          />

          <div className="mt-6 border-t border-slate-300 pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-slate-600">
                {ru ? "Чистая прибыль" : "Xalis qazanc"}
              </span>
              <span
                className={`font-mono-num text-[22px] font-semibold tabular-nums ${
                  healthy ? "text-slate-900" : "text-amber-800"
                }`}
              >
                {profit >= 0 ? "+" : "−"}
                {Math.abs(profit).toLocaleString("en-US")} ₼
              </span>
            </div>
          </div>

          {/* Visual weight bar */}
          <div className="mt-6">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="bg-slate-800"
                style={{ width: `${Math.max(0, (bid / marketPrice) * 100)}%` }}
              />
              <div
                className="bg-slate-500"
                style={{ width: `${Math.max(0, (fees / marketPrice) * 100)}%` }}
              />
              <div
                className="bg-[#a8926a]"
                style={{
                  width: `${Math.max(0, (repairCost / marketPrice) * 100)}%`,
                }}
              />
              <div
                className="bg-[#c5b89a]"
                style={{
                  width: `${Math.max(0, (Math.max(0, profit) / marketPrice) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-slate-400">
              <span>{ru ? "Ставка" : "Təklif"}</span>
              <span>{ru ? "Сборы" : "Rüsum"}</span>
              <span>{ru ? "Ремонт" : "Təmir"}</span>
              <span>{ru ? "Прибыль" : "Qazanc"}</span>
            </div>
          </div>

          <p className="mt-6 text-[12px] leading-relaxed text-slate-500">
            {ru
              ? "Правило: ставка не выше рыночной цены. Смета ремонта берётся с примера на главном экране."
              : "Qayda: təklif bazar qiymətindən yüksək ola bilməz. Təmir smetası əsas ekrandakı nümunədən gəlir."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CascadeLine({ label, value, sign, dim, accent }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 py-3 last:border-0">
      <span
        className={`text-[13px] ${
          accent ? "text-amber-900/80" : dim ? "text-slate-500" : "text-slate-800"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono-num text-[14px] font-semibold tabular-nums ${
          accent ? "text-amber-900/90" : "text-slate-800"
        }`}
      >
        {sign}
        {value.toLocaleString("en-US")} ₼
      </span>
    </div>
  );
}
