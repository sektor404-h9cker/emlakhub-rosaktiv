"use client";

/**
 * AuctionTicker — Bloomberg-style live auction marquee
 * Цвет: холодный slate, в тон светлому лендингу
 */

import React from "react";
import { Building2, Car, TrendingUp, TrendingDown } from "lucide-react";

const HOT_LOTS = [
  { id: "8842", kind: "auto", title: "Toyota Camry · 2018", start: 18400, market: 25000 },
  { id: "8843", kind: "estate", title: "3-otaqlı · Nərimanov", start: 78500, market: 92000 },
  { id: "8844", kind: "auto", title: "Hyundai Tucson · 2020", start: 21200, market: 23800 },
  { id: "8845", kind: "estate", title: "Kommersiya · Yasamal", start: 145000, market: 168000 },
  { id: "8846", kind: "auto", title: "BMW 320i · 2017", start: 14800, market: 13200 },
  { id: "8847", kind: "estate", title: "Torpaq sahəsi · Mərdəkan", start: 28000, market: 34500 },
  { id: "8848", kind: "auto", title: "Mercedes E200 · 2019", start: 32400, market: 39800 },
  { id: "8849", kind: "estate", title: "1-otaqlı · Nəsimi", start: 52000, market: 58500 },
  { id: "8850", kind: "auto", title: "Kia Sportage · 2021", start: 26900, market: 31200 },
  { id: "8851", kind: "estate", title: "Anbar sahəsi · Sumqayıt", start: 64000, market: 71500 },
];

function TickerRow({ lot, ru }) {
  const margin = ((lot.market - lot.start) / lot.start) * 100;
  const positive = margin >= 0;
  const Icon = lot.kind === "auto" ? Car : Building2;
  return (
    <div className="inline-flex items-center gap-3 border-r border-slate-200/80 px-6 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200/80">
        <Icon size={12} strokeWidth={1.8} />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
        LOT #{lot.id}
      </span>
      <span className="whitespace-nowrap text-[13px] font-medium text-slate-700">{lot.title}</span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {ru ? "СТАРТ" : "BAŞLANĞIC"}
      </span>
      <span className="font-mono-num text-[13px] font-semibold tabular-nums text-slate-700">
        ₼{lot.start.toLocaleString("en-US")}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {ru ? "РЫНОК" : "BAZAR"}
      </span>
      <span className="font-mono-num text-[13px] font-semibold tabular-nums text-slate-700">
        ₼{lot.market.toLocaleString("en-US")}
      </span>
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-num text-[11px] font-semibold tabular-nums",
          positive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700",
        ].join(" ")}
      >
        {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
        {positive ? "+" : ""}
        {margin.toFixed(1)}%
      </span>
    </div>
  );
}

export default function AuctionTicker({ locale = "az" }) {
  const ru = locale === "ru";
  const lots = [...HOT_LOTS, ...HOT_LOTS];

  return (
    <div className="relative w-full overflow-hidden border-y border-slate-200/80 bg-[#eef1f5]">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent"
        aria-hidden
      />
      <div className="absolute bottom-0 left-0 top-0 z-10 flex items-center bg-gradient-to-r from-[#eef1f5] via-[#eef1f5] to-transparent pl-4 pr-6 sm:pl-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-white">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
            DEMO
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
            {ru ? "Примеры лотов" : "Nümunə lotlar"}
          </span>
        </span>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 sm:w-28"
        style={{ background: "linear-gradient(to left, #eef1f5, transparent)" }}
      />

      <div
        className="flex animate-ticker whitespace-nowrap py-0.5 hover:[animation-play-state:paused]"
        style={{ paddingLeft: "220px" }}
      >
        {lots.map((lot, i) => (
          <TickerRow key={`${lot.id}-${i}`} lot={lot} ru={ru} />
        ))}
      </div>
    </div>
  );
}
