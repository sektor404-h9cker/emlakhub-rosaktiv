"use client";

import { useState } from "react";
import { buildHerracFacts } from "./herracFacts";
import { line, say } from "@/lib/i18n/copy";

export default function HerracFacts({ lot, az, locale, mode }) {
  const [open, setOpen] = useState(false);
  const { highlights, sections } = buildHerracFacts(lot, { az, locale });
  if (!highlights.length && !sections.length) return null;
  const showAll = mode === "pro" || open;

  return (
    <div className="max-w-[40rem]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {say(locale, "Hərrac məlumatları", "Данные Hərrac", "Hərrac facts")}
      </div>
      {mode === "simple" && !showAll ? (
        <dl className="mt-3 space-y-2">
          {highlights.map((item) => (
            <Fact key={item.id} locale={locale} item={item} />
          ))}
        </dl>
      ) : null}
      {mode === "simple" ? (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="mt-3 text-[13px] font-medium text-[#93c5fd]"
        >
          {open
            ? say(locale, "Əsas faktlar", "Только главное", "Main facts only")
            : say(locale, "Lotun bütün məlumatları", "Все данные лота", "All lot data")}
        </button>
      ) : null}
      {showAll ? (
        <div className="mt-4 space-y-4">
          {sections.map((section) => (
            <section key={section.id}>
              <h3 className="text-[13px] font-semibold text-white">
                {line(locale, { az: section.titleAz, ru: section.titleRu, en: section.titleEn })}
              </h3>
              <dl className="mt-2 space-y-2">
                {section.rows.map((item) => (
                  <Fact key={item.id} locale={locale} item={item} />
                ))}
              </dl>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Fact({ locale, item }) {
  return (
    <div className="grid grid-cols-[minmax(7rem,38%)_1fr] gap-3">
      <dt className="text-[12px] text-[#94a3b8]">{line(locale, item)}</dt>
      <dd className="min-w-0 break-words text-[13px] leading-relaxed text-white">
        {item.href ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-[#93c5fd]">
            {say(locale, "Xəritədə aç", "Открыть точку", "Open the point")}
          </a>
        ) : (
          item.value
        )}
      </dd>
    </div>
  );
}
