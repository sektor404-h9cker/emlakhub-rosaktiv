"use client";

/**
 * Пояснения под фото — живым языком.
 * Пустой список ≠ «скан зон»: мы не рисуем дефекты по пикселям.
 */

import { line, say } from "@/lib/i18n/copy";

export default function VisionFindingsPanel({
  defects = [],
  locale = "ru",
  activeId = null,
  onSelect,
  summary,
  emptyHint,
}) {
  if (!defects.length) {
    return (
      <div className="border-t border-white/[0.06] bg-[#0d0f14] px-3 py-3">
        <p className="text-[12px] font-medium leading-snug text-[#e2e8f0]">
          {say(locale, "Fotoda avtomatik «zonalar» çəkmirik", "На фото автоматические «зоны» не рисуем", "We do not draw automatic zones on the photo")}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#94a3b8]">
          {emptyHint ||
            say(
              locale,
              "Siqnallar yalnız herrac mətnindən və parametrlərdən gəlir. Pas, sönmüş təkər və ya uzaqdan «görmək» üçün piksel AI yoxdur — fotoya özünüz baxın.",
              "Сигналы берём только из текста и параметров herrac. Ржавчину, спущенные шины или «утопленника» по пикселям не определяем — смотрите фото сами.",
              "Signals come only from the herrac text and parameters. There is no pixel model for rust, flat tyres or flood — look at the photo yourself."
            )}
        </p>
      </div>
    );
  }

  const active = defects.find((d) => d.id === activeId) || defects[0];

  return (
    <div className="border-t border-white/[0.06] bg-[#0d0f14]">
      <div className="flex flex-col gap-2 border-b border-white/[0.05] px-3 py-2 sm:flex-row sm:items-center">
        <span className="shrink-0 rounded bg-[#e8d5b0]/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#e8d5b0]">
          {say(locale, "Siqnallar", "Сигналы", "Signals")}
        </span>
        <p className="min-w-0 flex-1 text-[11px] leading-snug text-[#94a3b8]">
          {summary}
        </p>
        <div className="flex shrink-0 flex-wrap gap-1">
          {defects.map((d, i) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelect?.(d.id)}
              className={[
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition",
                (activeId ?? defects[0]?.id) === d.id
                  ? d.severity === "high"
                    ? "bg-amber-400 text-black"
                    : "bg-[#e8d5b0] text-black"
                  : "bg-white/10 text-[#94a3b8] hover:bg-white/15 hover:text-white",
              ].join(" ")}
            >
              {d.n || i + 1}
            </button>
          ))}
        </div>
      </div>

      {active ? (
        <div className="space-y-2 px-3 py-3">
          <div className="flex items-start gap-2">
            <span
              className={[
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                active.severity === "high"
                  ? "bg-amber-400 text-black"
                  : active.severity === "low"
                    ? "bg-sky-400/90 text-black"
                    : "bg-[#e8d5b0] text-black",
              ].join(" ")}
            >
              {active.n || 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-snug text-white">
                {line(locale, active) || active.label}
              </p>
              {active.costNoteRu || active.costNoteAz ? (
                <p className="mt-1 text-[12px] leading-relaxed text-amber-200/90">
                  {say(locale, active.costNoteAz, active.costNoteRu, active.costNoteEn || active.costNoteRu)}
                </p>
              ) : null}
              {active.evidenceQuote && active.evidence === "notes_params" ? (
                <p className="mt-1 rounded-md bg-white/[0.04] px-2 py-1 font-mono text-[10px] leading-snug text-[#94a3b8]">
                  «{active.evidenceQuote}»
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 text-[12px] leading-relaxed text-[#cbd5e1]">
            {say(locale, active.whyAz, active.whyRu, active.whyEn || active.whyRu) ? (
              <p>
                <span className="font-medium text-[#93c5fd]">
                  {say(locale, "Niyə: ", "Почему: ", "Why: ")}
                </span>
                {say(locale, active.whyAz, active.whyRu, active.whyEn || active.whyRu)}
              </p>
            ) : null}
            {say(locale, active.nextAz, active.nextRu, active.nextEn || active.nextRu) ? (
              <p>
                <span className="font-medium text-[#93c5fd]">
                  {say(locale, "Nə etmək: ", "Что делать: ", "What to do: ")}
                </span>
                {say(locale, active.nextAz, active.nextRu, active.nextEn || active.nextRu)}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
