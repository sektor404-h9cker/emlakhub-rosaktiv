"use client";

/**
 * Маркеры на фото — цвет по типу (ржавчина / коррозия / …), без текста на картинке.
 */

import { motion } from "framer-motion";

export default function VisionOverlay({
  defects = [],
  show = true,
  locale = "ru",
  interactive = true,
  activeId = null,
  onSelect,
}) {
  const az = locale === "az";

  const visible = defects.filter(
    (d) =>
      d.showOnPhoto !== false &&
      Number(d.w || 0) > 0 &&
      Number(d.h || 0) > 0
  );

  if (!show || !visible.length) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {visible.map((d, i) => {
        const n = d.n || i + 1;
        const isOn = activeId == null ? i === 0 : activeId === d.id;
        const color = d.color || (d.severity === "high" ? "#f59e0b" : "#e8d5b0");
        const left = Math.min(
          94,
          Math.max(4, (d.x || 10) + (d.w || 12) / 2)
        );
        const top = Math.min(
          90,
          Math.max(6, (d.y || 12) + (d.h || 10) / 2)
        );
        const rw = Math.max(10, Math.min(36, d.w || 14));
        const rh = Math.max(10, Math.min(36, d.h || 14));

        return (
          <motion.button
            key={d.id}
            type="button"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 * i, duration: 0.3 }}
            onClick={(e) => {
              e.stopPropagation();
              if (interactive) onSelect?.(d.id);
            }}
            className={[
              "absolute -translate-x-1/2 -translate-y-1/2",
              interactive ? "pointer-events-auto cursor-pointer" : "",
            ].join(" ")}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-pressed={isOn}
            aria-label={
              locale === "az"
                ? d.labelAz || d.label
                : locale === "en"
                  ? d.labelEn || d.labelRu || d.label
                  : d.labelRu || d.label
            }
          >
            {/* полупрозрачное пятно зоны */}
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition"
              style={{
                width: `${rw * 2.2}px`,
                height: `${rh * 2.2}px`,
                background: isOn
                  ? `${color}33`
                  : `${color}18`,
                boxShadow: isOn
                  ? `0 0 0 1.5px ${color}, 0 0 18px ${color}55`
                  : `0 0 0 1px ${color}88`,
              }}
            />
            {/* пульс для rust/corrosion */}
            {(d.kind === "rust" || d.kind === "corrosion") && (
              <motion.span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: 28,
                  height: 28,
                  border: `1px solid ${color}`,
                }}
                animate={{ scale: [1, 1.55, 1], opacity: [0.55, 0, 0.55] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
              />
            )}
            <span
              className="relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-black shadow-lg ring-2 ring-black/50"
              style={{
                background: color,
                transform: isOn ? "scale(1.12)" : "scale(1)",
              }}
            >
              {n}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
