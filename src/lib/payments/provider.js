/**
 * Место для платёжного провайдера.
 * Пока ни один провайдер не подключён и не проверен по его документации,
 * касса остаётся ручной. Успешная страница сама PRO не включает.
 */

export const PAYMENT_PROVIDER = {
  id: "manual",
  automatic: false,
};

export async function createCheckout() {
  return {
    mode: "manual",
    automatic: false,
    checkoutUrl: null,
  };
}

export async function verifyWebhook() {
  const err = new Error("Платёжный провайдер не подключён.");
  err.status = 501;
  throw err;
}

export async function getPaymentStatus(payment) {
  return {
    mode: "manual",
    automatic: false,
    status: payment?.status || "unknown",
  };
}

export async function handleRefund() {
  const err = new Error("Автоматический возврат провайдера не подключён.");
  err.status = 501;
  throw err;
}

export async function reconcilePayment() {
  return { mode: "manual", automatic: false, updated: false };
}
