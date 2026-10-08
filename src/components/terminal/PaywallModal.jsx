"use client";

/**
 * PaywallModal - оплата / продление PRO (демо)
 */

import { createPortal } from "react-dom";
import { useState } from "react";
import { useIsClient } from "@/lib/react/useIsClient";
import { X, Crown, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PLAN_PRICES } from "@/lib/subscription";
import { manualPayHint } from "@/lib/payments/manualAz";
import { say } from "@/lib/i18n/copy";

const REASONS = {
  limit: {
    az: "Pulsuz planda lotlar bağlıdır. PRO lazımdır.",
    ru: "На Free лоты закрыты. Нужен PRO.",
    en: "Lots are closed on Free. PRO is required.",
  },
  expired: {
    az: "PRO abunəliyiniz bitib. Yeniləyin - terminal yenidən açılacaq.",
    ru: "Подписка PRO закончилась. Продлите - терминал снова откроется.",
    en: "Your PRO subscription has ended. Renew it and the terminal opens again.",
  },
  feature: {
    az: "Bu bölmə yalnız PRO-dadır.",
    ru: "Этот раздел доступен только на PRO.",
    en: "This section is available only on PRO.",
  },
  compare: {
    az: "Müqayisə - PRO funksiyasıdır.",
    ru: "Сравнение - функция PRO.",
    en: "Compare is a PRO feature.",
  },
  portfolio: {
    az: "Portfel - PRO funksiyasıdır.",
    ru: "Портфель - функция PRO.",
    en: "Portfolio is a PRO feature.",
  },
  map: {
    az: "Xəritə - PRO funksiyasıdır.",
    ru: "Карта - функция PRO.",
    en: "The map is a PRO feature.",
  },
};

export default function PaywallModal() {
  const { locale } = useLocale();
  const {
    paywallOpen,
    paywallReason,
    closePaywall,
    activatePro,
    dbConfigured,
  } = useAuth();
  const mounted = useIsClient();
  const [plan, setPlan] = useState("month");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const s = (az, ru, en) => say(locale, az, ru, en);

  if (!mounted || !paywallOpen) return null;

  const reason = REASONS[paywallReason] || REASONS.feature;
  const reasonText = s(reason.az, reason.ru, reason.en);

  const onPay = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await activatePro(plan);
      if (result?.pending) setDone(true);
    } catch (err) {
      setError(err.message || s("Müraciət göndərilmədi.", "Заявку не удалось отправить.", "The request could not be sent."));
    } finally {
      setBusy(false);
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
              {s("Abunəliyi rəsmiləşdirin", "Оформить подписку", "Start a subscription")}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#94a3b8]">
              {s(
                "Tarifi seçin → ödəyin → PRO alın",
                "Выберите тариф → Оплатите → Получите PRO",
                "Choose a plan → Pay → Get PRO"
              )}
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#64748b]">{reasonText}</p>
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
                    {s(p.labelAz, p.labelRu, p.labelEn)}
                  </span>
                  <span className="text-[11px] text-[#64748b]">
                    {p.days} {s("gün", "дней", "days")}
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
          {[
            s("Mövcud lotların analizi və iqtisadiyyat", "Анализ доступных лотов и расчёт экономики", "Analysis of available lots and the economics"),
            s("Müqayisə, seçilmişlər və portfel", "Сравнение, избранное и портфель", "Compare, favorites and portfolio"),
            s("Hesabdakı bildiriş siyahısı", "Список уведомлений в аккаунте", "The notification list in the account"),
          ].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400" />
              {line}
            </li>
          ))}
        </ul>

        <div className="p-5 pt-4">
          {error ? (
            <p className="mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-[13px] text-amber-100">
              {error}
            </p>
          ) : null}
          {done && dbConfigured ? (
            <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-[13px] text-emerald-200">
              {s(
                "Ödəniş yoxlanış gözləyir. Giriş təsdiqdən sonra açılacaq.",
                "Оплата ожидает проверки. Доступ откроется после подтверждения.",
                "Payment is waiting for review. Access opens after confirmation."
              )}
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onPay}
              className="w-full rounded-2xl bg-[#2563eb] py-3.5 text-[14px] font-semibold text-white shadow-[0_16px_40px_-16px_rgba(37,99,235,0.9)] hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {busy
                ? s("Göndərilir…", "Отправка…", "Sending…")
                : dbConfigured
                  ? s("Ödəniş sorğusu göndər", "Отправить заявку на оплату", "Send a payment request")
                  : s("Ödə (demo)", "Оплатить (демо)", "Pay (demo)")}
            </button>
          )}
          <p className="mt-2 text-center text-[11px] text-[#64748b]">
            {dbConfigured
              ? manualPayHint(locale)
              : s("PostgreSQL olmadan demo rejim.", "Демо-режим без PostgreSQL.", "Demo mode without PostgreSQL.")}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
