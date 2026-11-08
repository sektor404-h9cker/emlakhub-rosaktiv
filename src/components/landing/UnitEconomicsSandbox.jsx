"use client";

/**
 * ============================================================================
 * UnitEconomicsSandbox - мини-терминал сделки (тихая роскошь)
 * ============================================================================
 * Тот же Porsche-кейс, что в Hero. Клиент крутит ставку / рынок / ремонт
 * и видит каскад: скрытые риски → чистая маржа.
 * ============================================================================
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import { useLandingDeal } from "./LandingDealContext";
import { say } from "@/lib/i18n/copy";

const FEE_PCT = 0.05;

const SLIDER_TONES = {
  slate: { fill: "#e7edf3", thumb: "#f5f8fb" },
  sand: { fill: "#c4b39a", thumb: "#e3d5bd" },
};

const PRESET_META = {
  conservative: {
    ru: "Консервативный",
    az: "Konservativ",
    en: "Conservative",
    hintRu: "Запас по прибыли",
    hintAz: "Qazanc ehtiyatı",
    hintEn: "A margin of safety",
  },
  optimal: {
    ru: "Оптимальный",
    az: "Optimal",
    en: "Balanced",
    hintRu: "Баланс",
    hintAz: "Balans",
    hintEn: "Balance",
  },
  aggressive: {
    ru: "Агрессивный",
    az: "Aqressiv",
    en: "Aggressive",
    hintRu: "Близко к рынку",
    hintAz: "Bazara yaxın",
    hintEn: "Close to the market",
  },
};

function Slider({ label, value, min, max, step, onChange, tone = "slate", hint }) {
  const colors = SLIDER_TONES[tone] || SLIDER_TONES.slate;
  const span = Math.max(1, max - min);
  const pct = Math.max(0, Math.min(100, ((value - min) / span) * 100));

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[#c5d0db]">
          {label}
          {hint}
        </span>
        <span className="font-mono-num text-[15px] font-semibold tabular-nums text-[#f5f8fb]">
          {value.toLocaleString("en-US")} ₼
        </span>
      </div>
      <div className="relative h-[3px] rounded-full bg-white/15">
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
          className="absolute -top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#070b10] shadow"
          style={{ left: `calc(${pct}% - 7px)`, backgroundColor: colors.thumb }}
        />
      </div>
    </div>
  );
}

function FeesTip({ locale }) {
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
        className="text-[#8ea0b4] transition-colors hover:text-[#f5f8fb]"
      >
        <HelpCircle size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-2 w-52 -translate-x-1/2 rounded-lg border border-white/10 bg-[#121820] px-3 py-2 text-[11px] font-normal normal-case tracking-normal text-[#d3dce6] shadow-lg"
        >
          {say(
            locale,
            "Təklifin 5%-i: dövlət rüsumu və notarius.",
            "5% от ставки: госпошлина и нотариус.",
            "5% of the bid: state fee and notary."
          )}
        </span>
      )}
    </span>
  );
}

export default function UnitEconomicsSandbox({ locale = "ru" }) {
  const L = (az, ru, en) => say(locale, az, ru, en);
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
  const repairLabel = isEstate
    ? L("Bərpa", "Восстановление", "Restoration")
    : L("Təmir", "Ремонт", "Repair");

  const fees = useMemo(() => Math.round(bid * FEE_PCT), [bid]);
  const invested = bid + fees + repairCost;
  const profit = marketPrice - bid - fees - repairCost;
  const roi = invested > 0 ? (profit / invested) * 100 : 0;
  const healthy = profit >= 0;

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-[#10161e]">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0c1016] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            {L("Nümunə · təklifdən əvvəl", "Пример · до ставки", "Example · before you bid")}
          </div>
          <h3 className="mt-1 font-serif text-2xl font-semibold tracking-[-0.02em] text-[#e8dcc6] sm:text-[30px]">
            {demoLot.title}
          </h3>
          <p className="mt-1 font-mono text-[11px] text-white/45">
            {demoLot.id} ·{" "}
            {L("nümunə rəqəmi", "цифра примера", "example figure")}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            {L("Sizin qazancınız", "Ваша прибыль", "Your profit")}
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
        <div className="space-y-7 border-b border-white/10 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8ea0b4]">
              {L("Təklif nə qədər olsun", "Какой размер ставки", "How large should the bid be")}
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
                      "rounded-xl border px-2.5 py-2.5 text-left transition duration-300 ease-out",
                      active
                        ? "border-[#f3efe6] bg-[#f3efe6] text-[#161410]"
                        : "border-white/12 bg-white/[0.03] text-[#eef3f8] hover:-translate-y-px hover:border-white/30",
                    ].join(" ")}
                  >
                    <div className="text-[12px] font-semibold tracking-tight">
                      {say(locale, meta.az, meta.ru, meta.en)}
                    </div>
                    <div
                      className={`mt-0.5 text-[10px] ${
                        active ? "text-[#161410]/60" : "text-[#8ea0b4]"
                      }`}
                    >
                      {say(locale, meta.hintAz, meta.hintRu, meta.hintEn)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Slider
            label={L("Bazar qiyməti", "Рыночная цена", "Market price")}
            value={marketPrice}
            min={marketMin}
            max={marketMax}
            step={isEstate ? 500 : 100}
            onChange={setMarketPrice}
          />
          <Slider
            label={L("Hərrac təklifi", "Ставка на аукционе", "Auction bid")}
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
        <div className="bg-white/[0.02] p-5 sm:p-8">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[#8ea0b4]">
            {L("Necə hesablanır", "Как считается", "How it is calculated")}
          </div>

          <CascadeLine
            label={L("Bazar qiyməti", "Рыночная цена", "Market price")}
            value={marketPrice}
            sign=""
          />
          <CascadeLine
            label={L("Təklif", "Ставка", "Bid")}
            value={bid}
            sign="−"
            dim
          />
          <CascadeLine
            label={
              <span className="inline-flex items-center gap-1.5">
                {L("Vergi və rüsumlar 5%", "Налоги и сборы 5%", "Taxes and fees 5%")}
                <FeesTip locale={locale} />
              </span>
            }
            value={fees}
            sign="−"
            dim
          />
          <CascadeLine
            label={
              isEstate
                ? L("Təmir / bərpa", "Ремонт / восстановление", "Repair / restoration")
                : L("Təmir", "Ремонт", "Repair")
            }
            value={repairCost}
            sign="−"
            accent
          />

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#c5d0db]">
                {L("Xalis qazanc", "Чистая прибыль", "Net profit")}
              </span>
              <span
                className={`font-mono-num text-[22px] font-semibold tabular-nums ${
                  healthy ? "text-[#f3e6cc]" : "text-[#e7b8a0]"
                }`}
              >
                {profit >= 0 ? "+" : "−"}
                {Math.abs(profit).toLocaleString("en-US")} ₼
              </span>
            </div>
          </div>

          {/* Visual weight bar */}
          <div className="mt-6">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
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
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8ea0b4]">
              <span>{L("Təklif", "Ставка", "Bid")}</span>
              <span>{L("Rüsum", "Сборы", "Fees")}</span>
              <span>{repairLabel}</span>
              <span>{L("Qazanc", "Прибыль", "Profit")}</span>
            </div>
          </div>

          <p className="mt-6 text-[12px] leading-relaxed text-[#c5d0db]">
            {L(
              "Tədris nümunəsi. Buradakı təmir rəqəmi fotodan gəlmir və lot smetası deyil.",
              "Учебный пример. Цифра ремонта здесь не взята из фото и не является сметой лота.",
              "A teaching example. The repair figure here is not taken from a photo and is not a lot estimate."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function CascadeLine({ label, value, sign, dim, accent }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-3 last:border-0">
      <span
        className={`text-[13px] ${
          accent ? "text-[#e3d5bd]" : dim ? "text-[#8ea0b4]" : "text-[#eef3f8]"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono-num text-[14px] font-semibold tabular-nums ${
          accent ? "text-[#e3d5bd]" : "text-[#f5f8fb]"
        }`}
      >
        {sign}
        {value.toLocaleString("en-US")} ₼
      </span>
    </div>
  );
}
