/**
 * Эмпатичные шаблоны поддержки L1 / L2 - AZ / RU / EN
 */

export const SUPPORT_LEVELS = {
  L1: {
    id: "L1",
    label: {
      az: "L1 · Birinci xətt",
      ru: "L1 · Первая линия",
      en: "L1 · First line",
    },
    hint: {
      az: "Giriş, FAQ, abunəlik, sadə suallar",
      ru: "Доступы, FAQ, подписка, базовые вопросы",
      en: "Access, FAQ, subscription, basic questions",
    },
  },
  L2: {
    id: "L2",
    label: {
      az: "L2 · Ekspertlər",
      ru: "L2 · Эксперты",
      en: "L2 · Experts",
    },
    hint: {
      az: "Hüquq, ödənişlər, hadisələr, eskalasiya",
      ru: "Юридика, платежи, инциденты, эскалации",
      en: "Legal, payments, incidents, escalations",
    },
  },
};

export const SUPPORT_TEMPLATES = [
  {
    id: "l1-hello",
    level: "L1",
    title: {
      az: "Salamlama",
      ru: "Приветствие",
      en: "Greeting",
    },
    text: {
      az: "Salam! 💛 Mən Emlak Hub dəstəyindənəm. Sorğunuza artıq baxıram - tezliklə cavab yazacağam 😊",
      ru: "Здравствуйте! 💛 Я из поддержки Emlak Hub. Уже смотрю ваш запрос - скоро вернусь с ответом 😊",
      en: "Hello! 💛 I'm from Emlak Hub support. I'm already looking at your request - I'll get back to you shortly 😊",
    },
  },
  {
    id: "l1-wait",
    level: "L1",
    title: {
      az: "Bir az vaxt lazımdır",
      ru: "Нужно чуть времени",
      en: "Need a moment",
    },
    text: {
      az: "Səbriniz üçün təşəkkür 🙏 Hesab detallarını yoxlayıram. Adətən 15 dəqiqəyə qədər çəkir - əlaqədə qalın ✨",
      ru: "Спасибо за терпение 🙏 Проверяю детали аккаунта. Обычно это занимает до 15 минут - оставайтесь на связи ✨",
      en: "Thanks for your patience 🙏 I'm checking your account details. It usually takes up to 15 minutes - stay with me ✨",
    },
  },
  {
    id: "l1-access",
    level: "L1",
    title: {
      az: "Giriş / hesab",
      ru: "Доступ / вход",
      en: "Access / login",
    },
    text: {
      az: "Bu nə qədər əsəbi olduğunu başa düşürəm 😔 Gəlin birlikdə girişi bərpa edək: çıxıb yenidən daxil olun. Kömək etməsə - hansı cihazdan girdiyinizi yazın 💙",
      ru: "Понимаю, как это раздражает 😔 Давайте вместе восстановим доступ: попробуйте выйти и войти снова. Если не поможет - напишите, с какого устройства заходите 💙",
      en: "I know how frustrating this is 😔 Let's restore access together: try signing out and back in. If that doesn't help - tell me which device you're using 💙",
    },
  },
  {
    id: "l1-pro",
    level: "L1",
    title: {
      az: "PRO abunəlik",
      ru: "Подписка PRO",
      en: "PRO subscription",
    },
    text: {
      az: "Abunəliklə kömək etməkdən məmnunam 💚 Free-də 1-2 lot kartı aça bilərsiniz; PRO bütün terminalı açır. Necə rəsmiləşdirməyi izah edə bilərəm - təzyiqsiz 😊",
      ru: "Рада помочь с подпиской 💚 На Free можно открыть 1-2 карточки лота; PRO открывает весь терминал. Могу подсказать, как оформить - без лишнего давления 😊",
      en: "Happy to help with your plan 💚 On Free you can open 1-2 lot cards; PRO unlocks the full terminal. I can explain how to upgrade - no pressure 😊",
    },
  },
  {
    id: "l1-close",
    level: "L1",
    title: {
      az: "Qayğı ilə bağlama",
      ru: "Закрытие с заботой",
      en: "Warm close",
    },
    text: {
      az: "Görünür, məsələ həll olundu 🎉 Başqa bir şey çıxsa - istənilən vaxt yazın. Yanınızdayıq ❤️ Tiketi bağlayıram, xoş günlər!",
      ru: "Похоже, вопрос решён 🎉 Если что-то ещё всплывёт - пишите в любой момент. Мы рядом ❤️ Закрываю тикет, хорошего дня!",
      en: "Looks like we're all set 🎉 If anything else comes up - write anytime. We're here ❤️ Closing the ticket - have a great day!",
    },
  },
  {
    id: "l2-escalate",
    level: "L2",
    title: {
      az: "Eskalasiya qəbul edildi",
      ru: "Эскалация принята",
      en: "Escalation accepted",
    },
    text: {
      az: "Salam! 💛 Mən L2 komandasıyam. Tiketinizi birinci xəttdən götürdük - daha dərindən baxıb dəqiq həll ilə qayıdacağıq 🛠️",
      ru: "Здравствуйте! 💛 Меня зовут команда L2. Переняли ваш тикет у первой линии - разберём глубже и вернёмся с точным решением 🛠️",
      en: "Hello! 💛 This is the L2 team. We've taken your ticket from first line - we'll dig deeper and come back with a clear fix 🛠️",
    },
  },
  {
    id: "l2-legal",
    level: "L2",
    title: {
      az: "Hüquqi baxış",
      ru: "Юридический разбор",
      en: "Legal review",
    },
    text: {
      az: "Etibar etdiyiniz üçün təşəkkür 🙏 Lot sənədlərinə baxıram. Bu tam hüquqi konsultasiya deyil, amma riskləri və növbəti addımları aydın izah edəcəyəm 📋💙",
      ru: "Спасибо, что доверились нам 🙏 Смотрю документы по лоту. Это не юридическая консультация в полном смысле, но дам понятный разбор рисков и следующих шагов 📋💙",
      en: "Thank you for trusting us 🙏 I'm reviewing the lot documents. This isn't full legal advice, but I'll give a clear breakdown of risks and next steps 📋💙",
    },
  },
  {
    id: "l2-payment",
    level: "L2",
    title: {
      az: "Ödəniş / geri ödəmə",
      ru: "Платёж / возврат",
      en: "Payment / refund",
    },
    text: {
      az: "Ödənişlə bağlı narahatlığı başa düşürəm 😔 Tranzaksiyanı maliyyə ilə artıq tutuşdururam. Hər addımda sizi məlumatlandıracağam - sürpriz olmadan 💚",
      ru: "Понимаю беспокойство из-за оплаты 😔 Уже сверила транзакцию с финансами. Держу вас в курсе на каждом шаге - без сюрпризов 💚",
      en: "I understand the worry about the payment 😔 I've already matched the transaction with finance. I'll keep you updated at every step - no surprises 💚",
    },
  },
  {
    id: "l2-incident",
    level: "L2",
    title: {
      az: "Hadisə / nasazlıq",
      ru: "Инцидент / сбой",
      en: "Incident / outage",
    },
    text: {
      az: "Narahatçılığa görə üzr istəyirik 💔 Komanda artıq düzəldir. Girişiniz və məlumatlarınız təhlükəsizdir. Bərpa olunan kimi buraya yazacağıq ✨",
      ru: "Извините за неудобства 💔 Команда уже чинит. Ваш доступ и данные в безопасности. Как только восстановим - сразу напишем сюда ✨",
      en: "Sorry for the inconvenience 💔 The team is already fixing it. Your access and data are safe. As soon as we're back - we'll message you here ✨",
    },
  },
  {
    id: "l2-resolve",
    level: "L2",
    title: {
      az: "Həll tapıldı",
      ru: "Решение найдено",
      en: "Resolved",
    },
    text: {
      az: "Hazırdır! 🎉 Problemi bizim tərəfdə bağladıq. Zəhmət olmasa yoxlayın və hər şey qaydasındadırsa yazın - çox sevinərik ❤️",
      ru: "Готово! 🎉 Проблему закрыли на нашей стороне. Проверьте, пожалуйста, и дайте знать, если всё ок - будем очень рады ❤️",
      en: "Done! 🎉 We fixed it on our side. Please check and let us know if everything looks good - we'd love to hear ❤️",
    },
  },
];

/** Достаёт title/text/label на выбранном языке (fallback → ru → en) */
export function locField(field, locale = "ru") {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] || field.ru || field.en || field.az || "";
}

export function getSupportTemplates(locale = "ru", level) {
  return SUPPORT_TEMPLATES.filter((t) => !level || t.level === level).map(
    (t) => ({
      ...t,
      title: locField(t.title, locale),
      text: locField(t.text, locale),
    })
  );
}

export function getSupportLevelMeta(levelId, locale = "ru") {
  const lv = SUPPORT_LEVELS[levelId];
  if (!lv) return { id: levelId, label: levelId, hint: "" };
  return {
    id: lv.id,
    label: locField(lv.label, locale),
    hint: locField(lv.hint, locale),
  };
}
