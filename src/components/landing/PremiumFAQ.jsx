"use client";

/**
 * PremiumFAQ — простые вопросы для первого визита
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
    q: "Bu nədir — sadə dillə?",
    a: "Digital Emlak Hub dövlət hərraclarındakı lotlara baxmağa kömək edir. Təklif verməzdən əvvəl təmir, risklər və təxmini qazancı göstəririk.",
  },
  {
    q: "Hamı üçün açıqdır?",
    a: "Xeyr. Giriş müraciət və abunəliklə verilir. Bu, peşəkar investorlar və brokerlər üçündür.",
  },
  {
    q: "Məlumatlarım harada saxlanır?",
    a: "Bizim serverlərdə. Lot fotoları və sizin hesab məlumatları ChatGPT və digər kənar servislərə göndərilmir.",
  },
  {
    q: "Təmiri fotoya görə necə bilirsiniz?",
    a: "Lot şəkillərində zədələri qeyd edirik və təxmini təmir smetası veririk. Bu məbləğ dərhal qazanc hesabına daxil olur.",
  },
  {
    q: "Rusiyada da var?",
    a: "Azərbaycanda Digital Emlak Hub artıq işləyir. Rusiya üçün RosAktiv Hub hazırlanır və tezliklə açılacaq.",
  },
  {
    q: "Qazandığım lotdan komissiya götürürsünüz?",
    a: "Xeyr. Aylıq abunəlik var. Lotdan qazanc sizindir.",
  },
  {
    q: "Dövlət portalından fərqi nədir?",
    a: "Dövlət portalı rəsmi lotları göstərir — biz onu əvəz etmirik. Biz əlavə edirik: təmir smetası, risklər və təklifdən əvvəl qazanc.",
  },
];

const FAQ_RU = [
  {
    q: "Что это — простыми словами?",
    a: "Digital Emlak Hub помогает смотреть лоты на госаукционах. До ставки мы показываем ремонт, риски и примерную прибыль.",
  },
  {
    q: "Это открыто для всех?",
    a: "Нет. Доступ по заявке и подписке. Сервис для инвесторов и брокеров.",
  },
  {
    q: "Где хранятся мои данные?",
    a: "На наших серверах. Фото лотов и данные аккаунта не отправляются в ChatGPT и другие внешние сервисы.",
  },
  {
    q: "Как вы понимаете ремонт по фото?",
    a: "По снимкам лота отмечаем повреждения и даём примерную смету. Эта сумма сразу входит в расчёт прибыли.",
  },
  {
    q: "Есть ли версия для России?",
    a: "В Азербайджане Digital Emlak Hub уже работает. Для России готовим RosAktiv Hub — скоро откроем.",
  },
  {
    q: "Берёте комиссию с выигранных лотов?",
    a: "Нет. Есть месячная подписка. Прибыль по лоту остаётся вашей.",
  },
  {
    q: "Чем отличаетесь от госпортала?",
    a: "Госпортал показывает официальные лоты — мы его не заменяем. Мы добавляем смету ремонта, риски и прибыль до ставки.",
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
            {ru ? "Частые вопросы" : "Tez-tez verilən suallar"}
          </h2>
          <p className="mt-4 text-[15px] text-slate-500">
            {ru
              ? "Коротко о том, куда вы попали и как этим пользоваться."
              : "Haraya düşdüyünüz və necə istifadə edəcəyiniz haqqında qısa."}
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
