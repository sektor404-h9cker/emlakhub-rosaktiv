"use client";

/**
 * LotsMap - Leaflet + OSM.
 * Плотные точки собираются в кластер. Клик по кластеру приближает карту.
 * Если точки уже не разъезжаются — они раскрываются веером.
 * Координаты городские, поэтому подпись «приблизительно» обязательна.
 */

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { lotTitle } from "@/lib/lots/helpers";
import { useLots } from "@/hooks/useLots";
import { ensureLotCoords } from "@/lib/geo/azCities";
import { marketMapColor } from "@/lib/lots/markets";

const BAKU = [40.4093, 49.8671];
const CLUSTER_PX = 46;

function markerHtml(lot, active) {
  const color = marketMapColor(lot.market);
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
      ">${lot.registryNo || lot.id}</div>
      <div style="
        position:absolute;left:50%;bottom:2px;width:14px;height:14px;
        margin-left:-7px;
        border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:${color};border:2px solid ${ring};
        box-shadow:0 2px 8px rgba(0,0,0,0.45);
      "></div>
    </div>
  `;
}

function makeIcon(lot, active) {
  return L.divIcon({
    className: "eh-lot-marker",
    html: markerHtml(lot, active),
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -28],
  });
}

function clusterIcon(count) {
  return L.divIcon({
    className: "eh-cluster",
    html: `<div class="eh-cluster-dot">${count}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function placedLots(lots) {
  return lots.filter((lot) => lot.lat != null && lot.lng != null);
}

function clusterAt(map, lots, radiusPx) {
  const clusters = [];
  for (const lot of lots) {
    const pt = map.latLngToContainerPoint([lot.lat, lot.lng]);
    let hit = null;
    for (const cluster of clusters) {
      const dx = cluster.pt.x - pt.x;
      const dy = cluster.pt.y - pt.y;
      if (dx * dx + dy * dy <= radiusPx * radiusPx) {
        hit = cluster;
        break;
      }
    }
    if (hit) {
      hit.lots.push(lot);
      hit.pt = map.latLngToContainerPoint(meanLatLng(hit.lots));
    } else {
      clusters.push({ lots: [lot], pt });
    }
  }
  return clusters.map((cluster) => {
    const center = meanLatLng(cluster.lots);
    return { lots: cluster.lots, lat: center[0], lng: center[1] };
  });
}

function meanLatLng(lots) {
  const lat = lots.reduce((sum, lot) => sum + Number(lot.lat), 0) / lots.length;
  const lng = lots.reduce((sum, lot) => sum + Number(lot.lng), 0) / lots.length;
  return [lat, lng];
}

function spiderLatLng(map, center, index, count) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  const origin = map.latLngToContainerPoint(center);
  const point = L.point(
    origin.x + Math.cos(angle) * 28,
    origin.y + Math.sin(angle) * 28
  );
  const next = map.containerPointToLatLng(point);
  return [next.lat, next.lng];
}

export default function LotsMap({
  locale = "ru",
  selectedId = null,
  onSelect,
  onHover,
  panKey = 0,
  className = "",
  lots: lotsProp = null,
}) {
  const { lots: fetchedLots } = useLots({
    enabled: lotsProp == null,
  });
  const lots = (lotsProp ?? fetchedLots).map(ensureLotCoords);
  const lotsKey = lots.map((lot) => `${lot.id}:${lot.lat}:${lot.lng}`).join("|");
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const groupRef = useRef(null);
  const markersRef = useRef(new Map());
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const lotsRef = useRef(lots);
  const selectedRef = useRef(selectedId);
  const localeRef = useRef(locale);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onHoverRef.current = onHover;
    lotsRef.current = lots;
    selectedRef.current = selectedId;
    localeRef.current = locale;
  }, [onSelect, onHover, lots, selectedId, locale]);

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

    groupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    let alive = true;
    const timers = [];
    const fixSize = () => {
      if (!alive || mapRef.current !== map) return;
      if (!map.getContainer?.()?.isConnected) return;
      if (!map._mapPane) return;
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore */
      }
    };

    const raf = requestAnimationFrame(() => {
      fixSize();
      timers.push(setTimeout(fixSize, 80));
      timers.push(setTimeout(fixSize, 320));
    });

    const ro = new ResizeObserver(() => fixSize());
    ro.observe(hostRef.current);
    const markers = markersRef.current;

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      groupRef.current = null;
      markers.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const group = groupRef.current;
    if (!map || !group) return undefined;

    let spider = null;

    const addPin = (lot, latlng) => {
      const marker = L.marker(latlng, {
        icon: makeIcon(lot, lot.id === selectedRef.current),
        riseOnHover: true,
        keyboard: true,
        title: lot.registryNo || lot.id,
      });
      marker.bindTooltip(lotTitle(lot, localeRef.current), {
        direction: "top",
        offset: [0, -34],
        opacity: 0.95,
        className: "eh-map-tooltip",
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectRef.current?.(lot.id, { fromMap: true });
      });
      marker.on("mouseover", () => onHoverRef.current?.(lot.id));
      marker.on("mouseout", () => onHoverRef.current?.(null));
      marker.addTo(group);
      markersRef.current.set(lot.id, { marker, lot });
    };

    const draw = () => {
      if (!map.getContainer?.()?.isConnected || !map._mapPane) return;
      group.clearLayers();
      markersRef.current.clear();
      if (spider && spider.zoom !== map.getZoom()) spider = null;

      const visible = placedLots(lotsRef.current);
      const spiderIds = spider?.ids || null;
      const pinned = spiderIds ? visible.filter((lot) => spiderIds.has(lot.id)) : [];
      const rest = spiderIds ? visible.filter((lot) => !spiderIds.has(lot.id)) : visible;

      if (pinned.length) {
        const center = meanLatLng(pinned);
        pinned.forEach((lot, index) => {
          const latlng = spiderLatLng(map, center, index, pinned.length);
          L.polyline([center, latlng], {
            color: "rgba(255,255,255,0.38)",
            weight: 1,
            interactive: false,
          }).addTo(group);
          addPin(lot, latlng);
        });
      }

      for (const cluster of clusterAt(map, rest, CLUSTER_PX)) {
        if (cluster.lots.length === 1) {
          addPin(cluster.lots[0], [cluster.lots[0].lat, cluster.lots[0].lng]);
          continue;
        }
        const marker = L.marker([cluster.lat, cluster.lng], {
          icon: clusterIcon(cluster.lots.length),
          keyboard: true,
          title:
            localeRef.current === "az"
              ? `${cluster.lots.length} lot`
              : `${cluster.lots.length} лотов`,
        });
        marker.on("click", (event) => {
          L.DomEvent.stopPropagation(event);
          const bounds = L.latLngBounds(cluster.lots.map((lot) => [lot.lat, lot.lng]));
          let span = 0;
          try {
            span = bounds.getNorthEast().distanceTo(bounds.getSouthWest());
          } catch {
            span = 0;
          }
          if (span > 180 && map.getZoom() < 15) {
            map.fitBounds(bounds, {
              padding: [72, 72],
              maxZoom: Math.min(16, map.getZoom() + 2),
              animate: true,
            });
            return;
          }
          spider = {
            zoom: map.getZoom(),
            ids: new Set(cluster.lots.map((lot) => lot.id)),
          };
          draw();
        });
        marker.addTo(group);
      }
    };

    draw();
    map.on("zoomend", draw);
    return () => {
      map.off("zoomend", draw);
    };
  }, [lotsKey, locale, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = placedLots(lotsRef.current).map((lot) => [lot.lat, lot.lng]);
    if (!bounds.length) return;
    if (!map.getContainer?.()?.isConnected || !map._mapPane) return;
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    } catch {
      /* ignore */
    }
  }, [lotsKey]);

  useEffect(() => {
    if (!panKey || !selectedId || !mapRef.current) return;
    const lot = lotsRef.current.find((item) => item.id === selectedId);
    if (!lot || lot.lat == null || lot.lng == null) return;
    const map = mapRef.current;
    if (!map.getContainer?.()?.isConnected || !map._mapPane) return;
    try {
      map.invalidateSize({ animate: false });
      map.setView([lot.lat, lot.lng], Math.max(map.getZoom(), 13), { animate: true });
    } catch {
      /* ignore */
    }
  }, [panKey, selectedId]);

  return (
    <div className={`eh-lots-map relative overflow-hidden ${className}`}>
      <div ref={hostRef} className="absolute inset-0 z-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-12 bg-gradient-to-b from-[#05070b]/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] h-14 bg-gradient-to-t from-[#05070b]/45 to-transparent" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[450] rounded-md bg-[#0b0d12]/90 px-2.5 py-1 text-[11px] text-[#f5d0a9]">
        {locale === "az"
          ? "Təxmini yerləşmə"
          : locale === "en"
            ? "Approximate location"
            : "Приблизительное расположение"}
      </div>
      {!lots.length ? (
        <div className="pointer-events-none absolute inset-0 z-[450] flex items-center justify-center bg-[#05070b]/40 px-6 text-center text-[13px] text-[#94a3b8]">
          {locale === "az"
            ? "Xəritədə lot yoxdur — siyahı boşdur və ya yüklənmir."
            : "На карте нет лотов — список пуст или ещё грузится."}
        </div>
      ) : null}
    </div>
  );
}
