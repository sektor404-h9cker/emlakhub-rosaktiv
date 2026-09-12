/**
 * =============================================================================
 * TEST ACCOUNTS — локальный доступ без Firebase
 * =============================================================================
 * Используются только когда .env.local пустой (DEMO-режим).
 * На экране /login кнопок нет — вход обычной формой email + пароль.
 *
 * Админ-панель:  admin@emlakhub.net
 * Терминал:      investor@emlakhub.net
 * Разработчик:   dev@emlakhub.net  (тоже видит /admin)
 *
 * Пароль для всех тестовых аккаунтов: EmlakHub2026!
 * =============================================================================
 */

import { ROLES, isAdminRole } from "@/lib/firebase/constants";

export const TEST_PASSWORD = "EmlakHub2026!";

export const TEST_ACCOUNTS = [
  {
    email: "admin@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.ADMIN,
    displayName: "Admin Demo",
  },
  {
    email: "investor@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.INVESTOR,
    displayName: "Investor Demo",
  },
  {
    email: "dev@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.DEVELOPER,
    displayName: "Developer Demo",
    blocked: true,
  },
];

/** Проверка email/пароля в DEMO-режиме */
export function resolveTestAccount(email, password) {
  const normalized = email.trim().toLowerCase();
  return (
    TEST_ACCOUNTS.find(
      (acc) => acc.email === normalized && acc.password === password
    ) || null
  );
}

/** Куда отправить после входа */
export function redirectAfterLogin(role) {
  return isAdminRole(role) ? "/admin/users" : "/dashboard";
}
