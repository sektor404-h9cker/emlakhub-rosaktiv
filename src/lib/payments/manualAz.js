/**
 * Оплата до юрлица / эквайринга (Азербайджан)
 * =============================================================================
 * Пока компания не зарегистрирована и нет GoldenPay/Kapital и т.п.:
 *   1) Пользователь создаёт заявку pending в /api/payments
 *   2) Переводит на M10 / bank по реквизитам ниже
 *   3) Админ в Finance жмёт «Подтвердить» → PRO
 *
 * Когда будет 10+ платящих и VÖEN — подключаем полноценный эквайринг.
 * =============================================================================
 */

export const PAYMENT_MODE = "manual_m10"; // manual_m10 | card_gateway

export const MANUAL_PAYMENT = {
  /** Пока пусто — админ подставит свой M10 / номер карты */
  m10Phone: process.env.NEXT_PUBLIC_M10_PHONE || "",
  m10Label: "M10",
  bankNoteAz:
    "Ödənişdən sonra screenshot göndərin. Admin təsdiqləyəndən sonra PRO açılacaq.",
  bankNoteRu:
    "После перевода пришлите скрин. PRO откроется после подтверждения админом.",
  bankNoteEn:
    "After the transfer, send a screenshot. PRO opens after an admin confirms it.",
  contactAz: "Dəstək / WhatsApp — profil və ya support.",
  contactRu: "Поддержка / WhatsApp — профиль или support.",
  contactEn: "Support / WhatsApp — profile or support.",
};

export function manualPayHint(locale = "ru") {
  const phone = MANUAL_PAYMENT.m10Phone;
  if (locale === "az") {
    return phone
      ? `M10: ${phone}. ${MANUAL_PAYMENT.bankNoteAz}`
      : `M10 / bank köçürməsi. ${MANUAL_PAYMENT.bankNoteAz}`;
  }
  if (locale === "en") {
    return phone
      ? `M10: ${phone}. ${MANUAL_PAYMENT.bankNoteEn}`
      : `M10 / bank transfer. ${MANUAL_PAYMENT.bankNoteEn}`;
  }
  return phone
    ? `M10: ${phone}. ${MANUAL_PAYMENT.bankNoteRu}`
    : `M10 / банковский перевод. ${MANUAL_PAYMENT.bankNoteRu}`;
}
