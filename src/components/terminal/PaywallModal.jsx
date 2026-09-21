"use client";

/**
 * PaywallModal — оплата / продление PRO (демо)
 */

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, Crown, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PLAN_PRICES, PLANS } from "@/lib/subscription";

const REASONS = {
  limit: {
    az: "Pulsuz plana 2 kart daxildir. Daha çoxu üçün PRO lazımdır.",
    ru: "На бесплатном тарифе можно открыть 2 карточки. Дальше нужен PRO.",
  },
  expired: {
    az: "PRO abunəliyiniz bitib. Yeniləyin — terminal yenidən açılacaq.",
    ru: "Подписка PRO закончилась. Продлите — терминал снова откроется.",
  },
  feature: {
    az: "Bu bölmə yalnız PRO-dadır.",
    ru: "Этот раздел доступен только на PRO.",
  },
  compare: {
    az: "Müqayisə — PRO funksiyasıdır.",
    ru: "Сравнение — функция PRO.",
  },
  portfolio: {
    az: "Portfel — PRO funksiyasıdır.",
    ru: "Портфель — функция PRO.",
  },
  map: {
    az: "Xəritə — PRO funksiyasıdır.",
    ru: "Карта — функция PRO.",
  },
};

export default function PaywallModal() {
  const { locale } = useLocale();
  const { paywallOpen, paywallReason, closePaywall, activatePro, profile } =
    useAuth();
  const { users, upsertUser } = useSystem();
  const [mounted, setMounted] = useState(false);
  const [plan, setPlan] = useState("month");
  const ru = locale !== "az";

  useEffect(() => setMounted(true), []);

  if (!mounted || !paywallOpen) return null;

  const reason = REASONS[paywallReason] || REASONS.feature;
  const reasonText = ru ? reason.ru : reason.az;

  const onPay = () => {
    activatePro(plan);
    const price = PLAN_PRICES[plan] || PLAN_PRICES.month;
    const row = users.find((u) => u.email === profile?.email);
    if (row) {
      upsertUser({
        ...row,
        subscription: {
          plan: PLANS.PRO,
          expiresAt: Date.now() + price.days * 86400000,
          source: "demo_payment",
          updatedAt: Date.now(),
        },
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        aria-label="close"
        onClick={closePaywall}
      />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/12 bg-[#0a0c12] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)]">
        <div className="eh-aurora-stripe h-1.5 w-full" />
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
              <Crown size={12} />
              PRO
            </div>
            <h2 className="mt-3 text-[22px] font-semibold text-white">
              {ru ? "Оформить подписку" : "Abunəliyi rəsmiləşdirin"}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#94a3b8]">
              {reasonText}
            </p>
          </div>
          <button
            type="button"
            onClick={closePaywall}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-[#94a3b8] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {Object.entries(PLAN_PRICES).map(([key, p]) => {
            const on = plan === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPlan(key)}
                className={[
                  "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                  on
                    ? "border-[#2563eb]/60 bg-[#2563eb]/15"
                    : "border-white/10 hover:border-white/20",
                ].join(" ")}
              >
                <span>
                  <span className="block text-[14px] font-medium text-white">
                    {ru ? p.labelRu : p.labelAz}
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    {p.days} {ru ? "дней" : "gün"}
                  </span>
                </span>
                <span className="font-mono text-[15px] text-white">
                  ₼ {p.amount}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="space-y-1.5 px-5 text-[12px] text-[#94a3b8]">
          {(ru
            ? [
                "Безлимитные карточки лотов",
                "Карта, сравнение, портфель",
                "Документы и алерты",
              ]
            : [
                "Limitsiz lot kartları",
                "Xəritə, müqayisə, portfel",
                "Sənədlər və alertlər",
              ]
          ).map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400" />
              {line}
            </li>
          ))}
        </ul>

        <div className="p-5 pt-4">
          <button
            type="button"
            onClick={onPay}
            className="w-full rounded-2xl bg-[#2563eb] py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(37,99,235,0.9)] hover:bg-[#1d4ed8]"
          >
            {ru ? "Оплатить (демо)" : "Ödə (demo)"}
          </button>
          <p className="mt-2 text-center text-[11px] text-[#64748b]">
            {ru
              ? "Демо-режим: реальный эквайринг подключим позже."
              : "Demo rejim: real ödəniş sonra qoşulacaq."}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
