/**
 * =============================================================================
 * Hərrac (Азербайджан) — знания для продукта: риски, законы, чеклисты
 * =============================================================================
 * Справочник для UI (LegalRisks, HerracNextSteps, how-it-works).
 * НЕ юридическая консультация — ориентиры для инвестора до ставки.
 *
 * Официальные источники:
 *   https://herrac.gov.az — гос. электронные аукционы (авто, недвижимость, …)
 *   https://eherrac.com   — электронные торги по исполнительным производствам
 * =============================================================================
 */

export const HERRAC_SOURCES = {
  gov: "https://herrac.gov.az",
  eHerrac: "https://eherrac.com",
};

/** Категории активов, которые реально встречаются на AZ-аукционах */
export const HERRAC_ASSET_CLASSES = [
  "auto",
  "estate",
  "land",
  "commercial",
  "equipment",
  "other",
];

/**
 * Типовые риски до / после ставки (уровень: low | med | high)
 * textAz / textRu — для карточки лота и гайдов
 */
export const HERRAC_RISK_CATALOG = [
  {
    id: "encumbrance",
    level: "high",
    markets: ["estate", "land", "commercial"],
    textAz:
      "Reyestrdə ipoteka, həbs və ya digər yüklənmə ola bilər — təhvilə qədər yoxlayın.",
    textRu:
      "В реестре могут быть ипотека, арест или иное обременение — проверить до передачи.",
    textEn:
      "The registry may show a mortgage, arrest or other encumbrance — check it before handover.",
  },
  {
    id: "cadastre",
    level: "high",
    markets: ["land", "estate", "commercial"],
    textAz:
      "Kadastr sərhədləri və sahə elanla üst-üstə düşməyə bilər — plan/sənəd tələb edin.",
    textRu:
      "Кадастровые границы и площадь могут не совпадать с объявлением — запросите план.",
    textEn:
      "Cadastre boundaries and area may not match the listing — ask for the plan.",
  },
  {
    id: "land_purpose",
    level: "high",
    markets: ["land"],
    textAz:
      "Torpağın təyinatı (kənd təsərrüfatı / tikinti / digər) istifadəni məhdudlaşdırır.",
    textRu:
      "Назначение земли (с/х, строительство и т.д.) ограничивает допустимое использование.",
    textEn:
      "The land purpose (farming, building and so on) limits what you may do with it.",
  },
  {
    id: "municipal_vs_private",
    level: "med",
    markets: ["land"],
    textAz:
      "Bələdiyyə / dövlət / özəl torpaq — alqı-satqı və qeydiyyat qaydaları fərqlidir.",
    textRu:
      "Муниципальная / государственная / частная земля — разные правила сделки и регистрации.",
    textEn:
      "Municipal, state and private land follow different sale and registration rules.",
  },
  {
    id: "enforcement_sale",
    level: "med",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    textAz:
      "İcra icraatı üzrə satış: müddətlər, depozit və ödəniş qaydaları «İcra haqqında» Qanuna bağlıdır.",
    textRu:
      "Продажа по исполнению: сроки, депозит и оплата связаны с Законом «Об исполнении».",
    textEn:
      "An enforcement sale: deadlines, deposit and payment follow the Execution Law.",
  },
  {
    id: "deposit_deadline",
    level: "high",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    textAz:
      "Qalib gəldikdən sonra ödəniş və rəsmiləşdirmə müddətlərinə riayət olunmasa, hüquq itirilə bilər.",
    textRu:
      "После победы срыв сроков оплаты/оформления может привести к потере прав на лот.",
    textEn:
      "After you win, missing the payment or paperwork deadline can cost you the lot.",
  },
  {
    id: "vin_docs",
    level: "med",
    markets: ["auto"],
    textAz: "VIN, reyestr və hərrac protokolu üst-üstə düşməlidir.",
    textRu: "VIN, реестр и протокол аукциона должны совпадать.",
    textEn: "The VIN, the registry and the auction protocol must match.",
  },
  {
    id: "third_party",
    level: "high",
    markets: ["estate", "land", "commercial"],
    textAz:
      "Üçüncü şəxslərin iddiaları (kirayə, vərəsəlik, mübahisə) qeydiyyatdan sonra da çıxa bilər.",
    textRu:
      "Иски третьих лиц (аренда, наследство, спор) могут всплыть и после регистрации.",
    textEn:
      "Third-party claims (lease, inheritance, a dispute) can appear even after registration.",
  },
  {
    id: "access_infra",
    level: "med",
    markets: ["land", "commercial"],
    textAz:
      "Yol, kommunikasiya, servitut — yoxlanılmasa, torpaq «kağız üzərində» qala bilər.",
    textRu:
      "Дорога, коммуникации, сервитут — без проверки участок может остаться «на бумаге».",
    textEn:
      "Road, utilities and easement — without a check the plot can stay “on paper”.",
  },
];

/** Нормативные ориентиры (для гайда; не полный текст закона) */
export const HERRAC_LEGAL_PILLARS = [
  {
    id: "execution",
    titleAz: "«İcra haqqında» Qanun",
    titleRu: "Закон «Об исполнении»",
    titleEn: "Execution Law",
    hintAz:
      "Borclunun əmlakının hərracda satılması, ixtisaslaşmış təşkilatlar, müddətlər.",
    hintRu:
      "Продажа имущества должника с торгов, специализированные организации, сроки.",
    hintEn:
      "Sale of a debtor’s property at auction, specialised organisations, deadlines.",
  },
  {
    id: "land_market",
    titleAz: "Torpaq bazarı haqqında Qanun",
    titleRu: "Закон «О земельном рынке»",
    titleEn: "Land Market Law",
    hintAz:
      "Torpaq alqı-satqısı, hərrac/konkurs, ipotekaya qoyulmuş torpaqların bazara çıxarılması.",
    hintRu:
      "Купля-продажа земли, аукцион/конкурс, вывод заложенных земель на рынок.",
    hintEn:
      "Land sale, auction or tender, and bringing mortgaged land to market.",
  },
  {
    id: "realty_registry",
    titleAz: "Daşınmaz əmlakın dövlət reyestri",
    titleRu: "Госреестр недвижимости",
    titleEn: "State real-estate registry",
    hintAz:
      "Hüquqların və məhdudiyyətlərin (yüklənmə, həbs, servitut) qeydiyyatı.",
    hintRu:
      "Регистрация прав и ограничений (обременение, арест, сервитут).",
    hintEn:
      "Registration of rights and limits (encumbrance, arrest, easement).",
  },
];

/** Чеклист до ставки */
export const HERRAC_PRE_BID_CHECKLIST = [
  {
    az: "Elanı herrac.gov.az / eherrac-da oxuyun: növ, qiymət, müddət, depozit.",
    ru: "Прочитайте лот на herrac.gov.az / eherrac: тип, цена, срок, депозит.",
    en: "Read the lot on herrac.gov.az / eherrac: type, price, deadline, deposit.",
  },
  {
    az: "Reyestr / kadastr: sahə, ünvan, yüklənmələr.",
    ru: "Реестр / кадастр: площадь, адрес, обременения.",
    en: "Registry / cadastre: area, address, encumbrances.",
  },
  {
    az: "Torpaqdırsa — təyinat və tikinti imkanı.",
    ru: "Если земля — назначение и возможность застройки.",
    en: "If it is land — purpose and whether you can build.",
  },
  {
    az: "Avtodursa — VIN, yürüş, servis tarixi (mümkünsə).",
    ru: "Если авто — VIN, пробег, сервисная история (если доступна).",
    en: "If it is a car — VIN, mileage, service history if you can get it.",
  },
  {
    az: "Ödəniş qrafiki və qalib olduqdan sonrakı addımlar.",
    ru: "График оплаты и шаги после победы.",
    en: "The payment schedule and the steps after you win.",
  },
];

/** Идеи фич продукта вокруг Hərrac */
export const HERRAC_PRODUCT_IDEAS = [
  {
    id: "parser",
    az: "herrac.gov.az elanlarının avtomatik sinxronu (avto, mənzil, torpaq, kommersiya).",
    ru: "Автосинхрон объявлений herrac.gov.az (авто, жильё, земля, коммерция).",
  },
  {
    id: "encumbrance_flag",
    az: "Reyestr yüklənmə flaqı + izah (ipoteka / həbs / servitut).",
    ru: "Флаг обременения из реестра + пояснение (ипотека / арест / сервитут).",
  },
  {
    id: "land_zoning",
    az: "Torpaq təyinatı və «tikilə bilər / olmaz» skoru.",
    ru: "Назначение земли и скор «можно строить / нельзя».",
  },
  {
    id: "deadline_alerts",
    az: "Depozit və ödəniş deadline alertləri.",
    ru: "Алерты по дедлайнам депозита и оплаты.",
  },
  {
    id: "compare_geo",
    az: "Eyni rayonda oxşar lotların xəritə müqayisəsi.",
    ru: "Сравнение похожих лотов на карте в одном районе.",
  },
];

/** Риски по типу рынка для карточки лота */
export function risksForMarket(marketId, locale = "ru") {
  return HERRAC_RISK_CATALOG.filter(
    (r) => !r.markets?.length || r.markets.includes(marketId)
  ).map((r) => ({
    id: r.id,
    level: r.level,
    text: locale === "az" ? r.textAz : locale === "en" ? r.textEn || r.textRu : r.textRu,
    textAz: r.textAz,
    textRu: r.textRu,
  }));
}

/**
 * Скрытые / малоизвестные правила портала — то, что инвесторы часто не знают
 */
export const HERRAC_HIDDEN_RULES = [
  {
    id: "inspect_window",
    level: "high",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Əmlaka baxış adətən satışdan 1 iş günü əvvəl — şəxsi kabinet və ya operator vasitəsilə. «İstədiyim vaxt gəlib baxaram» demək olmaz.",
    ru: "Осмотр имущества обычно за 1 рабочий день до продажи — через кабинет или оператора. «Приеду когда захочу» — нельзя.",
    en: "Inspection is usually one working day before the sale, through the cabinet or an operator. You cannot just arrive whenever you like.",
  },
  {
    id: "open_electronic",
    level: "med",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Hərrac açıq elektron formatdadır; istənilən vaxt (hərrac gedərkən) qoşula bilərsiniz — amma beh + iştirak haqqı ödənilməlidir.",
    ru: "Торги открытые электронные; подключаться можно пока идёт аукцион — но нужны депозит и сбор за участие.",
    en: "The auction is open and electronic. You can join while it is running, but you need the deposit and the participation fee.",
  },
  {
    id: "pay_7_days",
    level: "high",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Qalib 7 iş günü ərzində satış qiymətini ödəməlidir — gecikmə hüquq itkisinə aparır.",
    ru: "Победитель обязан оплатить цену за 7 рабочих дней — просрочка грозит потерей лота.",
    en: "The winner must pay the price within 7 working days. Missing that can cost the lot.",
  },
  {
    id: "bid_step",
    level: "med",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Təklif artımı: minimum ~1%, maksimum ~3% satış qiymətindən.",
    ru: "Шаг ставки: минимум ~1%, максимум ~3% от цены продажи.",
    en: "Bid step: about 1% minimum and about 3% maximum of the sale price.",
  },
  {
    id: "soft_close",
    level: "med",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Son dəqiqədə təklif gəlsə hərrac +5 dəqiqə uzanır — bu təkrarlanır.",
    ru: "Ставка в последнюю минуту продлевает торги на +5 минут — и так по кругу.",
    en: "A bid in the last minute extends the auction by 5 minutes, and that can repeat.",
  },
  {
    id: "duration_7d",
    level: "low",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Tipik müddət: 7 təqvim günü (lotda start/bitiş tarixinə baxın).",
    ru: "Типичная длительность: 7 календарных дней (смотрите даты на лоте).",
    en: "Typical length: 7 calendar days. Check the dates on the lot.",
  },
  {
    id: "keys_debtor",
    level: "high",
    markets: ["auto"],
    az: "Tez-tez açar və qeydiyyat şəhadətnaməsi borcludadır — avtomobili «açıb sürmək» mümkün olmaya bilər.",
    ru: "Часто ключи и техпаспорт у должника — машину «открыть и уехать» может быть нельзя.",
    en: "Keys and the registration certificate are often with the debtor. You may not be able to open the car and drive away.",
  },
  {
    id: "storage_compound",
    level: "med",
    markets: ["auto", "equipment"],
    az: "Cərimə dayanacağında saxlanma gündəlik ödənişlə gedir — tarixdən etibarən məbləğ artır.",
    ru: "На штрафстоянке идут суточные — сумма растёт с даты начала хранения.",
    en: "A compound charges daily storage. The amount grows from the start date.",
  },
  {
    id: "bank_guarantee",
    level: "low",
    markets: ["auto", "estate", "land", "commercial", "equipment", "other"],
    az: "Beh bəzən bank qarantiyası formasında da qəbul olunur — qaydalara baxın.",
    ru: "Депозит иногда принимают банковской гарантией — смотрите правила участника.",
    en: "The deposit is sometimes accepted as a bank guarantee. Read the participant rules.",
  },
  {
    id: "restricted_turnover",
    level: "high",
    markets: ["estate", "land", "commercial", "other"],
    az: "Dövriyyəsi məhdud əmlak üçün xüsusi qaydalar var — hər kəs ala bilməz.",
    ru: "Для имущества с ограниченным оборотом действуют особые правила — купить может не каждый.",
    en: "Property with restricted turnover has special rules. Not everyone can buy it.",
  },
];

export function hiddenRulesForMarket(marketId, locale = "ru") {
  return HERRAC_HIDDEN_RULES.filter(
    (r) => !r.markets?.length || r.markets.includes(marketId)
  ).map((r) => ({
    id: r.id,
    level: r.level,
    text: locale === "az" ? r.az : locale === "en" ? r.en || r.ru : r.ru,
    textAz: r.az,
    textRu: r.ru,
  }));
}

export const MARKET_WARNINGS = {
  turbo: [
    {
      level: "high",
      az: "Turbo.az elanıdır: satıcı təsviri marketinq ola bilər. Servisə aparıb diaqnostika edin.",
      ru: "Объявление Turbo.az: описание продавца может быть маркетингом. Везите на диагностику.",
    },
    {
      level: "high",
      az: "«Vuruğu yoxdur» yazılsa belə — boya qalınlığı və VIN tarixçəsi yoxlanılmalıdır.",
      ru: "Даже при «без ударов» проверяйте толщину ЛКП и историю VIN.",
    },
  ],
  bina: [
    {
      level: "high",
      az: "Bina.az qiyməti tələb qiymətidir — real sövdələşmə aşağı ola bilər.",
      ru: "Цена на Bina.az — цена предложения; реальная сделка часто ниже.",
    },
    {
      level: "med",
      az: "Çıxarış / ipoteka / birgə mülkiyyət — notariusdan əvvəl sənədləri oxuyun.",
      ru: "Выписка / ипотека / совместная собственность — читайте документы до нотариуса.",
    },
  ],
};

