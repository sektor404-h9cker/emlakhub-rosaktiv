import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  ExternalLink,
  Loader2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { fetchLotAnalysis } from "@/lib/api/client";
import { originLabel } from "@/lib/analysis/economics";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { money } from "./lotStory/money";
import { say } from "@/lib/i18n/copy";

function statusHuman(status, az) {
  if (status === "asserted") return az ? "Əminik" : "Уверены";
  if (status === "hypothesis") return az ? "Fərziyyə" : "Гипотеза";
  return az ? "Az məlumat" : "Мало данных";
}

function humanStep(s, az) {
  const title =
    s.id === "inventory"
      ? az
        ? "Lotun rəqəmləri"
        : "Цифры лота"
      : s.id === "object"
        ? az
          ? "Obyekt"
          : "Объект"
      : s.id === "comps" || s.id === "comps_missing"
        ? az
          ? "Bazarda oxşarlar"
          : "Похожие на рынке"
        : s.id === "math"
          ? az
            ? "Pul hesabı"
            : "Считаем деньги"
          : s.id === "verdict"
            ? az
              ? "Nəticə"
              : "Итог"
            : s.id?.startsWith("vision_")
              ? az
                ? "Siqnal"
                : "Сигнал"
              : az
                ? "Addım"
                : "Шаг";

  return {
    title,
    body: s.claim,
    tip: s.thought,
    impact: s.impactAzn,
    status: s.status,
  };
}

export default function LotIntelPanel({ lot }) {
  const { locale } = useLocale();
  const az = locale === "az";
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [seenLotId, setSeenLotId] = useState(lot?.id);
  if (lot?.id !== seenLotId) {
    setSeenLotId(lot?.id);
    setReport(null);
    setError("");
    setLoading(false);
  }

  const runAnalysis = () => {
    if (!lot?.id || loading) return;
    setLoading(true);
    setError("");
    setReport(null);
    fetchLotAnalysis(lot.id, locale)
      .then((data) => setReport(data.report))
      .catch((e) => setError(e.message || "Analysis failed"))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-6 text-[13px] text-[#94a3b8]">
        <Loader2 className="animate-spin text-[#60a5fa]" size={16} />
        {az ? "Lotu hesablayırıq…" : "Считаем лот…"}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-100">
        <div>{error}</div>
        <button
          type="button"
          onClick={runAnalysis}
          className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white hover:bg-white/5"
        >
          {az ? "Yenidən" : "Ещё раз"}
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
          <Sparkles size={14} className="text-[#e8d5b0]" />
          {az ? "Lotun analizi" : "Разбор лота"}
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-[#64748b]">
          {az
            ? "Oxşar elanlar, marja və herrac siqnalları — düyməyə basanda. Fotoları toxunmuruq."
            : "Похожие объявления, маржа и сигналы herrac — по кнопке. Фото при этом не трогаем."}
        </p>
        <button
          type="button"
          onClick={runAnalysis}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#3b82f6]/40 bg-[#2563eb]/15 px-3 py-2 text-[12px] font-medium text-[#93c5fd] hover:bg-[#2563eb]/25"
        >
          <BarChart3 size={14} />
          {az ? "Hesabla" : "Посчитать"}
        </button>
      </div>
    );
  }

  const comps = report.comps;
  const steps = (report.reasoning?.steps || [])
    .filter((s) => s.id !== "photo_gate")
    .map((s) => ({ ...humanStep(s, az), impact: null }));
  const headline = report.reasoning?.summary?.decision || report.headline;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#1e3a5f]/70 bg-gradient-to-br from-[#0d1524] to-[#0a0c12] p-4">
        <div className="flex items-start gap-2">
          <Sparkles className="mt-0.5 shrink-0 text-[#93c5fd]" size={16} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
              {az ? "Qısa nəticə" : "Короткий итог"}
            </div>
            <p className="mt-1 text-[15px] font-medium leading-snug text-white">
              {headline}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-[#94a3b8]">
              {az
                ? "Yalnız təsdiq edə bildiyimizi yazırıq. 100% zəmanət yoxdur — sənəd və yerində baxış lazımdır."
                : "Пишем только то, что можем подтвердить. 100% гарантии нет — нужны документы и осмотр на месте."}
            </p>
          </div>
        </div>
      </div>

      {steps.length ? (
        <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
            {az ? "Necə düşünürük" : "Как мы думаем"}
          </div>
          <ol className="space-y-2.5">
            {steps.map((s, i) => (
              <li
                key={`${i}-${s.title}`}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
              >
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-[#e2e8f0]">
                    {i + 1}
                  </span>
                  <span className="text-[12px] font-semibold text-white">
                    {s.title}
                  </span>
                  <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-[#94a3b8]">
                    {statusHuman(s.status, az)}
                  </span>
                  {s.impact != null && s.impact !== 0 ? (
                    <span
                      className={[
                        "ml-auto break-all font-mono text-[12px]",
                        s.impact < 0 ? "text-amber-300" : "text-emerald-400",
                      ].join(" ")}
                    >
                      {s.impact > 0 ? "+" : "−"}
                      {money(Math.abs(s.impact))}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-[#e2e8f0]">
                  {s.body}
                </p>
                {s.tip ? (
                  <p className="mt-1 text-[12px] leading-relaxed text-[#94a3b8]">
                    {s.tip}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-[#0d0f14] p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
          {az ? "Bazarda oxşarlar" : "Похожие на рынке"}
          {comps?.source ? (
            <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 text-[10px] normal-case tracking-normal text-[#93c5fd]">
              {comps.source}
            </span>
          ) : null}
        </div>
        {comps?.query?.label ? (
          <p className="mb-2 text-[12px] text-[#e2e8f0]">
            {az ? "Axtarırıq:" : "Ищем:"}{" "}
            <span className="font-medium text-white">{comps.query.label}</span>
          </p>
        ) : null}
        <MarketTrail locale={locale} comps={comps} />
      </div>

      {(report.warnings || []).length ? (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200">
            <ShieldAlert size={14} />
            {az ? "Nəyə diqqət" : "На что обратить внимание"}
          </div>
          <ul className="space-y-2">
            {(report.warnings || []).slice(0, 6).map((w, i) => (
              <li
                key={w.id || i}
                className="flex gap-2 text-[12px] leading-relaxed text-[#fde68a]"
              >
                <AlertTriangle
                  size={12}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <span className="min-w-0">{w.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function CompList({ locale = "ru", items }) {
  const head = items.slice(0, 4);
  const rest = items.slice(4);
  return (
    <div>
      <ul className="space-y-1">
        {head.map((item) => (
          <li key={item.id}>
            <CompLink locale={locale} item={item} />
          </li>
        ))}
      </ul>
      {rest.length ? (
        <details className="mt-1">
          <summary className="cursor-pointer text-[12px] text-[#a8a29e]">
            {say(locale, `Daha ${rest.length}`, `Ещё ${rest.length}`, `${rest.length} more`)}
          </summary>
          <ul className="mt-1 space-y-1">
            {rest.map((item) => (
              <li key={item.id}>
                <CompLink locale={locale} item={item} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

function CompLink({ locale = "ru", item }) {
  const title =
    item.name ||
    [item.rooms != null ? `${item.rooms} ${say(locale, "otaq", "комн", "rooms")}` : null, item.areaSqm ? `${item.areaSqm} m²` : null, item.location || item.city || item.place]
      .filter(Boolean)
      .join(" · ") ||
    item.id;
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-[12px] text-[#d6d3d1] transition hover:bg-white/[0.04]"
    >
      <span className="min-w-0 truncate">{title}</span>
      <span className="flex shrink-0 items-center gap-1 font-mono text-white">
        {money(item.price)}
        <ExternalLink size={11} className="text-[#64748b]" />
      </span>
    </a>
  );
}

export function MarketTrail({ locale = "ru", comps }) {
  const counts = comps?.counts || { found: 0, accepted: 0, rejected: 0, used: 0 };
  const status = comps?.marketStatus || "insufficient";
  const quote = status === "insufficient" ? null : comps?.stats;
  const level = say(
    locale,
    status === "high" ? "Yüksək" : status === "medium" ? "Orta" : status === "low" ? "Aşağı" : "Kifayət qədər məlumat yoxdur",
    status === "high" ? "Высокая" : status === "medium" ? "Средняя" : status === "low" ? "Низкая" : "Недостаточно данных",
    status === "high" ? "High" : status === "medium" ? "Medium" : status === "low" ? "Low" : "Not enough data"
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
          {say(locale, "Etibarlılıq", "Достоверность", "Confidence")}: {level}
        </span>
        {comps?.fetchedAt ? (
          <span className="text-[10px] text-[#64748b]">
            {say(locale, "Alınıb", "Получено", "Fetched")}{" "}
            {new Date(comps.fetchedAt).toLocaleString(locale === "az" ? "az" : locale === "en" ? "en-GB" : "ru")}
          </span>
        ) : null}
      </div>

      <p className="text-[12px] leading-relaxed text-[#cbd5e1]">
        {say(
          locale,
          `Tapıldı: ${counts.found}. Yoxlamadan keçdi: ${counts.accepted}. Atıldı: ${counts.rejected}.`,
          `Найдено: ${counts.found}. Подошло после проверки: ${counts.accepted}. Отброшено: ${counts.rejected}.`,
          `Found: ${counts.found}. Accepted: ${counts.accepted}. Rejected: ${counts.rejected}.`
        )}
      </p>

      {comps?.nearbyNoteRu || comps?.nearbyNoteAz || comps?.nearbyNoteEn ? (
        <p className="text-[12px] leading-relaxed text-[#d6d3d1]">
          {say(locale, comps.nearbyNoteAz || comps.nearbyNoteRu, comps.nearbyNoteRu, comps.nearbyNoteEn || comps.nearbyNoteRu)}
        </p>
      ) : null}

      {quote?.medianPrice != null ? (
        <div className="grid grid-cols-2 gap-2">
          <Stat
            label={say(locale, "Aralıq", "Диапазон", "Range")}
            hint={originLabel("market", locale)}
            value={`${money(quote.p25)} – ${money(quote.p75)}`}
          />
          <Stat
            label={say(locale, "Median", "Медиана", "Median")}
            hint={originLabel("market", locale)}
            value={money(quote.medianPrice)}
          />
          <Stat
            label={say(locale, "İstifadə", "Использовано", "Used")}
            value={String(counts.used)}
          />
          <Stat
            label={say(locale, "Mənbə", "Источник", "Source")}
            value={comps.source || "—"}
          />
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-white">
          {comps?.error ||
            say(
              locale,
              "Bu rayon və tip üzrə kifayət qədər analoq yoxdur. Bazar qiyməti vermirik.",
              "Недостаточно сопоставимых объектов. Рыночную цену не даём.",
              "Not enough comparable listings. We do not give a market price."
            )}
        </p>
      )}

      {status === "low" && quote?.medianPrice != null ? (
        <p className="text-[12px] leading-relaxed text-[#94a3b8]">
          {say(
            locale,
            "Etibarlılıq aşağıdır. Bu median qazanc hesabına düşmür.",
            "Достоверность низкая. Эту медиану в расчёт прибыли не берём.",
            "Confidence is low. This median is not used in the profit calculation."
          )}
        </p>
      ) : null}

      <details className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <summary className="cursor-pointer text-[12px] font-medium text-[#93c5fd]">
          {say(locale, "Niyə bu rəqəm", "Почему эта цифра", "Why this figure")}
        </summary>
        <ol className="mt-3 space-y-2">
          {(comps?.evidence || []).map((step, i) => (
            <li key={step.id || i} className="text-[12px] leading-relaxed text-[#cbd5e1]">
              <span className="text-[#64748b]">{i + 1}. </span>
              <span className="font-medium text-white">
                {say(locale, step.titleAz || step.titleRu, step.titleRu, step.titleEn || step.titleRu)}
              </span>
              {step.textRu || step.textAz || step.textEn ? (
                <span> — {say(locale, step.textAz || step.textRu, step.textRu, step.textEn || step.textRu)}</span>
              ) : null}
              {step.count != null ? <span> — {step.count}</span> : null}
              {step.amount != null ? <span> — {money(step.amount)}</span> : null}
              {step.low != null && step.high != null ? (
                <span>
                  {" "}
                  — {money(step.low)} – {money(step.high)}
                </span>
              ) : null}
              {step.prices?.length ? (
                <span className="mt-1 block font-mono text-[11px] text-[#94a3b8]">
                  {step.prices.map((p) => money(p)).join(" · ")}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        {quote?.min != null ? (
          <p className="mt-2 text-[11px] text-[#64748b]">
            {say(locale, "Min/maks", "Мин / макс", "Min / max")}: {money(quote.min)} – {money(quote.max)}
          </p>
        ) : null}
      </details>

      {(comps?.foundPreview || []).length && !(comps?.comps || []).length ? (
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[#64748b]">
            {say(locale, "Tapıldı, qiymətə girmədi", "Нашли, в оценку не вошли", "Found, not used in the estimate")}
          </div>
          <CompList locale={locale} items={comps.foundPreview} />
        </div>
      ) : null}

      {(comps?.comps || []).length ? (
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-[#64748b]">
            {counts.used > 0
              ? say(locale, "İstifadə olunan elanlar", "Использованные объявления", "Listings used")
              : say(locale, "Yoxlamadan keçdi, qiymətə çatmır", "Прошли проверку, для оценки их мало", "Passed the check, too few to price")}
          </div>
          <CompList locale={locale} items={comps.comps} />
        </div>
      ) : null}

      {(comps?.rejected || []).length ? (
        <details className="rounded-xl border border-white/[0.06] p-3">
          <summary className="cursor-pointer text-[12px] text-[#94a3b8]">
            {say(locale, "Atılan elanlar", "Отброшенные объявления", "Rejected listings")} ({comps.rejected.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {comps.rejected.map((c) => (
              <li key={`${c.id}-${c.rejectReason}`} className="text-[12px] text-[#94a3b8]">
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[#cbd5e1] hover:underline">
                  {c.name || c.location || c.id}
                </a>
                {" — "}
                {say(locale, c.rejectReasonAz || c.rejectReasonRu, c.rejectReasonRu, c.rejectReasonEn || c.rejectReasonRu)}
                {c.price ? ` · ${money(c.price)}` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}


function Stat({ label, value, warn, good, hint }) {
  return (
    <div className="min-w-0 rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-[#64748b]">
        {label}
      </div>
      {hint ? (
        <div className="mt-0.5 text-[10px] text-[#64748b]">{hint}</div>
      ) : null}
      <div
        className={[
          "mt-0.5 break-all font-mono text-[13px] tabular-nums",
          warn ? "text-amber-300" : good ? "text-emerald-400" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
