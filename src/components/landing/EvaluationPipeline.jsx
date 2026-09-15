"use client";

/**
 * EvaluationPipeline — как сервис работает (простым языком)
 */

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { RefreshCw, ScanEye, FileCheck2, Calculator } from "lucide-react";

const stageFade = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

export default function EvaluationPipeline({ locale = "ru" }) {
  const ru = locale === "ru";
  const reduce = useReducedMotion();
  const railRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: railRef,
    offset: ["start 70%", "end 60%"],
  });
  const fillHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const stages = [
    {
      icon: RefreshCw,
      tag: ru ? "1 · ЛОТЫ" : "1 · LOTLAR",
      title: ru ? "Собираем лоты с госаукционов" : "Dövlət hərraclarından lotları toplayırıq",
      desc: ru
        ? "Вместо поиска по разным сайтам вы видите лоты в одном месте — авто и недвижимость."
        : "Müxtəlif saytlarda axtarmaq əvəzinə lotları bir yerdə görürsünüz — avto və daşınmaz əmlak.",
      meta: ru ? "Меньше хаоса, больше времени на решение" : "Daha az qarışıqlıq, qərara daha çox vaxt",
    },
    {
      icon: ScanEye,
      tag: ru ? "2 · ФОТО" : "2 · FOTO",
      title: ru ? "Смотрим, сколько может стоить ремонт" : "Təmirin nə qədər ola biləcəyinə baxırıq",
      desc: ru
        ? "По фото лота отмечаем повреждения и даём понятную смету — ещё до того, как вы поедете на объект."
        : "Lot fotolarında zədələri qeyd edirik və aydın smeta veririk — obyektə getməzdən əvvəl.",
      meta: ru ? "Смета без выезда" : "Getmədən smeta",
    },
    {
      icon: FileCheck2,
      tag: ru ? "3 · РИСКИ" : "3 · RİSKLƏR",
      title: ru ? "Ищем скрытые юридические проблемы" : "Gizli hüquqi problemləri axtarırıq",
      desc: ru
        ? "Проверяем описание и документы: обременения, доли, опасные формулировки — до внесения денег."
        : "Təsvir və sənədləri yoxlayırıq: yüklər, paylar, təhlükəli ifadələr — pul qoymadan əvvəl.",
      meta: ru ? "Меньше сюрпризов после задатка" : "Behdən sonra daha az sürpriz",
    },
    {
      icon: Calculator,
      tag: ru ? "4 · ПРИБЫЛЬ" : "4 · QAZANC",
      title: ru ? "Показываем, сколько останется вам" : "Sizə nə qədər qalacağını göstəririk",
      desc: ru
        ? "Ставка + сборы + ремонт + рыночная цена = одна понятная цифра. Решаете по ней, а не «на глаз»."
        : "Təklif + rüsum + təmir + bazar qiyməti = bir aydın rəqəm. «Gözə görə» yox, bu rəqəmə görə qərar verirsiniz.",
      meta: ru ? "Одна цифра — одно решение" : "Bir rəqəm — bir qərar",
    },
  ];

  return (
    <section id="platform" className="eh-wash-pearl relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="eh-orb absolute right-[10%] top-16 h-64 w-64 bg-slate-400/18" aria-hidden />
      <div className="eh-orb absolute left-[5%] bottom-10 h-56 w-56 bg-slate-400/15" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid-premium texture-fade opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div {...stageFade} className="mb-16 max-w-2xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {ru ? "Как это работает — за 4 шага" : "Necə işləyir — 4 addımda"}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {ru
              ? "От списка лотов до понятной прибыли — без сложных терминов."
              : "Lot siyahısından aydın qazanca qədər — mürəkkəb terminlər olmadan."}
          </p>
        </motion.div>

        <div ref={railRef} className="relative">
          <div
            aria-hidden
            className="absolute bottom-8 left-[19px] top-8 w-px bg-slate-200 sm:left-[23px]"
          />
          {!reduce && (
            <motion.div
              aria-hidden
              className="absolute left-[19px] top-8 w-px origin-top bg-slate-900 sm:left-[23px]"
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
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm sm:h-12 sm:w-12">
                  <s.icon size={18} strokeWidth={1.8} />
                </div>
                <div className="eh-card border-slate-200/80 bg-white p-6 sm:p-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {s.tag}
                  </div>
                  <h3 className="mt-2 font-serif text-xl font-semibold tracking-[-0.02em] text-slate-900 sm:text-[1.65rem]">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-[14px] leading-relaxed tracking-[-0.01em] text-slate-600 sm:text-[15px]">
                    {s.desc}
                  </p>
                  <p className="mt-4 text-[12px] font-medium text-slate-800">{s.meta}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
