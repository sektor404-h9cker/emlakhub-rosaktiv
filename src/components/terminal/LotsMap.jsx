"use client";

/**
 * =============================================================================
 * LotsMap — Leaflet + OSM (тёмный фильтр)
 * Маркеры: маленький пин с точным iconAnchor — без смещения клика.
 * =============================================================================
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_LOTS, lotTitle } from "@/data/demoLots";

const BAKU = [40.4093, 49.8671];

/** Компактный пин: остриё = lat/lng. Подпись выше, без hit-area. */
function markerHtml(lot, active) {
  const color = lot.market === "estate" ? "#34d399" : "#38bdf8";
  const ring = active ? "#2563eb" : "rgba(255,255,255,0.9)";
  const labelBg = active ? "#2563eb" : "rgba(10,12,18,0.92)";
  return `
    <div class="eh-pin" style="position:relative;width:24px;height:32px;">
      <div style="
        position:absolute;left:50%;bottom:20px;transform:translateX(-50%);
        pointer-events:none;white-space:nowrap;
        background:${labelBg};color:#fff;
        border:1px solid ${active ? "rgba(147,197,253,0.7)" : "rgba(255,255,255,0.14)"};
        border-radius:6px;padding:2px 6px;
        font:600 9px/1.2 ui-monospace,Menlo,monospace;
        box-shadow:0 6px 16px rgba(0,0,0,0.45);
      ">${lot.registryNo}</div>
      <div style="
        position:absolute;left:50%;bottom:2px;width:14px;height:14px;
        margin-left:-7px;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${color};border:2px solid ${ring};
        box-shadow:0 2px 8px rgba(0,0,0,0.45);
      "></div>
      ${
        active
          ? `<div style="position:absolute;left:50%;bottom:0;width:8px;height:8px;margin-left:-4px;border-radius:50%;background:${color};opacity:0.45;filter:blur(3px);"></div>`
          : ""
      }
    </div>
  `;
}

function makeIcon(lot, active) {
  return L.divIcon({
    className: "eh-lot-marker",
    html: markerHtml(lot, active),
    // Только зона пина — клик не «плывёт» из‑за широкой подписи
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -28],
  });
}

export default function LotsMap({
  locale = "ru",
  selectedId = null,
  onSelect,
  /** Инкремент из списка — плавный panTo. С карты не меняется. */
  panKey = 0,
  className = "",
}) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!hostRef.current || mapRef.current) return undefined;

    const map = L.map(hostRef.current, {
      center: BAKU,
      zoom: 11,
      zoomControl: false,
      attributionControl: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      className: "eh-map-tiles",
    }).addTo(map);

    const bounds = [];
    DEMO_LOTS.forEach((lot) => {
      if (lot.lat == null || lot.lng == null) return;
      const marker = L.marker([lot.lat, lot.lng], {
        icon: makeIcon(lot, false),
        riseOnHover: true,
        keyboard: true,
        title: lot.registryNo,
      });
      marker.bindTooltip(lotTitle(lot, locale), {
        direction: "top",
        offset: [0, -34],
        opacity: 0.95,
        className: "eh-map-tooltip",
      });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current?.(lot.id, { fromMap: true });
      });
      marker.addTo(map);
      markersRef.current.set(lot.id, { marker, lot });
      bounds.push([lot.lat, lot.lng]);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }

    mapRef.current = map;

    let alive = true;
    const timers = [];

    // Контейнер absolute — без invalidateSize маркеры «уезжают».
    // Strict Mode / unmount: не трогаем карту после remove (иначе _leaflet_pos).
    const fixSize = () => {
      if (!alive || mapRef.current !== map) return;
      if (!map.getContainer?.()?.isConnected) return;
      if (!map._mapPane) return;
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore mid-teardown */
      }
    };

    const raf = requestAnimationFrame(() => {
      fixSize();
      timers.push(setTimeout(fixSize, 80));
      timers.push(setTimeout(fixSize, 320));
    });

    const ro = new ResizeObserver(() => fixSize());
    ro.observe(hostRef.current);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map once
  }, []);

  useEffect(() => {
    markersRef.current.forEach(({ marker, lot }, id) => {
      marker.setIcon(makeIcon(lot, id === selectedId));
      try {
        marker.setTooltipContent(lotTitle(lot, locale));
      } catch {
        /* ignore */
      }
    });
  }, [selectedId, locale]);

  useEffect(() => {
    if (!panKey || !selectedId || !mapRef.current) return;
    const entry = markersRef.current.get(selectedId);
    if (!entry) return;
    const map = mapRef.current;
    if (!map.getContainer?.()?.isConnected || !map._mapPane) return;
    try {
      map.invalidateSize({ animate: false });
      map.panTo(entry.marker.getLatLng(), { animate: true, duration: 0.35 });
    } catch {
      /* ignore */
    }
  }, [panKey, selectedId]);

  return (
    <div className={`eh-lots-map relative overflow-hidden ${className}`}>
      <div ref={hostRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-12 bg-gradient-to-b from-[#05070b]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] h-14 bg-gradient-to-t from-[#05070b]/45 to-transparent" />
    </div>
  );
}
