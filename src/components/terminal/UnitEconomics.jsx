"use client";

/**
 * =============================================================================
 * UnitEconomics — математический движок
 * =============================================================================
 * Формула: Рынок − Ремонт − Издержки − (рынок − ставка как упущенное?) 
 *
 * Бизнес-логика терминала:
 *   Чистая маржа = Рынок − Ставка − Ремонт − Издержки
 *   (ставка = сколько платим на аукционе; чем выше ставка, тем ниже маржа)
 *
 * Ползунок ставки пересчитывает итог мгновенно (controlled state, без reload).
 * =============================================================================
 */

import { useMemo, useState, useEffect } from "react";

export default function UnitEconomics({ lot }) {
  const market = lot?.marketPrice || 0;
  const repair = lot?.repairCost || 0;
  const fees = lot?.fees || 0;

  // Стартовая ставка: чуть ниже рынка
  const [bid, setBid] = useState(() => Math.round(market * 0.82));

  useEffect(() => {
    setBid(Math.round((lot?.marketPrice || 0) * 0.82));
  }, [lot?.id, lot?.marketPrice]);

  const margin = useMemo(
    () => market - bid - repair - fees,
    [market, bid, repair, fees]
  );

  const marginPct = market > 0 ? (margin / market) * 100 : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-[16px] font-semibold text-white">Юнит-экономика</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">
          live
        </span>
      </div>

      <p className="mt-2 font-mono text-[11px] text-[#6b7280]">
        Рынок − Ставка − Ремонт − Издержки = Чистая маржа
      </p>

      {/* Цифровая лента */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Рынок" value={market} />
        <Metric label="Ставка" value={bid} accent />
        <Metric label="Ремонт" value={-repair} warn />
        <Metric label="Издержки" value={-fees} warn />
      </div>

      {/* Ползунок ставки */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b7280]">
            Ставка на аукционе
          </span>
          <span className="font-mono text-[13px] tabular-nums text-white">
            ₼ {bid.toLocaleString("en-US")}
          </span>
        </div>
        <input
          type="range"
          min={Math.round(market * 0.5)}
          max={market}
          step={100}
          value={bid}
          onChange={(e) => setBid(Number(e.target.value))}
          className="eh-term-range w-full"
        />
        <div className="mt-1 flex justify-between font-mono text-[9px] text-[#4b5563]">
          <span>50% рынка</span>
          <span>рынок</span>
        </div>
      </div>

      {/* Итог */}
      <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">
            Чистая маржа
          </div>
          <div
            className={[
              "mt-1 font-mono text-2xl font-semibold tabular-nums sm:text-3xl",
              margin >= 0 ? "text-[#e8d5b0]" : "text-red-400",
            ].join(" ")}
          >
            {margin < 0 ? "−" : ""}₼ {Math.abs(margin).toLocaleString("en-US")}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7280]">
            от рынка
          </div>
          <div
            className={[
              "mt-1 font-mono text-lg tabular-nums",
              marginPct >= 0 ? "text-white" : "text-red-400",
            ].join(" ")}
          >
            {marginPct.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, accent, warn }) {
  const abs = Math.abs(value);
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2.5">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b7280]">
        {label}
      </div>
      <div
        className={[
          "mt-1 font-mono text-[14px] tabular-nums sm:text-[15px]",
          warn ? "text-amber-400/90" : accent ? "text-[#b8956c]" : "text-white",
        ].join(" ")}
      >
        {value < 0 ? "−" : ""}₼ {abs.toLocaleString("en-US")}
      </div>
    </div>
  );
}
