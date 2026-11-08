"use client";

import { useState } from "react";
import Image from "next/image";
import { say } from "@/lib/i18n/copy";

const FEE_RATE = 0.01;

function formatManat(amount) {
  const n = Math.round(Number(amount));
  const sign = n < 0 ? "−" : "";
  const body = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}${body} ₼`;
}

function formatRatio(ratio) {
  const tenths = Math.round(ratio * 1000) / 10;
  return `${String(tenths).replace(".", ",")} %`;
}

function limitFor(sale, preparation, desired) {
  const room = sale - preparation - desired;
  if (room <= 0) return null;
  const bid = Math.floor(room / (1 + FEE_RATE) + 1e-6);
  return bid > 0 ? bid : null;
}

function evaluate(asset, desired) {
  const fee = Math.round(asset.purchase * FEE_RATE);
  const invested = asset.purchase + fee + asset.preparation;
  const profit = asset.sale - invested;
  return {
    fee,
    invested,
    profit,
    roi: profit / invested,
    maxBid: limitFor(asset.sale, asset.preparation, desired),
    breakEven: limitFor(asset.sale, asset.preparation, 0),
  };
}

function scenes(s) {
  return [
    {
      id: "residence",
      label: s("Mənzil", "Жильё", "Home"),
      title: s("Mənzil, 78 m²", "Квартира, 78 м²", "Apartment, 78 m²"),
      image: "/landing/dossier/residence.jpg",
      alt: s(
        "Nümunə: axşam Bakı bulvarına və Alov qüllələrinə baxan qonaq otağı",
        "Пример: гостиная с видом на вечерний Бакинский бульвар и Flame Towers",
        "Example: a living room looking onto the Baku boulevard and the Flame Towers at dusk"
      ),
      purchase: 145000,
      preparation: 22000,
      preparationLabel: s("Təmir və hazırlıq", "Ремонт и подготовка", "Repair and preparation"),
      sale: 192000,
      targets: [8000, 14000, 22000],
    },
    {
      id: "land",
      label: s("Torpaq", "Земля", "Land"),
      title: s("Sahə, 8 sot", "Участок, 8 соток", "Plot, 8 sot"),
      image: "/landing/dossier/land.jpg",
      alt: s(
        "Nümunə: Xəzər və Bakı işıqları fonunda işarələnmiş sahə",
        "Пример: размеченный участок на фоне Каспия и огней Баку",
        "Example: a marked plot with the Caspian and the lights of Baku behind it"
      ),
      purchase: 42000,
      preparation: 5500,
      preparationLabel: s("Sərhəd və hazırlıq", "Межевание и подготовка", "Survey and preparation"),
      sale: 56000,
      targets: [2500, 5000, 8000],
    },
    {
      id: "commerce",
      label: s("Kommersiya", "Коммерция", "Commercial"),
      title: s("Sahə, 64 m²", "Помещение, 64 м²", "Premises, 64 m²"),
      image: "/landing/dossier/commerce.jpg",
      alt: s(
        "Nümunə: axşam bulvara açılan boş zal",
        "Пример: пустой зал с окнами на вечерний бульвар",
        "Example: an empty hall opening onto the boulevard at dusk"
      ),
      purchase: 110000,
      preparation: 16000,
      preparationLabel: s("Təmir və hazırlıq", "Ремонт и подготовка", "Repair and preparation"),
      sale: 145000,
      targets: [6000, 12000, 18000],
    },
    {
      id: "vehicle",
      label: s("Avtomobil", "Автомобиль", "Vehicle"),
      title: "G-Class",
      image: "/landing/dossier/vehicle.jpg",
      alt: s(
        "Nümunə: axşam Bakı bulvarında qara G-Class",
        "Пример: чёрный G-Class на вечернем Бакинском бульваре",
        "Example: a black G-Class on the Baku boulevard at dusk"
      ),
      purchase: 64000,
      preparation: 8400,
      preparationLabel: s("Təmir və rəsmiləşdirmə", "Ремонт и оформление", "Repair and paperwork"),
      sale: 82000,
      targets: [3000, 6000, 9000],
    },
    {
      id: "equipment",
      label: s("Texnika", "Техника", "Equipment"),
      title: s("Ekskavator", "Экскаватор", "Excavator"),
      image: "/landing/dossier/equipment.jpg",
      alt: s(
        "Nümunə: Bakı işıqları fonunda ekskavator",
        "Пример: экскаватор на фоне вечернего Баку",
        "Example: an excavator with evening Baku behind it"
      ),
      purchase: 54000,
      preparation: 7500,
      preparationLabel: s("Çatdırılma və təmir", "Доставка и ремонт", "Delivery and repair"),
      sale: 72000,
      targets: [3000, 6000, 9000],
    },
  ];
}

function Tag({ kind, children }) {
  const tone =
    kind === "user"
      ? "bg-[#c4b39a]/15 text-[#e3d5bd]"
      : kind === "none"
        ? "text-[#f4f1ea]/60 shadow-[inset_0_0_0_1px_rgba(244,241,234,0.22)]"
        : "bg-white/8 text-[#f4f1ea]/80";
  return (
    <em className={["inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] not-italic", tone].join(" ")}>
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          kind === "none" ? "shadow-[inset_0_0_0_1px_currentColor]" : "bg-current",
        ].join(" ")}
        aria-hidden
      />
      {children}
    </em>
  );
}

export default function ExampleShowcase({ locale = "ru" }) {
  const s = (az, ru, en) => say(locale, az, ru, en);
  const items = scenes(s);
  const [assetIndex, setAssetIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(1);
  const asset = items[assetIndex];
  const target = asset.targets[targetIndex] ?? asset.targets[1];
  const result = evaluate(asset, target);
  const reachable = result.maxBid != null && result.maxBid >= asset.purchase;
  const feeLabel = s("Təşkilatçı yığımı, qiymətin 1 %-i", "Сбор организатора, 1 % от цены", "Organiser fee, 1% of the price");

  function choose(index) {
    setAssetIndex(index);
    setTargetIndex(1);
  }

  function onTabKey(event) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = (assetIndex + direction + items.length) % items.length;
    choose(next);
    event.currentTarget.parentElement?.children[next]?.focus();
  }

  return (
    <section id="example" className="bg-[#070b10] pb-2 pt-2 text-[#f4f1ea]">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]" role="tablist" aria-label={s("Nümunədəki əmlak", "Вид имущества в примере", "Asset in the example")}>
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={index === assetIndex}
              tabIndex={index === assetIndex ? 0 : -1}
              onClick={() => choose(index)}
              onKeyDown={onTabKey}
              className={[
                "shrink-0 rounded-full px-4 py-2 text-[13px] transition duration-300 ease-out hover:-translate-y-px",
                index === assetIndex ? "bg-[#f3efe6] text-[#161410]" : "bg-white/8 text-[#f4f1ea]/80 hover:bg-white/12",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#10161e] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
          <figure className="relative min-h-[340px] sm:min-h-[420px] lg:min-h-full">
            {items.map((item, index) => (
              <Image
                key={item.id}
                src={item.image}
                alt={index === assetIndex ? item.alt : ""}
                fill
                sizes="(min-width: 1024px) 46vw, 100vw"
                priority={index === 0}
                quality={92}
                unoptimized
                className={[
                  "object-cover transition-opacity duration-500",
                  index === assetIndex ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            ))}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />
            <figcaption className="absolute bottom-5 left-5 right-5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                {s("Hesablama nümunəsi", "Пример расчёта", "Sample calculation")}
              </span>
              <strong className="mt-1 block font-serif text-[28px] font-medium leading-none tracking-[-0.03em] text-white sm:text-[34px]">
                {asset.title}
              </strong>
            </figcaption>
          </figure>

          <div className="flex flex-col px-5 py-6 sm:px-7 sm:py-7">
            <dl>
              <Line label={s("Başlanğıc qiymət", "Стартовая цена", "Opening price")} value={formatManat(asset.purchase)} />
              <Line label={feeLabel} value={formatManat(result.fee)} />
              <Line label={asset.preparationLabel} value={formatManat(asset.preparation)} tag={s("Sizin qiymət", "Ваша оценка", "Your figure")} kind="user" />
              <Line label={s("Başlanğıc qiymətlə alışa qoyulan vəsait", "Вложения при покупке по старту", "Money in if bought at the opening price")} value={formatManat(result.invested)} total />
              <Line label={s("Gözlənilən satış qiyməti", "Предполагаемая цена продажи", "Expected sale price")} value={formatManat(asset.sale)} tag={s("Sizin qiymət", "Ваша оценка", "Your figure")} kind="user" />
            </dl>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {s("Başlanğıc qiymətlə alışda hesablanmış mənfəət", "Расчётная прибыль при покупке по стартовой цене", "Calculated profit if bought at the opening price")}
              </p>
              <strong className="mt-1 block font-serif text-[40px] font-medium leading-none tracking-[-0.03em] text-[#f3e6cc] sm:text-[46px]">
                {formatManat(result.profit)}
              </strong>
              <span className="mt-2 block text-[14px] text-white/70">
                ROI {formatRatio(result.roi)} {s("qoyuluşdan", "от вложений", "of the money in")}
              </span>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <fieldset>
                <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c5d0db]">
                  {s("Mənfəət məqsədi", "Цель по прибыли", "Profit target")}
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asset.targets.map((value, index) => (
                    <label
                      key={value}
                      className={[
                        "relative cursor-pointer rounded-full px-4 py-2 text-[14px] tabular-nums transition duration-300",
                        index === targetIndex
                          ? "bg-[#f3efe6] text-[#161410] shadow-[0_10px_24px_-16px_rgba(243,239,230,0.8)]"
                          : "text-[#f4f1ea] shadow-[inset_0_0_0_1px_rgba(243,239,230,0.28)] hover:-translate-y-px hover:shadow-[inset_0_0_0_1px_rgba(243,239,230,0.6)]",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name={`example-target-${asset.id}`}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        checked={index === targetIndex}
                        onChange={() => setTargetIndex(index)}
                      />
                      {formatManat(value)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 rounded-2xl border border-[#e3d5bd]/30 bg-[#0c1016] px-5 py-4" aria-live="polite">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c4b39a]">
                  {s("Hədd stavka", "Предельная ставка", "Highest bid")}
                </p>
                <strong className="mt-2 block font-serif text-[40px] font-medium leading-none tracking-[-0.03em] text-[#f7f4ee] sm:text-[46px]">
                  {result.maxBid == null ? s("alınmır", "не достигается", "out of reach") : formatManat(result.maxBid)}
                </strong>
                <p className="mt-2 text-[13px] text-[#c5d0db]">
                  {reachable
                    ? result.breakEven == null
                      ? s(`Məqsəd ${formatManat(target)}`, `Цель ${formatManat(target)}`, `Target ${formatManat(target)}`)
                      : s(
                          `Sıfır mənfəət ${formatManat(result.breakEven)}`,
                          `Безубыточность ${formatManat(result.breakEven)}`,
                          `Break-even ${formatManat(result.breakEven)}`
                        )
                    : s(
                        `Məqsəd ${formatManat(target)} alınmır`,
                        `Цель ${formatManat(target)} недостижима`,
                        `Target ${formatManat(target)} is out of reach`
                      )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Line({ label, value, tag, kind = "demo", total = false }) {
  return (
    <div className={["grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 border-t py-2.5", total ? "border-white/30" : "border-white/12"].join(" ")}>
      <dt className={total ? "font-semibold text-white" : "text-[14px] text-white/90"}>{label}</dt>
      <dd className={["text-right text-[14px] tabular-nums", total ? "font-semibold text-white" : "text-white/90"].join(" ")}>{value}</dd>
      {tag ? (
        <div className="col-span-2 mt-1 sm:col-span-1 sm:col-start-1">
          <Tag kind={kind}>{tag}</Tag>
        </div>
      ) : null}
    </div>
  );
}
