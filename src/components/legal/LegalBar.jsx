"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const LINKS = {
  az: [
    ["terms", "Saziş"],
    ["privacy", "Məxfilik"],
    ["disclaimer", "Hüquqi məlumat"],
    ["partners", "Partners"],
  ],
  ru: [
    ["terms", "Соглашение"],
    ["privacy", "Конфиденциальность"],
    ["disclaimer", "Правовая информация"],
    ["partners", "Partners"],
  ],
  en: [
    ["terms", "Terms"],
    ["privacy", "Privacy"],
    ["disclaimer", "Legal information"],
    ["partners", "Partners"],
  ],
};

export default function LegalBar({ className = "" }) {
  const { locale } = useLocale();
  const links = LINKS[locale] || LINKS.az;
  return (
    <nav
      aria-label="Legal"
      className={`inline-flex items-center rounded-full border border-white/[0.08] bg-black px-4 py-2 text-[11px] text-[#a8a29e] shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${className}`}
    >
      {links.map(([slug, label], index) => (
        <span key={slug}>
          {index > 0 ? <span className="px-1.5 text-[#3f3f46]">·</span> : null}
          <Link href={`/legal/${slug}`} className="transition-colors hover:text-white">
            {label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
