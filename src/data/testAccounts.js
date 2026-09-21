/**
 * =============================================================================
 * TEST ACCOUNTS — локальный доступ без Firebase
 * =============================================================================
 * Пароль для всех: EmlakHub2026!
 * =============================================================================
 */

import { ROLES, isAdminRole } from "@/lib/firebase/constants";
import { adminHomeForRole } from "@/lib/adminPrivileges";
import { PLANS, defaultSubscription } from "@/lib/subscription";

export const TEST_PASSWORD = "EmlakHub2026!";

export const TEST_ACCOUNTS = [
  {
    email: "admin@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.ADMIN,
    displayName: "Admin Demo",
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    email: "investor@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.INVESTOR,
    displayName: "Investor Demo",
    subscription: defaultSubscription(PLANS.FREE),
  },
  {
    email: "dev@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.DEVELOPER,
    displayName: "Developer Demo",
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    email: "support@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.SUPPORT,
    displayName: "Support Demo",
    subscription: defaultSubscription(PLANS.PRO),
  },
];

export function resolveTestAccount(email, password) {
  const normalized = email.trim().toLowerCase();
  return (
    TEST_ACCOUNTS.find(
      (acc) => acc.email === normalized && acc.password === password
    ) || null
  );
}

export function redirectAfterLogin(role) {
  if (isAdminRole(role)) return adminHomeForRole(role);
  return "/dashboard";
}
