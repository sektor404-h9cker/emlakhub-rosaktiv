/**
 * Draft legal text for Digital Emlak Hub.
 * A qualified lawyer for Azerbaijan must review this before a public launch.
 */

const DRAFT = {
  az: "Qaralama. Azərbaycan hüququ üzrə vəkil ictimai açılışdan əvvəl yoxlamalıdır.",
  ru: "Черновик. Перед публичным запуском текст должен проверить юрист по праву Азербайджана.",
  en: "Draft. A lawyer qualified in Azerbaijan law must review this before public launch.",
};

export const LEGAL_DOCS = {
  terms: {
    az: {
      title: "İstifadəçi sazişi",
      draft: DRAFT.az,
      sections: [
        ["Platforma nədir", "Digital Emlak Hub məlumat və analitik platformadır. O, dövlət hərracını keçirmir. Rəsmi iştirak, beh, təklif, nəticə və protokol müvafiq rəsmi meydançada qalır."],
        ["Hesab", "Siz düzgün e-poçt verirsiniz və parolu özünüz saxlayırsınız. Bir şəxsə bir hesab kifayətdir. Biz hesabı bloklaya bilərik, əgər girişdən sui-istifadə və ya qaydaların pozulması görünür."],
        ["Analitika", "Bazar oriyentiri, Emlak Score və investisiya ssenarisi qərar üçün alətdir. Onlar mənfəətin, bazar dəyərinin, əmlakın vəziyyətinin, hüquqi təmizliyin və ya hərrac nəticəsinin zəmanəti deyil. Rəsmi qiymətləndirmə və kredit reytinqi deyil."],
        ["Sizin qərarınız", "Lotu almaq, beh qoymaq və təklif vermək sizin qərarınızdır. Çatışmayan məlumatı biz sıfır və ya fakt kimi göstərmirik."],
        ["Ödəniş", "PRO əl ilə təsdiqdən sonra açılır. Gözləyən ödəniş hələ aktiv abunə deyil."],
        ["Məsuliyyət", "Biz platformanı ehtiyatla saxlayırıq. Rəsmi hərracın nəticəsi, üçüncü tərəf elanları və sizin öz rəqəmləriniz üzrə risk sizdə qalır. Bu, hər bir zərərə görə məsuliyyətdən qanunsuz imtina deyil: məcburi hüquqlar saxlanılır."],
        ["Dəyişiklik", "Sazişin mühüm yenilənməsində versiya dəyişir və razılıq yenidən soruşula bilər."],
      ],
    },
    ru: {
      title: "Пользовательское соглашение",
      draft: DRAFT.ru,
      sections: [
        ["Что это за платформа", "Digital Emlak Hub — информационно-аналитическая платформа. Она не проводит государственный аукцион. Официальное участие, задаток, ставка, результаты и протокол остаются на соответствующей официальной площадке."],
        ["Аккаунт", "Вы указываете рабочий email и сами храните пароль. Один человек — один аккаунт. Мы можем ограничить доступ, если видим злоупотребление входом или нарушение правил."],
        ["Аналитика", "Рыночный ориентир, Emlak Score и инвестиционный сценарий помогают принять решение. Это не гарантия прибыли, рыночной стоимости, состояния имущества, юридической чистоты или результата торгов. Это не официальная оценка и не кредитный рейтинг."],
        ["Ваше решение", "Покупать лот, вносить задаток и делать ставку решаете вы. Если данных нет, платформа показывает это прямо и не подставляет ноль вместо неизвестного."],
        ["Оплата", "PRO включается после реального подтверждения по текущей схеме. Платёж в ожидании ещё не активирует доступ."],
        ["Ответственность", "Мы поддерживаем платформу с разумной заботой. Итог официальных торгов, данные сторонних площадок и цифры, которые вы ввели сами, остаются вашей зоной решения. Это не отказ от ответственности там, где закон её не позволяет исключить."],
        ["Обновления", "При существенном изменении текста меняется версия документа, и согласие можно запросить снова."],
      ],
    },
    en: {
      title: "Terms of use",
      draft: DRAFT.en,
      sections: [
        ["What this platform is", "Digital Emlak Hub is an information and analytics platform. It does not run the state auction. Official participation, the deposit, the bid, the result, and the protocol stay on the relevant official venue."],
        ["Account", "You give a working email and keep the password yourself. One person, one account. We may limit access if sign-in is abused or these terms are broken."],
        ["Analytics", "A market estimate, Emlak Score, and an investment scenario help you decide. They are not a guarantee of profit, market value, property condition, legal cleanliness, or auction outcome. They are not an official appraisal or a credit score."],
        ["Your decision", "You decide whether to buy, pay a deposit, or bid. When data is missing, the platform says so and does not turn unknown into zero."],
        ["Payment", "PRO turns on only after a real confirmation under the current process. A pending payment is not an active subscription."],
        ["Responsibility", "We run the platform with reasonable care. The official auction result, third-party listings, and figures you enter stay in your decision. This is not a blanket waiver where the law does not allow one."],
        ["Updates", "A material change gets a new document version, and we can ask for consent again."],
      ],
    },
  },
  privacy: {
    az: {
      title: "Məxfilik siyasəti",
      draft: DRAFT.az,
      sections: [
        ["Nə toplayırıq", "Hesab üçün e-poçt, parolun yalnız hash-i, ad və istəsəniz şirkət. Dəstək məktubunun mətni. Ödənişin statusu. Qəbul etdiyiniz sənədin versiyası, vaxtı və dili."],
        ["Nə üçün", "Giriş, abunə, dəstək və sizin seçdiyiniz lotlar, müqayisə və investisiya ssenarisi. Reklam bazası üçün artıq sahə yığmırıq."],
        ["Nə saxlamırıq", "Parolu açıq saxlamırıq. Sessiya sirrini və tokeni jurnala yazmırıq."],
        ["Kim görür", "Sizin lot siyahısı, ssenari və dəstək müraciəti başqa istifadəçiyə açılmır. İşçi yalnız öz rolunun icazəsi ilə baxır."],
        ["Saxlama", "Hesab durduqca bu məlumat durur. Hesabı siləndə bağlı sətirlər verilənlər bazasının qaydaları ilə silinir və ya əlaqəsizləşir."],
      ],
    },
    ru: {
      title: "Политика конфиденциальности",
      draft: DRAFT.ru,
      sections: [
        ["Что мы берём", "Для аккаунта: email, хеш пароля, имя и по желанию компания. Текст обращения в поддержку. Статус платежа. Версия, время и язык принятых документов."],
        ["Зачем", "Чтобы вы входили, пользовались подпиской, писали в поддержку и хранили свои лоты, сравнение и сценарий. Данные «на будущее» и для чужой рекламы мы не собираем."],
        ["Чего нет в журналах", "Пароль открытым не хранится. Секрет сессии и токены в логи не пишем."],
        ["Кто видит", "Ваш список, сценарий и обращение не открываются другому пользователю. Сотрудник видит данные только в рамках своей роли."],
        ["Срок", "Пока аккаунт жив, эти записи живут с ним. Удаление аккаунта убирает или отвязывает связанные строки по правилам базы."],
      ],
    },
    en: {
      title: "Privacy policy",
      draft: DRAFT.en,
      sections: [
        ["What we collect", "For the account: email, a password hash, a name, and a company only if you add one. Support text. Payment status. The version, time, and language of documents you accept."],
        ["Why", "So you can sign in, use a subscription, write to support, and keep your own lots, comparison, and scenario. We do not collect extra fields for a future advertising file."],
        ["What we do not log", "The password is never stored in plain text. Session secrets and tokens are not written to logs."],
        ["Who can see it", "Your list, scenario, and ticket are not shown to another user. Staff see data only within their role."],
        ["How long", "These records stay with the account. Deleting the account removes or unlinks related rows under the database rules."],
      ],
    },
  },
  disclaimer: {
    az: {
      title: "Hüquqi məlumat",
      draft: DRAFT.az,
      sections: [
        ["Rəsmi hərrac", "Emlak Hub dövlət hərracını təşkil etmir. Beh, təklif və protokol rəsmi səhifədədir."],
        ["Bazar", "Market estimate mövcud elanlar üzrə analitik oriyentirdir. Əmlakın rəsmi qiymətləndirilməsi deyil. Seçim azdırsa, qiymət göstərmirik."],
        ["Emlak Score", "Bu analitik alətdir. Kredit reytinqi, dövlət qiyməti və ya sövdələşmə zəmanəti deyil. Hesablamaq mümkün deyilsə, bal gizlənir və səbəb yazılır."],
        ["Naməlum və risk", "Məlumatın olmaması nasazlıq demək deyil. Mənbə birbaşa problem yazırsa, bu təsdiqlənmiş siqnaldır."],
        ["Qərar", "Siz müstəqil qərar verirsiniz. Platforma mənfəət vəd etmir."],
      ],
    },
    ru: {
      title: "Правовая информация",
      draft: DRAFT.ru,
      sections: [
        ["Официальный аукцион", "Emlak Hub не проводит государственный аукцион. Задаток, ставка и протокол — на официальной площадке."],
        ["Рынок", "Market estimate — аналитический ориентир по доступным объявлениям, а не официальная оценка имущества. Если выборка слабая, цену мы не показываем."],
        ["Emlak Score", "Это аналитический инструмент. Не кредитный рейтинг, не государственная оценка и не гарантия сделки. Если балл посчитать нельзя, мы так и пишем, вместе с причиной."],
        ["Неизвестное и риск", "Отсутствие данных не означает поломку. Если источник прямо пишет о неисправности, это подтверждённый сигнал."],
        ["Решение", "Решение принимаете вы. Платформа не обещает прибыль."],
      ],
    },
    en: {
      title: "Legal information",
      draft: DRAFT.en,
      sections: [
        ["The official auction", "Emlak Hub does not run the state auction. The deposit, the bid, and the protocol stay on the official venue."],
        ["Market", "A market estimate is an analytical reference from available listings, not an official appraisal. A weak sample does not become a price."],
        ["Emlak Score", "It is an analytical tool. Not a credit score, not a state valuation, and not a guarantee of a deal. If the score cannot be calculated, we say so and give the reason."],
        ["Unknown and risk", "Missing information is not a defect. A defect is a confirmed signal only when the source states it."],
        ["Decision", "You decide. The platform does not promise a profit."],
      ],
    },
  },
  partners: {
    az: {
      title: "Emlak Partners",
      draft: DRAFT.az,
      sections: [
        ["Kim iştirak edir", "Hər qeydiyyatlı istifadəçi öz dəvət kodunu ala bilər. Dəvət olunan bir dəfə yalnız bir dəvət edənə bağlanır."],
        ["Bonus nə vaxt yazılır", "Dəvət edən +7 gün PRO, dəvət olunan +3 gün PRO yalnız dəvət olunan PRO-nu ilk dəfə uğurla ödəyəndən sonra alır. Qeydiyyatın özü bonus vermir. Rəqəmləri inzibatçı gələcək dəvətlər üçün dəyişə bilər."],
        ["Bu nə deyil", "Bonus xidmət günüdür. Pul ödənişi, passiv gəlir və çoxsəviyyəli şəbəkə yoxdur."],
        ["Ləğv", "Ödəniş qaytarılanda və ya səhv aşkar olanda həmin bonus ayrıca əməliyyatla geri alınır. Köhnə qeyd silinmir."],
        ["Məhdudiyyətlər", "Özünü dəvət etmək olmaz. Eyni dəvət olunan üçün bonus təkrar yazılmır. Şübhəli kütləvi qeydiyyat yoxlanışa düşə bilər."],
      ],
    },
    ru: {
      title: "Правила Emlak Partners",
      draft: DRAFT.ru,
      sections: [
        ["Кто участвует", "Каждый зарегистрированный пользователь получает свою ссылку. Приглашённый привязывается только к одному пригласившему."],
        ["Когда начисляется бонус", "Пригласивший получает +7 дней PRO, приглашённый +3 дня PRO после первой успешной оплаты PRO приглашённым. Регистрация сама по себе бонус не даёт. Администратор может изменить число дней для будущих приглашений."],
        ["Чем это не является", "Бонус — это дни сервиса. Это не денежная выплата, не обещание пассивного дохода и не многоуровневая система."],
        ["Отмена", "При возврате платежа или ошибочном начислении бонус снимается отдельной учётной операцией. История не удаляется."],
        ["Ограничения", "Самоприглашение запрещено. Повторная оплата того же приглашённого новый бонус не даёт. Массовая регистрация может быть отмечена для проверки."],
      ],
    },
    en: {
      title: "Emlak Partners rules",
      draft: DRAFT.en,
      sections: [
        ["Who can join", "Every registered user gets a personal link. An invited person is linked to one inviter only."],
        ["When the bonus is added", "The inviter receives +7 PRO days and the invited person +3 PRO days after the invited person's first successful PRO payment. Registration alone does not add days. An admin can change the day counts for future invitations."],
        ["What this is not", "The bonus is service days. It is not a cash payout, not a promise of passive income, and not a multi-level scheme."],
        ["Cancellation", "A refund or a mistaken grant removes the bonus as a separate accounting entry. The history stays."],
        ["Limits", "Self-invitation is not allowed. A later payment by the same invited person does not add the bonus again. A burst of signups can be flagged for review."],
      ],
    },
  },
};

export function legalDoc(slug, locale) {
  const doc = LEGAL_DOCS[slug];
  if (!doc) return null;
  return doc[locale] || doc.az;
}
