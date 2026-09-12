"use client";

/**
 * ============================================================================
 * HeroSection — первый экран, который «продаёт доступ»
 * ============================================================================
 * Маркетинговая логика (A→Я):
 * 1. Eyebrow: кто мы (B2B терминал) — мгновенная категоризация.
 * 2. Headline: обещание результата (маржа + прозрачность).
 * 3. Subhead: как именно — аукционы, риски, прибыль до сделки.
 * 4. Pillars: 3 коротких доказательства ценности (без карточек-шума).
 * 5. CTA: единственный магнит → закрытый дашборд.
 * 6. Dual-brand: Digital Emlak / RosAktiv — международный статус.
 *
 * Визуал Quiet Luxury × SpaceX:
 * - Full-bleed атмосфера (сетка + градиент midnight), не inset-карточка.
 * - Бренд и headline доминируют; вторичный текст титановый.
 * - Золото только в одном месте рядом с «маржой» — якорь прибыли.
 * ============================================================================
 */

import LandingNav from "./LandingNav";
import MagneticCta from "./MagneticCta";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function HeroSection() {
  const { t } = useLocale();

  return (
    <section className="relative min-h-[100dvh] overflow-hidden">
      {/* Техническая сетка: ощущение инженерной точности */}
      <div aria-hidden className="eh-grid-atmosphere pointer-events-none absolute inset-0" />

      {/* Вертикальный «луч» — намёк на сканирование данных (SpaceX vibe) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[55vh] w-px -translate-x-1/2 bg-[linear-gradient(180deg,rgba(62,207,255,0.45),transparent)] opacity-60"
      />

      <LandingNav />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pb-16 pt-16 sm:px-8 sm:pt-20 lg:px-12 lg:pt-24">
        {/* Статус-линия: «система живая» — повышает доверие без статистики-шума */}
        <p className="eh-rise eh-rise-delay-1 mb-6 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--eh-titanium)]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--eh-cyan)] opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--eh-cyan)]" />
          </span>
          {t.status}
        </p>

        <p className="eh-rise eh-rise-delay-1 mb-4 text-[12px] uppercase tracking-[0.28em] text-[var(--eh-cyan)]">
          {t.eyebrow}
        </p>

        {/*
          Headline — бренд-уровень силы:
          крупно, спокойно, без «кричащего» маркетинга.
          Конверсия растёт, когда инвестор сразу видит outcome.
        */}
        <h1 className="eh-rise eh-rise-delay-2 max-w-4xl text-[clamp(2.4rem,6vw,4.6rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--eh-ink)]">
          {t.headline}
        </h1>

        <p className="eh-rise eh-rise-delay-3 mt-6 max-w-2xl text-[15px] sm:text-[17px] leading-relaxed text-[var(--eh-titanium-bright)]/85">
          {t.subhead}
        </p>

        {/* Три опоры ценности — линейный ритм, не карточки */}
        <ul className="eh-rise eh-rise-delay-3 mt-10 grid max-w-3xl gap-5 sm:grid-cols-3">
          {t.pillars.map((pillar, index) => (
            <li key={pillar.label} className="relative pl-4">
              <span
                aria-hidden
                className={[
                  "absolute left-0 top-1 h-8 w-px",
                  index === 0
                    ? "bg-[var(--eh-gold)]" // золото = маржа
                    : "bg-[var(--eh-cyan)]", // cyan = tech / прозрачность / аналитика
                ].join(" ")}
              />
              <div className="text-[11px] uppercase tracking-[0.22em] text-[var(--eh-titanium)]">
                {pillar.label}
              </div>
              <div className="mt-1.5 text-[14px] text-[var(--eh-ink)]/90">
                {pillar.text}
              </div>
            </li>
          ))}
        </ul>

        <div className="eh-rise eh-rise-delay-4 mt-12">
          <MagneticCta href="/login" />
        </div>

        <p className="eh-rise eh-rise-delay-4 mt-10 max-w-xl text-[12px] leading-relaxed tracking-wide text-[var(--eh-titanium)]">
          {t.dualBrand}
        </p>
      </div>

      {/* Нижний градиент: мягкий «край земли» — взгляд не упирается в обрез */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(11,13,16,0.9))]"
      />
    </section>
  );
}
