"use client";

/**
 * /how-it-works - Hub = анализ; herrac.gov.az = официальные действия
 */

import Link from "next/link";
import { ExternalLink, Search, ShieldCheck, Calculator, Scale, Gavel } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { HERRAC_URL } from "@/lib/constants";

const HUB_STEPS = [
  {
    icon: Search,
    href: "/dashboard",
    ru: "Найти",
    az: "Tapmaq",
    ruHint: "Лоты Hərrac в одном списке.",
    azHint: "Hərrac lotları bir siyahıda.",
  },
  {
    icon: ShieldCheck,
    href: "/dashboard",
    ru: "Проверить",
    az: "Yoxlamaq",
    ruHint: "Что подтверждено карточкой, а что нет.",
    azHint: "Kartda nə təsdiqlənib, nə yox.",
  },
  {
    icon: Calculator,
    href: "/dashboard",
    ru: "Рассчитать",
    az: "Hesablamaq",
    ruHint: "Рынок и ваши расходы, без выдуманных цифр.",
    azHint: "Bazar və sizin xərclər, uydurma rəqəmsiz.",
  },
  {
    icon: Scale,
    href: "/compare",
    ru: "Решить",
    az: "Qərar",
    ruHint: "Лимит, сравнение и портфель — ваши заметки.",
    azHint: "Limit, müqayisə və portfel — sizin qeydlər.",
  },
  {
    icon: Gavel,
    external: true,
    ru: "Перейти на Hərrac",
    az: "Hərrac-a keçin",
    ruHint: "Участие и ставка — только на официальной площадке.",
    azHint: "İştirak və təklif yalnız rəsmi meydançadadır.",
  },
];

export default function HowItWorksPage() {
  const { locale } = useLocale();
  const az = locale === "az";

  return (
    <div className="mx-auto max-w-[760px]">
      <ol className="divide-y divide-white/[0.06]">
        {HUB_STEPS.map((step, index) => {
          const Icon = step.icon;
          const body = (
            <span className="flex gap-4 py-5 transition duration-200 hover:bg-white/[0.02]">
              <Icon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#d6d3d1]" />
              <span>
                <span className="block text-[18px] font-medium text-white">
                  {index + 1}. {az ? step.az : step.ru}
                  {step.external ? <ExternalLink size={13} className="ml-2 inline text-[#a8a29e]" /> : null}
                </span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[#a8a29e]">
                  {az ? step.azHint : step.ruHint}
                </span>
              </span>
            </span>
          );
          return (
            <li key={step.ru}>
              {step.external ? (
                <a href={HERRAC_URL} target="_blank" rel="noopener noreferrer" className="block">
                  {body}
                </a>
              ) : (
                <Link href={step.href} className="block">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-10 grid gap-8 border-t border-white/[0.06] pt-8 sm:grid-cols-2">
        <div>
          <h2 className="text-[15px] font-medium text-white">
            {az ? "Emlak Hub nə edir" : "Что делает Emlak Hub"}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#a8a29e]">
            {az
              ? "Lotu, bazarı və sizin şərtlərinizi bir yerdə göstərir."
              : "Показывает лот, рынок и ваши условия в одном месте."}
          </p>
        </div>
        <div>
          <h2 className="text-[15px] font-medium text-white">
            {az ? "Hərrac-da nə qalır" : "Что остаётся на Hərrac"}
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#a8a29e]">
            {az
              ? "Qeydiyyat, beh və təklif yalnız rəsmi portalda."
              : "Регистрация, задаток и ставка только на официальном портале."}
          </p>
        </div>
      </div>
    </div>
  );
}
