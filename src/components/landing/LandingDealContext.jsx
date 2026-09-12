"use client";

/**
 * ============================================================================
 * LandingDealContext — единый кейс лендинга (Авто / Недвижимость)
 * ============================================================================
 * assetClass переключается табами в Hero.
 * marketPrice / repairCost / bid синхронизируются с активным лотом.
 * ============================================================================
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export const DEMO_LOTS = {
  auto: {
    id: "HE-2026-0911",
    assetClass: "auto",
    title: "Porsche 911 Carrera",
    titleShort: { ru: "Автомобили", az: "Avtomobillər" },
    marketPrice: 72400,
    fullDefectTotal: 8400,
    repairLabel: { ru: "Смета ремонта", az: "Təmir smetası" },
  },
  estate: {
    id: "HE-2026-1184",
    assetClass: "estate",
    title: "3-otaqlı · Nərimanov",
    titleShort: { ru: "Недвижимость", az: "Daşınmaz əmlak" },
    marketPrice: 142000,
    fullDefectTotal: 18500,
    repairLabel: { ru: "Смета восстановления", az: "Bərpa smetası" },
  },
};

/** @deprecated — совместимость; используйте DEMO_LOTS.auto */
export const DEMO_LOT = DEMO_LOTS.auto;

export const BID_PRESETS = {
  conservative: { id: "conservative", bidRatio: 0.72 },
  optimal: { id: "optimal", bidRatio: 0.82 },
  aggressive: { id: "aggressive", bidRatio: 0.94 },
};

const LandingDealContext = createContext(null);

export function LandingDealProvider({ children }) {
  const [assetClass, setAssetClassState] = useState("auto");
  const demoLot = DEMO_LOTS[assetClass];

  const [marketPrice, setMarketPriceState] = useState(demoLot.marketPrice);
  const [repairCost, setRepairCost] = useState(demoLot.fullDefectTotal);
  const [bid, setBidState] = useState(
    Math.round(demoLot.marketPrice * BID_PRESETS.optimal.bidRatio)
  );
  const [activePreset, setActivePreset] = useState("optimal");

  /**
   * Переключение Авто ↔ Недвижимость:
   * полностью подменяем якоря сделки, чтобы Hero и калькулятор говорили об одном лоте.
   */
  const setAssetClass = useCallback((next) => {
    const lot = DEMO_LOTS[next];
    if (!lot) return;
    setAssetClassState(next);
    setMarketPriceState(lot.marketPrice);
    setRepairCost(lot.fullDefectTotal);
    setBidState(Math.round(lot.marketPrice * BID_PRESETS.optimal.bidRatio));
    setActivePreset("optimal");
  }, []);

  const setMarketPrice = useCallback((next) => {
    const market = Math.max(15000, Math.min(500000, Number(next) || 0));
    setMarketPriceState(market);
    setBidState((prev) => Math.min(prev, market));
    setActivePreset(null);
  }, []);

  const setBid = useCallback(
    (next) => {
      const clamped = Math.max(3000, Math.min(Number(next) || 0, marketPrice));
      setBidState(clamped);
      setActivePreset(null);
    },
    [marketPrice]
  );

  const reportDefectsTotal = useCallback((total) => {
    setRepairCost(Math.max(0, Math.min(80000, Math.round(Number(total) || 0))));
  }, []);

  const setRepairManual = useCallback((next) => {
    setRepairCost(Math.max(0, Math.min(80000, Math.round(Number(next) || 0))));
    setActivePreset(null);
  }, []);

  const applyPreset = useCallback(
    (presetId) => {
      const preset = BID_PRESETS[presetId];
      if (!preset) return;
      setBidState(Math.min(Math.round(marketPrice * preset.bidRatio), marketPrice));
      setActivePreset(presetId);
    },
    [marketPrice]
  );

  const value = useMemo(
    () => ({
      assetClass,
      setAssetClass,
      marketPrice,
      bid,
      repairCost,
      activePreset,
      setMarketPrice,
      setBid,
      setRepairManual,
      reportDefectsTotal,
      applyPreset,
      demoLot,
    }),
    [
      assetClass,
      setAssetClass,
      marketPrice,
      bid,
      repairCost,
      activePreset,
      setMarketPrice,
      setBid,
      setRepairManual,
      reportDefectsTotal,
      applyPreset,
      demoLot,
    ]
  );

  return (
    <LandingDealContext.Provider value={value}>{children}</LandingDealContext.Provider>
  );
}

export function useLandingDeal() {
  const ctx = useContext(LandingDealContext);
  if (!ctx) throw new Error("useLandingDeal must be used within LandingDealProvider");
  return ctx;
}
