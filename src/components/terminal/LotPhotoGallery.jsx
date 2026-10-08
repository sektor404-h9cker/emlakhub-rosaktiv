"use client";

/**
 * Галерея фото: proxy herrac + fallback на прямой URL
 */

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { lotPhotos } from "@/lib/lots/photos";
import { herracDirectUrl, mediaUrl } from "@/lib/lots/mediaUrl";

function SafeImg({ src, alt = "", className = "", onClick }) {
  const proxied = mediaUrl(src);
  const direct = herracDirectUrl(src);
  const [phase, setPhase] = useState("proxy"); // proxy | direct | fail
  const [seenSrc, setSeenSrc] = useState(src);
  if (src !== seenSrc) {
    setSeenSrc(src);
    setPhase("proxy");
  }

  if (!proxied || phase === "fail") {
    return (
      <div
        className={`flex items-center justify-center bg-[#151922] text-[#475569] ${className}`}
        onClick={onClick}
      >
        <Images size={18} />
      </div>
    );
  }

  const shown = phase === "direct" && direct ? direct : proxied;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={shown}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => {
        if (phase === "proxy" && direct && direct !== proxied) {
          setPhase("direct");
        } else {
          setPhase("fail");
        }
      }}
      onClick={onClick}
    />
  );
}

export default function LotPhotoGallery({
  lot,
  alt = "",
  className = "",
  aspectClass = "aspect-[16/11]",
  children,
}) {
  const photos = lotPhotos(lot);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [seenLotId, setSeenLotId] = useState(lot?.id);
  if (lot?.id !== seenLotId) {
    setSeenLotId(lot?.id);
    setIdx(0);
    setLightbox(false);
  }

  useEffect(() => {
    if (!lightbox) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + photos.length) % photos.length);
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  if (!photos.length) {
    return (
      <div
        className={`relative flex ${aspectClass} items-center justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] to-[#1e293b] ${className}`}
      >
        <div className="text-center">
          <Images className="mx-auto mb-2 text-[#475569]" size={28} />
          <div className="font-mono text-[11px] uppercase tracking-widest text-[#64748b]">
            {lot?.registryNo || lot?.id || "—"}
          </div>
        </div>
      </div>
    );
  }

  const safeIdx = ((idx % photos.length) + photos.length) % photos.length;
  const current = photos[safeIdx];
  const go = (delta) =>
    setIdx((i) => (i + delta + photos.length) % photos.length);

  const overlay =
    typeof children === "function"
      ? children({ index: safeIdx, url: current, total: photos.length })
      : children;

  return (
    <div className={`relative flex min-h-0 flex-col ${className}`}>
      <div
        className={`relative ${aspectClass} shrink-0 overflow-hidden bg-[#111]`}
      >
        <button
          type="button"
          className="absolute inset-0 z-0"
          onClick={() => setLightbox(true)}
          aria-label="Open photo"
        >
          <SafeImg
            src={current}
            alt={alt}
            className="h-full w-full object-cover transition duration-300"
          />
        </button>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {overlay ? (
          <div className="pointer-events-none absolute inset-0 z-[5]">
            {overlay}
          </div>
        ) : null}

        {photos.length > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/75"
              aria-label="Previous photo"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/15 bg-black/55 p-1.5 text-white backdrop-blur-sm transition hover:bg-black/75"
              aria-label="Next photo"
            >
              <ChevronRight size={18} />
            </button>
          </>
        ) : null}

        <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2 py-1 font-mono text-[10px] tabular-nums text-white backdrop-blur-sm">
          <Images size={12} className="text-[#93c5fd]" />
          {safeIdx + 1} / {photos.length}
        </div>
      </div>

      {photos.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-[#0a0c12] px-3 py-2 [scrollbar-width:none] sm:flex-wrap sm:justify-center sm:overflow-visible [&::-webkit-scrollbar]:hidden">
          {photos.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              className={[
                "relative h-11 w-14 shrink-0 snap-start overflow-hidden rounded-lg border transition",
                i === safeIdx
                  ? "border-white/40 opacity-100"
                  : "border-white/10 opacity-60 hover:opacity-100",
              ].join(" ")}
            >
              <SafeImg src={src} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => setLightbox(false)}
          />
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 z-10 rounded-full border border-white/20 bg-black/60 p-2 text-white"
            aria-label="Close lightbox"
          >
            <X size={20} />
          </button>
          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-3 z-10 rounded-full border border-white/20 bg-black/60 p-2 text-white sm:left-6"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-3 z-10 rounded-full border border-white/20 bg-black/60 p-2 text-white sm:right-6"
              >
                <ChevronRight size={24} />
              </button>
            </>
          ) : null}
          <SafeImg
            src={current}
            alt={alt}
            className="relative z-[1] max-h-[88dvh] max-w-[min(1100px,96vw)] object-contain"
          />
          <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 font-mono text-[12px] text-white">
            {safeIdx + 1} / {photos.length}
          </div>
        </div>
      ) : null}
    </div>
  );
}
