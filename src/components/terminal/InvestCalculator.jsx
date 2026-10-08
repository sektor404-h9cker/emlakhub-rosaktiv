"use client";

import { questionSet } from "./lotStory/foldCosts";
import { say } from "@/lib/i18n/copy";

const CHOICE =
  "rounded-full px-3.5 py-1.5 text-[13px] text-[#a8a29e] transition hover:text-white";
const CHOICE_ON =
  "rounded-full bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#0b0d12]";

export default function InvestCalculator({
  locale = "ru",
  market,
  mode,
  answers,
  patch,
  marketReady = false,
}) {
  const s = (azText, ruText, enText) => say(locale, azText, ruText, enText);
  const kind = questionSet(market);
  const human = mode !== "pro";
  const basis = answers.saleBasis === "user" || !marketReady ? "user" : "market";

  return (
    <div className="space-y-5">
      <Question
        title={s(
          "Satışı hansı qiymətlə hesablayaq?",
          "По какой цене продажи считать?",
          "Which sale price should the calculation use?"
        )}
        hint={
          marketReady
            ? s(
                "Bazar orientiri olduğu kimi qalır. Sizin rəqəminiz ayrıca ssenaridir və Emlak Hub qiyməti deyil.",
                "Рыночный ориентир остаётся на месте. Ваша цифра — отдельный сценарий, не оценка Emlak Hub.",
                "The market reference stays as it is. Your figure is a separate scenario, not an Emlak Hub valuation."
              )
            : s(
                "Bazar dəyərini təsdiqləmək alınmadı. Sövdələşməni öz gözlənilən satış qiymətinizlə hesablaya bilərsiniz.",
                "Не удалось подтвердить рыночную стоимость. Вы можете рассчитать сделку по собственной предполагаемой цене продажи.",
                "A market value could not be confirmed. You can calculate the deal with your own expected sale price."
              )
        }
      >
        {marketReady ? (
          <Choices
            value={basis}
            onChange={(saleBasis) => patch({ saleBasis })}
            options={[
              { id: "market", label: s("Bazar üzrə", "По рынку", "Use the market") },
              { id: "user", label: s("Mənim qiymətimlə", "По моей цене", "Use my price") },
            ]}
          />
        ) : null}
        {basis === "user" ? (
          <>
            <Amount
              locale={locale}
              value={answers.userSaleAmount || ""}
              onChange={(userSaleAmount) => patch({ saleBasis: "user", userSaleAmount })}
            />
            <p className="mt-2 text-[12px] leading-relaxed text-[#f5d0a9]">
              {s(
                "Qiyməti siz yazmısınız, bazar təsdiqləməyib.",
                "Цена указана вами, не подтверждена рынком.",
                "You entered this price. The market has not confirmed it."
              )}
            </p>
          </>
        ) : null}
      </Question>
      {kind === "land" ? (
        <Question
          title={s("Hazırlığa nə qədər pul qoyursunuz?", "Сколько заложить на подготовку участка?", "How much will you set aside to prepare the plot?")}
          hint={s(
            "Bilmirsinizsə, boş buraxın. Sıfır yalnız həqiqətən xərc olmayanda.",
            "Если не знаете — не угадываем за вас. Ноль только если расходов точно нет.",
            "If you do not know, leave it empty. Zero only when there is truly no cost."
          )}
        >
          <Choices
            value={answers.prepChoice}
            onChange={(prepChoice) => patch({ prepChoice })}
            options={amountOptions(locale)}
          />
          {answers.prepChoice === "amount" ? (
            <Amount
              locale={locale}
              value={answers.prepAmount}
              onChange={(prepAmount) => patch({ prepAmount })}
            />
          ) : null}
        </Question>
      ) : (
        <Question
          title={
            human
              ? s("Alışdan sonra təxminən nə qədər lazım olacaq?", "Сколько примерно понадобится после покупки?", "About how much will be needed after the purchase?")
              : kind === "auto"
                ? s("Təmirə nə qədər pul qoymaq istəyirsiniz?", "Сколько вы хотите заложить на ремонт?", "How much do you want to set aside for repair?")
                : s("Qaydaya salmağa nə qədər pul qoyursunuz?", "Сколько заложить, чтобы привести объект в порядок?", "How much will you set aside to put the property in order?")
          }
          hint={
            human
              ? s(
                  "Bu məbləği mümkün nəticədən çıxırıq. Bilmirsinizsə, sıfır yazmırıq.",
                  "Мы вычтем эту сумму из возможной прибыли. Если не знаете, ноль не подставляем.",
                  "We subtract this amount from the possible result. If you do not know, we do not put in zero."
                )
              : s(
                  "Fotodan təmir smetası çıxarmırıq. Bilmirsinizsə, «Bilmirəm» seçin.",
                  "Смету по фото мы не составляем. Если суммы нет — выберите «Не знаю».",
                  "We do not estimate repair from photos. If you have no amount, choose “I don’t know”."
                )
          }
        >
          <Choices
            value={answers.repairChoice}
            onChange={(repairChoice) => patch({ repairChoice })}
            options={[
              { id: "unknown", label: s("Bilmirəm", "Не знаю", "I don’t know") },
              {
                id: "zero",
                label: human
                  ? s("0 ₼ — təmir qoymuram", "0 ₼ — ремонт не закладываю", "0 ₼ — I am not setting repair aside")
                  : "0 ₼",
              },
              { id: "amount", label: s("Məbləğ yazın", "Введите сумму", "Enter an amount") },
            ]}
          />
          {answers.repairChoice === "amount" ? (
            <Amount
              locale={locale}
              value={answers.repairAmount}
              onChange={(repairAmount) => patch({ repairAmount })}
            />
          ) : null}
        </Question>
      )}

      {kind === "auto" ? (
        <Question
          title={
            human
              ? s(
                  "Alışdan sonra problem çıxsa, ehtiyat saxlamaq istəyirsiniz?",
                  "Хотите оставить запас, если после покупки обнаружится проблема?",
                  "Do you want a reserve in case a problem shows up after the purchase?"
                )
              : s(
                  "Gizli problemlər üçün ehtiyat saxlamaq istəyirsiniz?",
                  "Хотите оставить запас на скрытые проблемы?",
                  "Do you want a reserve for hidden problems?"
                )
          }
          hint={s(
            "Məsələn mühərrik, qutu, gediş hissəsi və ya kartda olmayan başqa nasazlıq. Bu sizin ehtiyatınızdır, Emlak Hub-ın təmir qiyməti deyil.",
            "Например двигатель, коробка, ходовая или другие неисправности, которых нет в карточке. Это ваш запас, а не оценка ремонта от Emlak Hub.",
            "For example the engine, gearbox, suspension, or other faults that are not in the card. This is your reserve, not a repair estimate from Emlak Hub."
          )}
        >
          <Choices
            value={answers.reserveChoice}
            onChange={(reserveChoice) => patch({ reserveChoice })}
            options={[
              { id: "unknown", label: s("Bilmirəm", "Не знаю", "I don’t know") },
              { id: "none", label: human ? s("Ehtiyatsız", "Без запаса", "No reserve") : s("Xeyr", "Нет", "No") },
              { id: "1000", label: "1 000 ₼" },
              { id: "2000", label: "2 000 ₼" },
              { id: "amount", label: s("Öz məbləğim", "Своя сумма", "My own amount") },
            ]}
          />
          {answers.reserveChoice === "amount" ? (
            <Amount
              locale={locale}
              value={answers.reserveAmount}
              onChange={(reserveAmount) => patch({ reserveAmount })}
            />
          ) : null}
        </Question>
      ) : null}

      {kind === "estate" ? (
        <>
          <MoneyQuestion
            locale={locale}
            title={s("Rəsmiləşdirmə nə qədərdir?", "Сколько заложите на оформление?", "How much for paperwork?")}
            hint={s(
              "Notarius, çıxarış və sənədlər. Bilmirsinizsə, «Bilmirəm» seçin.",
              "Нотариус, выписка и документы. Если суммы нет, выберите «Не знаю».",
              "Notary, extract and documents. If you have no amount, choose “I don’t know”."
            )}
            choice={answers.paperworkChoice}
            amount={answers.paperworkAmount}
            onChoice={(paperworkChoice) => patch({ paperworkChoice })}
            onAmount={(paperworkAmount) => patch({ paperworkAmount })}
          />
          <MoneyQuestion
            locale={locale}
            title={s("Komissiya varmı?", "Есть комиссия?", "Is there a commission?")}
            hint={s(
              "Agent və ya vasitəçi haqqı. Yoxdursa, «0 ₼» seçin. Bilmirsinizsə, sıfır yazmırıq.",
              "Оплата агенту или посреднику. Если её нет, выберите 0 ₼. Если не знаете, ноль не подставляем.",
              "A fee for an agent or intermediary. Choose 0 ₼ if there is none. If you do not know, we do not put in zero."
            )}
            choice={answers.commissionChoice}
            amount={answers.commissionAmount}
            onChoice={(commissionChoice) => patch({ commissionChoice })}
            onAmount={(commissionAmount) => patch({ commissionAmount })}
          />
        </>
      ) : null}

      {kind === "land" ? (
        <MoneyQuestion
          locale={locale}
          title={s("Rəsmiləşdirmə nə qədərdir?", "Сколько заложите на оформление?", "How much for paperwork?")}
          choice={answers.paperworkChoice}
          amount={answers.paperworkAmount}
          onChoice={(paperworkChoice) => patch({ paperworkChoice })}
          onAmount={(paperworkAmount) => patch({ paperworkAmount })}
        />
      ) : null}

      <Question
        title={
          human
            ? s(
                "Evakuator, çatdırılma, saxlama və ya rəsmiləşdirmə xərci olacaq?",
                "Будут расходы на эвакуатор, доставку, хранение или оформление?",
                "Will there be costs for a tow truck, delivery, storage, or paperwork?"
              )
            : kind === "auto"
              ? s(
                  "Başqa xərclər var? Çatdırılma, evakuator, saxlama.",
                  "Есть ещё расходы? Доставка, эвакуатор, хранение.",
                  "Any other costs? Delivery, tow, storage."
                )
              : s("Başqa xərclər var?", "Есть ещё расходы?", "Any other costs?")
        }
        hint={s(
          "Evakuator, çatdırılma, saxlama və rəsmiləşdirmə buraya daxildir. Bilmirsinizsə, sıfır yazmırıq.",
          "Сюда входят эвакуатор, доставка, хранение и оформление. Если не знаете, ноль не подставляем.",
          "This covers a tow, delivery, storage and paperwork. If you do not know, we do not put in zero."
        )}
      >
        <Choices
          value={answers.extraChoice}
          onChange={(extraChoice) => patch({ extraChoice })}
          options={[
            { id: "unknown", label: s("Bilmirəm", "Не знаю", "I don’t know") },
            { id: "none", label: s("Xeyr", "Нет", "No") },
            { id: "amount", label: human ? s("Məbləğ əlavə et", "Добавить сумму", "Add an amount") : s("Əlavə et", "Добавить", "Add") },
          ]}
        />
        {answers.extraChoice === "amount" ? (
          <Amount
            locale={locale}
            value={answers.extraAmount}
            onChange={(extraAmount) => patch({ extraAmount })}
          />
        ) : null}
      </Question>

      <Question
        title={
          human
            ? s("Sövdələşmənin hansı nəticəsi sizə uyğundur?", "Какой результат сделки вас устроит?", "What result of the deal would suit you?")
            : s("Nə qədər qazanmaq istəyirsiniz?", "Сколько хотите заработать?", "How much do you want to earn?")
        }
        hint={
          human
            ? s(
                "Bu, maksimum alış qiymətini hesablayır. Qazancın zəmanəti deyil. 20% qoyulan pula görədir.",
                "Это влияет на максимальную цену покупки и не является гарантированным доходом. 20% считается от вложенных денег.",
                "This sets the maximum purchase price. It is not a guaranteed income. 20% is a return on the money you put in."
              )
            : s(
                "20% qoyulan pula görədir, satış qiymətinin faizi deyil.",
                "20% считается от вложенных денег, не от цены продажи.",
                "20% is a return on the money you put in, not a share of the sale price."
              )
        }
      >
        <Choices
          value={answers.desiredChoice}
          onChange={(desiredChoice) => patch({ desiredChoice })}
          options={[
            { id: "unknown", label: s("Hələ bilmirəm", "Пока не решил", "Not decided yet") },
            { id: "3000", label: "3 000 ₼" },
            { id: "pct20", label: s("20% gəlir", "20% доходность", "20% return") },
            { id: "amount", label: s("Öz məbləğim", "Своя сумма", "My own amount") },
            { id: "pct", label: s("Öz faizi", "Свой процент", "My own percent") },
          ]}
        />
        {answers.desiredChoice === "amount" ? (
          <Amount
            locale={locale}
            value={answers.desiredAmount}
            onChange={(desiredAmount) => patch({ desiredAmount })}
          />
        ) : null}
        {answers.desiredChoice === "pct" ? (
          <Amount
            locale={locale}
            suffix="%"
            value={answers.desiredPct}
            onChange={(desiredPct) => patch({ desiredPct })}
          />
        ) : null}
      </Question>

      {mode === "pro" ? (
        <div className="border-t border-white/[0.06] pt-4">
          <label className="flex items-start gap-2 text-[12px] text-[#cbd5e1]">
            <input
              type="checkbox"
              checked={answers.sellOn}
              onChange={(e) =>
                patch({ sellTouched: true, sellOn: e.target.checked })
              }
              className="mt-0.5"
            />
            <span>
              {s(
                "Sonrakı satış xərcini nəzərə al",
                "Учитывать расходы на последующую продажу",
                "Include the cost of a later resale"
              )}
            </span>
          </label>
          {answers.sellOn ? (
            <Amount
              locale={locale}
              suffix="%"
              value={answers.sellPct}
              onChange={(sellPct) => patch({ sellTouched: true, sellPct })}
            />
          ) : null}
          <p className="mt-2 text-[11px] leading-relaxed text-[#64748b]">
            {answers.sellOn && !answers.sellTouched
              ? s(
                  "Standart 3% Emlak Hub fərziyyəsidir. Dəyişə və ya söndürə bilərsiniz.",
                  "Стандартные 3% — допущение Emlak Hub. Процент можно изменить или отключить.",
                  "The standard 3% is an Emlak Hub assumption. You can change or turn it off."
                )
              : s("Bu ayarı siz dəyişmisiniz.", "Эту настройку изменили вы.", "You changed this setting.")}
          </p>
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-[#64748b]">
          {s(
            "Hesaba satışın standart 3%-i də daxildir. Bu fərziyyədir, fakt deyil. Peşəkar rejimdə onu dəyişmək olar.",
            "В расчёт также входят стандартные 3% на будущую продажу. Это допущение, не факт из карточки. В профессиональном режиме его можно изменить или выключить.",
            "The calculation also includes a standard 3% for a later sale. That is an assumption, not a fact from the card. In professional mode you can change or turn it off."
          )}
        </p>
      )}
    </div>
  );
}

function amountOptions(locale) {
  return [
    { id: "unknown", label: say(locale, "Bilmirəm", "Не знаю", "I don’t know") },
    { id: "zero", label: "0 ₼" },
    { id: "amount", label: say(locale, "Məbləğ yazın", "Введите сумму", "Enter an amount") },
  ];
}

function MoneyQuestion({ locale, title, hint, choice, amount, onChoice, onAmount }) {
  return (
    <Question title={title} hint={hint}>
      <Choices value={choice} onChange={onChoice} options={amountOptions(locale)} />
      {choice === "amount" ? <Amount locale={locale} value={amount} onChange={onAmount} /> : null}
    </Question>
  );
}

function Question({ title, hint, children }) {
  return (
    <section>
      <h3 className="text-[15px] font-medium leading-snug text-white">{title}</h3>
      {hint ? <p className="mt-1 text-[12px] leading-relaxed text-[#94a3b8]">{hint}</p> : null}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function Choices({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={value === option.id ? CHOICE_ON : CHOICE}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function Amount({ locale = "ru", value, onChange, suffix = "₼" }) {
  return (
    <label className="mt-3 flex max-w-xs items-center gap-2 border-b border-white/15 py-1.5">
      <span className="sr-only">{say(locale, "Məbləğ", "Сумма", "Amount")}</span>
      <input
        type="number"
        min="0"
        step="1"
        inputMode="decimal"
        value={value}
        placeholder={say(locale, "məbləğ", "сумма", "amount")}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent font-mono text-[15px] text-white outline-none placeholder:text-[#475569]"
      />
      <span className="font-mono text-[12px] text-[#64748b]">{suffix}</span>
    </label>
  );
}
