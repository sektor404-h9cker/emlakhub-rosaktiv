"use client";

/**
 * SubscriptionBanner — Free закрыт / PRO скоро истечёт / PRO истёк
 */

import { Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { say } from "@/lib/i18n/copy";
import { formatExpiry, subscriptionWindow } from "@/lib/subscription";

export default function SubscriptionBanner() {
  const { locale } = useLocale();
  const {
    isPro,
    subscriptionExpired,
    daysLeft,
    profile,
    openPaywall,
    isAdmin,
  } = useAuth();
  const s = (az, ru, en) => say(locale, az, ru, en);
  const win = subscriptionWindow(profile?.subscription);

  if (isAdmin) return null;

  if (subscriptionExpired) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3">
        <div>
          <div className="text-[13px] font-semibold text-rose-200">
            {s("PRO abunəliyi bitib", "Подписка PRO истекла", "PRO subscription has ended")}
          </div>
          <p className="mt-0.5 text-[12px] text-[#fda4af]">
            {s(
              "PRO-nuz bitib. Analitikadan yenidən istifadə etmək üçün abunəliyi uzadın. Saxlanmış ssenarilər hesabda qalır.",
              "Ваш PRO завершился. Продлите подписку, чтобы снова пользоваться аналитикой. Сохранённые расчёты остаются в аккаунте.",
              "Your PRO has ended. Renew the subscription to use analytics again. Saved calculations stay in the account."
            )}
          </p>
          {win.expiresAt ? (
            <p className="mt-1 font-mono text-[11px] text-[#fb7185]">
              {s("Bitib:", "Истекло:", "Ended:")}{" "}
              {formatExpiry(win.expiresAt, locale)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => openPaywall("expired")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-[12px] font-semibold text-white"
        >
          <Crown size={14} />
          {s("Yenilə", "Продлить", "Renew")}
        </button>
      </div>
    );
  }

  if (isPro && daysLeft != null && daysLeft <= 7) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
        <div>
          <p className="text-[13px] text-[#fde68a]">
            {daysLeft <= 1
              ? s(
                  "PRO sabah bitir. Saxlanmış hesablamalarınız hesabda qalacaq.",
                  "PRO заканчивается завтра. Ваши сохранённые расчёты останутся в аккаунте.",
                  "PRO ends tomorrow. Your saved calculations stay in the account."
                )
              : s(
                  "PRO-nuz tezliklə bitəcək. Lotları analiz etməyə davam etmək üçün girişi uzadın.",
                  "Ваш PRO скоро закончится. Продлите доступ, чтобы продолжать анализировать лоты.",
                  "Your PRO will end soon. Renew access to keep analysing lots."
                )}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[#fbbf24]/90">
            {formatExpiry(win.startsAt, locale)}
            {" → "}
            {formatExpiry(win.expiresAt, locale)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPaywall("expired")}
          className="rounded-xl border border-amber-400/40 px-3 py-1.5 text-[12px] font-medium text-amber-100"
        >
          {s("Əvvəlcədən yenilə", "Продлить заранее", "Renew early")}
        </button>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div>
          <p className="text-[13px] text-[#94a3b8]">
            {s(
              "Free · lotlar və terminal bölmələri bağlıdır",
              "Free · лоты и разделы терминала закрыты",
              "Free · lots and terminal sections are closed"
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            {s(
              "PRO 9,90 ₼/ay-dan — tam giriş",
              "PRO от 9,90 ₼/мес — полный доступ",
              "PRO from 9.90 ₼/month — full access"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPaywall("feature")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-3.5 py-1.5 text-[12px] font-semibold text-white"
        >
          <Crown size={13} />
          PRO
        </button>
      </div>
    );
  }

  /* Активный PRO с большим запасом дней — компактная строка */
  if (isPro && win.startsAt && win.expiresAt) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-2.5">
        <p className="font-mono text-[12px] text-emerald-200/90">
          PRO
          {daysLeft != null ? ` · ${daysLeft} ${s("gün", "дн.", "d")}` : ""}
          {" · "}
          {formatExpiry(win.startsAt, locale)}
          {" → "}
          {formatExpiry(win.expiresAt, locale)}
        </p>
        <button
          type="button"
          onClick={() => openPaywall("feature")}
          className="text-[11px] text-[#64748b] hover:text-white"
        >
          {s("Yenilə", "Продлить", "Renew")}
        </button>
      </div>
    );
  }

  return null;
}
