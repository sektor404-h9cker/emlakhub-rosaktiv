"use client";

/**
 * LegalRisks — юридические риски лота (+ каталог Hərrac по типу рынка)
 */

import { risksForMarket } from "@/lib/herrac/knowledge";
import { say } from "@/lib/i18n/copy";

const LEVEL = {
  low: {
    label: "низкий",
    labelAz: "aşağı",
    labelEn: "low",
    color: "text-[#a8a29e]",
    border: "border-white/10",
  },
  med: {
    label: "средний",
    labelAz: "orta",
    labelEn: "medium",
    color: "text-[#d6d3d1]",
    border: "border-white/15",
  },
  high: {
    label: "высокий",
    labelAz: "yüksək",
    labelEn: "high",
    color: "text-white",
    border: "border-white/25",
  },
};

export default function LegalRisks({
  risks = [],
  market = "estate",
  locale = "ru",
}) {
  const specific = Array.isArray(risks) && risks.length > 0;
  const list = specific
    ? risks.map((r) => ({
        level: r.level,
        text: r.text || say(locale, r.textAz, r.textRu, r.textEn) || "",
      }))
    : risksForMarket(market, locale);

  if (!specific) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
        <h3 className="text-[15px] font-semibold text-white">
          {say(locale, "Hüquqi tərəf", "Юридическая сторона", "Legal side")}
        </h3>
        <p className="mt-2 text-[12px] uppercase tracking-[0.12em] text-[#a8a29e]">
          {say(locale, "Yoxlama tələb edir", "Требует проверки", "Needs a check")}
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-[#d6d3d1]">
          {say(
            locale,
            "Bu, hüquqi rəy deyil. Kartda ayrıca hüquqi fakt yoxdursa, reyestrə baxmaq lazımdır.",
            "Это не юридическое заключение. Если в карточке нет отдельного факта, реестр нужно проверить отдельно.",
            "This is not a legal opinion. If the card has no separate legal fact, the registry still needs a check."
          )}
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-[13px] text-[#d6d3d1]">
            {say(locale, "Ümumi iştirak siyahısı", "Общий чеклист", "General checklist")}
          </summary>
          <ul className="mt-3 space-y-2">
            {list.map((r, i) => (
              <li key={r.id || i} className="text-[13px] leading-relaxed text-[#cbd5e1]">
                {r.text}
              </li>
            ))}
          </ul>
        </details>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-[16px] font-semibold text-white">
          {say(locale, "Kartdan fakt", "Факт из карточки", "Fact from the card")}
        </h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">
          {say(locale, "hüquqi rəy deyil", "не юридическое заключение", "not a legal opinion")}
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {list.map((r, i) => {
          const meta = LEVEL[r.level] || LEVEL.med;
          return (
            <li
              key={r.id || i}
              className={`rounded-lg border ${meta.border} bg-white/5 px-3 py-2.5`}
            >
              <div
                className={`font-mono text-[9px] uppercase tracking-[0.16em] ${meta.color}`}
              >
                {say(locale, meta.labelAz, meta.label, meta.labelEn)}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#c4c8ce]">
                {r.text}
              </p>
            </li>
          );
        })}
        {!list.length ? (
          <li className="text-[13px] text-[#6b7280]">
            {say(locale, "Risklər aşkarlanmayıb", "Риски не выявлены", "No risks found")}
          </li>
        ) : null}
      </ul>
      <p className="mt-3 text-[10px] leading-relaxed text-[#64748b]">
        {say(
          locale,
          "Məlumat oriyentasiya üçündür, hüquqi məsləhət deyil. Reyestr və herrac.gov.az sənədlərini yoxlayın.",
          "Ориентир, не юрконсультация. Сверяйте реестр и документы на herrac.gov.az.",
          "A guide, not legal advice. Check the registry and the documents on herrac.gov.az."
        )}
      </p>
    </div>
  );
}
