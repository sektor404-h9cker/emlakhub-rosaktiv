/**
 * =============================================================================
 * DEMO PANEL DATA — портфель, алерты, документы, академия (демо до Firebase)
 * =============================================================================
 */

export const DEMO_BALANCE = 248500;

export const DEMO_DEALS = [
  {
    id: "D-01",
    lotId: "AUTO-911",
    stage: "analysis",
    bid: 60500,
    noteAz: "Vision yoxlanır",
    noteRu: "Идёт Vision-проверка",
    updatedAt: "2026-09-14",
  },
  {
    id: "D-02",
    lotId: "EST-NAR-3",
    stage: "decision",
    bid: 121000,
    noteAz: "Hüquqi risk — ekspertə göndərildi",
    noteRu: "Юрриск — отправлено эксперту",
    updatedAt: "2026-09-13",
  },
  {
    id: "D-03",
    lotId: "EST-HOUSE-1",
    stage: "auction",
    bid: 245000,
    noteAz: "Hərrac sabah 11:00",
    noteRu: "Аукцион завтра 11:00",
    updatedAt: "2026-09-15",
  },
  {
    id: "D-04",
    lotId: "AUTO-GLS",
    stage: "result",
    bid: 214000,
    noteAz: "Qalib — təhvil gözlənilir",
    noteRu: "Выигрыш — ожидание передачи",
    updatedAt: "2026-09-10",
  },
];

export const DEAL_STAGES = [
  {
    id: "explore",
    az: "Baxıram",
    ru: "Смотрю",
    hintAz: "Hələ qərar yoxdur — lot izlənilir",
    hintRu: "Решения нет — просто следите за лотом",
    accent: "#64748b",
  },
  {
    id: "analysis",
    az: "Yoxlayıram",
    ru: "Проверяю",
    hintAz: "Foto, sənəd və kalkulyator",
    hintRu: "Фото, документы и калькулятор",
    accent: "#38bdf8",
  },
  {
    id: "decision",
    az: "Qərar",
    ru: "Решение",
    hintAz: "Beh və maksimal stavka hazırdır",
    hintRu: "Задаток и потолок ставки готовы",
    accent: "#a78bfa",
  },
  {
    id: "auction",
    az: "Hərrac",
    ru: "Аукцион",
    hintAz: "Tarix və saat təyin olunub",
    hintRu: "Дата и время назначены",
    accent: "#f59e0b",
  },
  {
    id: "result",
    az: "Nəticə",
    ru: "Итог",
    hintAz: "Qazandınız və ya keçdiniz",
    hintRu: "Выиграли или прошли мимо",
    accent: "#34d399",
  },
];

export const DEMO_TICKETS = [
  {
    id: "T-1042",
    topic: "legal",
    status: "open",
    lotId: "EST-NAR-3",
    titleAz: "Yetkinlik payı — necə rəsmiləşdirilir?",
    titleRu: "Доля несовершеннолетнего — как оформить?",
    bodyAz: "Nərimanov 3-otaqlıda high risk var. Hərraca qədər qəyyumluq sənədi lazımdırmı?",
    bodyRu: "В 3-комн. Нариманов high-риск. Нужна ли опека до аукциона?",
    createdAt: "14 сен",
    replyAz: "Bəli: notariat + qəyyumluq orqanı. Ekspert paketi sənədlərdədir.",
    replyRu: "Да: нотариат и орган опеки. Пакет эксперта уже в документах.",
  },
  {
    id: "T-1038",
    topic: "deposit",
    status: "waiting",
    lotId: "EST-HOUSE-1",
    titleAz: "Beh necə köçürülür?",
    titleRu: "Как перевести задаток?",
    bodyAz: "Xəzər evi üçün 10% beh — hansı rekvizit?",
    bodyRu: "Дом в Хазаре, задаток 10% — какие реквизиты?",
    createdAt: "13 сен",
    replyAz: null,
    replyRu: null,
  },
  {
    id: "T-1021",
    topic: "access",
    status: "done",
    lotId: null,
    titleAz: "PRO statusu görünmürdü",
    titleRu: "Не отображался PRO-статус",
    bodyAz: "Login sonrası badge yox idi.",
    bodyRu: "После входа не было бейджа.",
    createdAt: "10 сен",
    replyAz: "Sessiya yeniləndi — PRO aktivdir.",
    replyRu: "Сессию обновили — PRO активен.",
  },
];

export const SUPPORT_FAQ = [
  {
    id: "q0",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Emlak Hub herrac.gov.az-ı əvəz edir?",
    qRu: "Emlak Hub заменяет herrac.gov.az?",
    aAz: "Xeyr. Hub lotları göstərir və analiz edir (skor, təmir, risk, marja). Beh, qeydiyyat və təklif — yalnız rəsmi portalda: herrac.gov.az. Son qərar və ödəniş sizindir.",
    aRu: "Нет. Hub показывает лоты и анализирует их (скор, ремонт, риск, маржа). Задаток, регистрация и ставка — только на официальном портале herrac.gov.az. Финальные действия за вами.",
  },
  {
    id: "q1",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Terminalda ilk nə etməliyəm?",
    qRu: "С чего начать в терминале?",
    aAz: "Analitik terminalda lotlara baxın. Maraqlı olanı «İzləmə»yə əlavə edin. Müqayisə edin. Qərar verəndən sonra təklifi herrac.gov.az-da verin.",
    aRu: "Откройте аналитический терминал. Интересный лот — в избранное. Сравните. Когда решите — ставку делайте на herrac.gov.az.",
  },
  {
    id: "q2",
    catAz: "Başlanğıc",
    catRu: "С чего начать",
    qAz: "Skor nə deməkdir?",
    qRu: "Что означает скор?",
    aAz: "0–100 siqnaldır: bazar qiyməti, təmir, hüquqi risk. 60+ — diqqətə dəyər. Skor zəmanət deyil, köməkçidir.",
    aRu: "Это сигнал 0–100: рынок, ремонт, юрриск. 60+ стоит внимания. Скор — не гарантия, а подсказка.",
  },
  {
    id: "q3",
    catAz: "Pul",
    catRu: "Деньги",
    qAz: "Beh və təklifi harada ödəyirəm?",
    qRu: "Где платить задаток и делать ставку?",
    aAz: "Yalnız herrac.gov.az-da. Terminaldakı kalkulyator — təxmini hesabdır: nə qədər beh və marja ola bilər. Rəsmi ödəniş və iştirak rəsmi portaldadır.",
    aRu: "Только на herrac.gov.az. Калькулятор в терминале — ориентир: какой задаток и маржа могут получиться. Официальная оплата и участие — на портале.",
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
    aAz: "Tələsik təklif verməyin. Sənədlərə və dəstəyə yazın. High risk — hüquqi yoxlama olmadan herrac-a girməyin.",
    aRu: "Не торопитесь со ставкой. Откройте документы и поддержку. High-риск — на herrac без проверки не ходите.",
  },
  {
    id: "q6",
    catAz: "Risk",
    catRu: "Риски",
    qAz: "Vision defektləri realdırmı?",
    qRu: "Vision-дефекты — это точно?",
    aAz: "AI foto üzərində ehtimaldır. Büdcəyə salın, amma yerində yoxlama əvəzinə keçmir. Şübhə olanda ekspertə foto göndərin.",
    aRu: "Это оценка по фото. Заложите в бюджет, но она не заменяет осмотр. Если сомневаетесь — отправьте фото эксперту.",
  },
  {
    id: "q7",
    catAz: "Portfel",
    catRu: "Портфель",
    qAz: "Portfel sütunları nə üçündür?",
    qRu: "Зачем колонки в портфеле?",
    aAz: "Bu sizin şəxsi qeyd axınıdır: baxıram → yoxlayıram → qərar → hərrac → nəticə. Rəsmi təklif herrac.gov.az-dadır.",
    aRu: "Это ваш личный конвейер заметок: смотрю → проверяю → решение → аукцион → итог. Официальная ставка — на herrac.gov.az.",
  },
  {
    id: "q8",
    catAz: "Texniki",
    catRu: "Техническое",
    qAz: "Şifrəni unutsam?",
    qRu: "Забыл пароль — что делать?",
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
    aRu: "Выключите лишние алерты или в профиле отключите почту и пуш. В колокольчике — «Прочитать все».",
  },
  {
    id: "q10",
    catAz: "Texniki",
    catRu: "Техническое",
    qAz: "Səhifədəki mavi izah qutularını necə gizlədim?",
    qRu: "Как убрать синие подсказки на страницах?",
    aAz: "Qutunun sağında «Gizlət». Hamısını profil → «Bölmə izahlarını göstər» ilə bağlamaq olar.",
    aRu: "В карточке подсказки нажмите «Скрыть». Все сразу — в профиле, переключатель «Показывать подсказки разделов».",
  },
];

export const DEMO_ALERTS = [
  {
    id: "A-01",
    enabled: true,
    type: "price",
    titleAz: "Bakı mənzil < ₼ 120 000",
    titleRu: "Квартира Баку < ₼ 120 000",
    detailAz: "Nərimanov / Yasamal · estate",
    detailRu: "Нариманов / Ясамал · недвижимость",
  },
  {
    id: "A-02",
    enabled: true,
    type: "deadline",
    titleAz: "Hərrac 24 saat ərzində",
    titleRu: "Аукцион в ближайшие 24 часа",
    detailAz: "İzlədiyiniz lotlar",
    detailRu: "Лоты из избранного",
  },
  {
    id: "A-03",
    enabled: false,
    type: "score",
    titleAz: "Fürsət skoru ≥ 60",
    titleRu: "Скор возможности ≥ 60",
    detailAz: "Avto və əmlak",
    detailRu: "Авто и недвижимость",
  },
];

export const DEMO_NOTIFICATIONS = [
  {
    id: "N-01",
    unread: true,
    tag: "ALERT",
    tagRu: "АЛЕРТ",
    textAz: "Yeni lot: 2-otaqlı Yasamal — skoru 48",
    textRu: "Новый лот: 2-комн. Ясамал — скор 48",
    at: "12 мин",
  },
  {
    id: "N-02",
    unread: true,
    tag: "LOT",
    tagRu: "ЛОТ",
    textAz: "Land Rover — qiymət yeniləndi (−₼ 1 200)",
    textRu: "Land Rover — цена обновлена (−₼ 1 200)",
    at: "41 мин",
  },
  {
    id: "N-03",
    unread: true,
    tag: "DEAL",
    tagRu: "СДЕЛКА",
    textAz: "Porsche 911 — mərhələ: Analiz",
    textRu: "Porsche 911 — этап: Анализ",
    at: "2 ч",
  },
  {
    id: "N-04",
    unread: false,
    tag: "AI",
    tagRu: "AI",
    textAz: "Mercedes GLS — fürsət skoru dəyişdi",
    textRu: "Mercedes GLS — скоринг возможности обновлён",
    at: "5 ч",
  },
  {
    id: "N-05",
    unread: false,
    tag: "DOC",
    tagRu: "ДОК",
    textAz: "Nərimanov 3-otaqlı — kadastr PDF hazırdır",
    textRu: "Нариманов 3-комн. — кадастр PDF готов",
    at: "1 д",
  },
];

export const DEMO_DOCUMENTS = [
  {
    id: "DOC-01",
    lotId: "EST-NAR-3",
    kind: "cadastre",
    titleAz: "Kadastr çıxarışı",
    titleRu: "Кадастровая выписка",
    status: "ready",
    pages: 4,
  },
  {
    id: "DOC-02",
    lotId: "EST-NAR-3",
    kind: "legal",
    titleAz: "Hüquqi risk memorandum",
    titleRu: "Юридический меморандум",
    status: "ready",
    pages: 6,
  },
  {
    id: "DOC-03",
    lotId: "AUTO-911",
    kind: "vision",
    titleAz: "Vision hesabatı",
    titleRu: "Vision-отчёт",
    status: "ready",
    pages: 2,
  },
  {
    id: "DOC-04",
    lotId: "AUTO-RR",
    kind: "customs",
    titleAz: "Gömrük qeydi",
    titleRu: "Таможенная запись",
    status: "pending",
    pages: 1,
  },
  {
    id: "DOC-05",
    lotId: "EST-HOUSE-1",
    kind: "land",
    titleAz: "Torpaq sənədi",
    titleRu: "Документ на землю",
    status: "review",
    pages: 3,
  },
  {
    id: "DOC-06",
    lotId: "AUTO-GLS",
    kind: "ai",
    titleAz: "AI due diligence summary",
    titleRu: "AI due diligence summary",
    status: "ready",
    pages: 3,
  },
];

export const ACADEMY_LESSONS = [
  {
    id: "L-01",
    level: "01",
    duration: "8 мин",
    titleAz: "Terminala giriş: lot kartı və skoru",
    titleRu: "Вход в терминал: карточка лота и скор",
    bodyAz:
      "Registry №, Vision overlay və opportunity score — qərarın ilk siqnalıdır. 60+ skoru olan lotları izləyin.",
    bodyRu:
      "Registry №, Vision overlay и opportunity score — первый сигнал решения. Следите за лотами со скором 60+.",
  },
  {
    id: "L-02",
    level: "02",
    duration: "12 мин",
    titleAz: "Marja kalkulyatoru: stavka və beh",
    titleRu: "Калькулятор маржи: ставка и задаток",
    bodyAz:
      "Bazar − stavka − təmir − komissiya = xalis. Beh 10% — likvidlik bufferini unutmayın.",
    bodyRu:
      "Рынок − ставка − ремонт − комиссия = чистая. Задаток 10% — не забывайте буфер ликвидности.",
  },
  {
    id: "L-03",
    level: "03",
    duration: "10 мин",
    titleAz: "Hüquqi bayraqlar: high / med / low",
    titleRu: "Юридические флаги: high / med / low",
    bodyAz:
      "High risk — ekspert çatına; med — sənəd yoxlaması; low — standart due diligence.",
    bodyRu:
      "High — в эксперт-чат; med — проверка документов; low — стандартный due diligence.",
  },
  {
    id: "L-04",
    level: "04",
    duration: "15 мин",
    titleAz: "Portfel mərhələləri: kəşfdən nəticəyə",
    titleRu: "Этапы портфеля: от обзора к итогу",
    bodyAz:
      "İzləmə → analiz → qərar → hərrac → nəticə. Hər mərhələdə sənəd və alert bağlayın.",
    bodyRu:
      "Watchlist → анализ → решение → аукцион → итог. На каждом этапе привязывайте документ и алерт.",
  },
  {
    id: "L-05",
    level: "05",
    duration: "9 мин",
    titleAz: "Müqayisə: 2–3 lot yan-yana",
    titleRu: "Сравнение: 2–3 лота рядом",
    bodyAz:
      "Eyni market tipində müqayisə edin. Marja və hüquqi risk — əsas oxlar.",
    bodyRu:
      "Сравнивайте в одном типе рынка. Оси — маржа и юридический риск.",
  },
];

export const ACADEMY_CHECKLIST = [
  { az: "Reyestr № və foto eynidir", ru: "Registry № и фото совпадают" },
  { az: "Vision defektləri büdcədədir", ru: "Vision-дефекты заложены в бюджет" },
  { az: "Hüquqi high bayraq yoxdur / ekspertdədir", ru: "Нет high-флага / у эксперта" },
  { az: "Stavka + beh likvidliyə sığır", ru: "Ставка + задаток влезают в ликвидность" },
  { az: "Alert və sənədlər bağlıdır", ru: "Алерт и документы привязаны" },
];
