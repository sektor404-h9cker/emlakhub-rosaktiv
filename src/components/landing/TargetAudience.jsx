"use client";

/**
 * TargetAudience - для кого сервис (простым языком)
 */

import React from "react";
import { motion } from "framer-motion";
import { LineChart, ShieldCheck, Building2 } from "lucide-react";
import { say } from "@/lib/i18n/copy";

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

export default function TargetAudience({ locale = "ru" }) {
  const L = (az, ru, en) => say(locale, az, ru, en);

  const personas = [
    {
      icon: LineChart,
      tag: L("ÖZÜ ÜÇÜN", "ДЛЯ СЕБЯ", "FOR YOURSELF"),
      title: L("Fərdi investorlar", "Частные инвесторы", "Private investors"),
      desc: L(
        "Dövlət hərracında lot almaq istəyirsiniz və əvvəlcədən bazar oxşarlarını, kart risklərini və öz təmir rəqəminizdən sonra qazancı görmək.",
        "Хотите купить лот на госаукционе и заранее увидеть рыночные аналоги, риски из карточки и прибыль после своей цифры ремонта.",
        "You want to buy a lot at a state auction and see market comps, card risks and profit after your own repair figure."
      ),
      metric: L("Təklifdən əvvəl qazanc", "Прибыль до ставки", "Profit before you bid"),
    },
    {
      icon: ShieldCheck,
      tag: L("MÜŞTƏRİLƏR ÜÇÜN", "ДЛЯ КЛИЕНТОВ", "FOR CLIENTS"),
      title: L("Brokerlər və agentliklər", "Брокеры и агентства", "Brokers and agencies"),
      desc: L(
        "Müştəri üçün lotu tez yoxlamaq lazımdır: beh qoymadan əvvəl gizli hüquqi problem varmı.",
        "Нужно быстро проверить лот за клиента: нет ли скрытых юридических проблем до внесения задатка.",
        "You need to check a lot quickly for a client: hidden legal problems before the deposit."
      ),
      metric: L("Müştərinin qorunması", "Защита клиента", "Client protection"),
    },
    {
      icon: Building2,
      tag: L("KOMANDALAR ÜÇÜN", "ДЛЯ КОМАНД", "FOR TEAMS"),
      title: L("Fondlar və şirkətlər", "Фонды и компании", "Funds and companies"),
      desc: L(
        "Bazar üçün bir ekran lazımdır: dövlət hərraclarından avto və daşınmaz əmlak - bir yerdə, eyni qaydalarla.",
        "Нужен один экран по рынку: авто и недвижимость с госаукционов - в одном месте, по одним правилам.",
        "You need one market screen: cars and property from state auctions, in one place, under the same rules."
      ),
      metric: L("Hər şey bir yerdə", "Всё в одном месте", "Everything in one place"),
    },
  ];

  return (
    <section className="eh-wash-silk relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div {...fadeUp} className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-[-0.03em] text-[#f5f8fb] sm:text-[2.75rem]">
            {L("Kimə faydalıdır", "Кому это полезно", "Who this is for")}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed tracking-[-0.01em] text-slate-600">
            {L(
              "Dövlət hərraclarında iştirak edirsinizsə və ya başqalarına kömək edirsinizsə - bu xidmət sizin üçündür.",
              "Если вы участвуете в госаукционах или помогаете другим - этот сервис для вас.",
              "If you take part in state auctions or help other people do it, this service is for you."
            )}
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
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[#f3efe6] transition-transform duration-500 group-hover:scale-105">
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
