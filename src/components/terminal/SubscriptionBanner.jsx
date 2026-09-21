"use client";

/**
 * SubscriptionBanner — напоминание об окончании / Free лимит
 */

import { Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatExpiry } from "@/lib/subscription";

export default function SubscriptionBanner() {
  const { locale } = useLocale();
  const {
    isPro,
    subscriptionExpired,
    daysLeft,
    profile,
    openPaywall,
    lotOpensUsed,
    freeLimits,
    isAdmin,
  } = useAuth();
  const ru = locale !== "az";

  if (isAdmin) return null;

  if (subscriptionExpired) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3">
        <div>
          <div className="text-[13px] font-semibold text-rose-200">
            {ru ? "Подписка PRO истекла" : "PRO abunəliyi bitib"}
          </div>
          <p className="mt-0.5 text-[12px] text-[#fda4af]">
            {ru
              ? "Терминал ограничен. Продлите доступ, чтобы снова открывать все лоты."
              : "Terminal məhdudlaşıb. Bütün lotları açmaq üçün yeniləyin."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPaywall("expired")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500 px-4 py-2 text-[12px] font-semibold text-white"
        >
          <Crown size={14} />
          {ru ? "Продлить" : "Yenilə"}
        </button>
      </div>
    );
  }

  if (isPro && daysLeft != null && daysLeft <= 7) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
        <p className="text-[13px] text-[#fde68a]">
          {ru
            ? `PRO ещё ${daysLeft} дн. (до ${formatExpiry(profile?.subscription?.expiresAt, "ru")})`
            : `PRO hələ ${daysLeft} gün (bitir: ${formatExpiry(profile?.subscription?.expiresAt, "az")})`}
        </p>
        <button
          type="button"
          onClick={() => openPaywall("expired")}
          className="rounded-xl border border-amber-400/40 px-3 py-1.5 text-[12px] font-medium text-amber-100"
        >
          {ru ? "Продлить заранее" : "Əvvəlcədən yenilə"}
        </button>
      </div>
    );
  }

  if (!isPro) {
    const left = Math.max(0, freeLimits.maxLotOpens - lotOpensUsed);
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <p className="text-[13px] text-[#94a3b8]">
          {ru
            ? `Бесплатный тариф · ещё ${left} из ${freeLimits.maxLotOpens} карточек`
            : `Pulsuz tarif · daha ${left} / ${freeLimits.maxLotOpens} kart`}
        </p>
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

  return null;
}
