"use client";

/**
 * =============================================================================
 * MarketSidebar — рынок Авто/Недвижимость + поиск ID + фильтр маржи
 * =============================================================================
 * Это «левый» блок внутри дашборда (рядом с карточкой лота),
 * не путать с TerminalShell sidebar (навигация приложения).
 * =============================================================================
 */

export default function MarketSidebar({
  market,
  onMarketChange,
  query,
  onQueryChange,
  minMargin,
  onMinMarginChange,
  lots,
  selectedId,
  onSelectLot,
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0a0a0a]">
      {/* Переключатель рынков */}
      <div className="grid grid-cols-2 gap-1 border-b border-white/10 p-2">
        {[
          { key: "auto", label: "Авто" },
          { key: "estate", label: "Недвижимость" },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onMarketChange(m.key)}
            className={[
              "rounded-md px-2 py-2 text-[12px] font-medium transition",
              market === m.key
                ? "bg-white text-[#050505]"
                : "text-[#9aa3ad] hover:bg-white/5",
            ].join(" ")}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 border-b border-white/10 p-3">
        <label className="block">
          <span className="mb-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b7280]">
            Поиск по ID лота
          </span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="AUTO-911"
            className="eh-term-input text-[13px]"
          />
        </label>

        <label className="block">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#6b7280]">
              Мин. маржа
            </span>
            <span className="font-mono text-[11px] tabular-nums text-[#b8956c]">
              {minMargin}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={minMargin}
            onChange={(e) => onMinMarginChange(Number(e.target.value))}
            className="eh-term-range w-full"
          />
        </label>
      </div>

      {/* Список лотов */}
      <div className="flex-1 overflow-auto p-2">
        {lots.length === 0 ? (
          <p className="px-2 py-6 text-center text-[12px] text-[#6b7280]">
            Нет лотов по фильтру
          </p>
        ) : (
          lots.map((lot) => {
            const active = lot.id === selectedId;
            return (
              <button
                key={lot.id}
                type="button"
                onClick={() => onSelectLot(lot.id)}
                className={[
                  "mb-1 w-full rounded-lg px-3 py-2.5 text-left transition",
                  active ? "bg-white/5 ring-1 ring-amber-700/40" : "hover:bg-white/5",
                ].join(" ")}
              >
                <div className="font-mono text-[10px] tracking-wide text-[#b8956c]">
                  {lot.id}
                </div>
                <div className="mt-0.5 truncate text-[13px] text-white">{lot.title}</div>
                <div className="mt-1 font-mono text-[11px] tabular-nums text-[#9aa3ad]">
                  маржа ~{lot.expectedMarginPct}%
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
