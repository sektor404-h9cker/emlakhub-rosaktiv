"use client";

/**
 * =============================================================================
 * LegalRisks — блок юридических рисков (NLP-слой)
 * =============================================================================
 */

const LEVEL = {
  low: { label: "низкий", color: "text-emerald-400", border: "border-emerald-500/30" },
  med: { label: "средний", color: "text-amber-400", border: "border-amber-500/30" },
  high: { label: "высокий", color: "text-red-400", border: "border-red-500/30" },
};

export default function LegalRisks({ risks = [] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-[16px] font-semibold text-white">Юридические риски</h3>
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6b7280]">
          NLP · local
        </span>
      </div>
      <ul className="mt-4 space-y-2.5">
        {risks.map((r, i) => {
          const meta = LEVEL[r.level] || LEVEL.med;
          return (
            <li
              key={i}
              className={`rounded-lg border ${meta.border} bg-white/5 px-3 py-2.5`}
            >
              <div className={`font-mono text-[9px] uppercase tracking-[0.16em] ${meta.color}`}>
                {meta.label}
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-[#c4c8ce]">{r.text}</p>
            </li>
          );
        })}
        {risks.length === 0 ? (
          <li className="text-[13px] text-[#6b7280]">Риски не выявлены</li>
        ) : null}
      </ul>
    </div>
  );
}
