"use client";

/**
 * =============================================================================
 * EmlakLogo — знак терминала (тот же бренд, OLED-контекст)
 * =============================================================================
 */

import { BrandMark } from "@/components/brand/BrandLockup";

export default function EmlakLogo({ compact = false }) {
  return (
    <div className="group flex items-center gap-3">
      <span className="relative shrink-0 transition-transform duration-500 group-hover:scale-[1.04]">
        <BrandMark size={compact ? 32 : 36} />
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[14px] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-70"
          style={{
            background: "radial-gradient(circle, rgba(184,149,108,0.4), transparent 70%)",
          }}
        />
      </span>
      {!compact ? (
        <div className="leading-tight">
          <div className="font-serif text-[15px] font-semibold tracking-tight text-white">
            Emlak Hub
          </div>
          <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.22em] text-[#64748b]">
            Digital Terminal
          </div>
        </div>
      ) : null}
    </div>
  );
}
