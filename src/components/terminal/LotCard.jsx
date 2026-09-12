"use client";

/**
 * =============================================================================
 * LotCard — фото + Vision overlay + метаданные лота
 * =============================================================================
 */

import VisionOverlay from "./VisionOverlay";

export default function LotCard({ lot }) {
  if (!lot) {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0a] text-[13px] text-[#6b7280]">
        Выберите лот
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">
            Vision · инспекция
          </div>
          <div className="mt-0.5 text-[14px] font-medium text-white">{lot.title}</div>
        </div>
        <div className="font-mono text-[11px] text-[#b8956c]">{lot.id}</div>
      </div>

      <div className="relative aspect-[16/10] bg-[#111]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lot.photo}
          alt={lot.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <VisionOverlay defects={lot.defects} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 35%, rgba(0,0,0,0.45) 100%)",
          }}
        />
      </div>
    </div>
  );
}
