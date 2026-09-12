"use client";

/**
 * ============================================================================
 * LandingNav — статусная шапка хедж-фонда
 * ============================================================================
 * Brand-first правило:
 * - Название бренда — герой-уровень сигнала, не мелкая ссылка.
 * - Никаких карточек/бейджей в навбаре: тишина = доверие.
 * ============================================================================
 */

import Link from "next/link";
import LanguageSwitch from "./LanguageSwitch";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function LandingNav() {
  const { t } = useLocale();

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 px-5 pt-6 sm:px-8 lg:px-12">
      <Link href="/" className="group min-w-0">
        {/* Типографический логотип: архитектурный гротеск через tracking */}
        <div className="font-semibold text-[15px] sm:text-[17px] tracking-[0.22em] text-[var(--eh-ink)]">
          {t.brandPrimary}
          <span className="ml-2 text-[var(--eh-cyan)]">{t.brandSecondary}</span>
        </div>
        <div className="mt-1 text-[9px] uppercase tracking-[0.34em] text-[var(--eh-titanium)]">
          Enterprise Terminal
        </div>
      </Link>

      <div className="flex items-center gap-3 sm:gap-5">
        <LanguageSwitch />
        <Link
          href="/login"
          className="hidden sm:inline-flex text-[12px] uppercase tracking-[0.18em] text-[var(--eh-titanium)] transition-colors hover:text-[var(--eh-cyan)]"
        >
          {t.navTerminal}
        </Link>
      </div>
    </header>
  );
}
