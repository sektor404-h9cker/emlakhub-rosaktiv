"use client";

import { marketLabel } from "@/lib/lots/markets";
import { formatAuctionWhen, isUpcomingLot, lotPhotoCount } from "@/lib/lots/photos";
import { line, say } from "@/lib/i18n/copy";
import {
  asksStillOpen,
  gapBetweenStartAndMarket,
  humanOutcome,
  ladderTone,
} from "@/lib/analysis/humanDeal";
import InvestCalculator from "../InvestCalculator";
import LotPhotoGallery from "../LotPhotoGallery";
import HerracFacts from "./HerracFacts";
import { money, moneyRange } from "./money";

const ASK = {
  user_sale_unknown: {
    az: "Gözlənilən satış qiymətini yazın",
    ru: "Укажите предполагаемую цену продажи",
    en: "Enter the expected sale price",
  },
  user_sale_invalid: {
    az: "Satış qiyməti sıfırdan böyük rəqəm olmalıdır",
    ru: "Цена продажи должна быть числом больше нуля",
    en: "The sale price must be a number above zero",
  },
  repair_unknown: {
    az: "Təmir xərcini yazın və ya «Bilmirəm» seçin",
    ru: "Укажите расходы на ремонт или выберите «Не знаю»",
    en: "Enter the repair cost, or choose “I don’t know”",
  },
  repair_invalid: {
    az: "Təmir məbləği rəqəm olmalıdır",
    ru: "Сумма ремонта должна быть числом",
    en: "The repair amount must be a number",
  },
  other_unknown: {
    az: "Əlavə xərcləri yazın və ya olmadığını təsdiqləyin",
    ru: "Укажите дополнительные расходы или подтвердите, что их нет",
    en: "Enter the extra costs, or confirm that there are none",
  },
  other_invalid: {
    az: "Digər xərc rəqəm olmalıdır",
    ru: "Другой расход должен быть числом",
    en: "The other cost must be a number",
  },
  desired_unknown: {
    az: "Sizə uyğun nəticəni seçin",
    ru: "Выберите результат, который вас устроит",
    en: "Choose the result that would suit you",
  },
  desired_invalid: {
    az: "İstədiyiniz nəticə rəqəm olmalıdır",
    ru: "Желаемый результат должен быть числом",
    en: "The result you want must be a number",
  },
  market_unavailable: {
    az: "Bazar müvəqqəti əlçatan deyil",
    ru: "Рынок временно недоступен",
    en: "The market is temporarily unavailable",
  },
  market_low: {
    az: "Bazar hələ təsdiqlənməyib",
    ru: "Рынок ещё не подтверждён",
    en: "The market is not confirmed yet",
  },
  market_unconfirmed: {
    az: "Bazar hələ təsdiqlənməyib",
    ru: "Рынок ещё не подтверждён",
    en: "The market is not confirmed yet",
  },
  sale_anchor_missing: {
    az: "Bazar orientiri yoxdur",
    ru: "Нет рыночного ориентира",
    en: "There is no market reference",
  },
};

export default function SimpleLot({
  locale,
  lot,
  report,
  loading,
  error,
  onRetry,
  answers,
  patch,
  result,
  start,
  startKnown,
  intel,
}) {
  const s = (az, ru, en) => say(locale, az, ru, en);
  const tx = (row) => line(locale, row);
  const comps = report?.comps || null;
  const counts = comps?.counts || {};
  const low = result?.market?.low?.amount;
  const high = result?.market?.high?.amount;
  const median = result?.market?.median?.amount;
  const usable = Boolean(result?.usableForValuation);
  const range = usable && low != null && high != null ? moneyRange(low, high) : null;
  const outcome = humanOutcome({
    usableForValuation: result ? usable : intel?.dealStatus === "market_unavailable" ? false : undefined,
    limitReady: result?.limitReady,
    atBid: result?.atBid,
    blockedBecause: result?.blockedBecause || [],
  });
  const profit = result?.atBid?.profit;
  const roi = result?.atBid?.roiPct;
  const costsOpen = (result?.blockedBecause || []).some(
    (id) => id === "repair_unknown" || id === "other_unknown"
  );
  const gap =
    costsOpen && startKnown && median != null && usable
      ? gapBetweenStartAndMarket(start, median)
      : null;
  const startAboveMarket = gap != null && gap < 0;
  const openAsks = asksStillOpen(result?.blockedBecause || []);

  return (
    <div className="mx-auto w-full max-w-[720px] px-5 py-6 sm:px-8 sm:py-8">
      <section id="story-verdict" className="scroll-mt-16">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#a8a29e]">
          {s("Nə satılır", "Что продаётся", "What is for sale")}
        </div>
        <h2 className="mt-3 text-[28px] font-semibold leading-tight text-white sm:text-[34px]">
          {lotTitle(lot, locale)}
        </h2>
        <p className="mt-2 text-[14px] text-[#a8a29e]">
          {[marketLabel(lot.market, locale), lot.cityRu || lot.cityAz].filter(Boolean).join(" · ")}
        </p>
        <p className={["mt-6 text-[22px] font-semibold leading-tight sm:text-[26px]", toneClass(outcome)].join(" ")}>
          {headline(s, outcome, intel, tx, startAboveMarket, result, lot.market)}
        </p>

        <div className="mt-8 flex flex-wrap gap-x-8 gap-y-5">
          <Figure label={s("Hərracın başlanğıcı", "Старт торгов", "Auction start")} value={startKnown ? money(start) : "—"} />
          <Figure label={s("Bazarda oxşarları", "Похожее на рынке", "Similar on the market")} value={range || "—"} />
          <Figure label={s("Bazar orientiri", "Ориентир рынка", "Market reference")} value={range && median != null ? `≈ ${money(median)}` : "—"} />
        </div>

        <p className="mt-8 max-w-[40rem] text-[16px] leading-relaxed text-[#e7e5e4]">
          {lead(s, outcome, result, range, startAboveMarket)}
        </p>

        {result?.priced ? (
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-5">
            <Figure label={s("Alış qiyməti", "Цена покупки", "Purchase price")} value={money(result.purchase)} />
            <Figure
              label={
                result.saleSource === "user"
                  ? s("Sizin satış qiyməti", "Ваша цена продажи", "Your sale price")
                  : s("Bazar", "Рынок", "Market")
              }
              value={money(result.saleAnchor?.amount)}
            />
            <Figure label={s("Məlum xərclər", "Известные расходы", "Known costs")} value={money(result.knownCosts)} />
            <Figure
              label={s("Hesablanmış nəticə", "Расчётный результат", "Calculated result")}
              value={profit == null ? "—" : signed(profit)}
            />
            {result.limitReady ? (
              <Figure label={s("Maksimum təklif", "Максимальная ставка", "Maximum bid")} value={money(result.maxBid?.amount)} />
            ) : null}
          </div>
        ) : null}

        {result?.saleSource === "user" ? (
          <p className="mt-4 max-w-[40rem] text-[13px] font-medium text-[#f5d0a9]">
            {s(
              "Qiyməti siz yazmısınız, bazar təsdiqləməyib.",
              "Цена указана вами, не подтверждена рынком.",
              "You entered this price. The market has not confirmed it."
            )}
            {median != null
              ? ` ${s(
                  `Emlak Hub orientiri ≈ ${money(median)} olaraq qalır.`,
                  `Рыночный ориентир Emlak Hub остаётся ≈ ${money(median)}.`,
                  `The Emlak Hub market reference stays ≈ ${money(median)}.`
                )}`
              : ""}
          </p>
        ) : null}

        {profit != null ? (
          <div className="mt-8">
            <p className="text-[15px] leading-relaxed text-[#e7e5e4]">{resultSentence(s, profit)}</p>
            <div className={["mt-2 font-mono text-[36px] font-medium", toneClass(outcome)].join(" ")}>
              {signed(profit)}
            </div>
            {roi != null ? (
              <p className="mt-2 text-[14px] text-[#d6d3d1]">
                {s("Hesablanmış gəlir", "Расчётная доходность", "Calculated return")} ≈ {formatPct(roi)}
              </p>
            ) : null}
            <p className="mt-3 max-w-[40rem] text-[13px] leading-relaxed text-[#a8a29e]">
              {verdictLine(s, outcome, result)}
            </p>
            <p className="mt-3 max-w-[40rem] text-[13px] leading-relaxed text-[#78716c]">
              {s(
                "Bu hesablamadır, zəmanət deyil. Nəticə obyektin vəziyyətindən, alış və satış qiymətindən asılıdır.",
                "Это расчёт, а не гарантия. Реальный результат зависит от состояния объекта, финальной цены покупки и продажи.",
                "This is a calculation, not a guarantee. The real result depends on the condition of the object and the final buy and sell prices."
              )}
            </p>
          </div>
        ) : null}

        {!result?.priced && !result?.limitReady && openAsks.length ? (
          <div className="mt-6">
            <p className="text-[15px] text-white">{s("Hələ hesablaya bilmirik.", "Пока не можем посчитать.", "We cannot calculate this yet.")}</p>
            <ul className="mt-2 space-y-1 text-[14px] text-[#d6d3d1]">
              {openAsks.map((id) => (
                <li key={id}>{askCopy(s, id, lot.market)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {gap != null && gap >= 0 ? (
          <div className="mt-6 max-w-[40rem] rounded-2xl border border-white/10 px-4 py-4">
            <p className="text-[14px] leading-relaxed text-[#e7e5e4]">
              {s(
                "Hələ yekun qazancı dürüst hesablamaq olmur.",
                "Пока нельзя честно посчитать итоговую прибыль.",
                "The final profit cannot be calculated honestly yet."
              )}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-[#d6d3d1]">
              {s(
                "Təmir və digər naməlum xərclərdən əvvəl start ilə bazar orientiri arasındakı fərq",
                "До ремонта и других неизвестных расходов разница между стартом и рыночным ориентиром составляет",
                "Before repair and other unknown costs, the gap between the start and the market reference is"
              )}{" "}
              ≈ {money(gap)}.
            </p>
            <p className="mt-2 text-[13px] font-medium text-white">
              {s(
                "Bu qazanc deyil. Bu məbləğdən xərcləri çıxmaq lazımdır.",
                "Это не прибыль. Из этой суммы ещё нужно вычесть расходы.",
                "This is not profit. The costs still have to come out of this amount."
              )}
            </p>
          </div>
        ) : null}

        {!result?.priced ? (
          <button
            type="button"
            onClick={() => document.getElementById("story-costs")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="mt-8 rounded-full bg-white px-5 py-2.5 text-[14px] font-medium text-[#0b0d12]"
          >
            {s("Sövdələşməmi hesabla", "Рассчитать мою сделку", "Calculate my deal")}
          </button>
        ) : null}
      </section>

      <LotPhotoGallery
        lot={lot}
        alt={lotTitle(lot, locale)}
        aspectClass="mt-8 aspect-[16/10] max-h-[220px] sm:max-h-[280px]"
      />
      <p className="mt-3 text-[12px] text-[#78716c]">
        {lotPhotoCount(lot)} {s("foto", "фото", "photos")}
        {isUpcomingLot(lot) && lot.startAt
          ? ` · ${formatAuctionWhen(lot.startAt, locale)}`
          : lot.validUntil
            ? ` · ${formatAuctionWhen(lot.validUntil, locale)}`
            : ""}
      </p>

      <section id="story-market" className="mt-10 scroll-mt-16 border-t border-white/[0.06] pt-8">
        <h3 className="text-[20px] font-semibold text-white">
          {range
            ? s("Belə obyektlər bazarda nə qədərdir?", "Сколько такие объекты стоят на рынке?", "What do objects like this cost on the market?")
            : s("Bazar qiymətini hələ müəyyən etmək olmur", "Рыночную цену пока определить нельзя", "A market price cannot be set yet")}
        </h3>
        {range ? (
          <>
            <p className="mt-4 font-mono text-[28px] text-white">{range}</p>
            <p className="mt-2 text-[16px] text-[#d6d3d1]">
              {s("Orientir", "Ориентир", "Reference")}: ≈ {money(median)}
            </p>
            <p className="mt-3 text-[14px] text-[#a8a29e]">
              {s(
                `${counts.used ?? 0} uyğun elan tapdıq.`,
                `Мы нашли ${counts.used ?? 0} подходящих объявлений.`,
                `We found ${counts.used ?? 0} matching listings.`
              )}
            </p>
          </>
        ) : (
          <div className="mt-4 max-w-[40rem] space-y-3 text-[15px] leading-relaxed text-[#d6d3d1]">
            <p>{intel ? tx(intel.why?.market) : s("Baxırıq", "Смотрим", "Checking")}</p>
            {counts.found != null ? (
              <p>
                {s("Tapılıb", "Нашли", "Found")}: {counts.found ?? 0}. {s("Yoxlamadan sonra uyğun", "После проверки подошло", "Matched after checks")}: {counts.accepted ?? counts.used ?? 0}.
              </p>
            ) : null}
            <p className="text-[#a8a29e]">
              {lot.market === "auto" || lot.market === "equipment"
                ? s(
                    "İli, mühərriki və komplektasiyanı yoxlayın və ya elanları özünüz açın.",
                    "Проверьте год, двигатель и комплектацию автомобиля или откройте объявления вручную.",
                    "Check the year, engine and trim, or open the listings yourself."
                  )
                : s(
                    "Rayonu və sahəni yoxlayın və ya elanları özünüz açın.",
                    "Проверьте район и площадь или откройте объявления вручную.",
                    "Check the district and the area, or open the listings yourself."
                  )}
            </p>
          </div>
        )}
        {error ? (
          <button type="button" onClick={onRetry} className="mt-3 text-[14px] text-[#93c5fd]">
            {s("Yenidən bax", "Попробовать ещё раз", "Try again")}
          </button>
        ) : null}
        <details className="mt-4">
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Niyə belə hesab edirik?", "Почему мы считаем так?", "Why do we count it this way?")}
          </summary>
          <p className="mt-3 max-w-[40rem] text-[14px] leading-relaxed text-[#d6d3d1]">
            {loading && !comps
              ? s("Bazara baxırıq", "Смотрим рынок", "Checking the market")
              : intel
                ? tx(intel.why?.market)
                : "—"}
          </p>
        </details>
      </section>

      <section id="story-costs" className="mt-10 scroll-mt-16 border-t border-white/[0.06] pt-8">
        <h3 className="text-[20px] font-semibold text-white">{s("Sizin hesab", "Ваш расчёт", "Your calculation")}</h3>
        <p className="mt-2 max-w-[40rem] text-[14px] text-[#a8a29e]">
          {s(
            "Bu suallar qazancı uydurmur. Cavabınız olmadan sıfır yazmırıq.",
            "Эти вопросы не выдумывают прибыль. Без вашего ответа мы не подставляем ноль.",
            "These questions do not invent a profit. Without your answer we do not put in zero."
          )}
        </p>
        <div className="mt-5">
          <InvestCalculator
            locale={locale}
            market={lot.market}
            mode="simple"
            answers={answers}
            patch={patch}
            marketReady={!loading && usable}
          />
        </div>
      </section>

      {result?.priced && result.atBid ? (
        <section className="mt-10 border-t border-white/[0.06] pt-8">
          <h3 className="text-[20px] font-semibold text-white">{s("Nəticə necə alındı", "Как получился результат", "How the result was built")}</h3>
          <Receipt locale={locale} result={result} answers={answers} />
          <p className="mt-4 max-w-[40rem] text-[13px] leading-relaxed text-[#94a3b8]">
            {s(
              "Belə analizi lazım olan investor tanıyırsınız? Onu dəvət edin və ilk ödənişdən sonra bonus PRO günləri alın.",
              "Знаете инвестора, которому пригодится такой анализ? Пригласите его и получите бонусные дни PRO после первой оплаты.",
              "Know an investor who could use this analysis? Invite them and receive bonus PRO days after their first payment."
            )}{" "}
            <a href="/profile" className="text-white underline underline-offset-2">Emlak Partners</a>
          </p>
          <p className="mt-4 max-w-[40rem] text-[13px] leading-relaxed text-[#a8a29e]">
            {result.saleSource === "user"
              ? s(
                  "Əgər obyekt sizin yazdığınız qiymətə satılsa və xərclər bundan çox olmasa. Bu, bazar qiymətləndirməsi deyil.",
                  "Если объект удастся продать по указанной вами цене и расходы не превысят введённые. Это не рыночная оценка Emlak Hub.",
                  "If the object sells at the price you entered and the costs stay within what you entered. This is not an Emlak Hub market valuation."
                )
              : s(
                  "Əgər obyekt təxminən bazar orientirinə satılsa və xərclər sizin yazdığınızdan çox olmasa.",
                  "Если объект удастся продать примерно по рыночному ориентиру и расходы не превысят указанные вами.",
                  "If the object sells near the market reference and the costs stay within what you entered."
                )}
          </p>
        </section>
      ) : null}

      {result?.ladder?.length ? (
        <section className="mt-10 border-t border-white/[0.06] pt-8">
          <h3 className="text-[20px] font-semibold text-white">
            {s("Fərqli təklifdə nə olar?", "Что будет при разной ставке?", "What happens at different bids?")}
          </h3>
          <ul className="mt-4 max-w-lg divide-y divide-white/[0.06]">
            {result.ladder.map((row) => (
              <li key={`${row.role}-${row.bid}`} className="flex items-baseline justify-between gap-4 py-3">
                <span className="font-mono text-[16px] text-white">{money(row.bid)}</span>
                <span className="text-right text-[14px] text-[#d6d3d1]">
                  {ladderRole(s, row.role)}
                  <span className="mt-0.5 block text-[12px] text-[#a8a29e]">
                    {signed(row.profit)} · {ladderLabel(s, ladderTone(row), row.role)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section id="story-limit" className="mt-10 border-t border-white/[0.06] pt-8">
        <h3 className="text-[20px] font-semibold text-white">
          {s("Hansı qiymətə qədər ticarət etmək məntiqlidir?", "До какой цены имеет смысл торговаться?", "Up to what price is it worth bidding?")}
        </h3>
        {result?.limitReady ? (
          <>
            <p className="mt-4 font-mono text-[32px] text-white">
              {s("Yuxarı deyil", "Не выше", "Not above")} {money(result.maxBid?.amount)}
            </p>
            <p className="mt-3 max-w-[40rem] text-[14px] leading-relaxed text-[#d6d3d1]">
              {s(
                "Bu məbləğdən yuxarı sövdələşmə sizin seçdiyiniz qazanc və xərclərə uyğun gəlmir.",
                "Выше этой суммы сделка перестаёт соответствовать выбранной вами прибыли и расходам.",
                "Above this amount the deal no longer matches the profit and the costs you chose."
              )}
            </p>
          </>
        ) : (
          <p className="mt-4 text-[16px] text-white">{s("Hələ hesablaya bilmirik.", "Пока не можем посчитать.", "We cannot calculate this yet.")}</p>
        )}
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-8">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#a8a29e]">Emlak</div>
        <h3 className="mt-2 text-[28px] font-semibold text-white">{headline(s, outcome, intel, tx, startAboveMarket, result, lot.market)}</h3>
        <p className="mt-3 max-w-[40rem] text-[15px] leading-relaxed text-[#d6d3d1]">{finalBody(s, outcome, result)}</p>
        <p className="mt-4 text-[13px] text-[#a8a29e]">{s("Niyə?", "Почему?", "Why?")}</p>
        <ul className="mt-2 max-w-[40rem] space-y-2 text-[14px] leading-relaxed text-[#e7e5e4]">
          {whyLines(intel, result, tx).map((text, index) => (
            <li key={`${index}-${text}`}>{text}</li>
          ))}
        </ul>
      </section>

      <section id="story-risks" className="mt-10 border-t border-white/[0.06] pt-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <h3 className="text-[16px] font-semibold text-white">{s("Nəyi bilirik", "Что мы знаем", "What we know")}</h3>
            <ul className="mt-3 space-y-2 text-[14px] text-[#e7e5e4]">
              {(intel?.riskState?.confirmed || []).length ? (
                intel.riskState.confirmed.map((item) => (
                  <li key={item.id}>{tx(item)}{item.quote ? ` — «${item.quote}»` : ""}</li>
                ))
              ) : (
                <li className="text-[#a8a29e]">
                  {s(
                    "Mətndə təsdiqli qüsur yoxdur. Boş sahə xarab hissə demək deyil.",
                    "В тексте нет подтверждённого дефекта. Пустое поле не означает поломку.",
                    "The text has no confirmed defect. An empty field does not mean something is broken."
                  )}
                </li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-white">{s("Nəyi yoxlamaq lazımdır", "Что нужно проверить", "What to check")}</h3>
            <ul className="mt-3 space-y-2 text-[14px] text-[#d6d3d1]">
              {(intel?.riskState?.unknown || []).slice(0, 6).map((item) => (
                <li key={item.id}>{tx(item)}</li>
              ))}
              {(intel?.dataCompleteness?.missed || []).slice(0, 4).map((item) => (
                <li key={item.id}>{tx(item)}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 border-t border-white/[0.06] pt-8">
        <h3 className="text-[16px] font-semibold text-white">
          {s("Təklifdən əvvəl", "Что сделать перед ставкой", "Before you bid")}
        </h3>
        <ul className="mt-3 max-w-[40rem] space-y-2 text-[14px] text-[#d6d3d1]">
          {checklist(lot.market).map((row) => (
            <li key={row.ru}>· {tx(row)}</li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] text-[#78716c]">
          {s(
            "Bu yoxlama siyahısıdır, hüquqi rəy deyil.",
            "Это список проверки, не юридическое заключение.",
            "This is a checklist, not a legal opinion."
          )}
        </p>
      </section>

      <section className="mt-8">
        <details>
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Texniki tamlıq qiymətini göstər", "Показать техническую оценку полноты", "Show the technical completeness score")}
          </summary>
          <p className="mt-3 text-[14px] text-[#d6d3d1]">
            {intel?.dataCompleteness?.score >= 55
              ? s("Lot haqqında analiz üçün kifayət qədər məlumat var.", "Данных о лоте достаточно для анализа.", "There is enough data about the lot to analyse it.")
              : s("Vacib məlumat çatmır.", "Не хватает важных данных.", "Important data is missing.")}
          </p>
          <p className="mt-2 text-[13px] text-[#a8a29e]">
            Data Completeness {intel?.dataCompleteness?.score ?? "—"}/100
            {" · "}
            Emlak Score{" "}
            {intel?.emlakScore == null
              ? result?.saleSource === "user"
                ? s(
                    "hesablanmayıb: sizin qiymətiniz bazar qiyməti deyil",
                    "не рассчитан: ваша цена не является рыночной оценкой",
                    "not calculated: your price is not a market valuation"
                  )
                : s("hesabınızdan sonra görünəcək", "появится после вашего расчёта", "appears after your calculation")
              : intel.emlakScore}
          </p>
        </details>
        <details className="mt-3">
          <summary className="cursor-pointer text-[14px] text-[#93c5fd]">
            {s("Hərrac kartı", "Карточка Hərrac", "Hərrac card")}
          </summary>
          <div className="mt-4">
            <HerracFacts lot={lot} locale={locale} mode="simple" />
          </div>
        </details>
      </section>
    </div>
  );
}

function Receipt({ locale, result, answers }) {
  const s = (az, ru, en) => say(locale, az, ru, en);
  const sale = result.saleAnchor?.amount;
  const bid = result.atBid?.bid;
  const repair = result.costs?.repair?.amount;
  const other = result.costs?.other?.amount;
  const fee = result.costs?.herracFee?.amount;
  const sell = result.costs?.sellCost?.amount;
  const reserve = reserveAmount(answers);
  const split = reserve != null && other != null && other + 0.001 >= reserve;
  const rest = split ? Math.round((other - reserve) * 100) / 100 : null;
  const rows = [
    [s("Gözlənilən satış qiyməti", "Ожидаемая цена продажи", "Expected sale price"), sale, ""],
    [s("Alış qiyməti", "Цена покупки", "Purchase price"), bid, "−"],
    [s("Təmir", "Ремонт", "Repair"), repair, "−"],
  ];
  if (split) {
    rows.push([s("Problemlər üçün ehtiyat", "Запас на проблемы", "Reserve for problems"), reserve, "−"]);
    rows.push([s("Qalan xərclər", "Остальные расходы", "Other costs"), rest, "−"]);
  } else {
    rows.push([s("Qalan xərclər", "Остальные расходы", "Other costs"), other, "−"]);
  }
  if (fee != null) rows.push([s("Hərrac haqqı", "Сбор Hərrac", "Hərrac fee"), fee, "−"]);
  if (sell != null) rows.push([s("Satış xərci", "Расходы при продаже", "Cost of selling"), sell, "−"]);

  return (
    <div className="mt-4 max-w-md">
      <ul className="space-y-2">
        {rows.map(([label, amount, sign]) => (
          <li key={label} className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="text-[#a8a29e]">{sign ? `${sign} ${label}` : label}</span>
            <span className="font-mono text-white">{money(amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="text-[13px] text-[#a8a29e]">{s("Hesablanmış nəticə", "Расчётный результат", "Calculated result")}</div>
        <div className="mt-1 font-mono text-[28px] text-white">{signed(result.atBid?.profit)}</div>
      </div>
    </div>
  );
}

function reserveAmount(answers) {
  if (!answers) return null;
  if (answers.reserveChoice === "1000" || answers.reserveChoice === "2000") return Number(answers.reserveChoice);
  if (answers.reserveChoice === "none") return 0;
  if (answers.reserveChoice === "amount") {
    const n = Number(String(answers.reserveAmount || "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

function Figure({ label, value }) {
  return (
    <div className="min-w-[8.5rem] max-w-full flex-1">
      <div className="text-[13px] text-[#a8a29e]">{label}</div>
      <div className="mt-2 break-words font-mono text-[22px] font-medium leading-snug text-white sm:text-[26px]">{value}</div>
    </div>
  );
}

function toneClass(outcome) {
  if (outcome === "interesting") return "text-[#b7e4c7]";
  if (outcome === "loss" || outcome === "above") return "text-[#f0b4b4]";
  if (outcome === "borderline" || outcome === "missing") return "text-[#f5d0a9]";
  return "text-white";
}

function askCopy(s, id, market) {
  if (id === "repair_unknown" && market === "land") {
    return s(
      "Hazırlıq xərcini yazın və ya «Bilmirəm» seçin",
      "Укажите расходы на подготовку или выберите «Не знаю»",
      "Enter the preparation cost, or choose “I don’t know”"
    );
  }
  if (id === "repair_unknown" && (market === "estate" || market === "commercial")) {
    return s(
      "Qaydaya salma xərcini yazın və ya «Bilmirəm» seçin",
      "Укажите расходы на приведение в порядок или выберите «Не знаю»",
      "Enter the cost of putting it in order, or choose “I don’t know”"
    );
  }
  const row = ASK[id];
  if (!row) return id;
  return s(row.az, row.ru, row.en);
}

function headline(s, outcome, intel, tx, startAboveMarket, result, market) {
  const userScenario = result?.saleSource === "user";
  if (outcome === "interesting" && userScenario) {
    return s("Sizin ssenari üzrə nəticə", "Результат по вашему сценарию", "Result on your scenario");
  }
  if (outcome === "interesting") return s("Maraqlı görünür", "Выглядит интересно", "Looks interesting");
  if (result?.atBid?.profit != null && userScenario && outcome !== "loss") {
    return s("Sizin ssenari üzrə nəticə", "Результат по вашему сценарию", "Result on your scenario");
  }
  if (outcome === "missing" && startAboveMarket) {
    return s("Start artıq orientirdən yüksəkdir", "Старт уже выше ориентира", "The start is already above the reference");
  }
  if (outcome === "missing" || outcome === "no_market") {
    const first = asksStillOpen(result?.blockedBecause || [])[0];
    if (first) return askCopy(s, first, market);
  }
  if (result?.priced && result?.atBid?.profit != null) {
    return s("Cari qiymət üzrə nəticə", "Результат по текущей ставке", "Result at the current bid");
  }
  if (outcome === "missing") return s("Xərclər olmadan nəticəni demək olmaz", "Без расходов итог назвать нельзя", "The result cannot be named without the costs");
  if (outcome === "borderline") return s("Sərhəddədir", "На границе", "On the edge");
  if (outcome === "above") return s("Sizin limitdən yuxarı", "Выше вашего лимита", "Above your limit");
  if (outcome === "loss") return s("Zərər mümkün görünür", "Возможен убыток", "A loss is possible");
  if (outcome === "no_market") return s("Satış qiymətini yazın", "Укажите предполагаемую цену продажи", "Enter the expected sale price");
  return intel?.dealStatusLabel ? tx(intel.dealStatusLabel) : s("Baxırıq", "Смотрим", "Checking");
}

function lead(s, outcome, result, range, startAboveMarket) {
  if (result?.priced && result?.saleSource === "user") {
    return s(
      "Hesab sizin yazdığınız satış qiyməti və xərclər üzərindədir. Bazar bu qiyməti təsdiqləməyib.",
      "Расчёт стоит на указанной вами цене продажи и ваших расходах. Рынок эту цену не подтвердил.",
      "The calculation uses the sale price you entered and your costs. The market has not confirmed that price."
    );
  }
  if (!range && !result?.priced) {
    return s(
      "Bazar təsdiqlənməyib. Gözlənilən satış qiymətini özünüz yazın. Xərclər məlum olanda nəticəni göstərəcəyik. Bu, Emlak Hub qiymətləndirməsi deyil.",
      "Не удалось подтвердить рыночную стоимость. Вы можете рассчитать сделку по собственной предполагаемой цене продажи.",
      "The market is not confirmed. Enter the expected sale price yourself. Once the costs are known, we will show the result. This is not an Emlak Hub valuation."
    );
  }
  if (result?.limitReady) return verdictLine(s, outcome, result);
  if (result?.desiredBlockedBecause?.includes("goal_unreachable")) {
    return s(
      "Bu xərclərlə seçilmiş qazanc 0 ₼ təklifdə belə mümkün deyil. Maksimum stavkanı göstərmirik.",
      "При этих расходах выбранная прибыль недостижима даже при ставке 0 ₼. Максимальную ставку не показываем.",
      "With these costs the chosen profit is impossible even at a 0 ₼ bid. The maximum bid is not shown."
    );
  }
  if (result?.priced && result?.atBid?.profit != null) {
    return s(
      "Mənfəət cari qiymətə görə hesablanıb. Maksimum təklifi görmək üçün məqsədi seçin.",
      "Прибыль посчитана по текущей ставке. Чтобы увидеть, до какой суммы можно повышать ставку, выберите цель сделки.",
      "Profit is calculated at the current bid. Choose a deal goal to see how high the bid can go."
    );
  }
  if (startAboveMarket) {
    return s(
      "Başlanğıc qiymət bazar orientirindən yüksəkdir. Xərcləri yazmadan yekun nəticəni hesablamırıq.",
      "Стартовая цена выше рыночного ориентира. Пока вы не укажете расходы, итоговый результат не считаем.",
      "The starting price is above the market reference. Until you enter the costs, we do not calculate a final result."
    );
  }
  return s(
    "Hələ yekun qazancı dürüst hesablamaq olmur. Üç qısa suala cavab verin — alış həddini və mümkün nəticəni göstərəcəyik.",
    "Пока нельзя честно посчитать итоговую прибыль. Ответьте на короткие вопросы — покажем предел покупки и возможный результат.",
    "The final profit cannot be calculated honestly yet. Answer the short questions and we will show the buy limit and the possible result."
  );
}

function verdictLine(s, outcome, result) {
  const limit = money(result?.maxBid?.amount);
  if (result?.saleSource === "user" && outcome !== "loss" && outcome !== "above") {
    return s(
      "Bu sizin yazdığınız satış qiymətidir. Bazar onu təsdiqləməyib.",
      "Это указанная вами цена продажи. Рынок её не подтвердил.",
      "This is the sale price you entered. The market has not confirmed it."
    );
  }
  if (outcome === "interesting") {
    return s(
      `Sizin ssenarinizdə sövdələşmə ${limit} qədər maraqlı görünür.`,
      `По вашему сценарию сделка выглядит интересной до ${limit}.`,
      `On your scenario the deal looks interesting up to ${limit}.`
    );
  }
  if (outcome === "borderline") {
    return s(
      "Xərclərdən sonra ehtiyat çox kiçik qalır.",
      "После расходов остаётся слишком маленький запас.",
      "After the costs the margin left is very small."
    );
  }
  if (outcome === "above") {
    return s(
      "Bu qiymətdə sövdələşmə sizin ssenarinizə uyğun gəlmir.",
      "По этой цене сделка не соответствует вашему сценарию.",
      "At this price the deal does not match your scenario."
    );
  }
  if (outcome === "loss") {
    return s(
      "Bu qiymətə almaq risklidir.",
      "По такой цене покупать рискованно.",
      "Buying at this price is risky."
    );
  }
  return s(
    "Hesab sizin xərcləriniz və bazar orientiri üzərindədir.",
    "Расчёт стоит на ваших расходах и рыночном ориентире.",
    "The calculation rests on your costs and the market reference."
  );
}

function resultSentence(s, profit) {
  const shown = signed(profit);
  if (Number(profit) < 0) {
    return s(
      `Sizin ssenarinizdə mümkün zərər ${shown}.`,
      `По вашему сценарию возможен убыток ${shown}.`,
      `On your scenario a loss of ${shown} is possible.`
    );
  }
  return s(
    `Sizin ssenarinizdə mümkün qazanc ${shown} təşkil edir.`,
    `По вашему сценарию возможная прибыль составляет ${shown}.`,
    `On your scenario the possible profit is ${shown}.`
  );
}

function finalBody(s, outcome, result) {
  if (outcome === "interesting" && result?.saleSource === "user") {
    return s(
      "Bu, sizin yazdığınız satış qiymətidir. Bazar onu təsdiqləməyib. Xərclərdən sonra seçdiyiniz mənfəət qalır.",
      "Это ваша цена продажи, рынок её не подтвердил. После расходов остаётся выбранная вами прибыль.",
      "This is your sale price. The market has not confirmed it. After the costs, the profit you chose still remains."
    );
  }
  if (outcome === "interesting") {
    return s(
      "Qiymət bazardan aşağıdır və sizin xərclərinizdən sonra kifayət qədər ehtiyat qalır.",
      "Цена ниже рынка и после ваших расходов остаётся достаточный запас.",
      "The price is below the market and after your costs a usable margin remains."
    );
  }
  if (outcome === "missing") {
    return s(
      "Xərclər məlum olmayana qədər yekun qazancı dürüst hesablamaq olmaz.",
      "Пока расходы неизвестны, итоговую прибыль честно посчитать нельзя.",
      "Until the costs are known, a final profit cannot be calculated honestly."
    );
  }
  if (outcome === "borderline") {
    return s(
      "Xərclərdən sonra ehtiyat çox kiçik qalır.",
      "После расходов остаётся слишком маленький запас.",
      "After the costs the margin left is very small."
    );
  }
  if (outcome === "above") {
    return s(
      "Bu qiymətdə sövdələşmə sizin ssenarinizə uyğun gəlmir.",
      "По этой цене сделка не соответствует вашему сценарию.",
      "At this price the deal does not match your scenario."
    );
  }
  if (outcome === "loss") {
    return s(
      "Göstərilən xərclərlə hesab mənfi olur.",
      "При указанных расходах расчёт становится отрицательным.",
      "With the costs you entered the calculation turns negative."
    );
  }
  if (outcome === "pending") {
    return s(
      "Mənfəət cari qiymətə görədir. Maksimum təklif üçün məqsədi seçin.",
      "Прибыль уже посчитана по текущей ставке. Максимальная ставка появится, когда выберете цель сделки.",
      "Profit is already calculated at the current bid. The maximum bid appears after you choose a deal goal."
    );
  }
  return s(
    "Bazarı etibarlı müəyyən edə bilmirik.",
    "Мы не можем надёжно определить рынок.",
    "We cannot determine the market reliably."
  );
}

function whyLines(intel, result, tx) {
  const lines = [];
  const push = (text) => {
    if (text && !lines.includes(text)) lines.push(text);
  };
  push(tx(intel?.why?.status));
  push(tx(intel?.why?.market));
  push(tx(intel?.why?.limit));
  for (const row of result?.blockedText || []) push(tx(row));
  return lines.slice(0, 4);
}

function ladderRole(s, role) {
  if (role === "start") return s("Start qiymətində almaq", "Если купить по стартовой цене", "If you buy at the starting price");
  if (role === "between") return s("Start ilə həddin arasında", "Если цена вырастет, но останется ниже предела", "If the price rises but stays under your limit");
  if (role === "limit") return s("Sizin həddinizdə", "На вашем пределе покупки", "At your buy limit");
  if (role === "above") return s("Həddən yuxarı qalxsa", "Если цена торгов вырастет выше предела", "If the auction price rises above your limit");
  return s("Müqayisə", "Сравнение", "Comparison");
}

function ladderLabel(s, tone, role) {
  if (tone === "loss") return s("Zərər", "Убыток", "Loss");
  if (tone === "above") return s("Təhlükəsiz səviyyədən yuxarı", "Выше вашего безопасного уровня", "Above your safe level");
  if (tone === "thin") return s("Ehtiyat azdır", "Запас небольшой", "The margin is small");
  if (tone === "room" && role === "start") return s("Yaxşı ehtiyat", "Хороший запас", "A good margin");
  if (tone === "room") return s("Ehtiyat var", "Есть запас", "There is a margin");
  return s("Müqayisə", "Сравнение", "Comparison");
}

function checklist(market) {
  if (market === "land") {
    return [
      { az: "Torpağın təyinatını yoxlayın", ru: "Проверьте назначение земли", en: "Check the land purpose" },
      { az: "Sahəni və sərhədi kadastrla tutuşdurun", ru: "Сверьте площадь и границы с кадастром", en: "Match the area and boundaries to the cadastre" },
      { az: "Yolu və kommunikasiyanı yoxlayın", ru: "Проверьте дорогу и коммуникации", en: "Check the road and utilities" },
      { az: "Baxış şərtini və hərrac tarixini dəqiqləşdirin", ru: "Уточните условия осмотра и дату торгов", en: "Confirm the inspection terms and the auction date" },
      { az: "Beh və rəsmi addımlar herrac.gov.az-dadır", ru: "Задаток и официальные шаги — на herrac.gov.az", en: "The deposit and the official steps are on herrac.gov.az" },
    ];
  }
  if (market === "estate" || market === "commercial") {
    return [
      { az: "Ünvanı və sahəni kartla tutuşdurun", ru: "Сверьте адрес и площадь с карточкой", en: "Match the address and area to the card" },
      { az: "Sənədləri və yüklənməni yoxlayın", ru: "Проверьте документы и обременение", en: "Check the documents and any encumbrance" },
      { az: "Obyektə yerində baxın", ru: "Осмотрите объект на месте", en: "Look at the property on site" },
      { az: "Baxış şərtini və hərrac tarixini dəqiqləşdirin", ru: "Уточните условия осмотра и дату торгов", en: "Confirm the inspection terms and the auction date" },
      { az: "Beh və rəsmi addımlar herrac.gov.az-dadır", ru: "Задаток и официальные шаги — на herrac.gov.az", en: "The deposit and the official steps are on herrac.gov.az" },
    ];
  }
  return [
    { az: "VIN və ya kuzov nömrəsini yoxlayın", ru: "Проверьте VIN или номер кузова", en: "Check the VIN or body number" },
    { az: "Mühərrikə baxın", ru: "Осмотрите двигатель", en: "Inspect the engine" },
    { az: "Qutunu yoxlayın", ru: "Проверьте коробку", en: "Check the gearbox" },
    { az: "Kuzova baxın", ru: "Проверьте кузов", en: "Check the body" },
    { az: "Sənədləri yoxlayın", ru: "Проверьте документы", en: "Check the documents" },
    { az: "Baxış şərtini dəqiqləşdirin", ru: "Уточните условия осмотра", en: "Confirm the inspection terms" },
    { az: "Hərrac tarixini və behi yoxlayın", ru: "Проверьте дату торгов и задаток", en: "Check the auction date and the deposit" },
  ];
}

function signed(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  const shown = money(n);
  if (Number(n) > 0) return `+${shown}`;
  return shown;
}

function formatPct(n) {
  const sign = Number(n) > 0 ? "+" : "";
  return `${sign}${Number(n).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}%`;
}

function lotTitle(lot, locale) {
  if (locale === "az") return lot.titleAz || lot.titleRu || lot.titleEn || "";
  if (locale === "en") return lot.titleEn || lot.titleRu || lot.titleAz || "";
  return lot.titleRu || lot.titleAz || lot.titleEn || "";
}
