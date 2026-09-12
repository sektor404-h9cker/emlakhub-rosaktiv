"use client";

/**
 * ============================================================================
 * PremiumLanding — White Premium (SpaceX × Ralph Lauren)
 * ============================================================================
 * Перенесено из DigitalEmlakPlatform и адаптировано под Next.js.
 * RosAktiv Hub: в разработке, скоро для России (не «уже развёрнут»).
 * ============================================================================
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Gauge,
  Globe2,
  Menu,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import LanguageSwitch from "./LanguageSwitch";
import InteractiveSandbox from "./InteractiveSandbox";
import AuctionTicker from "./AuctionTicker";
import UnitEconomicsSandbox from "./UnitEconomicsSandbox";
import PremiumFAQ from "./PremiumFAQ";
import TargetAudience from "./TargetAudience";
import EvaluationPipeline from "./EvaluationPipeline";
import { LandingDealProvider } from "./LandingDealContext";
import BrandLockup from "@/components/brand/BrandLockup";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

function FlagAz({ className = "" }) {
  const uid = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <clipPath id={`az-clip-${uid}`}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#az-clip-${uid})`}>
        <rect width="32" height="10.67" fill="#00B5E2" />
        <rect y="10.67" width="32" height="10.66" fill="#E30A17" />
        <rect y="21.33" width="32" height="10.67" fill="#3F9C35" />
        <circle cx="13.6" cy="16" r="3.6" fill="#fff" />
        <circle cx="14.85" cy="16" r="2.95" fill="#E30A17" />
        <path
          fill="#fff"
          d="M19.85 16l.55-1.7.22 1.78 1.55-.85-1.15 1.35 1.72.4-1.72.4 1.15 1.35-1.55-.85-.22 1.78L19.85 17.7l-.55 1.7-.22-1.78-1.55.85 1.15-1.35-1.72-.4 1.72-.4-1.15-1.35 1.55.85.22-1.78z"
        />
      </g>
    </svg>
  );
}

function FlagRu({ className = "" }) {
  const uid = React.useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <clipPath id={`ru-clip-${uid}`}>
          <circle cx="16" cy="16" r="16" />
        </clipPath>
      </defs>
      <g clipPath={`url(#ru-clip-${uid})`}>
        <rect width="32" height="10.67" fill="#FFFFFF" />
        <rect y="10.67" width="32" height="10.66" fill="#0039A6" />
        <rect y="21.33" width="32" height="10.67" fill="#D52B1E" />
      </g>
      <circle cx="16" cy="16" r="15.4" fill="none" stroke="rgba(15,23,42,0.1)" strokeWidth="1.2" />
    </svg>
  );
}

function HeroSignal({ icon: Icon, children }) {
  return (
    <div className="group flex min-w-0 items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 transition-colors duration-300 group-hover:border-slate-800 group-hover:bg-slate-900 group-hover:text-white">
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <span className="text-[12px] font-medium leading-snug tracking-tight text-slate-600 sm:text-[13px]">
        {children}
      </span>
    </div>
  );
}

/** Плоские статус-полоски рынков — без «толстых» карточек */
function MarketCard({ active, flag, badge, name, country, meta }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3",
        active
          ? "border-slate-800/90 bg-slate-900 text-white"
          : "border-slate-200 bg-white/80 text-slate-800",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full",
          active ? "ring-1 ring-white/20" : "ring-1 ring-slate-200",
        ].join(" ")}
      >
        {flag}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium tracking-tight sm:text-[14px]">
            {name}
          </span>
          <span
            className={[
              "shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em]",
              active
                ? "bg-white/12 text-white/80"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>
        <div
          className={[
            "mt-0.5 truncate text-[11px] tracking-tight",
            active ? "text-white/45" : "text-slate-500",
          ].join(" ")}
        >
          {country}
          <span className={active ? "text-white/25" : "text-slate-300"}> · </span>
          {meta}
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = "", hover = true }) {
  return (
    <div
      className={[
        hover ? "eh-card" : "eh-card-static",
        "bg-white/90 backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Sparkline({ data, stroke = "#141414" }) {
  const w = 96;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = React.useId();
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={stroke} />
    </svg>
  );
}

function StatCard({ value, label, accent, spark, sparkColor }) {
  return (
    <motion.div
      {...fadeUp}
      whileHover={reduceMotionSafe()}
      className="eh-card group min-w-0 p-4 sm:p-5 lg:p-6"
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div
          className={[
            "font-serif text-2xl font-semibold leading-none tracking-[-0.03em] tabular-nums transition-transform duration-500 group-hover:scale-[1.02] sm:text-3xl sm:text-[2.65rem]",
            accent || "text-slate-900",
          ].join(" ")}
        >
          {value}
        </div>
        <div className="hidden sm:block">{spark && <Sparkline data={spark} stroke={sparkColor || "#141414"} />}</div>
      </div>
      <div className="mt-2.5 text-[9px] font-medium uppercase leading-snug tracking-[0.12em] text-slate-500 sm:mt-3.5 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </div>
    </motion.div>
  );
}

function reduceMotionSafe() {
  return { y: -2, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } };
}

export default function PremiumLanding() {
  const { locale: lang } = useLocale();
  const ru = lang === "ru";
  const reduce = useReducedMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const entryHref = "/login";

  const t = useMemo(
    () => ({
      nav: {
        platform: ru ? "Платформа" : "Platforma",
        security: ru ? "Безопасность" : "Təhlükəsizlik",
        global: ru ? "Международно" : "Beynəlxalq",
        login: ru ? "Войти" : "Daxil ol",
      },
      hero: {
        eyebrow: ru ? "Закрытый B2B-терминал" : "Bağlı B2B-terminal",
        titleLines: ru
          ? ["Цифровое управление", "государственной", "собственностью"]
          : ["Dövlət əmlakının", "rəqəmsal idarəetməsi"],
        sub: ru
          ? "Риски и чистая маржа видны до ставки. Без шума — только решение."
          : "Risklər və xalis marja təklifdən əvvəl görünür. Səs-küy yox — yalnız qərar.",
        signals: ru
          ? [
              { icon: Zap, text: "Ответ за доли секунды" },
              { icon: ShieldCheck, text: "Риски до задатка" },
              { icon: Gauge, text: "Чистая маржа на экране" },
            ]
          : [
              { icon: Zap, text: "Cavab saniyənin hissəsində" },
              { icon: ShieldCheck, text: "Risklər behdən əvvəl" },
              { icon: Gauge, text: "Xalis marja ekranda" },
            ],
        markets: [
          {
            active: true,
            name: "Digital Emlak Hub",
            country: ru ? "Азербайджан" : "Azərbaycan",
            meta: "emlakhub.net",
            badge: ru ? "Доступен" : "Əlçatan",
            flag: "az",
          },
          {
            active: false,
            name: "RosAktiv Hub",
            country: ru ? "Россия" : "Rusiya",
            meta: ru ? "скоро" : "tezliklə",
            badge: ru ? "В разработке" : "İnkişafda",
            flag: "ru",
          },
        ],
        cta: ru ? "Запросить доступ" : "Giriş istəyin",
        ctaSecondary: ru ? "Безопасность" : "Təhlükəsizlik",
      },
      stats: [
        {
          value: "247K+",
          label: ru ? "Лотов в контуре" : "Konturdakı lotlar",
          spark: [12, 18, 16, 24, 30, 28, 38, 44, 52, 61],
          sparkColor: "#0f172a",
        },
        {
          value: "<0.5s",
          label: ru ? "До цифры по сделке" : "Sövdə rəqəminə qədər",
          accent: "text-emerald-700",
          spark: [70, 74, 78, 82, 86, 90, 93, 96, 98, 99],
          sparkColor: "#047857",
        },
        {
          value: "2",
          label: ru ? "Рынка в дорожной карте" : "Yol xəritəsində bazar",
          spark: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2],
          sparkColor: "#0f172a",
        },
        {
          value: "0",
          label: ru ? "Утечек за периметр" : "Perimetrdən sızma",
          spark: [5, 4, 3, 3, 2, 2, 1, 1, 0, 0],
          sparkColor: "#0f172a",
        },
      ],
      pillars: [
        {
          title: ru ? "Капитал остаётся у вас" : "Kapital sizdə qalır",
          desc: ru
            ? "Фото, документы и расчёты не покидают закрытый контур. Доступ - только для приглашённого капитала."
            : "Foto, sənəd və hesablamalar bağlı konturdan çıxmır. Giriş - yalnız dəvətli kapital üçündür.",
          icon: ShieldCheck,
        },
        {
          title: ru ? "Каждая цифра объясняется" : "Hər rəqəm izah olunur",
          desc: ru
            ? "Маржа опирается на реестр, осмотр объекта и рыночные ориентиры - без «чёрного ящика»."
            : "Marja reyestrə, obyekt yoxlamasına və bazar istiqamətlərinə söykənir - «qara qutu» yoxdur.",
          icon: Gauge,
        },
        {
          title: ru ? "Один стандарт - два рынка" : "Bir standart - iki bazar",
          desc: ru
            ? "Азербайджан уже в работе. Россия - в подготовке. Юрисдикции разделены полностью."
            : "Azərbaycan artıq işləyir. Rusiya hazırlanır. Yurisdiksiyalar tam ayrılıb.",
          icon: Globe2,
        },
      ],
      comparison: {
        title: ru
          ? "Государственный портал + наш аналитический слой"
          : "Dövlət portalı + analitik qatımız",
        sub: ru
          ? "Мы не конкурируем с государством - мы усиливаем его данные."
          : "Dövlətlə rəqabət etmirik - onun məlumatlarını gücləndiririk.",
        official: {
          title: ru ? "Государственный портал" : "Dövlət portalı",
          items: ru
            ? [
                "Официальный реестр лотов",
                "Стартовая цена и условия",
                "Регистрация участника",
                "Залог и гарантийный взнос",
              ]
            : [
                "Rəsmi lot reyestri",
                "Başlanğıc qiymət və şərtlər",
                "İştirakçı qeydiyyatı",
                "Beh və zəmanət ödənişi",
              ],
        },
        hub: {
          title: "Digital Emlak Hub",
          items: ru
            ? [
                "Оценка ремонта и износа по фотографиям",
                "Поиск скрытых юридических рисков и обременений",
                "Расчёт чистой маржи до ставки",
                "Сравнение с рынком в один взгляд",
              ]
            : [
                "Fotolara görə təmir və aşınma qiymətləndirməsi",
                "Gizli hüquqi risk və yüklərin axtarışı",
                "Təklifdən əvvəl xalis marja",
                "Bir baxışda bazar müqayisəsi",
              ],
        },
      },
      cta: {
        title: ru ? "Следующий лот - без сюрпризов" : "Növbəti lot - sürprizsiz",
        sub: ru
          ? "Закрытый доступ для профессионального капитала. Без комиссии с выигранных лотов."
          : "Peşəkar kapital üçün bağlı giriş. Qazanılmış lotlardan komissiya yoxdur.",
        btn: ru ? "Запросить доступ" : "Giriş istəyin",
      },
    }),
    [ru]
  );

  return (
    <LandingDealProvider>
    <div className="eh-grain relative min-h-screen text-slate-800 selection:bg-slate-900 selection:text-[#fbfaf7]">
      {/* ── NAV ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-[#f8f9fb]/80 backdrop-blur-2xl">
        <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-8">
          <Link href="/" className="group relative z-10 flex min-w-0 items-center">
            <BrandLockup size={34} stacked className="sm:gap-3" />
          </Link>

          {/* Центр: Платформа / Безопасность / Международно */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-9">
              <a href="#platform" className="eh-link text-[13px] font-medium text-slate-600 hover:text-slate-900">
                {t.nav.platform}
              </a>
              <a href="#security" className="eh-link text-[13px] font-medium text-slate-600 hover:text-slate-900">
                {t.nav.security}
              </a>
              <a href="#global" className="eh-link text-[13px] font-medium text-slate-600 hover:text-slate-900">
                {t.nav.global}
              </a>
            </div>
          </div>

          <div className="relative z-10 hidden items-center gap-5 lg:flex">
            <LanguageSwitch variant="light" />
            <div className="h-4 w-px bg-slate-200" />
            <Link
              href={entryHref}
              className="eh-btn eh-btn-primary inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              {t.nav.login}
              <ArrowRight size={14} />
            </Link>
          </div>

          <button
            type="button"
            className="relative z-10 p-2 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md overflow-hidden"
            >
              <div className="p-6 flex flex-col gap-4">
                <a href="#platform" className="text-[15px] font-medium" onClick={() => setMobileOpen(false)}>
                  {t.nav.platform}
                </a>
                <a href="#security" className="text-[15px] font-medium" onClick={() => setMobileOpen(false)}>
                  {t.nav.security}
                </a>
                <a href="#global" className="text-[15px] font-medium" onClick={() => setMobileOpen(false)}>
                  {t.nav.global}
                </a>
                <LanguageSwitch variant="light" />
                <Link
                  href={entryHref}
                  className="py-3 rounded-lg bg-slate-900 text-white text-center font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.login}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO: свет + сетка + глубина ── */}
      <section className="eh-wash-silk relative flex min-h-[100dvh] flex-col overflow-hidden pt-14 sm:pt-16">
        <div aria-hidden className="bg-grid-hero pointer-events-none absolute inset-0 opacity-90" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 82% 12%, rgba(186,166,138,0.16), transparent 65%), radial-gradient(ellipse 45% 40% at 10% 75%, rgba(148,163,184,0.2), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background: "linear-gradient(to top, rgba(238,240,243,0.95), transparent)",
          }}
        />
        {!reduce ? (
          <>
            <motion.div
              aria-hidden
              className="eh-orb right-[-8%] top-[4%] h-[20rem] w-[20rem] bg-[#c4b49a]/25 sm:h-[30rem] sm:w-[30rem]"
              animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }}
              transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="eh-orb -left-[12%] bottom-[8%] h-[16rem] w-[16rem] bg-slate-400/30 sm:h-[22rem] sm:w-[22rem]"
              animate={{ opacity: [0.28, 0.45, 0.28], x: [0, 18, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            />
          </>
        ) : null}

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-10 sm:px-8 sm:py-14 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 xl:gap-16">
            <div className="min-w-0">
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:mb-6 sm:tracking-[0.22em]"
              >
                {t.hero.eyebrow}
              </motion.p>

              <h1 className={["eh-display", ru ? "eh-display-ru" : ""].join(" ")}>
                {t.hero.titleLines.map((line, i) => {
                  const last = i === t.hero.titleLines.length - 1;
                  return (
                    <span key={`${line}-${i}`} className="relative mt-[0.06em] block overflow-hidden first:mt-0">
                      <motion.span
                        className={["block", last ? "eh-display-muted" : ""].join(" ")}
                        initial={reduce ? false : { y: "105%", opacity: 0 }}
                        animate={{ y: "0%", opacity: 1 }}
                        transition={{
                          delay: 0.08 + i * 0.1,
                          duration: 0.75,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {line}
                      </motion.span>
                    </span>
                  );
                })}
              </h1>

              <motion.div
                initial={reduce ? false : { scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.38, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6 origin-left sm:mt-7"
                aria-hidden
              >
                <span className="block h-px w-12 bg-slate-900/70 sm:w-16" />
              </motion.div>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="mt-5 max-w-sm text-[15px] leading-relaxed text-slate-600 sm:mt-6 sm:max-w-md sm:text-[16px]"
              >
                {t.hero.sub}
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.48 }}
                className="mt-6 grid gap-3 sm:mt-7 sm:grid-cols-3 sm:gap-4"
              >
                {t.hero.signals.map((s) => (
                  <HeroSignal key={s.text} icon={s.icon}>
                    {s.text}
                  </HeroSignal>
                ))}
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54 }}
                className="mt-5 grid gap-3 sm:mt-6 sm:grid-cols-2"
              >
                {t.hero.markets.map((m) => (
                  <MarketCard
                    key={m.name}
                    active={m.active}
                    badge={m.badge}
                    name={m.name}
                    country={m.country}
                    meta={m.meta}
                    flag={
                      m.flag === "az" ? (
                        <FlagAz className="h-full w-full" />
                      ) : (
                        <FlagRu className="h-full w-full" />
                      )
                    }
                  />
                ))}
              </motion.div>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-7 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:items-center sm:gap-3"
              >
                <Link
                  href={entryHref}
                  className="eh-btn eh-btn-primary group inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3.5 text-[14px] font-semibold text-white sm:w-auto"
                >
                  {t.hero.cta}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#security"
                  className="eh-btn inline-flex w-full items-center justify-center rounded-full border border-slate-300/90 bg-transparent px-6 py-3.5 text-[14px] font-medium text-slate-700 sm:w-auto"
                >
                  {t.hero.ctaSecondary}
                </a>
              </motion.div>
            </div>

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="relative min-w-0"
            >
              <InteractiveSandbox locale={lang} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Метрики — после первого экрана, не конкурируют с миссией */}
      <section className="eh-wash-pearl border-y border-slate-200/70 py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 sm:gap-5 sm:px-8 lg:grid-cols-4">
          {t.stats.map((s, i) => (
            <motion.div
              key={i}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="min-w-0"
            >
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>
      </section>

      <AuctionTicker locale={lang} />
      <TargetAudience locale={lang} />
      <EvaluationPipeline locale={lang} />

      <section id="platform" className="eh-wash-pearl relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="eh-orb absolute -right-20 top-10 h-72 w-72 bg-slate-400/20" aria-hidden />
        <div className="eh-orb absolute -left-16 bottom-0 h-64 w-64 bg-slate-400/15" aria-hidden />
        <div className="bg-grid-premium texture-fade pointer-events-none absolute inset-0 opacity-35" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              {ru ? "Основа доверия" : "Etibarın əsası"}
            </h2>
            <p className="mt-4 text-slate-600 text-[16px] leading-relaxed">
              {ru
                ? "Три правила, без которых профессиональный капитал не входит в сделку."
                : "Peşəkar kapitalın sövdəyə girmədiyi üç qayda."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {t.pillars.map((p, i) => (
              <motion.div key={p.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <GlassCard className="p-8 h-full hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)] transition-shadow duration-500">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-6">
                    <p.icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-900 mb-3">{p.title}</h3>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{p.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="eh-wash-ink relative overflow-hidden py-16 text-white sm:py-24 lg:py-32">
        <div className="eh-orb absolute -left-10 top-0 h-80 w-80 bg-slate-400/25" aria-hidden />
        <div className="eh-orb absolute -right-10 bottom-0 h-96 w-96 bg-sky-900/40" aria-hidden />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,220,198,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(232,220,198,0.15) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, #000 20%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <motion.div {...fadeUp}>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8dcc6]/70">
                {ru ? "Безопасность · технологический фундамент" : "Təhlükəsizlik · texnoloji təməl"}
              </p>
              <h2 className="font-serif text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-[42px]">
                {ru ? (
                  <>
                    100% локальный контур.
                    <br />
                    <span className="text-white/45">Ноль внешних API.</span>
                  </>
                ) : (
                  <>
                    100% lokal kontur.
                    <br />
                    <span className="text-white/45">Sıfır xarici API.</span>
                  </>
                )}
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-[1.75] text-white/55">
                {ru
                  ? "Vision и NLP работают только на нашей инфраструктуре. Фото лотов, тексты реестра и данные инвесторов физически не покидают сервер. Это не маркетинг - это архитектура терминала."
                  : "Vision və NLP yalnız infrastrukturumuzda işləyir. Lot fotoları, reyestr mətnləri və investor datası fiziki olaraq serverdən çıxmır. Bu marketinq deyil - terminalın arxitekturasıdır."}
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="space-y-4">
              {(ru
                ? [
                    {
                      k: "01",
                      t: "Vision · on-prem",
                      d: "Анализ кузова и дефектов без облачных vision-API.",
                    },
                    {
                      k: "02",
                      t: "NLP · закрытый контур",
                      d: "Юридические red flags читаются локально, без ChatGPT/Claude.",
                    },
                    {
                      k: "03",
                      t: "Данные инвестора",
                      d: "Сессии, ставки и портфель не уходят к третьим сторонам.",
                    },
                  ]
                : [
                    {
                      k: "01",
                      t: "Vision · on-prem",
                      d: "Kuzov və qüsur analizi bulud vision-API-siz.",
                    },
                    {
                      k: "02",
                      t: "NLP · bağlı kontur",
                      d: "Hüquqi red flag-lər lokal oxunur - ChatGPT/Claude yoxdur.",
                    },
                    {
                      k: "03",
                      t: "Investor datası",
                      d: "Sessiya, təklif və portfel üçüncü tərəfə getmir.",
                    },
                  ]
              ).map((row) => (
                <div
                  key={row.k}
                  className="flex gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-4"
                >
                  <span className="font-mono text-[11px] tabular-nums text-[#e8dcc6]/60">
                    {row.k}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold tracking-tight text-white">
                      {row.t}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/45">{row.d}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Интерактивный кейс — ближе к концу воронки */}
      <section id="economics" className="eh-wash-mist relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="eh-orb absolute right-10 top-20 h-64 w-64 bg-slate-400/15" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...fadeUp} className="mb-12 max-w-2xl">
            <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              {ru ? "Кейс · до ставки" : "Keys · təklifdən əvvəl"}
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-[40px]">
              {ru ? "Юнит-экономика лота" : "Lotun unit-iqtisadiyyatı"}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              {ru
                ? "Тот же актив, что на главном экране. Меняйте ставку - увидите скрытые расходы и чистую маржу до участия."
                : "Əsas ekrandakı eyni aktiv. Təklifi dəyişin - gizli xərcləri və iştirakdan əvvəl xalis marjanı görün."}
            </p>
          </motion.div>
          <motion.div {...fadeUp}>
            <UnitEconomicsSandbox locale={lang} />
          </motion.div>
        </div>
      </section>

      {/* Сравнение портал + слой — компактно после кейса */}
      <section className="eh-wash-pearl relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="eh-orb absolute left-1/2 top-0 h-56 w-56 -translate-x-1/2 bg-white/50" aria-hidden />
        <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...fadeUp} className="mx-auto mb-10 max-w-2xl text-center">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {t.comparison.title}
            </h3>
            <p className="mt-3 text-slate-600">{t.comparison.sub}</p>
          </motion.div>

          <div className="relative grid gap-6 md:grid-cols-2">
            <motion.div {...fadeUp}>
              <GlassCard className="h-full p-8">
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
                  {t.comparison.official.title}
                </h3>
                <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  {ru ? "Официальный источник" : "Rəsmi mənbə"}
                </p>
                <ul className="space-y-3">
                  {t.comparison.official.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] text-slate-600">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <GlassCard className="h-full border-slate-300 bg-slate-50/50 p-8">
                <h3 className="font-serif text-lg font-semibold text-slate-900 mb-1">
                  {t.comparison.hub.title}
                </h3>
                <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  {ru ? "Аналитический слой" : "Analitik qat"}
                </p>
                <ul className="space-y-3">
                  {t.comparison.hub.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-700" />
                      {item}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── GLOBAL / ROSAKTIV ── */}
      <section id="global" className="eh-wash-mist relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="eh-orb absolute -left-20 top-24 h-72 w-72 bg-slate-400/18" aria-hidden />
        <div className="eh-orb absolute -right-16 bottom-10 h-80 w-80 bg-slate-500/10" aria-hidden />
        <div className="bg-dots-premium texture-fade pointer-events-none absolute inset-0 opacity-45" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <motion.div {...fadeUp} className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              {ru ? "Международная дорожная карта" : "Beynəlxalq yol xəritəsi"}
            </h2>
            <p className="mt-4 text-slate-600 text-[16px] leading-relaxed">
              {ru
                ? "Единая архитектура. Два рынка. Полная изоляция данных между юрисдикциями."
                : "Vahid arxitektura. İki bazar. Yurisdiksiyalar arasında tam məlumat izolyasiyası."}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div {...fadeUp}>
              <GlassCard className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl" aria-hidden>
                    🇦🇿
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">Digital Emlak Hub</h3>
                    <p className="text-[12px] text-slate-500 font-mono">emlakhub.net</p>
                  </div>
                </div>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  {ru
                    ? "Аналитический терминал для профессионального капитала в Азербайджане. Недвижимость и авто с государственных аукционов."
                    : "Azərbaycanda peşəkar kapital üçün analitik terminal. Dövlət hərraclarından daşınmaz əmlak və avto."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
                  </span>
                  {ru ? "Активно · Production" : "Aktiv · Production"}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <GlassCard className="p-8 border-amber-200/70 bg-amber-50/20">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl" aria-hidden>
                    🇷🇺
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">RosAktiv Hub</h3>
                    <p className="text-[12px] text-slate-500 font-mono">
                      {ru ? "для России · скоро" : "Rusiya üçün · tezliklə"}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] text-slate-600 leading-relaxed">
                  {ru
                    ? "Версия той же архитектуры для российского рынка сейчас в разработке. Госаукционы недвижимости и авто с локальным AI-анализом - скоро будут доступны для инвесторов в России."
                    : "Eyni arxitekturanın Rusiya bazarı üçün versiyası hazırda inkişaf mərhələsindədir. Dövlət hərracları və lokal AI analizi - tezliklə Rusiya investorları üçün əlçatan olacaq."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-amber-800">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-600" />
                  </span>
                  {ru ? "В разработке · скоро доступен" : "İnkişafda · tezliklə əlçatan"}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="eh-wash-cta relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="eh-orb absolute left-[20%] top-10 h-64 w-64 bg-slate-400/30" aria-hidden />
        <div className="eh-orb absolute right-[15%] bottom-0 h-72 w-72 bg-slate-700/10" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <motion.div {...fadeUp}>
            <h2 className="font-serif text-3xl sm:text-[2.75rem] font-semibold text-slate-900 tracking-tight">
              {t.cta.title}
            </h2>
            <p className="mt-4 text-slate-600 text-[16px]">{t.cta.sub}</p>
            <Link
              href={entryHref}
              className="mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition shadow-xl shadow-slate-900/10"
            >
              {t.cta.btn}
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <PremiumFAQ locale={lang} />

      <footer className="relative overflow-hidden border-t border-slate-200/90 bg-[#eaedf2]/90 py-12">
        <div className="eh-orb absolute right-0 top-0 h-40 w-40 bg-slate-400/20" aria-hidden />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row">
          <div>
            <div className="mb-3">
              <BrandLockup size={28} stacked />
            </div>
            <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed">
              {ru
                ? "Закрытый B2B-терминал для профессионального капитала. RosAktiv Hub для России - скоро."
                : "Peşəkar kapital üçün bağlı B2B terminal. RosAktiv Hub Rusiya üçün - tezliklə."}
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-8 pt-8 border-t border-slate-200 text-[12px] text-slate-400">
          © 2026 Digital Emlak Hub · RosAktiv Hub.{" "}
          {ru ? "Все права защищены." : "Bütün hüquqlar qorunur."}
        </div>
      </footer>
    </div>
    </LandingDealProvider>
  );
}
