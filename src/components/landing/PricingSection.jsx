"use client";

/**
 * Секция тарифов PRO на лендинге (AZN, месяц ≤ 15 ₼)
 */
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Crown } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PLAN_PRICES, CURRENCY_SYMBOL } from "@/lib/subscription";

const COPY = {
  az: {
    eyebrow: "Abunəlik",
    title: "Terminal yalnız PRO ilə açılır",
    sub: "Pulsuz rejimdə lotlar və analitika bağlıdır. Aylıq 9,90 ₼ — 15 ₼ həddindən aşağı.",
    cta: "Terminala keç",
    note: "Ödəniş təsdiqlənəndən sonra PRO aktiv olur.",
    features: [
      "Mövcud lotların analizi və iqtisadiyyat",
      "Müqayisə, seçilmişlər və portfel",
      "Hesabdakı bildiriş siyahısı",
    ],
  },
  ru: {
    eyebrow: "Подписка",
    title: "Терминал открыт только с PRO",
    sub: "На Free лоты и аналитика закрыты. Месяц — 9,90 ₼, ниже порога 15 ₼.",
    cta: "В терминал",
    note: "PRO активируется после подтверждения оплаты.",
    features: [
      "Анализ доступных лотов и расчёт экономики",
      "Сравнение, избранное и портфель",
      "Список уведомлений в аккаунте",
    ],
  },
  en: {
    eyebrow: "Subscription",
    title: "The terminal opens only with PRO",
    sub: "On Free, lots and analytics stay closed. A month is 9.90 ₼, under the 15 ₼ cap.",
    cta: "Open the terminal",
    note: "PRO turns on after the payment is confirmed.",
    features: [
      "Analysis of available lots and the economics",
      "Compare, favorites and portfolio",
      "The notification list in the account",
    ],
  },
};

/** Фиксированный формат — без toLocaleString (иначе SSR ≠ client → hydration error) */
function formatAznAmount(amount) {
  return Number(amount).toFixed(2).replace(".", ",");
}

export default function PricingSection() {
  const { locale } = useLocale();
  const c = COPY[locale] || COPY.ru;

  return (
    <section
      id="pricing"
      className="relative border-t border-white/10 bg-[#070b10] px-4 py-16 text-[#eef3f8] sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#c4b39a]">
            {c.eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[clamp(2rem,5vw,3rem)] leading-tight text-[#f7f4ee]">
            {c.title}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#c5d0db]">
            {c.sub}
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {Object.entries(PLAN_PRICES).map(([key, plan], i) => {
            const highlight = key === "month";
            const label =
              locale === "az"
                ? plan.labelAz
                : locale === "en"
                  ? plan.labelEn
                  : plan.labelRu;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className={[
                  "relative flex flex-col rounded-2xl border p-6",
                  highlight
                    ? "border-[#e7edf3]/70 bg-[#121820] text-[#f7f4ee] shadow-[0_24px_60px_-28px_rgba(231,237,243,0.35)]"
                    : "border-white/10 bg-[#10161e] text-[#eef3f8]",
                ].join(" ")}
              >
                {highlight ? (
                  <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    <Crown size={12} />
                    PRO
                  </span>
                ) : null}
                <div className="text-[13px] uppercase tracking-[0.14em] opacity-70">
                  {label}
                </div>
                <div className="mt-2 font-serif text-[2.5rem] leading-none">
                  {formatAznAmount(plan.amount)}
                  <span className="ml-1 text-[1.25rem]">{CURRENCY_SYMBOL}</span>
                </div>
                <p className="mt-2 text-[13px] opacity-70">
                  {plan.days}{" "}
                  {locale === "az" ? "gün" : locale === "en" ? "days" : "дней"}
                </p>
                <ul className="mt-6 flex-1 space-y-2 text-[13px]">
                  {c.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        size={14}
                        className="text-[#b7e4c7]"
                      />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="eh-cta eh-cta-solid px-8 py-3.5 text-[14px] font-semibold"
          >
            {c.cta}
          </Link>
          <p className="text-[12px] text-[#8ea0b4]">{c.note}</p>
        </div>
      </div>
    </section>
  );
}
