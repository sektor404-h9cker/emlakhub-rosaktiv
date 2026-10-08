/**
 * Умный антифрод: сценарии → кейс + автотикет в поддержку
 * с готовым объяснением для агента
 */

export const FRAUD_SCENARIOS = [
  {
    id: "pay_loop",
    icon: "PAY",
    titleRu: "Цикл неудачных оплат",
    titleAz: "Uğursuz ödəniş döngüsü",
    titleEn: "Failed payment loop",
    signalRu: "10+ попыток оплаты за короткий срок",
    signalAz: "Qısa müddətdə 10+ ödəniş cəhdi",
    signalEn: "10+ payment attempts in a short window",
    score: 88,
    severity: "critical",
    defaultCount: 10,
    explainRu:
      "Система зафиксировала серию неудачных попыток списания. Часто это: ошибка банка, неверный CVV, или бот/перебор карт. Пользователю уже неудобно - нужна эмпатичная помощь и проверка, не chargeback ли это.",
    explainAz:
      "Sistem uğursuz ödəniş cəhdləri gördü. Bank xətası, səhv CVV və ya kart brute-force ola bilər. İstifadəçiyə yumşaq kömək və chargeback riski yoxlanmalıdır.",
    explainEn:
      "Multiple failed charges. Bank decline, bad CVV, or card testing. Help the user calmly and check chargeback risk.",
    supportSubjectRu: "Антифрод: много попыток оплаты",
    supportSubjectEn: "Anti-fraud: payment attempts",
    agentDraftRu:
      "Здравствуйте! Мы заметили несколько неудачных попыток оплаты PRO и открыли проверку, чтобы защитить ваш счёт. Напишите, пожалуйста: какая карта/банк и видите ли списание в SMS. Пока доступ к терминалу можно оставить на Free - как только платеж подтвердится, активируем PRO вручную.",
    agentDraftAz:
      "Salam! PRO ödənişində bir neçə uğursuz cəhd gördük və hesabınızı qorumaq üçün yoxlama açdıq. Zəhmət olmasa yazın: hansı kart/bank və SMS-də silinmə varmı. Təsdiqlənən kimi PRO-nu əl ilə aktivləşdirəcəyik.",
    agentDraftEn:
      "Hi! We saw several failed PRO payment attempts and opened a review to protect your account. Please tell us your bank/card and if you see any SMS charge. Once confirmed we'll activate PRO manually.",
    userHintRu: "Пользователь может быть раздражён - не обвиняйте, предлагайте ручную активацию после проверки.",
    recommend: ["Проверить платежи", "Не блокировать сразу", "Предложить другой метод"],
  },
  {
    id: "geo_jump",
    icon: "GEO",
    titleRu: "Скачок геолокации",
    titleAz: "Geolokasiya sıçrayışı",
    titleEn: "Impossible travel",
    signalRu: "Вход из Baku → через 8 мин из другого региона",
    signalAz: "Baku-dan giriş → 8 dəq sonra başqa region",
    signalEn: "Login Baku → another region in 8 min",
    score: 76,
    severity: "high",
    explainRu:
      "Два входа слишком далеко друг от друга за короткое время. Возможны VPN, shared account или угон сессии. Спросить: это вы? Предложить сменить пароль и завершить чужие сессии.",
    explainAz:
      "Qısa vaxtda uzaq yerlərdən iki giriş. VPN, paylaşılan hesab və ya oğurluq ola bilər. Soruşun: siz idiniz? Şifrə və sessiyaları yoxlayın.",
    explainEn:
      "Two distant logins too close in time. VPN, shared account, or session theft. Ask to confirm and rotate password.",
    supportSubjectRu: "Антифрод: подозрительный вход (гео)",
    supportSubjectEn: "Anti-fraud: suspicious geo login",
    agentDraftRu:
      "Здравствуйте! Зафиксировали вход с нового региона почти сразу после Баку. Если это были вы (VPN/поездка) - подтвердите. Если нет - срочно смените пароль; мы можем завершить все сессии по вашей просьбе.",
    agentDraftAz:
      "Salam! Bakıdan dərhal sonra yeni regiondan giriş gördük. Siz idinizsə (VPN/səfər) təsdiqləyin. Deyilsinizsə şifrəni dəyişin; istəsəniz bütün sessiyaları bağlayarıq.",
    agentDraftEn:
      "Hi! We saw a login from a new region right after Baku. If that was you (VPN/travel), confirm. If not, change your password; we can end all sessions on request.",
    userHintRu: "Не пугать. Дать кнопку «Это был я» / «Это не я» в ответе.",
    recommend: ["Завершить чужие сессии", "Письмо security", "2FA reminder"],
  },
  {
    id: "card_stack",
    icon: "CARD",
    titleRu: "Несколько карт подряд",
    titleAz: "Ardıcıl bir neçə kart",
    titleEn: "Multiple cards in a row",
    signalRu: "4+ разные карты за 15 минут",
    signalAz: "15 dəq ərzində 4+ fərqli kart",
    signalEn: "4+ different cards in 15 minutes",
    score: 91,
    severity: "critical",
    explainRu:
      "Классический паттерн card testing. Высокий риск fraud. Рекомендуется статус review + ручная проверка KYC/телефона перед PRO.",
    explainAz:
      "Card testing nümunəsi. Yüksək fraud riski. PRO-dan əvvəl review + telefon/KYC yoxlaması.",
    explainEn:
      "Classic card-testing pattern. Hold PRO until phone/KYC review.",
    supportSubjectRu: "Антифрод: перебор карт",
    supportSubjectEn: "Anti-fraud: card testing",
    agentDraftRu:
      "Здравствуйте. Система временно приостановила оплату: слишком много разных карт за короткое время. Чтобы защитить вас и нас, подтвердите номер телефона из профиля и одну карту, которой хотите оплатить. После проверки включим PRO.",
    agentDraftAz:
      "Salam. Qısa vaxtda çox kart cəhdi olduğu üçün ödəniş dayandırılıb. Profil telefonunu və bir kartı təsdiqləyin - yoxlamadan sonra PRO açılacaq.",
    agentDraftEn:
      "Hi. Payments were paused after too many different cards in a short time. Confirm your profile phone and one card; we'll enable PRO after review.",
    userHintRu: "Не раскрывать внутренний score. Говорить о защите аккаунта.",
    recommend: ["Hold PRO", "Verify phone", "Flag finance"],
  },
  {
    id: "vpn_pay",
    icon: "VPN",
    titleRu: "VPN + оплата",
    titleAz: "VPN + ödəniş",
    titleEn: "VPN during payment",
    signalRu: "Оплата из датацентра / VPN ASN",
    signalAz: "Data center / VPN ASN-dən ödəniş",
    signalEn: "Payment from datacenter / VPN ASN",
    score: 68,
    severity: "medium",
    explainRu:
      "IP относится к хостингу/VPN. Само по себе не блок, но вместе с failed payments повышает риск. Попросить оплату без VPN или верификацию.",
    explainAz:
      "IP hosting/VPN-dir. Təkcə blok deyil, amma uğursuz ödənişlərlə risk artır. VPN-siz ödəniş və ya verify istəyin.",
    explainEn:
      "Hosting/VPN IP. Not auto-block, but raises risk with failed pays. Ask to retry without VPN.",
    supportSubjectRu: "Антифрод: VPN при оплате",
    supportSubjectEn: "Anti-fraud: VPN payment",
    agentDraftRu:
      "Здравствуйте! Оплата пришла с VPN/прокси, поэтому банк мог отклонить её. Попробуйте без VPN или с мобильного интернета и напишите нам - мы проверим статус платежа.",
    agentDraftAz:
      "Salam! Ödəniş VPN/proksi ilə gəlib, bank rədd edə bilər. VPN-siz və ya mobil internetlə yenidən yoxlayın və yazın - statusu yoxlayacağıq.",
    agentDraftEn:
      "Hi! The payment came via VPN/proxy, so the bank may have declined it. Try without VPN or on mobile data and reply — we'll check the payment status.",
    userHintRu: "Мягкий тон, техническая причина.",
    recommend: ["Retry without VPN", "Check bank SMS"],
  },
  {
    id: "lot_scrape",
    icon: "API",
    titleRu: "Скрейпинг лотов",
    titleAz: "Lot skreypinqi",
    titleEn: "Lot scraping",
    signalRu: "Открыто >40 карточек лотов за час (Free)",
    signalAz: "1 saatda 40+ lot kartı (Free)",
    signalEn: ">40 lot cards opened / hour (Free)",
    score: 55,
    severity: "medium",
    explainRu:
      "Похоже на парсер или перебор. На Free лимит 2 карточки - значит обошли клиентский лимит или баг. Проверить usage и предложить PRO легально.",
    explainAz:
      "Parser və ya brute ola bilər. Free limit 2 kart - client limit keçilib. Usage yoxla, PRO təklif et.",
    explainEn:
      "Likely scraper or bypass of Free 2-card limit. Check usage; offer legitimate PRO.",
    supportSubjectRu: "Антифрод: аномальный просмотр лотов",
    supportSubjectEn: "Anti-fraud: lot browsing anomaly",
    agentDraftRu:
      "Здравствуйте! Заметили очень частые открытия карточек лотов. На Free доступны 1-2 карточки. Если нужна аналитика по рынку - расскажем про PRO. Если это ошибка на нашей стороне - напишите, разберём.",
    agentDraftAz:
      "Salam! Lot kartlarının çox tez açıldığını gördük. Free-də 1-2 kart var. Bazar analizi lazımdırsa PRO haqqında danışarıq. Xəta varsa yazın.",
    agentDraftEn:
      "Hi! We noticed very frequent lot card opens. Free allows 1–2 cards. If you need deeper market analytics, we can walk you through PRO. If something looks broken, reply and we'll fix it.",
    userHintRu: "Можно upsell PRO без давления.",
    recommend: ["Check usage", "Rate-limit", "Offer PRO"],
  },
  {
    id: "chargeback",
    icon: "CB",
    titleRu: "Риск chargeback",
    titleAz: "Chargeback riski",
    titleEn: "Chargeback risk",
    signalRu: "Оспаривание / повторный refund запрос",
    signalAz: "Dispute / təkrar refund",
    signalEn: "Dispute / repeated refund request",
    score: 84,
    severity: "critical",
    explainRu:
      "Клиент мог оспорить платёж в банке. Нужна сверка с finance journal и аккуратная коммуникация. Не обещать мгновенный возврат без проверки.",
    explainAz:
      "Bankda dispute ola bilər. Finance journal ilə tutuşdurun. Yoxlamadan instant refund vəd etməyin.",
    explainEn:
      "Possible bank dispute. Reconcile with finance journal; don't promise instant refund.",
    supportSubjectRu: "Антифрод / finance: chargeback",
    supportSubjectEn: "Anti-fraud / finance: chargeback",
    agentDraftRu:
      "Здравствуйте. Получили сигнал по платежу (возможный спор с банком). Уже сверяем с финансами. Напишите номер операции из SMS и дату - ответим в течение рабочего дня с точным статусом.",
    agentDraftAz:
      "Salam. Ödənişlə bağlı siqnal aldıq (bank mübahisəsi ola bilər). Maliyyə ilə tutuşdururuq. SMS-dəki əməliyyat nömrəsi və tarixi yazın - iş günü ərzində cavab verəcəyik.",
    agentDraftEn:
      "Hi. We got a payment dispute signal. We're reconciling with finance. Please send the SMS transaction id and date — we'll reply with an exact status within a business day.",
    userHintRu: "Эскалация L2 + тег finance.",
    recommend: ["Escalate L2", "Ping finance", "Hold PRO"],
  },
  {
    id: "shared_device",
    icon: "DEV",
    titleRu: "Общий / скомпрометированный девайс",
    titleAz: "Paylaşılan / kompromis cihaz",
    titleEn: "Shared / compromised device",
    signalRu: "Один device fingerprint на 3+ аккаунта",
    signalAz: "1 device fingerprint → 3+ hesab",
    signalEn: "One device fingerprint on 3+ accounts",
    score: 72,
    severity: "high",
    explainRu:
      "Несколько аккаунтов с одного устройства. Может быть семья/офис или мультиаккаунт для обхода Free. Уточнить контекст, не блокировать всех сразу.",
    explainAz:
      "Eyni cihazdan bir neçə hesab. Ailə/ofis və ya Free limit bypass. Konteksti soruşun, hamısını dərhal bloklamayın.",
    explainEn:
      "Multiple accounts on one device. Family/office or Free-limit bypass. Ask context before mass block.",
    supportSubjectRu: "Антифрод: несколько аккаунтов с одного устройства",
    supportSubjectEn: "Anti-fraud: multi-account same device",
    agentDraftRu:
      "Здравствуйте! Видим несколько аккаунтов Emlak Hub с вашего устройства. Если это семья/коллеги - ок, просто подтвердите. Если аккаунт чужой - смените пароль и напишите нам, поможем закрыть лишние сессии.",
    agentDraftAz:
      "Salam! Cihazınızdan bir neçə Emlak Hub hesabı görürük. Ailə/həmkarlardırsa təsdiqləyin. Yad hesabdırsa şifrəni dəyişin - sessiyaları bağlamağa kömək edərik.",
    agentDraftEn:
      "Hi! We see several Emlak Hub accounts from your device. If that's family/colleagues, just confirm. If not yours, change the password and reply — we'll help close extra sessions.",
    userHintRu: "Нейтральный тон, без обвинений.",
    recommend: ["Ask context", "Session review"],
  },
  {
    id: "brute_login",
    icon: "PWD",
    titleRu: "Перебор пароля",
    titleAz: "Şifrə brute-force",
    titleEn: "Password brute-force",
    signalRu: "15+ неудачных логинов за 10 мин",
    signalAz: "10 dəq ərzində 15+ uğursuz login",
    signalEn: "15+ failed logins in 10 min",
    score: 80,
    severity: "high",
    explainRu:
      "Возможна атака на аккаунт. Временно ограничить вход, предложить сброс пароля и проверить email владельца.",
    explainAz:
      "Hesaba hücum ola bilər. Girişi müvəqqəti məhdudlaşdırın, şifrə reset və email yoxlayın.",
    explainEn:
      "Possible account attack. Soft-lock login, offer password reset, verify owner email.",
    supportSubjectRu: "Антифрод: много неудачных входов",
    supportSubjectEn: "Anti-fraud: failed logins",
    agentDraftRu:
      "Здравствуйте! Заметили много неудачных попыток входа в ваш аккаунт. Если это не вы - срочно смените пароль по ссылке «Забыли пароль». Мы можем на время ограничить вход с чужих IP по вашей просьбе.",
    agentDraftAz:
      "Salam! Hesabınıza çox uğursuz giriş cəhdi gördük. Siz deyilsinizsə «Şifrəni unutdum» ilə dəyişin. İstəsəniz yad IP-lərdən girişi müvəqqəti bağlarıq.",
    agentDraftEn:
      "Hi! We saw many failed login attempts on your account. If that wasn't you, reset the password via Forgot password. We can temporarily block foreign IPs on request.",
    userHintRu: "Срочность без паники.",
    recommend: ["Password reset", "Temp IP lock", "SOC watch"],
  },
];

export function getFraudScenario(id) {
  return FRAUD_SCENARIOS.find((s) => s.id === id) || null;
}

export function scenarioCopy(scenario, locale = "ru") {
  if (!scenario) return {};
  const L = locale === "az" ? "Az" : locale === "en" ? "En" : "Ru";
  return {
    title: scenario[`title${L}`] || scenario.titleRu,
    signal: scenario[`signal${L}`] || scenario.signalRu,
    explain: scenario[`explain${L}`] || scenario.explainRu,
    supportSubject:
      scenario[`supportSubject${L}`] ||
      scenario.supportSubjectRu ||
      scenario.supportSubjectEn,
    agentDraft:
      scenario[`agentDraft${L}`] ||
      scenario.agentDraftRu ||
      scenario.agentDraftEn,
    userHint: scenario.userHintRu,
  };
}

export const ACCOUNT_STATUSES = [
  {
    id: "active",
    label: { az: "Aktiv", ru: "Активен", en: "Active" },
    cls: "text-emerald-300 bg-emerald-500/15",
  },
  {
    id: "review",
    label: { az: "Yoxlama", ru: "На проверке", en: "Under review" },
    cls: "text-amber-300 bg-amber-500/15",
  },
  {
    id: "risk",
    label: { az: "Risk", ru: "Риск", en: "Risk" },
    cls: "text-rose-300 bg-rose-500/15",
  },
  {
    id: "blocked",
    label: { az: "Blok", ru: "Заблокирован", en: "Blocked" },
    cls: "text-red-300 bg-red-500/20",
  },
  {
    id: "dormant",
    label: { az: "Passiv", ru: "Неактивен", en: "Dormant" },
    cls: "text-slate-300 bg-slate-500/15",
  },
];

export function accountStatusMeta(id, locale = "ru") {
  const s =
    ACCOUNT_STATUSES.find((x) => x.id === id) || ACCOUNT_STATUSES[0];
  const L = s.label;
  return {
    ...s,
    label: typeof L === "string" ? L : L[locale] || L.ru,
  };
}

export function resolveAccountStatus(user) {
  if (!user) return "active";
  if (user.blocked || user.accountStatus === "blocked") return "blocked";
  if (user.accountStatus) return user.accountStatus;
  return "active";
}
