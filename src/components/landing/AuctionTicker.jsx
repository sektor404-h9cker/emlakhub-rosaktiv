"use client";

/**
 * AuctionTicker - Bloomberg-style live auction marquee (маркетинговые примеры)
 */

import React from "react";
import { Building2, Car, LandPlot, TrendingUp, TrendingDown } from "lucide-react";
import { say } from "@/lib/i18n/copy";

const HOT_LOTS = [
  { id: "8842", kind: "auto", title: "Toyota Camry · 2018", start: 18400, market: 25000 },
  { id: "8843", kind: "estate", title: "3-otaqlı · Nərimanov", start: 78500, market: 92000 },
  { id: "8844", kind: "auto", title: "Hyundai Tucson · 2020", start: 21200, market: 23800 },
  { id: "8845", kind: "commercial", title: "Kommersiya · Yasamal", start: 145000, market: 168000 },
  { id: "8846", kind: "auto", title: "BMW 320i · 2017", start: 14800, market: 13200 },
  { id: "8847", kind: "land", title: "Torpaq sahəsi · Mərdəkan", start: 28000, market: 34500 },
  { id: "8848", kind: "auto", title: "Mercedes E200 · 2019", start: 32400, market: 39800 },
  { id: "8849", kind: "estate", title: "1-otaqlı · Nəsimi", start: 52000, market: 58500 },
  { id: "8850", kind: "auto", title: "Kia Sportage · 2021", start: 26900, market: 31200 },
  { id: "8851", kind: "commercial", title: "Anbar sahəsi · Sumqayıt", start: 64000, market: 71500 },
];

function KindGlyph({ kind, ...props }) {
  const Icon = kind === "auto" ? Car : kind === "land" ? LandPlot : Building2;
  return <Icon {...props} />;
}

function TickerRow({ lot, locale }) {
  const margin = ((lot.market - lot.start) / lot.start) * 100;
  const positive = margin >= 0;
  return (
    <div className="inline-flex items-center gap-3 border-r border-white/10 px-6 py-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/8 text-[#c5d0db] ring-1 ring-white/10">
        <KindGlyph kind={lot.kind} size={12} strokeWidth={1.8} />
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8ea0b4]">
        LOT #{lot.id}
      </span>
      <span className="whitespace-nowrap text-[13px] font-medium text-[#eef3f8]">
        {lot.title}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-[#8ea0b4]">
        {say(locale, "BAŞLANĞIC", "СТАРТ", "START")}
      </span>
      <span className="font-mono-num text-[13px] font-semibold tabular-nums text-[#eef3f8]">
        ₼{lot.start.toLocaleString("en-US")}
      </span>
      <span className="text-[10px] font-medium uppercase tracking-wider text-[#8ea0b4]">
        {say(locale, "BAZAR", "РЫНОК", "MARKET")}
      </span>
      <span className="font-mono-num text-[13px] font-semibold tabular-nums text-[#eef3f8]">
        ₼{lot.market.toLocaleString("en-US")}
      </span>
      <span
        className={[
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-num text-[11px] font-semibold tabular-nums",
          positive ? "bg-[#143024] text-[#b7e4c7]" : "bg-[#3a1c22] text-[#f3c0c0]",
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
  const lots = [...HOT_LOTS, ...HOT_LOTS];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/10 bg-[#070b10]">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/70 to-transparent"
        aria-hidden
      />
      <div className="absolute bottom-0 left-0 top-0 z-10 flex items-center bg-gradient-to-r from-[#070b10] via-[#070b10] to-transparent pl-4 pr-6 sm:pl-5">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e7edf3] px-3 py-1.5 text-[#0c1218]">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-[#6d5b40]">
            DEMO
          </span>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">
            {say(locale, "Nümunə lotlar", "Примеры лотов", "Sample lots")}
          </span>
        </span>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-20 sm:w-28"
        style={{ background: "linear-gradient(to left, #070b10, transparent)" }}
      />

      <div
        className="flex animate-ticker whitespace-nowrap py-0.5 hover:[animation-play-state:paused]"
        style={{ paddingLeft: "220px" }}
      >
        {lots.map((lot, i) => (
          <TickerRow key={`${lot.id}-${i}`} lot={lot} locale={locale} />
        ))}
      </div>
    </div>
  );
}
