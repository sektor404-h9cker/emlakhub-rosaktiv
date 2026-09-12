"use client";

/**
 * EvaluationPipeline — язык бизнеса, без техжаргона
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
      tag: ru ? "РЫНОК" : "BAZAR",
      title: ru ? "Полная картина торгов" : "Hərracın tam mənzərəsi",
      desc: ru
        ? "Лоты с государственных порталов собраны в одном контуре. Часы ручного поиска заменены ясным обзором рынка."
        : "Dövlət portallarındakı lotlar bir konturda toplanıb. Saatlarla əl axtarışı aydın bazar mənzərəsi ilə əvəz olunub.",
      meta: ru ? "Время - на решение, не на поиск" : "Vaxt axtarışa yox, qərara",
    },
    {
      icon: ScanEye,
      tag: ru ? "ОСМОТР" : "YOXLAMA",
      title: ru
        ? "Точная оценка стоимости ремонта по фотографиям"
        : "Fotolara görə təmir dəyərinin dəqiq qiymətləndirilməsi",
      desc: ru
        ? "По снимкам лота видно скрытый износ кузова, фасада или отделки - и понятная смета до ставки."
        : "Lot şəkillərində kuzov, fasad və ya təmirin gizli aşınması - və təklifdən əvvəl aydın smeta görünür.",
      meta: ru ? "Смета без выезда на объект" : "Obyektə getmədən smeta",
    },
    {
      icon: FileCheck2,
      tag: ru ? "РИСКИ" : "RİSKLƏR",
      title: ru
        ? "Автоматический поиск скрытых юридических рисков и обременений"
        : "Gizli hüquqi risklərin və yüklərin avtomatik axtarışı",
      desc: ru
        ? "Описания и документы проверяются на обременения, долевую собственность и опасные формулировки - до задатка."
        : "Təsvir və sənədlər yük, pay mülkiyyəti və təhlükəli ifadələr üzrə yoxlanır - behdən əvvəl.",
      meta: ru ? "Капитал защищён заранее" : "Kapital əvvəlcədən qorunur",
    },
    {
      icon: Calculator,
      tag: ru ? "МАРЖА" : "MARJA",
      title: ru ? "Чистая прибыль до участия в торгах" : "Hərracdan əvvəl xalis gəlir",
      desc: ru
        ? "Ставка, сборы, ремонт и рынок складываются в одну цифру. Решение принимается по прибыли, а не по ощущению."
        : "Təklif, rüsum, təmir və bazar bir rəqəmdə toplanır. Qərar hissə görə yox, gəlirə görə verilir.",
      meta: ru ? "Одна цифра - одно решение" : "Bir rəqəm - bir qərar",
    },
  ];

  return (
    <section className="eh-wash-pearl relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="eh-orb absolute right-[10%] top-16 h-64 w-64 bg-slate-400/18" aria-hidden />
      <div className="eh-orb absolute left-[5%] bottom-10 h-56 w-56 bg-slate-400/15" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-grid-premium texture-fade opacity-60" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div {...stageFade} className="mb-16 max-w-2xl">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {ru ? "От сырых лотов - к ясному решению" : "Xam lotlardan - aydın qərara"}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
            {ru
              ? "Четыре шага, которые экономят часы и отсекают убыточные активы до задатка."
              : "Behdən əvvəl saatlara qənaət edən və zərərli aktivləri kənarlaşdıran dörd addım."}
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
