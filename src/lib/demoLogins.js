/**
 * Динамические демо-логины (сотрудники, добавленные в админке)
 * Хранятся отдельно от TEST_ACCOUNTS
 */

const KEY = "eh_demo_logins_v1";

export function readDemoLogins() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeDemoLogins(list) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertDemoLogin(account) {
  const email = account.email.trim().toLowerCase();
  const list = readDemoLogins().filter((a) => a.email !== email);
  list.unshift({ ...account, email });
  writeDemoLogins(list);
  return list;
}

export function removeDemoLogin(email) {
  const normalized = email.trim().toLowerCase();
  const list = readDemoLogins().filter((a) => a.email !== normalized);
  writeDemoLogins(list);
  return list;
}

export function findDemoLogin(email, password) {
  const normalized = email.trim().toLowerCase();
  return (
    readDemoLogins().find(
      (a) => a.email === normalized && a.password === password
    ) || null
  );
}
