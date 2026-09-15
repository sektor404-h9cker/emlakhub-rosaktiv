"use client";

/**
 * /how-it-works — Hub = анализ; herrac.gov.az = официальные действия
 */

import Link from "next/link";
import { ExternalLink, Search, Scale, Gavel, MessageCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { HERRAC_URL } from "@/lib/constants";
import SectionGuide from "@/components/terminal/SectionGuide";
import { useTerminalPanel } from "@/context/TerminalPanelContext";

const HUB_STEPS = [
  {
    icon: Search,
    href: "/dashboard",
    az: "Lotlara baxın",
    ru: "Смотрите лоты",
    azHint: "Terminalda skor, təmir, risk və marja",
    ruHint: "В терминале: скор, ремонт, риск и маржа",
  },
  {
    icon: Scale,
    href: "/compare",
    az: "Müqayisə edin və qərar verin",
    ru: "Сравните и решите",
    azHint: "İzləmə, müqayisə, portfel — yalnız sizin qeydləriniz",
    ruHint: "Избранное, сравнение, портфель — ваши рабочие заметки",
  },
  {
    icon: Gavel,
    href: null,
    external: true,
    az: "Rəsmi hərraca keçin",
    ru: "Перейдите на официальный аукцион",
    azHint: "Beh, iştirak və təklif — yalnız herrac.gov.az-da",
    ruHint: "Задаток, участие и ставка — только на herrac.gov.az",
  },
  {
    icon: MessageCircle,
    href: "/support",
    az: "Sual olsa — dəstək",
    ru: "Если вопрос — в поддержку",
    azHint: "FAQ, tiket və ekspert — terminal haqqında kömək",
    ruHint: "FAQ, тикет и эксперт — помощь по терминалу",
  },
];

export default function HowItWorksPage() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { startTour } = useTerminalPanel();
  const ru = locale !== "az";

  return (
    <div className="mx-auto max-w-[760px] space-y-6">
      <SectionGuide section="how" />

      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-white">
          {t.howTitle}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#94a3b8]">
          {t.howHintLong}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2563eb]/35 bg-[#0d1524] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#93c5fd]">
            {t.howHubRole}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#cbd5e1]">
            {t.howHubRoleText}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-[#16120a] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300">
            {t.howHerracRole}
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#cbd5e1]">
            {t.howHerracRoleText}
          </p>
          <a
            href={HERRAC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-200 hover:text-white"
          >
            herrac.gov.az
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <ol className="space-y-3">
        {HUB_STEPS.map((step, i) => {
          const Icon = step.icon;
          const title = ru ? step.ru : step.az;
          const hint = ru ? step.ruHint : step.azHint;
          const inner = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-[13px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-[14px] font-medium text-white">
                  <Icon size={15} className="shrink-0 text-[#93c5fd]" />
                  {title}
                  {step.external ? <ExternalLink size={13} className="text-[#64748b]" /> : null}
                </span>
                <span className="mt-1 block text-[12px] leading-relaxed text-[#64748b]">
                  {hint}
                </span>
              </span>
            </>
          );

          if (step.external) {
            return (
              <li key={i}>
                <a
                  href={HERRAC_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-2xl border border-amber-500/25 bg-[#0a0c12] px-4 py-3.5 transition hover:border-amber-400/40"
                >
                  {inner}
                </a>
              </li>
            );
          }

          return (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex gap-3 rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3.5 transition hover:border-[#2563eb]/40"
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ol>

      <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[12px] leading-relaxed text-[#64748b]">
        {t.howDisclaimer}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={startTour}
          className="flex-1 rounded-2xl bg-[#2563eb] py-3.5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
        >
          {t.tourRestart}
        </button>
        <Link
          href="/support"
          className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 py-3.5 text-[14px] font-medium text-[#94a3b8] hover:text-white"
        >
          {t.navChat}
        </Link>
      </div>
    </div>
  );
}
