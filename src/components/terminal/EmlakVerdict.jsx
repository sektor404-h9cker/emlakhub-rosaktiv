"use client";

import { useState } from "react";
import { moneyRange } from "./lotStory/money";
import { line, say } from "@/lib/i18n/copy";

/**
 * Показывает уже собранный Emlak Intelligence.
 * Статус и цифры здесь не считают.
 */
const TONE = {
  pending: "text-[#93c5fd]",
  insufficient_data: "text-[#d6d3d1]",
  own_scenario: "text-white",
  market_unavailable: "text-[#d6d3d1]",
  potential: "text-[#f5d0a9]",
  fits: "text-[#b7e4c7]",
  borderline: "text-[#f5d0a9]",
  above: "text-[#f0b4b4]",
};

const STAGES = [
  { id: "lot", ru: "Лот", az: "Lot", en: "Lot" },
  { id: "market", ru: "Рынок", az: "Bazar", en: "Market" },
  { id: "risks", ru: "Риски", az: "Risklər", en: "Risks" },
  { id: "economics", ru: "Экономика", az: "İqtisadiyyat", en: "Economics" },
  { id: "decision", ru: "Решение", az: "Qərar", en: "Decision" },
];

export default function EmlakVerdict({ intel, locale, startLabel, limitLabel }) {
  const [open, setOpen] = useState(false);
  if (!intel) return null;
  const text = (row) => line(locale, row);
  const tone = TONE[intel.dealStatus] || TONE.insufficient_data;
  const stage = stageIndex(intel);
  const marketValue = intel.marketConfidence.range
    ? moneyRange(intel.marketConfidence.range.low, intel.marketConfidence.range.high)
    : text(intel.marketConfidence.label);

  return (
    <section id="story-verdict" className="scroll-mt-16 pb-10">
      <ol className="flex items-center gap-0 overflow-x-auto text-[11px] tracking-wide">
        {STAGES.map((item, index) => {
          const state = index < stage ? "done" : index === stage ? "now" : "later";
          return (
            <li key={item.id} className="flex min-w-0 items-center">
              {index > 0 ? <span className="mx-2 text-[#3f3f46]" aria-hidden>→</span> : null}
              <span
                className={
                  state === "now"
                    ? "text-white"
                    : state === "done"
                      ? "text-[#a8a29e]"
                      : "text-[#57534e]"
                }
              >
                {text(item)}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 text-[11px] font-medium uppercase tracking-[0.22em] text-[#a8a29e]">
        Emlak Engine
      </div>
      <h2 key={intel.dealStatus} className={["eh-settle mt-3 text-[32px] font-semibold leading-none tracking-tight sm:text-[40px]", tone].join(" ")}>
        {text(intel.dealStatusLabel)}
      </h2>

      <div className="mt-10">
        <div key={startLabel} className="eh-settle font-mono text-[40px] font-medium leading-none tracking-tight text-white whitespace-nowrap sm:text-[52px]">
          {startLabel}
        </div>
        <div className="mt-3 text-[13px] text-[#a8a29e]">{say(locale, "Hərrac startı", "Старт Hərrac", "Hərrac start")}</div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <div className="text-[13px] text-[#a8a29e]">{say(locale, "Bazar", "Рынок", "Market")}</div>
          <div key={marketValue} className="eh-settle mt-2 font-mono text-[22px] font-medium leading-snug text-white sm:text-[26px]">
            {marketValue}
          </div>
        </div>
        <div>
          <div className="text-[13px] text-[#a8a29e]">{say(locale, "Sizin limit", "Ваш лимит", "Your limit")}</div>
          <div key={limitLabel} className="eh-settle mt-2 font-mono text-[22px] font-medium leading-snug text-white sm:text-[26px]">
            {limitLabel}
          </div>
        </div>
      </div>

      <p className="mt-10 max-w-[38rem] text-[15px] leading-relaxed text-[#e7e5e4]">
        <span className="text-[#a8a29e]">{say(locale, "Niyə: ", "Почему: ", "Why: ")}</span>
        {text(intel.mainReason)}
      </p>

      {intel.nextActions?.length ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="text-[14px] text-[#93c5fd] hover:text-white"
          >
            {say(locale, "Nəyi dəqiqləşdirmək lazımdır", "Что нужно уточнить", "What to confirm")}
            <span aria-hidden> →</span>
          </button>
          {open ? (
            <ul className="mt-3 max-w-[38rem] space-y-2 text-[14px] leading-relaxed text-[#d6d3d1]">
              {intel.nextActions.map((item) => (
                <li key={item.id}>{text(item)}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function stageIndex(intel) {
  if (intel.dealStatus === "pending" || intel.marketConfidence?.level === "loading") return 1;
  if (intel.dealStatus === "own_scenario") return 4;
  if (!intel.marketConfidence?.usable) return 1;
  if (!intel.flow?.showCalculation) return 3;
  return 4;
}
