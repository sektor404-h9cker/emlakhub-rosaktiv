"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";

export default function AcademyPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);

  return (
    <div className="mx-auto max-w-[720px]">
      <h2 className="text-[20px] font-semibold text-white">{t.academyTitle}</h2>
      <p className="mt-1 text-[13px] text-[#64748b]">{t.academyHint}</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#0a0c12] p-6 text-[14px] leading-relaxed text-[#94a3b8]">
        {t.soon}
      </div>
    </div>
  );
}
