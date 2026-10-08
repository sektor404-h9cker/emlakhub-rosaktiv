/**
 * =============================================================================
 * PANEL DATA — DEMO_* пустые; DEAL_STAGES / SUPPORT_FAQ / ACADEMY — справочный копирайт
 * =============================================================================
 */

export const DEMO_BALANCE = 0;

export const DEMO_DEALS = [];

export const DEAL_STAGES = [
  {
    id: "explore",
    az: "Baxıram",
    ru: "Смотрю",
    en: "Watching",
    hintAz: "Hələ qərar yoxdur - lot izlənilir",
    hintRu: "Решения нет - просто следите за лотом",
    hintEn: "No decision yet — you are watching the lot",
    accent: "#64748b",
  },
  {
    id: "analysis",
    az: "Yoxlayıram",
    ru: "Проверяю",
    en: "Checking",
    hintAz: "Foto, sənəd və kalkulyator",
    hintRu: "Фото, документы и калькулятор",
    hintEn: "Photos, documents and the calculator",
    accent: "#38bdf8",
  },
  {
    id: "decision",
    az: "Qərar",
    ru: "Решение",
    en: "Decision",
    hintAz: "Beh və maksimal stavka hazırdır",
    hintRu: "Задаток и потолок ставки готовы",
    hintEn: "Deposit and maximum bid are ready",
    accent: "#a78bfa",
  },
  {
    id: "auction",
    az: "Hərrac",
    ru: "Аукцион",
    en: "Auction",
    hintAz: "Tarix və saat təyin olunub",
    hintRu: "Дата и время назначены",
    hintEn: "Date and time are set",
    accent: "#f59e0b",
  },
  {
    id: "result",
    az: "Nəticə",
    ru: "Итог",
    en: "Result",
    hintAz: "Qazandınız və ya keçdiniz",
    hintRu: "Выиграли или прошли мимо",
    hintEn: "You won or you walked away",
    accent: "#34d399",
  },
];

export const DEMO_TICKETS = [];

export const SUPPORT_FAQ = [
  {
    id: "q0",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Emlak Hub herrac.gov.az-ı əvəz edir?",
    qRu: "Emlak Hub заменяет herrac.gov.az?",
    aAz: "Xeyr. Hub lotları, bazar oxşarlarını və kart mətnindəki riskləri göstərir. Təmiri siz yazırsınız. Beh, qeydiyyat və təklif yalnız herrac.gov.az-dadır.",
    aRu: "Нет. Hub показывает лоты, рыночные аналоги и риски из текста карточки. Ремонт вводите вы. Задаток, регистрация и ставка — только на herrac.gov.az.",
  },
  {
    id: "q1",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Terminalda ilk nə etməliyəm?",
    qRu: "С чего начать в терминале?",
    aAz: "Analitik terminalda lotlara baxın. Maraqlı olanı «İzləmə»yə əlavə edin. Müqayisə edin. Qərar verəndən sonra təklifi herrac.gov.az-da verin.",
    aRu: "Откройте аналитический терминал. Интересный лот - в избранное. Сравните. Когда решите - ставку делайте на herrac.gov.az.",
  },
  {
    id: "q2",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Terminal qiyməti özü uydurur?",
    qRu: "Терминал сам придумывает цену?",
    aAz: "Xeyr. Başlanğıc qiymət kartda yoxdursa, sıfır yazılmır. Təmir boşdursa, qazanc hesab olunmur.",
    aRu: "Нет. Если в карточке нет стартовой цены, мы не пишем ноль. Если ремонт не введён, прибыль не считается.",
  },
  {
    id: "q3",
    catAz: "Pul",
    catRu: "Деньги",
    qAz: "Beh və təklifi harada ödəyirəm?",
    qRu: "Где платить задаток и делать ставку?",
    aAz: "Yalnız herrac.gov.az-da. Terminaldakı kalkulyator - təxmini hesabdır: nə qədər beh və marja ola bilər. Rəsmi ödəniş və iştirak rəsmi portaldadır.",
    aRu: "Только на herrac.gov.az. Калькулятор в терминале - ориентир: какой задаток и маржа могут получиться. Официальная оплата и участие - на портале.",
  },
  {
    id: "q4",
    catAz: "Pul",
    catRu: "Деньги",
    qAz: "Komissiya və təmir harada görünür?",
    qRu: "Где комиссия и ремонт?",
    aAz: "Lot kartında. «Detallı hesabla» açın: bazar − stavka − təmir − 3% = xalis. Bu rəqəmlər planlaşdırma üçündür.",
    aRu: "В карточке лота. Откройте детальный расчёт: рынок − ставка − ремонт − 3% = чистыми. Цифры для планирования.",
  },
  {
    id: "q5",
    catAz: "Risk",
    catRu: "Риски",
    qAz: "Qırmızı bayraq görsəm nə etməliyəm?",
    qRu: "Что делать, если вижу красный флаг?",
    aAz: "Tələsik təklif verməyin. Sənədlərə və dəstəyə yazın. High risk - hüquqi yoxlama olmadan herrac-a girməyin.",
    aRu: "Не торопитесь со ставкой. Откройте документы и поддержку. High-риск - на herrac без проверки не ходите.",
  },
  {
    id: "q6",
    catAz: "Risk",
    catRu: "Риски",
    qAz: "Vision defektləri realdırmı?",
    qRu: "Vision-дефекты - это точно?",
    aAz: "Fotoda pas/çat uydurmuruq. Yalnız herrac mətnindəki siqnallar (açar, mühərrik…). Yerində baxış əvəzi deyil.",
    aRu: "Ржавчину/трещины на фото не выдумываем. Только сигналы из текста herrac (ключи, двигатель…). Это не замена осмотру.",
  },
  {
    id: "q7",
    catAz: "Portfel",
    catRu: "Портфель",
    qAz: "Portfel sütunları nə üçündür?",
    qRu: "Зачем колонки в портфеле?",
    aAz: "Bu sizin şəxsi qeyd axınıdır: baxıram → yoxlayıram → qərar → hərrac → nəticə. Rəsmi təklif herrac.gov.az-dadır.",
    aRu: "Это ваш личный конвейер заметок: смотрю → проверяю → решение → аукцион → итог. Официальная ставка - на herrac.gov.az.",
  },
  {
    id: "q8",
    catAz: "Texniki",
    catRu: "Техническое",
    qAz: "Şifrəni unutsam?",
    qRu: "Забыл пароль - что делать?",
    aAz: "Tiket açın mövzu «Giriş». Demo üçün: admin@emlakhub.net / EmlakHub2026!",
    aRu: "Откройте тикет с темой «Вход». Для демо: admin@emlakhub.net / EmlakHub2026!",
  },
  {
    id: "q9",
    catAz: "Texniki",
    catRu: "Техническое",
    qAz: "Bildirişlər çoxdursa?",
    qRu: "Слишком много уведомлений?",
    aAz: "Alertləri söndürün və ya profilə keçib e-poçt/push-u bağlayın. Kolokolçukda «Hamısını oxu».",
    aRu: "Выключите лишние алерты или в профиле отключите почту и пуш. В колокольчике - «Прочитать все».",
  },
  {
    id: "q10",
    catAz: "Texniki",
    catRu: "Техническое",
    qAz: "Səhifədəki mavi izah qutularını necə gizlədim?",
    qRu: "Как убрать синие подсказки на страницах?",
    aAz: "Qutunun sağında «Gizlət». Hamısını profil → «Bölmə izahlarını göstər» ilə bağlamaq olar.",
    aRu: "В карточке подсказки нажмите «Скрыть». Все сразу - в профиле, переключатель «Показывать подсказки разделов».",
  },
];

export const DEMO_ALERTS = [];

export const DEMO_NOTIFICATIONS = [];

export const DEMO_DOCUMENTS = [];

export const ACADEMY_LESSONS = [
  {
    id: "L-01",
    level: "01",
    duration: "8 мин",
    titleAz: "Terminal və herrac: kim nə edir",
    titleRu: "Терминал и herrac: кто что делает",
    titleEn: "The terminal and herrac: who does what",
    bodyAz:
      "Emlak Hub lotları oxuyur: foto, qiymət, risk, marja, xəritə, turbo/bina comps. Beh və təklif - yalnız herrac.gov.az-da.",
    bodyRu:
      "Emlak Hub читает лоты: фото, цена, риск, маржа, карта, comps turbo/bina. Задаток и ставка — только на herrac.gov.az.",
    bodyEn:
      "Emlak Hub reads lots: photos, price, risk, margin, map, turbo/bina comps. The deposit and the bid stay on herrac.gov.az.",
  },
  {
    id: "L-02",
    level: "02",
    duration: "10 мин",
    titleAz: "Qiymət və pul",
    titleRu: "Цена и деньги",
    titleEn: "Price and money",
    bodyAz:
      "Başlanğıc yalnız Hərrac kartındandır. Təmiri investor yazır. Boş sahə sıfır deyil.",
    bodyRu:
      "Старт только из карточки Hərrac. Ремонт вводит инвестор. Пустое поле — не ноль.",
    bodyEn:
      "The opening price comes only from the Hərrac card. The investor enters repair. An empty field is not zero.",
  },
  {
    id: "L-03",
    level: "03",
    duration: "10 мин",
    titleAz: "Comps: eyni marka / eyni tip",
    titleRu: "Comps: та же марка / тот же тип",
    titleEn: "Comps: same make / same type",
    bodyAz:
      "Avto: turbo.az-da yalnız eyni marka+model (məs. Volvo XC90). Ev: bina.az-da oxşar otaq/sahə/rayon. Torpaq/kommersiya üçün mənzil comps yoxdur.",
    bodyRu:
      "Авто: на turbo.az только та же марка+модель (напр. Volvo XC90). Жильё: на bina.az похожие комнаты/площадь/район. Для земли/коммерции квартирные comps не подставляем.",
    bodyEn:
      "Cars: turbo.az uses the same make and model (for example Volvo XC90). Homes: bina.az uses similar rooms, area and district. Apartment comps are not used for land or commercial.",
  },
  {
    id: "L-04",
    level: "04",
    duration: "8 мин",
    titleAz: "Foto və siqnallar",
    titleRu: "Фото и сигналы",
    titleEn: "Photos and signals",
    bodyAz:
      "Fotoda pas uydurmuruq. Siqnallar herrac qeydindən (açar, mühərrik, saxlanma). Yerində baxış məcburidir.",
    bodyRu:
      "Ржавчину на фото не выдумываем. Сигналы — из заметок herrac (ключи, двигатель, хранение). Осмотр на месте обязателен.",
    bodyEn:
      "We do not invent rust on the photo. Signals come from herrac notes (keys, engine, storage). An on-site inspection is required.",
  },
  {
    id: "L-05",
    level: "05",
    duration: "12 мин",
    titleAz: "İş axını: izləmə → hərrac",
    titleRu: "Рабочий поток: избранное → аукцион",
    titleEn: "Workflow: watchlist → auction",
    bodyAz:
      "Terminal → izləmə/müqayisə → portfel mərhələləri → herrac.gov.az-da beh və təklif. Xəritə şəhər üzrə göstərir.",
    bodyRu:
      "Терминал → избранное/сравнение → этапы портфеля → задаток и ставка на herrac.gov.az. Карта показывает лоты по городу.",
    bodyEn:
      "Terminal → watchlist/compare → portfolio stages → deposit and bid on herrac.gov.az. The map shows lots by city.",
  },
];

export const ACADEMY_CHECKLIST = [
  { az: "Reyestr № herrac ilə eynidir", ru: "Registry № совпадает с herrac", en: "The registry number matches herrac" },
  { az: "Comps eyni marka/model və ya tipdir", ru: "Comps — та же марка/модель или тип", en: "Comps are the same make/model or type" },
  { az: "Marja və beh likvidliyə sığır", ru: "Маржа и задаток влезают в ликвидность", en: "Margin and deposit fit the liquidity" },
  { az: "Mətn riskləri oxunub (açar, həbs…)", ru: "Текстовые риски прочитаны (ключи, арест…)", en: "Text risks are read (keys, arrest…)" },
  { az: "Təklif yalnız herrac.gov.az-da", ru: "Ставка только на herrac.gov.az", en: "The bid is only on herrac.gov.az" },
];
