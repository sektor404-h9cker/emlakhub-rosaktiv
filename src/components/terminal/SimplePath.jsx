"use client";

/**
 * SimplePath — видимый путь Hub → herrac (FLOW_PATH)
 */

import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { FLOW_PATH } from "@/data/guideCopy";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";

export default function SimplePath({ className = "" }) {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);

  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-white/[0.08]",
        "bg-gradient-to-br from-[#0d1524] via-[#0a0e16] to-[#080a10]",
        className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-white/[0.06] px-4 py-3 sm:px-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            {t.flowTitle}
          </div>
          <p className="mt-1 text-[13px] text-[#94a3b8]">{t.flowHint}</p>
        </div>
        <Link
          href="/how-it-works"
          className="text-[12px] font-medium text-[#93c5fd] hover:text-white"
        >
          {t.navHow} →
        </Link>
      </div>

      <ol className="flex flex-col gap-0 sm:flex-row sm:items-stretch sm:overflow-x-auto">
        {FLOW_PATH.map((step, i) => {
          const label = locale === "az" ? step.az : step.ru;
          const external = step.href.startsWith("http");
          const inner = (
            <>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2563eb]/40 bg-[#2563eb]/15 font-mono text-[11px] font-semibold text-[#93c5fd]">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-white">
                {label}
              </span>
              {external ? (
                <ExternalLink size={13} className="shrink-0 text-[#64748b]" />
              ) : null}
            </>
          );

          return (
            <li
              key={step.href + i}
              className="relative flex min-w-0 flex-1 items-center gap-0 border-b border-white/[0.05] last:border-b-0 sm:min-w-[140px] sm:border-b-0 sm:border-r sm:border-white/[0.05] sm:last:border-r-0"
            >
              {external ? (
                <a
                  href={step.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-3.5"
                >
                  {inner}
                </a>
              ) : (
                <Link
                  href={step.href}
                  className="flex w-full items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:px-3.5"
                >
                  {inner}
                </Link>
              )}
              {i < FLOW_PATH.length - 1 ? (
                <ArrowRight
                  size={14}
                  className="pointer-events-none absolute -right-1.5 top-1/2 z-[1] hidden -translate-y-1/2 text-[#334155] sm:block"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
