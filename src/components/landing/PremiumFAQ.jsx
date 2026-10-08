"use client";

/**
 * PremiumFAQ - простые вопросы для первого визита
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { say } from "@/lib/i18n/copy";

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
    q: "Bu nədir - sadə dillə?",
    a: "Digital Emlak Hub dövlət hərraclarındakı lotlara baxmağa kömək edir. Təklifdən əvvəl bazar oxşarlarını və kart mətnindəki riskləri göstəririk. Qazanc təmir rəqəmini siz yazandan sonra görünür.",
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
    q: "Təmiri fotoya görə hesablayırsınız?",
    a: "Xeyr. Foto üzrə zədə və smeta yoxdur. Təmiri siz yazırsınız. Boş sahə sıfır sayılmır və qazanc hesabına düşmür.",
  },
  {
    q: "Rusiyada da var?",
    a: "Azərbaycanda Digital Emlak Hub artıq işləyir. Rusiya üçün RosTorg Hub hazırlanır və tezliklə açılacaq.",
  },
  {
    q: "Qazandığım lotdan komissiya götürürsünüz?",
    a: "Xeyr. Aylıq abunəlik var. Lotdan qazanc sizindir.",
  },
  {
    q: "Dövlət portalından fərqi nədir?",
    a: "Dövlət portalı rəsmi lotları göstərir - biz onu əvəz etmirik. Biz bazar oxşarlarını, mətn risklərini və sizin təmir rəqəminizdən sonra qazancı əlavə edirik.",
  },
];

const FAQ_RU = [
  {
    q: "Что это - простыми словами?",
    a: "Digital Emlak Hub помогает смотреть лоты на госаукционах. До ставки показываем рыночные аналоги и риски из текста карточки. Прибыль появляется после вашей цифры ремонта.",
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
    q: "Вы считаете ремонт по фото?",
    a: "Нет. Повреждения по фото и смету ремонта сервис не строит. Ремонт вводите вы. Пустое поле не считается нулём и в прибыль не входит.",
  },
  {
    q: "Есть ли версия для России?",
    a: "В Азербайджане Digital Emlak Hub уже работает. Для России готовим RosTorg Hub - скоро откроем.",
  },
  {
    q: "Берёте комиссию с выигранных лотов?",
    a: "Нет. Есть месячная подписка. Прибыль по лоту остаётся вашей.",
  },
  {
    q: "Чем отличаетесь от госпортала?",
    a: "Госпортал показывает официальные лоты — мы его не заменяем. Мы добавляем рыночные аналоги, риски из текста и прибыль после вашей цифры ремонта.",
  },
];

const FAQ_EN = [
  {
    q: "What is this, in plain words?",
    a: "Digital Emlak Hub helps you look at lots on state auctions. Before you bid we show market comps and risks from the card text. Profit appears after you enter your repair figure.",
  },
  {
    q: "Is it open to everyone?",
    a: "No. Access is by request and subscription. The service is for investors and brokers.",
  },
  {
    q: "Where is my data kept?",
    a: "On our servers. Lot photos and account data are not sent to ChatGPT or other outside services.",
  },
  {
    q: "Do you estimate repair from the photo?",
    a: "No. The service does not build damage or a repair estimate from photos. You enter repair. An empty field is not treated as zero and does not enter the profit.",
  },
  {
    q: "Is there a version for Russia?",
    a: "Digital Emlak Hub is already live in Azerbaijan. RosTorg Hub for Russia is being prepared and will open soon.",
  },
  {
    q: "Do you take a commission on lots I win?",
    a: "No. There is a monthly subscription. Profit on the lot stays yours.",
  },
  {
    q: "How is this different from the state portal?",
    a: "The state portal shows the official lots — we do not replace it. We add market comps, risks from the text, and profit after your repair figure.",
  },
];

export default function PremiumFAQ({ locale = "az" }) {
  const [openIdx, setOpenIdx] = useState(0);
  const items = locale === "az" ? FAQ_AZ : locale === "en" ? FAQ_EN : FAQ_RU;

  return (
    <section className="eh-afterglow eh-wash-pearl relative overflow-hidden border-t border-slate-200/70 py-16 sm:py-24 lg:py-32">
      <div className="eh-orb absolute left-[30%] top-0 h-56 w-56 bg-[#b8956c]/10" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-5 sm:px-8">
        <div className="mb-14 text-center">
          <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-[42px]">
            {say(locale, "Tez-tez verilən suallar", "Частые вопросы", "Common questions")}
          </h2>
          <p className="mt-4 text-[15px] text-slate-500">
            {say(
              locale,
              "Haraya düşdüyünüz və necə istifadə edəcəyiniz haqqında qısa.",
              "Коротко о том, куда вы попали и как этим пользоваться.",
              "A short note on where you are and how to use this."
            )}
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
