"use client";

import Link from "next/link";
import { say } from "@/lib/i18n/copy";

const POINTS = [
  ["Lotun qiyməti hesablamanın yalnız başlanğıcıdır.", "Цена лота — это только начало расчёта.", "The lot price is only the start of the calculation."],
  ["Hər ucuz alış sərfəli sövdələşmə olmur.", "Не каждая дешёвая покупка становится выгодной сделкой.", "A cheap purchase is not always a good deal."],
  ["Bir nəzərə alınmamış xərc bütün nəticəni apara bilər.", "Один непросчитанный расход может съесть всю прибыль.", "One uncounted cost can take the whole result."],
  ["Məlumat çatmayanda Emlak Hub bunu birbaşa deyir.", "Когда данных недостаточно, Emlak Hub говорит об этом прямо.", "When the data is not enough, Emlak Hub says so."],
];

const INCLUDED = [
  ["Alış qiyməti", "Цена покупки", "Purchase price"],
  ["Bazar oriyentiri", "Рыночный ориентир", "Market reference"],
  ["Təmir, əgər siz yazmısınızsa", "Ремонт, если указан", "Repair, if you entered it"],
  ["Naməlum xərclər üçün ehtiyat", "Запас на неизвестные расходы", "Reserve for unknown costs"],
  ["Komissiyalar və digər xərclər", "Комиссии и другие расходы", "Commissions and other costs"],
  ["Mümkün maliyyə nəticəsi", "Возможный финансовый результат", "Possible financial result"],
];

export default function GrowthStory({ lang = "ru" }) {
  const L = (az, ru, en) => say(lang, az, ru, en);
  return (
    <section id="why" className="border-t border-slate-200/80 bg-[#f7f5f1] px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {L("Niyə hərrac qiyməti hələ nəticə deyil", "Почему цена аукциона — ещё не прибыль", "Why the auction price is not the result yet")}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {L("Sizin təklifiniz. Sizin xərcləriniz. Sizin qərarınız.", "Ваша ставка. Ваши расходы. Ваше решение.", "Your bid. Your costs. Your decision.")}
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((row) => (
              <li key={row[1]} className="border-l border-slate-300 pl-4 text-[15px] leading-relaxed text-slate-700">
                {L(...row)}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(15,23,42,0.5)]">
          <h2 className="font-serif text-2xl font-semibold text-slate-950">
            {L("Niyə Emlak Hub gəlir vəd etmir", "Почему Emlak Hub не обещает прибыль", "Why Emlak Hub does not promise profit")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {L(
              "Mümkün maliyyə nəticəsini əldə olan məlumat, bazar oriyentirləri və sizin xərcləriniz əsasında hesablayırıq. Məlumat çatmayanda nəyin çatışmadığını birbaşa göstəririk. Son qərar sizdə qalır.",
              "Мы рассчитываем возможный финансовый результат на основании доступных данных, рыночных ориентиров и ваших расходов. Если сведений недостаточно, прямо показываем, чего не хватает. Окончательное решение остаётся за вами.",
              "We calculate a possible financial result from the available data, market references, and your costs. When information is missing, we show what is missing. The final decision stays with you."
            )}
          </p>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
            {L("Hesablamaya nə daxildir?", "Что входит в расчёт?", "What is in the calculation?")}
          </h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-700">
            {INCLUDED.map((row) => (
              <li key={row[1]}>{L(...row)}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-6xl rounded-3xl border border-slate-900 bg-slate-950 px-6 py-7 text-white sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Emlak Partners</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold sm:text-3xl">
          {L("İnvestor dəvət edin. Əlavə PRO günləri alın.", "Приглашайте инвесторов. Получайте дополнительные дни PRO.", "Invite investors. Receive extra PRO days.")}
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          {L(
            "Dəvət etdiyiniz şəxs PRO-nu ilk dəfə uğurla ödəyəndə siz +7 gün, o isə +3 gün alır. Bu, xidmət günləridir, pul ödənişi deyil. Günlər inzibatçı panelindən dəyişə bilər.",
            "Когда приглашённый впервые успешно оплачивает PRO, вы получаете +7 дней, а он +3 дня. Это дни сервиса, не денежная выплата. Размер дней можно изменить в админке.",
            "When the person you invite pays for PRO for the first time, you receive +7 days and they receive +3. These are service days, not a cash payout. The day counts can be changed in admin."
          )}
        </p>
        <Link href="/legal/partners" className="mt-4 inline-flex text-sm font-medium text-white underline underline-offset-4">
          {L("Emlak Partners qaydaları", "Правила Emlak Partners", "Emlak Partners rules")}
        </Link>
      </div>
    </section>
  );
}
