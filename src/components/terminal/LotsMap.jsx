"use client";

/**
 * =============================================================================
 * LotsMap — Leaflet + Carto Dark Matter (OSM tiles, без API-ключа)
 * =============================================================================
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_LOTS, lotTitle } from "@/data/demoLots";

const BAKU = [40.4093, 49.8671];

function markerHtml(lot, active) {
  const color = lot.market === "estate" ? "#34d399" : "#38bdf8";
  const glow = active ? "0 0 0 4px rgba(37,99,235,0.45)" : "0 8px 20px rgba(0,0,0,0.45)";
  const scale = active ? "1.08" : "1";
  return `
    <div style="transform:scale(${scale}); transform-origin:bottom center; transition:transform .2s ease">
      <div style="
        background:${active ? "#2563eb" : "rgba(10,12,18,0.92)"};
        color:#fff;
        border:1px solid ${active ? "rgba(147,197,253,0.7)" : "rgba(255,255,255,0.14)"};
        border-radius:8px;
        padding:3px 7px;
        font:600 9px/1.2 ui-monospace, SFMono-Regular, Menlo, monospace;
        white-space:nowrap;
        box-shadow:${glow};
        margin-bottom:4px;
        text-align:center;
      ">${lot.registryNo}</div>
      <div style="
        width:14px;height:14px;margin:0 auto;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:2px solid rgba(255,255,255,0.85);
        box-shadow:0 4px 12px rgba(0,0,0,0.5);
      "></div>
    </div>
  `;
}

export default function LotsMap({
  locale = "ru",
  selectedId = null,
  onSelect,
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
      preferCanvas: true,
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
      const icon = L.divIcon({
        className: "eh-lot-marker",
        html: markerHtml(lot, false),
        iconSize: [90, 44],
        iconAnchor: [45, 44],
      });
      const marker = L.marker([lot.lat, lot.lng], { icon, riseOnHover: true });
      marker.bindTooltip(lotTitle(lot, locale), {
        direction: "top",
        offset: [0, -40],
        opacity: 0.95,
        className: "eh-map-tooltip",
      });
      marker.on("click", () => onSelectRef.current?.(lot.id));
      marker.addTo(map);
      markersRef.current.set(lot.id, { marker, lot });
      bounds.push([lot.lat, lot.lng]);
    });

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
    }

    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(hostRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    markersRef.current.forEach(({ marker, lot }, id) => {
      marker.setIcon(
        L.divIcon({
          className: "eh-lot-marker",
          html: markerHtml(lot, id === selectedId),
          iconSize: [90, 44],
          iconAnchor: [45, 44],
        })
      );
      marker.setTooltipContent(lotTitle(lot, locale));
    });

    if (selectedId && mapRef.current) {
      const entry = markersRef.current.get(selectedId);
      if (entry) {
        mapRef.current.flyTo(entry.marker.getLatLng(), 13, {
          duration: 0.7,
        });
      }
    }
  }, [selectedId, locale]);

  return (
    <div className={`eh-lots-map relative overflow-hidden ${className}`}>
      <div ref={hostRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-16 bg-gradient-to-b from-[#05070b]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] h-20 bg-gradient-to-t from-[#05070b]/50 to-transparent" />
    </div>
  );
}
