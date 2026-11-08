"use client";

/**
 * EvaluationPipeline - как сервис работает (простым языком)
 */

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useCalmMotion } from "./useCalmMotion";
import { RefreshCw, ScanEye, FileCheck2, Calculator } from "lucide-react";
import { say } from "@/lib/i18n/copy";

const stageFade = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export default function EvaluationPipeline({ locale = "ru" }) {
  const L = (az, ru, en) => say(locale, az, ru, en);
  const reduce = useCalmMotion();
  const railRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 70%", "end 60%"],
  });
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const stages = [
    {
      icon: RefreshCw,
      tag: L("1 · LOTLAR", "1 · ЛОТЫ", "1 · LOTS"),
      title: L("Dövlət hərraclarından lotları toplayırıq", "Собираем лоты с госаукционов", "We gather lots from state auctions"),
      desc: L(
        "Müxtəlif saytlarda axtarmaq əvəzinə lotları bir yerdə görürsünüz - avto və daşınmaz əmlak.",
        "Вместо поиска по разным сайтам вы видите лоты в одном месте - авто и недвижимость.",
        "Instead of searching several sites, you see the lots in one place — cars and property."
      ),
      meta: L("Daha az qarışıqlıq, qərara daha çox vaxt", "Меньше хаоса, больше времени на решение", "Less noise, more time to decide"),
    },
    {
      icon: ScanEye,
      tag: L("2 · BAZAR", "2 · РЫНОК", "2 · MARKET"),
      title: L("Lotu elanlarla tutuşdururuq", "Сверяем лот с объявлениями", "We match the lot to listings"),
      desc: L(
        "Avto — eyni marka və model. Daşınmaz əmlak — eyni tip və rayon. Yabancı oxşarları qiymətə qatmırıq.",
        "Авто — та же марка и модель. Недвижимость — тот же тип и район. Чужие аналоги в цену не подмешиваем.",
        "Cars — the same make and model. Property — the same type and district. Unrelated comps are not mixed into the price."
      ),
      meta: "Turbo.az · Bina.az",
    },
    {
      icon: FileCheck2,
      tag: L("3 · RİSKLƏR", "3 · РИСКИ", "3 · RISKS"),
      title: L("Gizli hüquqi problemləri axtarırıq", "Ищем скрытые юридические проблемы", "We look for hidden legal problems"),
      desc: L(
        "Təsvir və sənədləri yoxlayırıq: yüklər, paylar, təhlükəli ifadələr - pul qoymadan əvvəl.",
        "Проверяем описание и документы: обременения, доли, опасные формулировки - до внесения денег.",
        "We check the description and documents: encumbrances, shares, risky wording — before you put money in."
      ),
      meta: L("Behdən sonra daha az sürpriz", "Меньше сюрпризов после задатка", "Fewer surprises after the deposit"),
    },
    {
      icon: Calculator,
      tag: L("4 · QAZANC", "4 · ПРИБЫЛЬ", "4 · PROFIT"),
      title: L("Sizə nə qədər qalacağını göstəririk", "Показываем, сколько останется вам", "We show what is left for you"),
      desc: L(
        "Qazanc sizin təmir rəqəminiz və təsdiqli bazar qiymətindən sonra görünür. Boş təmiri sıfırla əvəz etmirik.",
        "Прибыль появляется после вашей цифры ремонта и подтверждённой рыночной цены. Пустой ремонт мы не заменяем нулём.",
        "Profit appears after your repair figure and a confirmed market price. An empty repair field is not replaced with zero."
      ),
      meta: L("Bir rəqəm - bir qərar", "Одна цифра - одно решение", "One figure, one decision"),
    },
  ];

  return (
    <section id="platform" className="eh-wash-pearl relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden style={{ backgroundImage: "linear-gradient(rgba(232,238,244,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,238,244,0.04) 1px, transparent 1px)", backgroundSize: "72px 72px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 30%, #000 10%, transparent 75%)" }} />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div {...stageFade} className="mb-16 max-w-2xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#f7f4ee] sm:text-4xl">
            {L("Necə işləyir - 4 addımda", "Как это работает - за 4 шага", "How it works — in 4 steps")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {L(
              "Lot siyahısından aydın qazanca qədər - mürəkkəb terminlər olmadan.",
              "От списка лотов до понятной прибыли - без сложных терминов.",
              "From the lot list to a clear profit, without heavy jargon."
            )}
          </p>
        </motion.div>

        <div ref={railRef} className="relative">
          <div
            aria-hidden
            className="absolute bottom-8 left-[19px] top-8 w-px bg-white/12 sm:left-[23px]"
          />
          {!reduce && (
            <motion.div
              aria-hidden
              className="absolute left-[19px] top-8 w-px origin-top bg-[#c4b39a] sm:left-[23px]"
              style={{ height: fillHeight }}
            />
          )}

          <div className="space-y-10 sm:space-y-14">
            {stages.map((s, i) => (
              <motion.div
                key={s.title}
                {...stageFade}
                transition={{ ...stageFade.transition, delay: i * 0.06 }}
                className="relative grid gap-5 sm:grid-cols-[48px_1fr] sm:gap-8"
              >
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#121820] text-[#f3efe6] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)] sm:h-12 sm:w-12">
                  <s.icon size={18} strokeWidth={1.8} />
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-[#10161e] p-6 transition duration-500 hover:-translate-y-0.5 hover:border-white/20 sm:p-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {s.tag}
                  </div>
                  <h3 className="mt-2 font-serif text-xl font-semibold tracking-[-0.02em] text-[#f7f4ee] sm:text-[1.65rem]">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed tracking-[-0.01em] text-[#c5d0db] sm:text-[15px]">
                    {s.desc}
                  </p>
                  <p className="mt-4 text-[12px] font-medium text-[#e7edf3]">{s.meta}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
