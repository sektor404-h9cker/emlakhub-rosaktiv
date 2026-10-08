/**
 * HTTP-клиент для Route Handlers (browser → /api/*)
 * Все запросы с credentials для httpOnly cookie eh_session
 */

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || "Request failed");
    err.status = res.status;
    err.unavailable = Boolean(data.unavailable);
    err.configured = data.configured;
    throw err;
  }
  return data;
}

export async function apiGet(path) {
  const res = await fetch(path, { credentials: "include" });
  return parseJson(res);
}

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return parseJson(res);
}

export async function apiPatch(path, body) {
  const res = await fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return parseJson(res);
}

export async function apiDelete(path) {
  const res = await fetch(path, {
    method: "DELETE",
    credentials: "include",
  });
  return parseJson(res);
}

export async function fetchMe() {
  return apiGet("/api/auth/me");
}

export async function loginApi(email, password) {
  return apiPost("/api/auth/login", { email, password });
}

export async function logoutApi() {
  return apiPost("/api/auth/logout");
}

export async function registerApi(email, password, displayName, extra = {}) {
  return apiPost("/api/auth/register", { email, password, displayName, ...extra });
}

export async function fetchPayments() {
  return apiGet("/api/payments");
}

export async function createPayment(planKey) {
  return apiPost("/api/payments", { planKey });
}

export async function confirmPaymentApi(paymentId) {
  return apiPost(`/api/payments/${paymentId}/confirm`);
}

export async function fetchLots(adminView = false) {
  const q = adminView ? "?admin=1" : "";
  return apiGet(`/api/lots${q}`);
}

export async function fetchLotAnalysis(lotId, locale = "ru") {
  const q = locale === "az" ? "?locale=az" : "?locale=ru";
  return apiGet(`/api/lots/${encodeURIComponent(lotId)}/analysis${q}`);
}

/** Синк лотов с herrac.gov.az (admin) */
export async function syncHerracApi(body = {}) {
  return apiPost("/api/admin/herrac/sync", body);
}

export async function createLotApi(body) {
  return apiPost("/api/lots", body);
}

export async function updateLotApi(id, body) {
  return apiPatch(`/api/lots/${id}`, body);
}

export async function deleteLotApi(id) {
  return apiDelete(`/api/lots/${id}`);
}

export async function fetchUsers(role) {
  const q = role ? `?role=${encodeURIComponent(role)}` : "";
  return apiGet(`/api/users${q}`);
}

export async function createUserApi(body) {
  return apiPost("/api/users", body);
}

export async function updateUserApi(id, body) {
  return apiPatch(`/api/users/${id}`, body);
}

export async function deleteUserApi(id) {
  return apiDelete(`/api/users/${id}`);
}

export async function wipeUserApi(id) {
  return apiPost(`/api/users/${id}/wipe`);
}

export async function fetchSupportTickets() {
  return apiGet("/api/support/tickets");
}

export async function createSupportTicketApi(body) {
  return apiPost("/api/support/tickets", body);
}

export async function patchSupportTicketApi(id, body) {
  return apiPatch(`/api/support/tickets/${id}`, body);
}

export async function deleteSupportTicketApi(id) {
  return apiDelete(`/api/support/tickets/${id}`);
}

export async function postSupportMessageApi(id, body) {
  return apiPost(`/api/support/tickets/${id}/messages`, body);
}

export async function patchSupportMessageApi(ticketId, messageId, body) {
  return apiPatch(
    `/api/support/tickets/${ticketId}/messages/${messageId}`,
    body
  );
}

export async function deleteSupportMessageApi(ticketId, messageId) {
  return apiDelete(`/api/support/tickets/${ticketId}/messages/${messageId}`);
}
