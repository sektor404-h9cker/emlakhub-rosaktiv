"use client";

import { marketLabel } from "@/lib/lots/markets";
import { formatAuctionWhen, isUpcomingLot, lotPhotoCount } from "@/lib/lots/photos";
import { MarketTrail } from "../LotIntelPanel";
import InvestCalculator from "../InvestCalculator";
import LegalRisks from "../LegalRisks";
import LotPhotoGallery from "../LotPhotoGallery";
import { money, moneyRange } from "./money";
import HerracFacts from "./HerracFacts";
import EmlakVerdict from "../EmlakVerdict";
import { line, say } from "@/lib/i18n/copy";
import SimpleLot from "./SimpleLot";

const STATUS = {
  good: {
    ru: "В пределах вашего сценария",
    az: "Ssenarinizin daxilində",
    en: "Inside your scenario",
    text: "text-[#b7e4c7]",
  },
  borderline: {
    ru: "Близко к лимиту",
    az: "Limitə yaxın",
    en: "Close to the limit",
    text: "text-[#f5d0a9]",
  },
  above: {
    ru: "Выше вашего лимита",
    az: "Limitinizdən yuxarı",
    en: "Above your limit",
    text: "text-[#f0b4b4]",
  },
};

export default function LotStory({
  az,
  locale,
  lot,
  mode,
  report,
  loading,
  error,
  onRetry,
  answers,
  patch,
  result,
  defects,
  start,
  startKnown,
  deposit,
  fee,
  herracPrice,
  herracPriceKnown,
  intel,
}) {
  const comps = report?.comps || null;
  const marketView = describeMarket(comps, result, loading, error);
  const viewedRaw = answers.bidTouched ? answers.bidText : startKnown ? String(start) : "";
  const viewed = viewedRaw === "" ? null : Number(String(viewedRaw).replace(",", "."));
  const viewedKnown = viewed != null && Number.isFinite(viewed);
  const s = (azText, ruText, enText) => say(locale, azText, ruText, enText);
  const tx = (row) => line(locale, row);

  const showCalculation = Boolean(intel?.flow?.showCalculation);
  const limitLabel = result?.limitReady
    ? money(result.maxBid.amount)
    : s("Hələ hesablanmayıb", "Пока не рассчитан", "Not calculated yet");
  const reserve =
    result?.limitReady && viewedKnown ? Number(result.maxBid.amount) - viewed : null;

  if (mode !== "pro") {
    return (
      <SimpleLot
        locale={locale}
        lot={lot}
        report={report}
        loading={loading}
        error={error}
        onRetry={onRetry}
        answers={answers}
        patch={patch}
        result={result}
        start={start}
        startKnown={startKnown}
        intel={intel}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-6 sm:px-8 sm:py-8">
      <EmlakVerdict
        intel={intel}
        locale={locale}
        startLabel={startKnown ? money(start) : s("məlum deyil", "неизвестна", "unknown")}
        limitLabel={limitLabel}
      />

      <LotPhotoGallery
        lot={lot}
        alt={lotTitle(lot, locale)}
        aspectClass="aspect-[16/10] max-h-[220px] sm:max-h-[320px]"
      />
      <p className="mt-3 text-[12px] text-[#78716c]">
        {lotPhotoCount(lot)} {s("foto", "фото", "photos")}
        {isUpcomingLot(lot) && lot.startAt
          ? ` · ${formatAuctionWhen(lot.startAt, locale)}`
          : lot.validUntil
            ? ` · ${formatAuctionWhen(lot.validUntil, locale)}`
            : ""}
      </p>

      <section id="story-what" className="scroll-mt-16 mt-12 border-t border-white/[0.06] pt-10">
        <h2 className="text-[13px] text-[#a8a29e]">{s("Nə satılır", "Что продают", "What is for sale")}</h2>
        <h3 className="mt-3 max-w-[36rem] text-[22px] font-semibold leading-snug text-white">
          {lotTitle(lot, locale)}
        </h3>
        <p className="mt-2 text-[14px] text-[#a8a29e]">
          {[marketLabel(lot.market, locale), lot.cityRu || lot.cityAz, factLine(lot, locale)]
            .filter(Boolean)
            .join(" · ")}
        </p>

        {intel ? <KnownSplit locale={locale} intel={intel} /> : null}

        <details className="mt-8">
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Ətraflı", "Подробнее", "Details")}
          </summary>
          <div className="mt-4">
            <HerracFacts lot={lot} az={az} locale={locale} mode={mode} />
          </div>
        </details>
      </section>

      <section id="story-market" className="mt-12 scroll-mt-16 border-t border-white/[0.06] pt-10">
        <h2 className="text-[13px] text-[#a8a29e]">{s("Bazar", "Рынок", "Market")}</h2>
        {marketView.kind === "range" ? (
          <>
            <p className="mt-4 font-mono text-[32px] font-medium leading-none tracking-tight text-white sm:text-[40px]">
              {moneyRange(marketView.low, marketView.high)}
            </p>
            <p className="mt-6 text-[13px] text-[#a8a29e]">{s("Orientir", "Ориентир", "Reference")}</p>
            <p className="mt-1 font-mono text-[28px] font-medium text-white">{money(marketView.median)}</p>
            <p className="mt-4 text-[14px] text-[#d6d3d1]">
              {marketView.used} {s("uyğun elan", "сопоставимых объявлений", "comparable listings")}
            </p>
            {mode === "pro" && intel?.marketConfidence ? (
              <p className="mt-2 text-[13px] text-[#a8a29e]">
                {s("Etibar", "Надёжность", "Confidence")}: {tx(intel.marketConfidence.label)}
                {comps?.counts
                  ? ` · p25 ${money(marketView.low)} · p75 ${money(marketView.high)}`
                  : ""}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="mt-4 text-[28px] font-semibold leading-tight text-white sm:text-[32px]">
              {marketView.kind === "loading"
                ? s("Bazara baxırıq", "Смотрим рынок", "Checking the market")
                : marketView.kind === "unavailable"
                  ? s("Bazar müvəqqəti əlçatan deyil", "Рынок временно недоступен", "Market is temporarily unavailable")
                  : s("Bazar hələ müəyyən deyil", "Рынок пока не определён", "The market is not set yet")}
            </p>
            <p className="mt-4 max-w-[36rem] text-[15px] leading-relaxed text-[#d6d3d1]">
              {intel ? tx(intel.why.market) : null}
            </p>
            {marketView.kind !== "loading" ? (
              <div className="mt-6 space-y-1 text-[14px] text-[#a8a29e]">
                <p>
                  {s("Tapılıb", "Найдено", "Found")}: {marketView.found ?? comps?.counts?.found ?? 0}
                </p>
                <p>
                  {s("Qiymət üçün istifadə etmək olar", "Можно использовать для оценки", "Usable for a price")}:{" "}
                  {marketView.used ?? 0}
                </p>
              </div>
            ) : null}
          </>
        )}
        {error ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 text-[14px] text-[#93c5fd]"
          >
            {s("Yenidən bax", "Попробовать ещё раз", "Try again")}
          </button>
        ) : null}
        <details className="mt-5">
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Bu qiymət niyə?", "Почему эта цена?", "Why this price?")}
          </summary>
          <div className="mt-3 max-w-[40rem] text-[14px] leading-relaxed text-[#d6d3d1]">
            {intel ? tx(intel.why.market) : null}
            {mode === "pro" && comps ? (
              <div className="mt-4">
                <MarketTrail locale={locale} comps={comps} />
              </div>
            ) : null}
          </div>
        </details>
      </section>

      <section id="story-risks" className="mt-12 scroll-mt-16 border-t border-white/[0.06] pt-10">
        <h2 className="text-[13px] text-[#a8a29e]">{s("Əsas risk", "Главный риск", "Main risk")}</h2>
        <p className="mt-3 max-w-[36rem] text-[20px] font-medium leading-snug text-white">
          {riskHeadline(locale, intel)}
        </p>
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Ətraflı", "Подробнее", "Details")}
          </summary>
          <div className="mt-4 max-w-[40rem] space-y-4">
            {intel?.riskState?.confirmed?.length ? (
              <ul className="space-y-2 text-[14px] leading-relaxed text-[#e7e5e4]">
                {intel.riskState.confirmed.map((item) => (
                  <li key={item.id}>
                    {tx(item)}
                    <span className="text-[#a8a29e]"> — «{item.quote}»</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] text-[#a8a29e]">
                {s(
                  "Mətndə təsdiqli qüsur yoxdur. Boş sahə xarab hissə demək deyil.",
                  "В тексте нет подтверждённого дефекта. Пустое поле не означает поломку.",
                  "The text has no confirmed defect. An empty field does not mean something is broken."
                )}
              </p>
            )}
            {mode === "pro" ? (
              <LegalRisks risks={lot.legalRisks} market={lot.market} locale={locale} />
            ) : null}
          </div>
        </details>
      </section>

      <section id="story-costs" className="mt-12 scroll-mt-16 border-t border-white/[0.06] pt-10">
        <h2 className="text-[13px] text-[#a8a29e]">{s("Xərclər", "Расходы", "Costs")}</h2>
        <div className="mt-4">
          <InvestCalculator
            locale={locale}
            market={lot.market}
            mode={mode}
            answers={answers}
            patch={patch}
            marketReady={!loading && Boolean(result?.usableForValuation)}
          />
        </div>
      </section>

      <section id="story-limit" className="mt-12 scroll-mt-16 border-t border-white/[0.06] pt-10">
        {showCalculation ? (
          <>
            <h2 className="text-[13px] text-[#a8a29e]">{s("Lot üzrə yekun", "Итог по лоту", "Result for this lot")}</h2>
            <p className="mt-3 text-[13px] text-[#a8a29e]">
              {s(
                "Alış → Satış → Xərclər → Nəticə → Maksimum təklif",
                "Покупка → Продажа → Расходы → Результат → Максимальная ставка",
                "Purchase → Sale → Costs → Result → Maximum bid"
              )}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2">
              <SummaryFigure
                label={s("Alış qiyməti", "Цена покупки", "Purchase price")}
                value={result?.purchase != null ? money(result.purchase) : viewedKnown ? money(viewed) : "—"}
              />
              <SummaryFigure
                label={
                  result?.saleSource === "user"
                    ? s("Sizin satış qiyməti", "Ваша цена продажи", "Your sale price")
                    : s("Satış", "Продажа", "Sale")
                }
                value={
                  result?.saleSource === "user"
                    ? money(result.saleAnchor?.amount)
                    : marketView.kind === "range"
                      ? money(marketView.median)
                      : "—"
                }
              />
              <SummaryFigure
                label={s("Bütün xərclər", "Все расходы", "All costs")}
                value={result?.knownCosts != null ? money(result.knownCosts) : "—"}
              />
              <SummaryFigure label={s("Maksimum təklif", "Максимальная ставка", "Maximum bid")} value={limitLabel} />
              <SummaryFigure
                label={s("Cari qiymət", "Текущая цена", "Current price")}
                value={viewedKnown ? money(viewed) : "—"}
              />
              <SummaryFigure
                label={s("Limitə qədər ehtiyat", "Запас до лимита", "Room under the limit")}
                value={reserve != null && reserve >= 0 ? money(reserve) : "—"}
              />
            </div>
            {result.atBid?.status && STATUS[result.atBid.status] ? (
              <p className={["mt-8 text-[22px] font-semibold", STATUS[result.atBid.status].text].join(" ")}>
                {tx(STATUS[result.atBid.status])}
              </p>
            ) : null}
            {result?.atBid?.profit != null ? (
              <p className="mt-4 font-mono text-[28px] text-white">
                {Number(result.atBid.profit) < 0
                  ? s(
                      `Mümkün zərər ${money(result.atBid.profit)}`,
                      `По вашему сценарию возможен убыток ${money(result.atBid.profit)}`,
                      `On your scenario a loss of ${money(result.atBid.profit)} is possible`
                    )
                  : s(
                      `Mümkün qazanc +${money(result.atBid.profit)}`,
                      `По вашему сценарию возможная прибыль составляет +${money(result.atBid.profit)}`,
                      `On your scenario the possible profit is +${money(result.atBid.profit)}`
                    )}
              </p>
            ) : null}
            <p className="mt-3 max-w-[36rem] text-[13px] leading-relaxed text-[#a8a29e]">
              {result?.saleSource === "user"
                ? s(
                    "Qiyməti siz yazmısınız, bazar təsdiqləməyib.",
                    "Цена указана вами, не подтверждена рынком.",
                    "You entered this price. The market has not confirmed it."
                  )
                : s(
                    "Hesab bazar analoqları və sizin xərclərinizə əsaslanır.",
                    "Расчёт основан на рыночных аналогах и ваших расходах.",
                    "The calculation uses market comparables and your costs."
                  )}
            </p>
            <label className="mt-8 block max-w-sm text-[13px] text-[#a8a29e]">
              {s("Hansı qiymətə baxırsınız?", "Какую цену вы рассматриваете?", "Which price are you considering?")}
              <span className="mt-2 flex items-center gap-2 border-b border-white/15 py-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={answers.bidTouched ? answers.bidText : startKnown ? String(start) : answers.bidText}
                  placeholder={s("məbləğ", "сумма", "amount")}
                  onChange={(e) => patch({ bidTouched: true, bidText: e.target.value })}
                  className="w-full bg-transparent font-mono text-[20px] text-white outline-none"
                />
                <span className="font-mono text-[12px] text-[#78716c]">₼</span>
              </span>
            </label>
            {mode === "pro" ? (
              <details className="mt-8">
                <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
                  {s("Formula və ssenarilər", "Формула и сценарии", "Formula and scenarios")}
                </summary>
                <div className="mt-4 space-y-4">
                  <p className="max-w-[40rem] text-[13px] leading-relaxed text-[#a8a29e]">
                    {tx({ az: result.formulaAz, ru: result.formulaRu, en: result.formulaEn })}
                  </p>
                  <ProCostLines locale={locale} result={result} />
                  {result.ladder?.length ? (
                    <ul className="max-w-lg divide-y divide-white/[0.06] text-[12px]">
                      {result.ladder.map((row) => (
                        <li key={`${row.role}-${row.bid}`} className="grid grid-cols-3 gap-2 py-2">
                          <span className="font-mono text-white">{money(row.bid)}</span>
                          <span className="text-[#d6d3d1]">{money(row.profit)}</span>
                          <span className="text-[#a8a29e]">ROI {formatPct(row.roiPct)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {comps ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        ["conservative", s("Ehtiyatlı", "Нижняя граница", "Low"), result.market.low.amount],
                        ["market", s("Bazar orientiri", "Ориентир рынка", "Market"), result.market.median.amount],
                        ["optimistic", s("Yuxarı hədd", "Верхняя граница", "High"), result.market.high.amount],
                      ].map(([id, label, amount]) => (
                        <button
                          key={id}
                          type="button"
                          disabled={amount == null || !result.usableForValuation}
                          onClick={() => patch({ saleScenario: id })}
                          className={[
                            "border-b px-1 py-2 text-left",
                            answers.saleScenario === id ? "border-white text-white" : "border-white/10 text-[#a8a29e]",
                            amount == null || !result.usableForValuation ? "opacity-40" : "",
                          ].join(" ")}
                        >
                          <div className="text-[11px]">{label}</div>
                          <div className="font-mono text-[14px]">{money(amount)}</div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="text-[28px] font-semibold leading-tight text-white sm:text-[32px]">
              {s("Nəticə üçün rəqəmlər çatmır", "Для результата не хватает цифр", "The result still needs figures")}
            </h2>
            <p className="mt-4 max-w-[36rem] text-[15px] leading-relaxed text-[#d6d3d1]">
              {marketView.kind === "range" && answers.saleBasis !== "user"
                ? s(
                    "Bazar təsdiqlənib. Nəticəni görmək üçün xərcləri və məqsədi yazın. Boş sahə sıfır sayılmır.",
                    "Рынок подтверждён. Чтобы увидеть результат, укажите расходы и цель. Пустое поле не считается нулём.",
                    "The market is confirmed. Enter the costs and the goal to see the result. An empty field is not zero."
                  )
                : String(answers.userSaleAmount || "").trim()
                  ? s(
                      "Satış qiyməti yazılıb. Aşağıda nəyin çatışdığı göstərilib. Boş sahə sıfır sayılmır.",
                      "Цена продажи уже указана. Ниже написано, чего ещё не хватает. Пустое поле не считается нулём.",
                      "The sale price is already entered. The list below says what is still missing. An empty field is not zero."
                    )
                  : s(
                      "Bazar qiyməti təsdiqlənməyib. Öz gözlənilən satış qiymətinizi yuxarıda yazın. Bu, Emlak Hub qiyməti olmayacaq.",
                      "Рыночная цена не подтверждена. Укажите свою предполагаемую цену продажи выше. Это не будет оценкой Emlak Hub.",
                      "The market price is not confirmed. Enter your expected sale price above. That will not be an Emlak Hub valuation."
                    )}
            </p>
            {result?.blockedText?.length ? (
              <ul className="mt-4 max-w-[36rem] space-y-2 text-[14px] text-[#d6d3d1]">
                {result.blockedText.map((row) => (
                  <li key={row.id}>{tx(row)}</li>
                ))}
              </ul>
            ) : null}
          </>
        )}
        {mode === "pro" && intel ? (
          <details className="mt-8">
            <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
              Data Completeness · {intel.dataCompleteness.score}/100
              {" · "}
              Emlak Score {intel.emlakScore == null ? s("hesablanmayıb", "не рассчитан", "not calculated") : intel.emlakScore}
            </summary>
            <div className="mt-4 max-w-lg">
              <table className="w-full text-left text-[13px]">
                <tbody>
                  {intel.dataCompleteness.earned.map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.06]">
                      <td className="py-2 text-[#e7e5e4]">{tx(row)}</td>
                      <td className="py-2 text-right font-mono text-[#a8a29e]">+{row.weight}</td>
                    </tr>
                  ))}
                  {intel.dataCompleteness.missed.map((row) => (
                    <tr key={row.id} className="border-b border-white/[0.06]">
                      <td className="py-2 text-[#78716c]">{tx(row)}</td>
                      <td className="py-2 text-right font-mono text-[#57534e]">0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[13px] leading-relaxed text-[#a8a29e]">
                {tx(intel.why.score)}
              </p>
            </div>
          </details>
        ) : null}
      </section>
    </div>
  );
}

function KnownSplit({ locale, intel }) {
  const known = (intel.dataCompleteness?.earned || []).slice(0, 6);
  const missed = (intel.dataCompleteness?.missed || []).slice(0, 6);
  const zones = (intel.riskState?.unknown || []).slice(0, 4);
  const tx = (row) => line(locale, row);
  return (
    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <div className="text-[13px] text-[#a8a29e]">{say(locale, "Təsdiqlənib", "Подтверждено", "Confirmed")}</div>
        <ul className="mt-3 space-y-2">
          {known.length ? known.map((row) => (
            <li key={row.id} className="text-[15px] text-white">
              <span className="mr-2 text-[#b7e4c7]">✓</span>
              {tx(row)}
            </li>
          )) : (
            <li className="text-[15px] text-[#78716c]">—</li>
          )}
        </ul>
      </div>
      <div>
        <div className="text-[13px] text-[#a8a29e]">{say(locale, "Təsdiqlənməyib", "Не подтверждено", "Not confirmed")}</div>
        <ul className="mt-3 space-y-2">
          {missed.map((row) => (
            <li key={row.id} className="text-[15px] text-[#d6d3d1]">
              <span className="mr-2 text-[#57534e]">—</span>
              {tx(row)}
            </li>
          ))}
          {zones.map((row) => (
            <li key={row.id} className="text-[15px] text-[#d6d3d1]">
              <span className="mr-2 text-[#57534e]">—</span>
              {tx(row)}
            </li>
          ))}
          {!missed.length && !zones.length ? <li className="text-[15px] text-[#78716c]">—</li> : null}
        </ul>
      </div>
    </div>
  );
}

function riskHeadline(locale, intel) {
  const first = intel?.riskState?.confirmed?.[0];
  if (first) return line(locale, first);
  const zone = intel?.riskState?.unknown?.[0];
  if (zone) return line(locale, zone);
  return say(locale, "Kartda təsdiqli qüsur yoxdur", "В карточке нет подтверждённого дефекта", "The card has no confirmed defect");
}

function SummaryFigure({ label, value }) {
  return (
    <div>
      <div className="text-[13px] text-[#a8a29e]">{label}</div>
      <div className="mt-2 font-mono text-[32px] font-medium leading-none text-white sm:text-[36px]">{value}</div>
    </div>
  );
}

function describeMarket(comps, result, loading, error) {
  if (loading && !comps) return { kind: "loading" };
  if (error && !comps) return { kind: "error", error };
  const status = comps?.marketStatus || result?.marketStatus || "insufficient";
  if (status === "unavailable") return { kind: "unavailable" };
  const low = result?.market?.low?.amount;
  const high = result?.market?.high?.amount;
  const median = result?.market?.median?.amount;
  const counts = comps?.counts || {};
  const used = counts.used ?? counts.accepted ?? 0;
  if (result?.usableForValuation && low != null && high != null) {
    return { kind: "range", low, high, median, status, used };
  }
  return { kind: "insufficient", used, found: counts.found ?? 0, status };
}

function ProCostLines({ locale, result }) {
  const rows = [
    result.costs.repair,
    result.costs.other,
    result.costs.herracFee,
    result.costs.sellCost,
    result.costs.deposit,
  ];
  return (
    <ul className="mx-auto mt-4 max-w-[440px] space-y-1.5 border-t border-white/10 pt-3">
      {rows.map((row) => (
        <li key={row.id} className="flex items-baseline justify-between gap-3 text-[12px] text-[#a8a29e]">
          <span>{line(locale, row)}</span>
          <span className="font-mono text-[#e7e5e4]">
            {row.amount == null ? "—" : money(row.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}


function limitShort(locale, result) {
  const blocked = result.blockedBecause || [];
  if (blocked.includes("market_unavailable")) {
    return say(locale, "bazar əlçatan deyil", "рынок недоступен", "market unavailable");
  }
  if (
    blocked.includes("market_unconfirmed") ||
    blocked.includes("market_low") ||
    blocked.includes("sale_anchor_missing")
  ) {
    return say(locale, "bazar təsdiqlənməyib", "рынок не подтверждён", "market not confirmed");
  }
  return say(locale, "sizin hesab lazımdır", "нужен ваш расчёт", "your calculation is needed");
}

export function stickyMarket(locale, view) {
  if (!view) return "…";
  if (view.kind === "loading") return say(locale, "baxırıq", "смотрим", "checking");
  if (view.kind === "unavailable") return say(locale, "müvəqqəti yoxdur", "временно недоступен", "temporarily unavailable");
  if (view.kind === "range") return moneyRange(view.low, view.high);
  if (view.kind === "error") return say(locale, "alınmadı", "не загрузился", "did not load");
  return say(locale, "kifayət deyil", "недостаточно данных", "not enough data");
}

export function stickyLimit(locale, result) {
  if (!result) return "…";
  if (result.limitReady) return money(result.maxBid.amount);
  return limitShort(locale, result);
}

export { describeMarket };

function factLine(lot, locale) {
  if (lot.year && lot.mileageKm) {
    const unit = say(locale, "km", "км", "km");
    return `${lot.year}, ${Number(lot.mileageKm).toLocaleString(locale === "en" ? "en-US" : "ru-RU")} ${unit}`;
  }
  if (lot.rooms && lot.areaSqm) return `${lot.rooms} ${say(locale, "otaq", "комн", "rooms")}, ${lot.areaSqm} м²`;
  if (lot.areaSqm) return `${lot.areaSqm} м²`;
  if (lot.landAreaSqm) return `${lot.landAreaSqm} м²`;
  return "";
}

function lotTitle(lot, locale) {
  if (locale === "az") return lot.titleAz || lot.titleRu || lot.titleEn || "";
  if (locale === "en") return lot.titleEn || lot.titleRu || lot.titleAz || "";
  return lot.titleRu || lot.titleAz || lot.titleEn || "";
}


function formatPct(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}
