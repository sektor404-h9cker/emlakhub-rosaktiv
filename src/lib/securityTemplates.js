/**
 * Шаблоны сообщений Департамента безопасности Emlak Hub
 */

export const SECURITY_TEMPLATES = [
  {
    id: "sec-login",
    severity: "info",
    titleRu: "Подозрительный вход",
    titleAz: "Şübhəli giriş",
    bodyRu:
      "Здравствуйте. Департамент безопасности Emlak Hub зафиксировал вход с нового устройства. Если это были вы - подтвердите в профиле. Если нет - смените пароль и напишите в поддержку.",
    bodyAz:
      "Salam. Emlak Hub Təhlükəsizlik Departamenti yeni cihazdan giriş qeydə aldı. Siz idinizsə - profildə təsdiqləyin. Deyilsinizsə - şifrəni dəyişin və dəstəyə yazın.",
  },
  {
    id: "sec-fraud",
    severity: "critical",
    titleRu: "Проверка транзакции",
    titleAz: "Tranzaksiya yoxlaması",
    bodyRu:
      "Ваша недавняя операция отправлена на ручную проверку антифрода. Доступ к PRO может быть временно ограничен - это защита вашего счёта. Обычно занимает до 24 часов.",
    bodyAz:
      "Son əməliyyatınız antifraud yoxlamasına göndərilib. PRO girişi müvəqqəti məhdudlaşdırıla bilər - bu hesabınızı qoruyur. Adətən 24 saata qədər çəkir.",
  },
  {
    id: "sec-password",
    severity: "warn",
    titleRu: "Рекомендуем сменить пароль",
    titleAz: "Şifrəni dəyişməyi tövsiyə edirik",
    bodyRu:
      "Мы заметили несколько неудачных попыток входа. Рекомендуем сменить пароль и включить уведомления о сессиях. Департамент безопасности Emlak Hub всегда на связи.",
    bodyAz:
      "Bir neçə uğursuz giriş cəhdi gördük. Şifrəni dəyişməyi və sessiya bildirişlərini aktivləşdirməyi tövsiyə edirik. Emlak Hub Təhlükəsizlik Departamenti həmişə əlaqədədir.",
  },
  {
    id: "sec-block",
    severity: "critical",
    titleRu: "Аккаунт временно ограничен",
    titleAz: "Hesab müvəqqəti məhdudlaşdırılıb",
    bodyRu:
      "В целях безопасности доступ к терминалу ограничен до завершения проверки. Ответьте на это уведомление или откройте тикет - мы поможем быстрее.",
    bodyAz:
      "Təhlükəsizlik üçün terminal girişi yoxlama bitənə qədər məhdudlaşdırılıb. Bu bildirişə cavab yazın və ya tiket açın - daha tez kömək edəcəyik.",
  },
  {
    id: "sec-clear",
    severity: "ok",
    titleRu: "Проверка завершена",
    titleAz: "Yoxlama tamamlandı",
    bodyRu:
      "Спасибо за терпение. Проверка Департамента безопасности завершена - ограничений нет. Приятной работы в Emlak Hub.",
    bodyAz:
      "Səbriniz üçün təşəkkür. Təhlükəsizlik yoxlaması bitdi - məhdudiyyət yoxdur. Emlak Hub-da xoş işlər.",
  },
  {
    id: "sec-phish",
    severity: "warn",
    titleRu: "Осторожно: фишинг",
    titleAz: "Diqqət: fişinq",
    bodyRu:
      "Emlak Hub никогда не просит пароль или код в мессенджерах. Письма только с @emlakhub.net. При сомнении - перешлите письмо в security@emlakhub.net.",
    bodyAz:
      "Emlak Hub heç vaxt mesajlarda şifrə və ya kod istəmir. Məktublar yalnız @emlakhub.net-dən. Şübhə varsa - security@emlakhub.net ünvanına göndərin.",
  },
];

export const SEVERITY_META = {
  info: { label: "Info", cls: "text-sky-300 bg-sky-500/15 border-sky-400/30" },
  warn: {
    label: "Warn",
    cls: "text-amber-300 bg-amber-500/15 border-amber-400/30",
  },
  critical: {
    label: "Critical",
    cls: "text-rose-300 bg-rose-500/15 border-rose-400/30",
  },
  ok: {
    label: "OK",
    cls: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30",
  },
};
