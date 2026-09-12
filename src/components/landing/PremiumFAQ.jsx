"use client";

/**
 * PremiumFAQ — язык капитала; техника — только в ответах про периметр
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

function FAQItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-start justify-between gap-6 py-6 text-left"
      >
        <span className="font-serif text-[18px] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[20px]">
          {q}
        </span>
        <span
          className={[
            "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300",
            open
              ? "rotate-45 bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200",
          ].join(" ")}
        >
          <Plus size={14} strokeWidth={2.4} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-7 pr-14 text-[15px] leading-[1.7] text-slate-600">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const FAQ_AZ = [
  {
    q: "Bu hamı üçün açıq platformadır?",
    a: "Xeyr. Digital Emlak Hub - peşəkar kapital üçün bağlı terminaldır. Giriş müraciət və abunəlik əsasında verilir.",
  },
  {
    q: "Lot məlumatları harada emal olunur?",
    a: "Yalnız infrastrukturumuzda. Vision və NLP lokal işləyir, xarici API yoxdur. Investor datası fiziki olaraq serverdən çıxmır - ətraflı təhlükəsizlik blokunda.",
  },
  {
    q: "Təmir fotolara görə necə qiymətləndirilir?",
    a: "Lot şəkillərində aşınma və qüsur zonaları seçilir, bərpa smetası formalaşır. Bu məbləğ dərhal təklifdən əvvəl xalis marjaya daxil olur.",
  },
  {
    q: "Rusiyada da işləyirsiniz?",
    a: "RosAktiv Hub - Rusiya bazarı üçün versiya - inkişafdadır və tezliklə əlçatan olacaq. Digital Emlak Hub artıq Azərbaycanda işləyir.",
  },
  {
    q: "Qazanılmış lotlardan komissiya tutulur?",
    a: "Xeyr. Model - aylıq abunəlik. Lot üzrə gəlir sizindir.",
  },
  {
    q: "Dövlət portalı ilə nə fərqi var?",
    a: "Dövlət portalı rəsmi mənbədir - biz onu əvəz etmirik. Biz qiymətləndirmə qatı veririk: gizli risklər, smeta və iştirakdan əvvəl xalis marja. Hüquqi mənbə dövlət portalı olaraq qalır.",
  },
];

const FAQ_RU = [
  {
    q: "Это открытая платформа для всех?",
    a: "Нет. Digital Emlak Hub - закрытый терминал для профессионального капитала. Доступ - по заявке и подписке.",
  },
  {
    q: "Где обрабатываются данные лотов?",
    a: "Только на нашей инфраструктуре. Vision и NLP работают локально, без внешних API. Данные инвесторов физически не покидают сервер - подробнее в блоке безопасности.",
  },
  {
    q: "Как оценивается ремонт по фотографиям?",
    a: "По снимкам лота выделяются зоны износа и дефектов, формируется смета восстановления. Эта сумма сразу входит в расчёт чистой маржи до ставки.",
  },
  {
    q: "Работаете ли в России?",
    a: "RosAktiv Hub - версия для российского рынка - в разработке и скоро будет доступна. Digital Emlak Hub уже работает в Азербайджане.",
  },
  {
    q: "Берёте ли комиссию с выигранных лотов?",
    a: "Нет. Модель - месячная подписка. Прибыль по лоту остаётся вашей.",
  },
  {
    q: "Чем отличаетесь от государственного портала?",
    a: "Госпортал - официальный источник, мы его не заменяем. Мы даём слой оценки: скрытые риски, смета и чистая маржа до участия. Юридически значимым источником остаётся госпортал.",
  },
];

export default function PremiumFAQ({ locale = "az" }) {
  const [openIdx, setOpenIdx] = useState(0);
  const ru = locale === "ru";
  const items = ru ? FAQ_RU : FAQ_AZ;

  return (
    <section className="eh-wash-pearl relative overflow-hidden border-t border-slate-200/70 py-16 sm:py-24 lg:py-32">
      <div className="eh-orb absolute left-[30%] top-0 h-56 w-56 bg-slate-400/15" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <div className="mb-14 text-center">
          <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-[42px]">
            {ru ? "Вопросы" : "Suallar"}
          </h2>
          <p className="mt-4 text-[15px] text-slate-500">
            {ru
              ? "То, что обычно спрашивает профессиональный капитал."
              : "Peşəkar kapitalın adətən soruşduğu."}
          </p>
        </div>

        <div className="border-t border-slate-200">
          {items.map((it, i) => (
            <FAQItem
              key={i}
              q={it.q}
              a={it.a}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
