"use client";

/**
 * MaintenanceScreen - переливающийся экран при kill-switch
 */

import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { say } from "@/lib/i18n/copy";
import Link from "next/link";

export default function MaintenanceScreen() {
  const { locale } = useLocale();
  const { system } = useSystem();
  const { isAdmin, logout } = useAuth();
  const title = say(
    locale,
    system.titleAz || "Texniki işlər",
    system.titleRu || "Технические работы",
    system.titleEn || "Maintenance"
  );
  const message = say(locale, system.messageAz, system.messageRu, system.messageEn);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#05070b] px-6 text-center">
      <div className="eh-aurora-bg pointer-events-none absolute inset-0" />
      <div className="relative z-10 max-w-lg">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Digital Emlak Hub
        </p>
        <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">
          {title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#94a3b8]">
          {message ||
            say(
              locale,
              "Servis müvəqqəti əlçatan deyil. Artıq düzəldirik.",
              "Сервис временно недоступен. Мы уже чиним.",
              "The service is temporarily unavailable. We are fixing it."
            )}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin/system"
              className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              {say(locale, "Adminə (sistem)", "В админку (система)", "Admin (system)")}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-[13px] text-[#94a3b8] hover:text-white"
          >
            {say(locale, "Çıxış", "Выйти", "Log out")}
          </button>
        </div>
      </div>
    </div>
  );
}
