"use client";

/**
 * TargetAudience — для кого терминал (язык капитала)
 */

import React from "react";
import { motion } from "framer-motion";
import { LineChart, ShieldCheck, Building2 } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export default function TargetAudience({ locale = "ru" }) {
  const ru = locale === "ru";

  const personas = [
    {
      icon: LineChart,
      tag: ru ? "ЧАСТНЫЙ КАПИТАЛ" : "FƏRDİ KAPİTAL",
      title: ru ? "Частные инвесторы" : "Fərdi investorlar",
      desc: ru
        ? "Недооценённые лоты, смета ремонта и чистая маржа - до участия в торгах. Решение по цифре, не по ощущению."
        : "Qiyməti aşağı lotlar, təmir smetası və xalis marja - hərracdan əvvəl. Qərar hissə görə yox, rəqəmə görə.",
      metric: ru ? "Маржа до торгов" : "Marja hərracdan əvvəl",
    },
    {
      icon: ShieldCheck,
      tag: ru ? "БРОКЕРЫ" : "BROKERLƏR",
      title: ru ? "Брокеры и агентства" : "Brokerlər və agentliklər",
      desc: ru
        ? "Автоматический поиск скрытых юридических рисков и обременений - капитал клиентов под защитой до задатка."
        : "Gizli hüquqi risklərin və yüklərin avtomatik axtarışı - müştəri kapitalı behdən əvvəl qorunur.",
      metric: ru ? "Защита клиента" : "Müştəri qorunması",
    },
    {
      icon: Building2,
      tag: ru ? "ФОНДЫ" : "FONDLAR",
      title: ru ? "Институциональный капитал" : "İnstitusional kapital",
      desc: ru
        ? "Обзор всего рынка в одном контуре. Единый стандарт оценки для авто и недвижимости."
        : "Bütün bazar bir konturda. Avtomobil və daşınmaz əmlak üçün vahid qiymətləndirmə standardı.",
      metric: ru ? "Масштаб без шума" : "Səs-küysüz miqyas",
    },
  ];

  return (
    <section className="eh-wash-silk relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="eh-orb absolute -right-10 top-20 h-72 w-72 bg-slate-400/22" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-[2.75rem]">
            {ru ? "Для тех, кто считает капитал" : "Kapitalı hesab edənlər üçün"}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed tracking-[-0.01em] text-slate-600">
            {ru
              ? "Один терминал - три сценария работы с государственными торгами."
              : "Bir terminal - dövlət hərracları ilə işin üç ssenarisi."}
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {personas.map((p, i) => (
            <motion.div
              key={p.title}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: i * 0.08 }}
              className="group"
            >
              <div className="eh-card h-full border-slate-200/80 bg-white p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_12px_28px_-12px_rgba(20,20,20,0.5)] transition-transform duration-500 group-hover:scale-105">
                  <p.icon size={18} strokeWidth={1.8} />
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                  {p.tag}
                </div>
                <h3 className="mt-2 font-serif text-[22px] font-semibold tracking-tight text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed tracking-[-0.01em] text-slate-600">
                  {p.desc}
                </p>
                <div className="mt-5 text-[12px] font-medium text-slate-800">{p.metric}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
