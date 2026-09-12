"use client";

/**
 * /support — Эксперт-чат (отдельная страница навигации)
 */

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import SupportChat from "@/components/admin/SupportChat";

export default function SupportPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);

  return (
    <div className="mx-auto max-w-[960px] space-y-4">
      <div>
        <h2 className="text-[20px] font-semibold text-white">{t.supportTitle}</h2>
        <p className="mt-1 text-[13px] text-[#64748b]">{t.supportHint}</p>
      </div>
      <SupportChat />
    </div>
  );
}
