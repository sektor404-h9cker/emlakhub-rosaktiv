"use client";

/**
 * ============================================================================
 * MagneticCta — «магнит» к закрытому терминалу
 * ============================================================================
 * Зачем эта кнопка именно такая:
 * 1) Конверсия: на hero должно быть ОДНО главное действие.
 *    «Войти в систему» = обещание доступа к капиталу знаний, не «узнать больше».
 * 2) Магнетический hover: кнопка слегка следует за курсором —
 *    подсознание читает это как «живой интерфейс / премиум продукт».
 * 3) Неоновое дыхание (cyan glow): tech-сигнал SpaceX без кислотного неона.
 * 4) Золотая тонкая линия внутри — намёк на прибыль (Quiet Luxury).
 *
 * Под капотом: считаем смещение курсора относительно центра кнопки
 * и применяем translate3d (GPU) — плавно и без дёрганья layout.
 * ============================================================================
 */

import Link from "next/link";
import { useRef } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function MagneticCta({ href = "/login" }) {
  const { t } = useLocale();
  const ref = useRef(null);

  function onMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    // Сила магнита умеренная: 0.22 — «притяжение», не «прыжок»
    el.style.transform = `translate3d(${x * 0.22}px, ${y * 0.22}px, 0)`;
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0, 0, 0)";
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-3">
      {/* Внешний ореол — «дыхание» терминала */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-2xl bg-[radial-gradient(circle_at_center,rgba(62,207,255,0.18),transparent_65%)] blur-xl"
      />

      <Link
        href={href}
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={[
          "eh-cta-glow group relative inline-flex items-center justify-center gap-3",
          "rounded-xl px-8 py-4 sm:px-10 sm:py-4.5",
          "bg-[linear-gradient(135deg,#0e1f38_0%,#12151a_45%,#0a1628_100%)]",
          "border border-[rgba(62,207,255,0.35)]",
          "text-[var(--eh-ink)] font-semibold tracking-[0.04em]",
          "transition-[transform,border-color,background] duration-200 ease-out",
          "hover:border-[rgba(62,207,255,0.7)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--eh-cyan)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--eh-graphite)]",
        ].join(" ")}
      >
        {/* Тонкая золотая «жила» — акцент на прибыли, не на декоре */}
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--eh-gold),transparent)] opacity-70"
        />

        <span className="relative text-[15px] sm:text-base">{t.cta}</span>

        {/* Стрелка: микро-движение вправо на hover усиливает «вход» */}
        <span
          aria-hidden
          className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(62,207,255,0.35)] bg-[var(--eh-cyan-soft)] text-[var(--eh-cyan)] transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </Link>

      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--eh-titanium)]">
        {t.ctaHint}
      </p>
    </div>
  );
}
