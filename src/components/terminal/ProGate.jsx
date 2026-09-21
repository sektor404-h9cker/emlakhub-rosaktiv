"use client";

import { useEffect } from "react";
import { Crown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";

/** Блокирует раздел для Free с красивым CTA */
export default function ProGate({ feature = "feature", children }) {
  const { isPro, isAdmin, openPaywall } = useAuth();
  const { locale } = useLocale();
  const ru = locale !== "az";
  const allowed = isPro || isAdmin;

  useEffect(() => {
    if (!allowed) openPaywall(feature);
  }, [allowed, feature, openPaywall]);

  if (allowed) return children;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb]/20 text-[#93c5fd]">
        <Crown size={26} />
      </div>
      <h2 className="mt-5 text-[22px] font-semibold text-white">
        {ru ? "Нужен PRO" : "PRO lazımdır"}
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#94a3b8]">
        {ru
          ? "На бесплатном тарифе этот раздел закрыт. Откройте до 2 карточек лотов или оформите подписку."
          : "Pulsuz tarifdə bu bölmə bağlıdır. 2 lot kartı aça bilərsiniz və ya abunə olun."}
      </p>
      <button
        type="button"
        onClick={() => openPaywall(feature)}
        className="mt-6 rounded-xl bg-[#2563eb] px-5 py-2.5 text-[13px] font-semibold text-white"
      >
        {ru ? "Оплатить подписку" : "Abunəliyi ödə"}
      </button>
    </div>
  );
}
