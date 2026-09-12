"use client";

/**
 * =============================================================================
 * VisionOverlay — UI-сетка дефектов поверх фото (Vision AI слой)
 * =============================================================================
 */

import { motion } from "framer-motion";

export default function VisionOverlay({ defects = [], show = true }) {
  if (!show) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Сетка */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(184,149,108,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(184,149,108,0.35) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {defects.map((d, i) => (
        <motion.div
          key={d.id}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.w}%`,
            height: `${d.h}%`,
          }}
        >
          <div
            className="absolute inset-0 rounded-sm"
            style={{
              border: "1px solid rgba(184,149,108,0.85)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.35), inset 0 0 20px rgba(184,149,108,0.08)",
              background: "rgba(184,149,108,0.08)",
            }}
          />
          <span className="absolute -left-px -top-px h-2 w-2 border-l border-t border-[#e8d5b0]" />
          <span className="absolute -right-px -top-px h-2 w-2 border-r border-t border-[#e8d5b0]" />
          <span className="absolute -bottom-px -left-px h-2 w-2 border-b border-l border-[#e8d5b0]" />
          <span className="absolute -bottom-px -right-px h-2 w-2 border-b border-r border-[#e8d5b0]" />

          <div className="absolute -top-6 left-0 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-[#e8d5b0]">
            {d.label}
            {d.cost ? (
              <span className="ml-1 text-[#9aa3ad]">−{d.cost.toLocaleString("en-US")}</span>
            ) : null}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
