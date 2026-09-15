/**
 * =============================================================================
 * DEMO LOTS — имитация спарсенных лотов (интерфейс до реального парсера)
 * =============================================================================
 * Поля как у продакшн-карты: реестр, тип, скоринг, цены, Vision-дефекты, NLP,
 * гео (карта), город/район.
 * =============================================================================
 */

export const DEMO_LOTS = [
  {
    id: "AUTO-911",
    registryNo: "EH-24-0911",
    market: "auto",
    typeAz: "Avtomobil",
    typeRu: "Автомобиль",
    titleAz: "Porsche 911 Carrera · dövlət lotu",
    titleRu: "Porsche 911 Carrera · гос. лот",
    photo: "/landing/porsche-black-mountains.jpg",
    marketPrice: 72400,
    startPrice: 59800,
    repairCost: 8400,
    fees: 2100,
    expectedMarginPct: 18.4,
    score: 72,
    opportunityScore: 68,
    expectedProfit: 13300,
    defects: [
      { id: "bumper", x: 48, y: 58, w: 26, h: 18, label: "Бампер", cost: 2800 },
      { id: "fender", x: 14, y: 38, w: 36, h: 28, label: "Крыло", cost: 2500 },
      { id: "intake", x: 6, y: 52, w: 16, h: 20, label: "Воздухозаборник", cost: 3100 },
    ],
    legalRisks: [
      { level: "med", textAz: "Reyestrdə yüklənmə — təhvilə qədər götürülməlidir.", textRu: "Обременение по реестру — снять до передачи." },
      { level: "low", textAz: "VIN protokolla üst-üstə düşür.", textRu: "VIN совпадает с протоколом аукциона." },
      { level: "high", textAz: "KASKO mübahisəsi — təşkilatçıdan dəqiqləşdirin.", textRu: "Спор по КАСКО — уточнить у организатора." },
    ],
    aiSummaryAz: "Bazar qiyməti start qiymətindən yüksəkdir. Kuzov riskləri məhduddur.",
    aiSummaryRu: "Рыночная цена выше стартовой. Кузовные риски ограничены.",
    redFlags: false,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Nəsimi",
    districtRu: "Насими",
    lat: 40.385,
    lng: 49.835,
  },
  {
    id: "AUTO-GLS",
    registryNo: "EH-24-5801",
    market: "auto",
    typeAz: "Avtomobil",
    typeRu: "Автомобиль",
    titleAz: "Mercedes-Benz GLS 580 4MATIC",
    titleRu: "Mercedes-Benz GLS 580 4MATIC",
    photo:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 240125,
    startPrice: 212500,
    repairCost: 0,
    fees: 6375,
    expectedMarginPct: 11.5,
    score: 64,
    opportunityScore: 13,
    expectedProfit: 27625,
    defects: [],
    legalRisks: [
      { level: "low", textAz: "Sənədlər komplektdir.", textRu: "Документы комплекта полные." },
    ],
    aiSummaryAz: "Analoji lotlarla müqayisədə start qiyməti əlverişlidir. Qırmızı bayraq yoxdur.",
    aiSummaryRu: "Стартовая цена выгодна относительно аналогов. Красных флагов нет.",
    redFlags: false,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Xətai",
    districtRu: "Хатаи",
    lat: 40.378,
    lng: 49.872,
  },
  {
    id: "AUTO-320",
    registryNo: "EH-24-0320",
    market: "auto",
    typeAz: "Avtomobil",
    typeRu: "Автомобиль",
    titleAz: "Mercedes-Benz E 220d",
    titleRu: "Mercedes-Benz E 220d",
    photo:
      "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 41200,
    startPrice: 34800,
    repairCost: 5600,
    fees: 1400,
    expectedMarginPct: 12.1,
    score: 58,
    opportunityScore: 41,
    expectedProfit: 4980,
    defects: [
      { id: "door", x: 40, y: 40, w: 18, h: 22, label: "Дверь", cost: 2400 },
      { id: "hood", x: 20, y: 35, w: 28, h: 16, label: "Капот", cost: 3200 },
    ],
    legalRisks: [
      { level: "med", textAz: "Yürüş servis tarixçəsi ilə ~8 min km fərqlənir.", textRu: "Пробег расходится с сервисом ~на 8 тыс. км." },
    ],
    aiSummaryAz: "Təmir ehtiyatı marjanı azaldır — stavkanı ehtiyatla seçin.",
    aiSummaryRu: "Резерв на ремонт снижает маржу — ставку выбирайте осторожно.",
    redFlags: false,
    cityAz: "Sumqayıt",
    cityRu: "Сумгаит",
    districtAz: "Mərkəz",
    districtRu: "Центр",
    lat: 40.589,
    lng: 49.669,
  },
  {
    id: "AUTO-RR",
    registryNo: "EH-24-4410",
    market: "auto",
    typeAz: "Avtomobil",
    typeRu: "Автомобиль",
    titleAz: "Land Rover Range Rover Sport",
    titleRu: "Land Rover Range Rover Sport",
    photo:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 98000,
    startPrice: 82000,
    repairCost: 11200,
    fees: 2900,
    expectedMarginPct: 9.8,
    score: 51,
    opportunityScore: 29,
    expectedProfit: 9600,
    defects: [
      { id: "side", x: 35, y: 45, w: 30, h: 20, label: "Бок", cost: 6200 },
      { id: "rim", x: 70, y: 70, w: 14, h: 14, label: "Диск", cost: 5000 },
    ],
    legalRisks: [
      { level: "high", textAz: "Import gömrük qeydi natamamdır.", textRu: "Таможенная запись по импорту неполная." },
    ],
    aiSummaryAz: "Hüquqi risk yüksəkdir — ekspert yoxlaması tövsiyə olunur.",
    aiSummaryRu: "Юридический риск высокий — рекомендуется экспертная проверка.",
    redFlags: true,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Binəqədi",
    districtRu: "Бинагади",
    lat: 40.432,
    lng: 49.812,
  },
  {
    id: "EST-NAR-3",
    registryNo: "EH-24-NAR3",
    market: "estate",
    typeAz: "Mənzil",
    typeRu: "Квартира",
    titleAz: "3-otaqlı · Nərimanov",
    titleRu: "3-комн. · Нариманов",
    photo:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 142000,
    startPrice: 118000,
    repairCost: 18500,
    fees: 4200,
    expectedMarginPct: 14.8,
    score: 66,
    opportunityScore: 55,
    expectedProfit: 21000,
    defects: [
      { id: "floor", x: 18, y: 68, w: 28, h: 14, label: "Пол", cost: 6200 },
      { id: "window", x: 58, y: 22, w: 22, h: 28, label: "Окна", cost: 7100 },
      { id: "wall", x: 8, y: 30, w: 16, h: 22, label: "Стены", cost: 5200 },
    ],
    legalRisks: [
      { level: "high", textAz: "Yetkinlik yaşına çatmayan pay — qəyyumluq lazımdır.", textRu: "Доля несовершеннолетнего — нужна опека." },
      { level: "med", textAz: "Kadastr: lojiya sərhədlərini dəqiqləşdirin.", textRu: "Кадастр: уточнить границы лоджии." },
    ],
    aiSummaryAz: "Lokasiya güclüdür; hüquqi yüklər marjanı sıxır.",
    aiSummaryRu: "Локация сильная; юридические обременения сжимают маржу.",
    redFlags: true,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Nərimanov",
    districtRu: "Нариманов",
    lat: 40.402,
    lng: 49.868,
  },
  {
    id: "EST-YAS-2",
    registryNo: "EH-24-YAS2",
    market: "estate",
    typeAz: "Mənzil",
    typeRu: "Квартира",
    titleAz: "2-otaqlı · Yasamal",
    titleRu: "2-комн. · Ясамал",
    photo:
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 98000,
    startPrice: 86000,
    repairCost: 9200,
    fees: 3100,
    expectedMarginPct: 9.2,
    score: 48,
    opportunityScore: 33,
    expectedProfit: 9000,
    defects: [
      { id: "kitchen", x: 30, y: 40, w: 30, h: 25, label: "Кухня", cost: 5200 },
      { id: "bath", x: 70, y: 50, w: 18, h: 20, label: "Санузел", cost: 4000 },
    ],
    legalRisks: [
      { level: "low", textAz: "Reyestr təmizdir.", textRu: "Реестр чистый." },
    ],
    aiSummaryAz: "Stabil giriş səviyyəsi; marja orta.",
    aiSummaryRu: "Стабильный входной уровень; маржа средняя.",
    redFlags: false,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Yasamal",
    districtRu: "Ясамал",
    lat: 40.389,
    lng: 49.808,
  },
  {
    id: "EST-HOUSE-1",
    registryNo: "EH-24-HV12",
    market: "estate",
    typeAz: "Fərdi yaşayış evi",
    typeRu: "Частный дом",
    titleAz: "Fərdi ev · Xəzər",
    titleRu: "Частный дом · Хазар",
    photo:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 285000,
    startPrice: 240000,
    repairCost: 32000,
    fees: 8500,
    expectedMarginPct: 15.2,
    score: 71,
    opportunityScore: 62,
    expectedProfit: 43200,
    defects: [
      { id: "roof", x: 20, y: 15, w: 50, h: 20, label: "Кровля", cost: 18000 },
      { id: "facade", x: 10, y: 40, w: 40, h: 30, label: "Фасад", cost: 14000 },
    ],
    legalRisks: [
      { level: "med", textAz: "Torpaq sənədi yenilənməlidir.", textRu: "Документ на землю требует обновления." },
    ],
    aiSummaryAz: "Yüksək potensial; təmir büdcəsini rezervə alın.",
    aiSummaryRu: "Высокий потенциал; заложите бюджет на ремонт.",
    redFlags: false,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Xəzər",
    districtRu: "Хазар",
    lat: 40.372,
    lng: 50.005,
  },
  {
    id: "EST-OFF-1",
    registryNo: "EH-24-OF08",
    market: "estate",
    typeAz: "Ofis",
    typeRu: "Офис",
    titleAz: "Ofis sahəsi · 28 May",
    titleRu: "Офис · 28 Мая",
    photo:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1600&auto=format&fit=crop",
    marketPrice: 175000,
    startPrice: 152000,
    repairCost: 14000,
    fees: 5100,
    expectedMarginPct: 10.4,
    score: 54,
    opportunityScore: 38,
    expectedProfit: 18200,
    defects: [
      { id: "hvac", x: 50, y: 20, w: 25, h: 20, label: "HVAC", cost: 9000 },
      { id: "floor", x: 20, y: 70, w: 40, h: 15, label: "Пол", cost: 5000 },
    ],
    legalRisks: [
      { level: "low", textAz: "İcarə tarixçəsi şəffafdır.", textRu: "История аренды прозрачна." },
    ],
    aiSummaryAz: "Kommersiya axını yaxşıdır; likvidlik orta.",
    aiSummaryRu: "Коммерческий поток хороший; ликвидность средняя.",
    redFlags: false,
    cityAz: "Bakı",
    cityRu: "Баку",
    districtAz: "Nəsimi",
    districtRu: "Насими",
    lat: 40.380,
    lng: 49.848,
  },
];

/** Удобные геттеры под язык UI */
export function lotTitle(lot, locale) {
  return locale === "az" ? lot.titleAz : lot.titleRu;
}

export function lotType(lot, locale) {
  return locale === "az" ? lot.typeAz : lot.typeRu;
}

export function lotAiSummary(lot, locale) {
  return locale === "az" ? lot.aiSummaryAz : lot.aiSummaryRu;
}

export function lotCity(lot, locale) {
  return locale === "az" ? lot.cityAz : lot.cityRu;
}

export function lotDistrict(lot, locale) {
  return locale === "az" ? lot.districtAz : lot.districtRu;
}

export function getLotById(id) {
  return DEMO_LOTS.find((l) => l.id === id) || null;
}
