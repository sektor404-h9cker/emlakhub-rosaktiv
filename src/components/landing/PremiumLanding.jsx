"use client";

/**
 * ============================================================================
 * PremiumLanding - White Premium (SpaceX × Ralph Lauren)
 * ============================================================================
 * Перенесено из DigitalEmlakPlatform и адаптировано под Next.js.
 * RosAktiv Hub: в разработке, скоро для России (не «уже развёрнут»).
 * ============================================================================
 */

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCalmMotion } from "./useCalmMotion";
import { say } from "@/lib/i18n/copy";
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
import ExampleShowcase from "./ExampleShowcase";
import AuctionTicker from "./AuctionTicker";
import PremiumFAQ from "./PremiumFAQ";
import TargetAudience from "./TargetAudience";
import EvaluationPipeline from "./EvaluationPipeline";
import PricingSection from "./PricingSection";
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

/** Плоские статус-полоски рынков */
function MarketCard({ active, flag, badge, name, country, meta }) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border px-3 py-2.5 sm:px-3.5 sm:py-3",
        active
          ? "border-white/15 bg-[#10161e] text-white"
          : "border-white/10 bg-white/[0.03] text-[#d3dce6]",
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
                : "bg-white/8 text-[#c5d0db]",
            ].join(" ")}
          >
            {badge}
          </span>
        </div>
        <div
          className={[
            "mt-0.5 truncate text-[11px] tracking-tight",
            active ? "text-white/45" : "text-[#c5d0db]",
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
        "border-white/10 bg-[#10161e]/95 text-[#eef3f8] backdrop-blur-xl",
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
  const L = useCallback((az, ru, en) => say(lang, az, ru, en), [lang]);
  const reduce = useCalmMotion();
  const [mobileOpen, setMobileOpen] = useState(false);

  const entryHref = "/login";

  const t = useMemo(
    () => ({
      nav: {
        example: L("Nümunə", "Пример", "Example"),
        platform: L("Necə işləyir", "Как это работает", "How it works"),
        security: L("Təhlükəsizlik", "Безопасность", "Security"),
        global: L("Ölkələr", "Страны", "Countries"),
        login: L("Daxil ol", "Войти", "Sign in"),
      },
      hero: {
        eyebrow: L(
          "Dövlət hərracları üçün investor xidməti",
          "Сервис для инвесторов на госаукционах",
          "A service for investors on state auctions"
        ),
        titleLines:
          lang === "az"
            ? ["Dövlət əmlakının", "rəqəmsal idarəetməsi"]
            : lang === "en"
              ? ["Digital management", "of state", "property"]
              : ["Цифровое управление", "государственной", "собственностью"],
        sub: L(
          "Dövlət hərraclarından avto və daşınmaz əmlak lotlarına baxırsınız. Təklif verməzdən əvvəl görünür: təmir nə qədərdir, hansı risklər var və nə qədər qazanc qalır.",
          "Вы смотрите лоты авто и недвижимости с государственных торгов. До ставки видно: сколько стоит ремонт, какие риски есть и какая прибыль останется.",
          "You look at car and property lots from state auctions. Before you bid you see the repair cost, the risks, and the profit that remains."
        ),
        signals: [
          {
            icon: Zap,
            text: L(
              "Cavab saniyələrlə — uzun cədvəlsiz",
              "Ответ за секунды — без долгих таблиц",
              "An answer in seconds — without long tables"
            ),
          },
          {
            icon: ShieldCheck,
            text: L(
              "Risklər pul qoymadan əvvəl görünür",
              "Риски видны до внесения денег",
              "Risks are visible before you put money in"
            ),
          },
          {
            icon: Gauge,
            text: L(
              "Lot üzrə qazanc dərhal ekranda",
              "Прибыль по лоту — сразу на экране",
              "Lot profit — right on the screen"
            ),
          },
        ],
        markets: [
          {
            active: true,
            name: "Digital Emlak Hub",
            country: L("Azərbaycan", "Азербайджан", "Azerbaijan"),
            meta: "emlakhub.net",
            badge: L("İşləyir", "Работает", "Live"),
            flag: "az",
          },
          {
            active: false,
            name: "RosAktiv Hub",
            country: L("Rusiya", "Россия", "Russia"),
            meta: L("tezliklə", "скоро", "soon"),
            badge: L("Tezliklə", "Скоро", "Soon"),
            flag: "ru",
          },
        ],
        cta: L("Giriş alın", "Получить доступ", "Get access"),
        ctaSecondary: L("Məlumatı necə saxlayırıq", "Как храним данные", "How we keep data"),
      },
      stats: [
        {
          value: "247K+",
          label: L("Sistemdəki lotlar", "Лотов в системе", "Lots in the system"),
          spark: [12, 18, 16, 24, 30, 28, 38, 44, 52, 61],
          sparkColor: "#e7edf3",
        },
        {
          value: "<0.5s",
          label: L("Lot üzrə aydın rəqəmə qədər", "До понятной цифры по лоту", "To a clear figure per lot"),
          accent: "text-[#e3d5bd]",
          spark: [70, 74, 78, 82, 86, 90, 93, 96, 98, 99],
          sparkColor: "#c4b39a",
        },
        {
          value: "2",
          label: L("Planlaşdırılan ölkə", "Страны в планах", "Countries planned"),
          spark: [0, 0, 0, 1, 1, 1, 1, 2, 2, 2],
          sparkColor: "#e7edf3",
        },
        {
          value: "0",
          label: L("Məlumat çölə getmir", "Данные не уходят наружу", "Data does not leave"),
          spark: [5, 4, 3, 3, 2, 2, 1, 1, 0, 0],
          sparkColor: "#e7edf3",
        },
      ],
      pillars: [
        {
          title: L("Məlumatınız sizdə qalır", "Ваши данные остаются у вас", "Your data stays with you"),
          desc: L(
            "Lot fotoları, sənədlər və hesablamalar kənar servislərə göndərilmir. Giriş yalnız icazə verilənlər üçündür.",
            "Фото лотов, документы и расчёты не отправляются в чужие сервисы. Вход только для тех, кому открыли доступ.",
            "Lot photos, documents and calculations are not sent to outside services. Access is only for people who were invited."
          ),
          icon: ShieldCheck,
        },
        {
          title: L("Hər rəqəm aydındır", "Каждая цифра понятна", "Every figure is clear"),
          desc: L(
            "Qazanc lot qiyməti, sizin təmiriniz və bazar qiymətindən hesablanır. Kartda olmayanı uydurmuruq.",
            "Прибыль считается из цены лота, вашего ремонта и рыночной цены. Чего нет в карточке — не выдумываем.",
            "Profit is calculated from the lot price, your repair figure and the market price. What is not on the card is not invented."
          ),
          icon: Gauge,
        },
        {
          title: L("Əvvəl Azərbaycan, sonra Rusiya", "Сначала Азербайджан, потом Россия", "Azerbaijan first, then Russia"),
          desc: L(
            "İndi Azərbaycanda Digital Emlak Hub işləyir. Rusiya üçün RosAktiv Hub ayrıca hazırlanır.",
            "Сейчас работает Digital Emlak Hub в Азербайджане. Версия для России - RosAktiv Hub - готовится отдельно.",
            "Digital Emlak Hub is live in Azerbaijan. The Russia version, RosAktiv Hub, is being prepared separately."
          ),
          icon: Globe2,
        },
      ],
      comparison: {
        title: L(
          "Dövlət portalı lotları verir. Biz iştirak etməyə dəyərini göstəririk.",
          "Госпортал даёт лоты. Мы помогаем решить, стоит ли участвовать.",
          "The state portal lists the lots. We help you decide whether to take part."
        ),
        sub: L(
          "Dövləti əvəz etmirik. Rəsmi lotları götürüb üzərinə aydın qiymətləndirmə əlavə edirik.",
          "Мы не заменяем государство. Берём официальные лоты и добавляем понятную оценку.",
          "We do not replace the state. We take the official lots and add a clear assessment."
        ),
        official: {
          title: L("Dövlət portalı", "Государственный портал", "State portal"),
          items:
            lang === "en"
              ? [
                  "The official lot list",
                  "Opening price and terms",
                  "Participant registration",
                  "Deposit and fees",
                ]
              : lang === "az"
                ? [
                    "Rəsmi lotların siyahısı",
                    "Başlanğıc qiymət və şərtlər",
                    "İştirakçı qeydiyyatı",
                    "Beh və ödənişlər",
                  ]
                : [
                    "Список официальных лотов",
                    "Стартовая цена и условия",
                    "Регистрация участника",
                    "Залог и взносы",
                  ],
        },
        hub: {
          title: "Digital Emlak Hub",
          items:
            lang === "en"
              ? [
                  "Market comps for the same model or district",
                  "Risks that can be read in the lot text",
                  "Profit after your repair figure",
                  "A plain comparison with the opening price",
                ]
              : lang === "az"
                ? [
                    "Eyni model və ya rayonun bazar oxşarları",
                    "Lot mətnində oxunan risklər",
                    "Təmir rəqəminizi yazandan sonra qazanc",
                    "Başlanğıc qiymətlə sadə müqayisə",
                  ]
                : [
                    "Рыночные аналоги той же модели или района",
                    "Риски, которые читаются в тексте лота",
                    "Прибыль после вашей цифры ремонта",
                    "Сравнение со стартом простым языком",
                  ],
        },
      },
      cta: {
        title: L(
          "Növbəti lot - artıq aydın rəqəmlərlə",
          "Следующий лот - уже с понятными цифрами",
          "The next lot already has clear figures"
        ),
        sub: L(
          "Giriş müraciətlə. Qazandığınız lotlardan komissiya almırıq.",
          "Доступ по заявке. С выигранных лотов комиссию не берём.",
          "Access is by request. We do not take a commission on lots you win."
        ),
        btn: L("Giriş alın", "Получить доступ", "Get access"),
      },
    }),
    [lang, L]
  );

  return (
    <div className="eh-night min-h-screen bg-[#070b10] text-[#eef3f8]">
      <div className="eh-page-glow" aria-hidden>
        <span className="eh-page-glow-gold" />
        <span className="eh-page-glow-blue" />
        <span className="eh-page-glow-sheen" />
      </div>
      {/* Nav вне grain - иначе на тёмных секциях «пропадает» из‑за stacking context */}
      <nav className="fixed inset-x-0 top-0 z-[100] border-b border-white/10 bg-[#070b10]/80 backdrop-blur-xl">
        <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-8">
          <Link href="/" className="group relative z-10 flex min-w-0 items-center">
            <BrandLockup size={34} stacked tone="dark" className="sm:gap-3" />
          </Link>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
            <div className="pointer-events-auto flex items-center gap-9">
              <a href="#example" className="eh-link text-[13px] font-medium text-[#d3dce6] hover:text-white">
                {t.nav.example}
              </a>
              <a href="#platform" className="eh-link text-[13px] font-medium text-[#d3dce6] hover:text-white">
                {t.nav.platform}
              </a>
              <a href="#security" className="eh-link text-[13px] font-medium text-[#d3dce6] hover:text-white">
                {t.nav.security}
              </a>
              <a href="#global" className="eh-link text-[13px] font-medium text-[#d3dce6] hover:text-white">
                {t.nav.global}
              </a>
            </div>
          </div>

          <div className="relative z-10 hidden items-center gap-5 lg:flex">
            <LanguageSwitch variant="dark" />
            <div className="h-4 w-px bg-white/15" />
            <Link href={entryHref} className="eh-login">
              {t.nav.login}
              <span className="eh-login-arrow" aria-hidden>
                <ArrowRight size={14} strokeWidth={2.1} />
              </span>
            </Link>
          </div>

          <button
            type="button"
            className="relative z-10 p-2 text-[#e7edf3] lg:hidden"
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
              className="overflow-hidden border-t border-white/10 bg-[#070b10] lg:hidden"
            >
              <div className="flex flex-col gap-4 p-6">
                <a href="#example" className="text-[15px] font-medium text-slate-800" onClick={() => setMobileOpen(false)}>
                  {t.nav.example}
                </a>
                <a href="#platform" className="text-[15px] font-medium text-slate-800" onClick={() => setMobileOpen(false)}>
                  {t.nav.platform}
                </a>
                <a href="#security" className="text-[15px] font-medium text-slate-800" onClick={() => setMobileOpen(false)}>
                  {t.nav.security}
                </a>
                <a href="#global" className="text-[15px] font-medium text-slate-800" onClick={() => setMobileOpen(false)}>
                  {t.nav.global}
                </a>
                <LanguageSwitch variant="dark" />
                <Link
                  href={entryHref}
                  className="eh-login w-full justify-between"
                  onClick={() => setMobileOpen(false)}
                >
                  {t.nav.login}
                  <span className="eh-login-arrow" aria-hidden>
                    <ArrowRight size={14} strokeWidth={2.1} />
                  </span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

    <div className="eh-grain relative min-h-screen text-slate-800 selection:bg-slate-900 selection:text-[#fbfaf7]">
      {/* ── HERO: свет + сетка + глубина ── */}
      <section className="relative overflow-hidden bg-[#070b10] pt-14 sm:pt-16">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(rgba(232,238,244,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(232,238,244,0.045) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "radial-gradient(ellipse 70% 60% at 40% 20%, #000 10%, transparent 72%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-64"
          style={{
            background:
              "radial-gradient(ellipse 40% 80% at 70% 0%, rgba(196,179,154,0.14), transparent 70%)",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-end gap-8 px-4 pb-8 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
          <div>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c5d0db]"
            >
              {t.hero.eyebrow}
            </motion.p>
            <h1 className={["eh-display mt-4", lang === "ru" ? "eh-display-ru" : ""].join(" ")}>
              {t.hero.titleLines.map((line, i) => (
                <span key={`${line}-${i}`} className="relative mt-[0.04em] block first:mt-0">
                  <motion.span
                    className={["block", i > 0 ? "eh-gold" : ""].join(" ")}
                    initial={reduce ? false : { y: "105%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ delay: 0.08 + i * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
          </div>
          <div className="max-w-md lg:mb-2">
            <p className="font-serif text-[1.65rem] leading-tight tracking-[-0.03em] text-[#f7f4ee]">
              {L(
                "Dəqiq hesab təklifdən əvvəl başlayır.",
                "Точный расчёт начинается до ставки.",
                "A precise calculation starts before the bid."
              )}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#d3dce6]">{t.hero.sub}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-2">
            <a href="#example" className="eh-cta eh-cta-solid group">
              {L("Hesab nümunəsinə bax", "Посмотреть пример расчёта", "See a sample calculation")}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </a>
            <Link href={entryHref} className="eh-cta eh-cta-line group">
              {t.hero.cta}
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <ExampleShowcase locale={lang} />

      <section className="border-t border-white/10 bg-[#070b10] py-8 sm:py-10">
        <div className="mx-auto grid max-w-3xl gap-3 px-4 sm:grid-cols-2 sm:px-8">
          {t.hero.markets.map((m) => (
            <MarketCard
              key={m.name}
              active={m.active}
              badge={m.badge}
              name={m.name}
              country={m.country}
              meta={m.meta}
              flag={m.flag === "az" ? <FlagAz className="h-full w-full" /> : <FlagRu className="h-full w-full" />}
            />
          ))}
        </div>
        <div className="mx-auto mt-5 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:gap-5 sm:px-8 lg:grid-cols-4">
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

      <section className="eh-wash-pearl relative overflow-hidden py-16 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute inset-0 opacity-30" aria-hidden style={{ backgroundImage: "radial-gradient(rgba(232,238,244,0.08) 1px, transparent 1px)", backgroundSize: "22px 22px", maskImage: "radial-gradient(ellipse 70% 55% at 50% 40%, #000 20%, transparent 75%)" }} />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {L("Niyə bizə etibar etmək olar", "Почему нам можно доверять", "Why you can trust this")}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              {L(
                "Lota pul qoymadan əvvəl vacib olan üç sadə məqam.",
                "Три простые вещи, которые важны, прежде чем вкладывать деньги в лот.",
                "Three plain things that matter before you put money into a lot."
              )}
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {t.pillars.map((p, i) => (
              <motion.div key={p.title} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }}>
                <GlassCard className="h-full p-8 transition-shadow duration-500 hover:shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)]">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#f3efe6]">
                    <p.icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="mb-3 font-serif text-xl font-semibold text-slate-900">{p.title}</h3>
                  <p className="text-[14px] leading-relaxed text-slate-600">{p.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="security"
        className="eh-security relative w-full py-16 text-white sm:py-20 lg:py-24"
      >
        <div className="eh-security-fx" aria-hidden>
          <div className="eh-security-aurora" />
          <div className="eh-security-sheen" />
          <div className="eh-security-sheen-secondary" />
          <div className="eh-security-grid" />
          {!reduce ? (
            <>
              <motion.div
                className="eh-orb absolute -left-[10%] top-[10%] h-[22rem] w-[22rem] bg-[#b8956c]/25 sm:h-[28rem] sm:w-[28rem]"
                animate={{ opacity: [0.35, 0.55, 0.35], x: [0, 24, 0], y: [0, -12, 0] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="eh-orb absolute -right-[8%] bottom-[5%] h-[24rem] w-[24rem] bg-sky-700/30 sm:h-[32rem] sm:w-[32rem]"
                animate={{ opacity: [0.3, 0.5, 0.3], x: [0, -20, 0] }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
              />
            </>
          ) : null}
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <motion.div {...fadeUp}>
              <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#e8dcc6]/70">
                {L("Məlumat təhlükəsizliyi", "Безопасность данных", "Data security")}
              </p>
              <h2 className="font-serif text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-[42px]">
                {lang === "en" ? (
                  <>
                    Your data stays with us.
                    <br />
                    <span className="text-white/45">It does not go to outside services.</span>
                  </>
                ) : lang === "az" ? (
                  <>
                    Məlumatınız bizdə qalır.
                    <br />
                    <span className="text-white/45">Kənar servislərə getmir.</span>
                  </>
                ) : (
                  <>
                    Ваши данные остаются у нас.
                    <br />
                    <span className="text-white/45">Не уходят в чужие сервисы.</span>
                  </>
                )}
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-[1.75] text-white/55">
                {L(
                  "Lot fotoları, reyestr mətnləri və sizin məlumatlarınız bizim serverlərdə emal olunur. Onları ChatGPT, Claude və digər xarici servislərə göndərmirik.",
                  "Фото лотов, тексты из реестра и ваши данные обрабатываются на наших серверах. Мы не отправляем их в ChatGPT, Claude и другие внешние сервисы.",
                  "Lot photos, registry text and your data are processed on our servers. We do not send them to ChatGPT, Claude or other outside services."
                )}
              </p>
            </motion.div>

            <motion.div {...fadeUp} className="space-y-3">
              {[
                {
                  k: "01",
                  t: L("Lot fotosu", "Фото лота", "Lot photo"),
                  d: L(
                    "Şəkillər bizdə qalır. Foto üzrə zədə və təmir smetası qurmirik.",
                    "Снимки остаются у нас. Повреждения по фото и смету ремонта мы не строим.",
                    "The pictures stay with us. We do not build damage or a repair estimate from the photo."
                  ),
                },
                {
                  k: "02",
                  t: L("Mətn yoxlaması", "Проверка текстов", "Text check"),
                  d: L(
                    "Hüquqi risklər bizim serverlərdə oxunur, kənar çat-botlarla yox.",
                    "Юридические риски читаются на наших серверах, не через сторонние чат-боты.",
                    "Legal risks are read on our servers, not through outside chatbots."
                  ),
                },
                {
                  k: "03",
                  t: L("Sizin hesab", "Ваш аккаунт", "Your account"),
                  d: L(
                    "Giriş, təkliflər və portfel üçüncü şəxslərə ötürülmür.",
                    "Вход, ставки и портфель не передаются третьим лицам.",
                    "Sign-in, bids and the portfolio are not passed to third parties."
                  ),
                },
              ].map((row, i) => (
                <motion.div
                  key={row.k}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="eh-security-card flex gap-4 rounded-xl px-5 py-4"
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
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Сравнение портал + слой */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#070b10] py-16 sm:py-20">
        <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
          <motion.div {...fadeUp} className="mx-auto mb-10 max-w-2xl text-center">
            <h3 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {t.comparison.title}
            </h3>
            <p className="mt-3 text-slate-600">{t.comparison.sub}</p>
          </motion.div>

          <div className="relative grid gap-5 md:grid-cols-2 md:gap-6">
            <motion.div {...fadeUp}>
              <GlassCard className="h-full p-8">
                <h3 className="mb-1 font-serif text-lg font-semibold text-slate-900">
                  {t.comparison.official.title}
                </h3>
                <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  {L("Dövlət nə verir", "Что даёт государство", "What the state provides")}
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
              <GlassCard className="h-full border-[#c4b39a]/30 bg-[#121820] p-8">
                <h3 className="mb-1 font-serif text-lg font-semibold text-slate-900">
                  {t.comparison.hub.title}
                </h3>
                <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.16em] text-[#9a7b55]">
                  {L("Biz nə əlavə edirik", "Что добавляем мы", "What we add")}
                </p>
                <ul className="space-y-3">
                  {t.comparison.hub.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[14px] text-slate-700">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-slate-800" />
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
      <section id="global" className="relative overflow-hidden border-t border-white/10 bg-[#070b10] py-16 sm:py-20">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...fadeUp} className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {L("Harada işləyirik və hara gedirik", "Где уже работаем и куда идём", "Where we work and where we are going")}
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
              {L(
                "Bir ideya - iki ölkə. Azərbaycan və Rusiya məlumatları qarışmır.",
                "Одна идея - две страны. Данные Азербайджана и России не смешиваются.",
                "One idea, two countries. Azerbaijan and Russia data stay separate."
              )}
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2 md:gap-6">
            <motion.div {...fadeUp}>
              <GlassCard className="p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    🇦🇿
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">Digital Emlak Hub</h3>
                    <p className="font-mono text-[12px] text-slate-500">emlakhub.net</p>
                  </div>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-600">
                  {L(
                    "Azərbaycanda investorlar üçün xidmət: dövlət hərraclarından avto və daşınmaz əmlak - təklifdən əvvəl aydın qiymətləndirmə ilə.",
                    "Сервис для инвесторов в Азербайджане: авто и недвижимость с государственных аукционов - с понятной оценкой до ставки.",
                    "A service for investors in Azerbaijan: cars and property from state auctions, with a clear assessment before you bid."
                  )}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[#b7e4c7]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  </span>
                  {L("Artıq işləyir · müraciət üçün açıq", "Уже работает · открыт для заявок", "Live · open for requests")}
                </div>
              </GlassCard>
            </motion.div>

            <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.08 }}>
              <GlassCard className="border-white/10 bg-[#10161e] p-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl" aria-hidden>
                    🇷🇺
                  </span>
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">RosAktiv Hub</h3>
                    <p className="font-mono text-[12px] text-slate-500">
                      {L("Rusiya üçün · tezliklə", "для России · скоро", "for Russia · soon")}
                    </p>
                  </div>
                </div>
                <p className="text-[14px] leading-relaxed text-slate-600">
                  {L(
                    "Eyni ideya Rusiya üçün: dövlət hərraclarından avto və daşınmaz əmlak, aydın qiymətləndirmə ilə. İndi hazırlanır - tezliklə giriş açılacaq.",
                    "Та же идея для России: госаукционы авто и недвижимости с понятной оценкой. Сейчас готовим - скоро откроем доступ.",
                    "The same idea for Russia: state auctions for cars and property with a clear assessment. We are preparing it and will open access soon."
                  )}
                </p>
                <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-[#e3d5bd]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-50" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-600" />
                  </span>
                  {L("Tezliklə açılacaq", "Скоро откроем", "Opening soon")}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="relative overflow-hidden border-t border-white/10 bg-[#070b10] py-16 sm:py-24">
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <motion.div {...fadeUp}>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.75rem]">
              {t.cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-slate-600">{t.cta.sub}</p>
            <Link
              href={entryHref}
              className="eh-cta eh-cta-solid mt-10 px-9 py-4 text-[15px]"
            >
              {t.cta.btn}
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      <PremiumFAQ locale={lang} />

      <footer className="relative overflow-hidden border-t border-white/10 bg-[#070b10] py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" aria-hidden />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 sm:px-8 md:flex-row">
          <div>
            <div className="mb-3">
              <BrandLockup size={28} stacked tone="dark" />
            </div>
            <p className="text-[13px] text-slate-500 max-w-xs leading-relaxed">
              {L(
                "İnvestorlara dövlət hərrac lotlarını təklifdən əvvəl anlamağa kömək edirik. RosAktiv Hub Rusiya üçün - tezliklə.",
                "Помогаем инвесторам понять лоты госаукционов до ставки. RosAktiv Hub для России - скоро.",
                "We help investors understand state-auction lots before they bid. RosAktiv Hub for Russia is coming soon."
              )}
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-8 pt-8 border-t border-slate-200 text-[12px] text-slate-400">
          <p>
            © 2026 Digital Emlak Hub · RosAktiv Hub.{" "}
            {L("Bütün hüquqlar qorunur.", "Все права защищены.", "All rights reserved.")}
          </p>
          <p className="mt-2 text-slate-500">
            {L(
              "Təsisçi - Camal Huseynov · Digital Emlak Hub",
              "Основатель - Camal Huseynov · Digital Emlak Hub",
              "Founder — Camal Huseynov · Digital Emlak Hub"
            )}
          </p>
        </div>
      </footer>
    </div>
    </div>
  );
}
