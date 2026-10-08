/**
 * =============================================================================
 * TEST ACCOUNTS - локальный доступ без Firebase
 * =============================================================================
 * Пароль для всех: EmlakHub2026!
 * Доп. сотрудники из /admin/staff → eh_demo_logins_v1
 * =============================================================================
 */

import { ROLES } from "@/lib/roles";
import { redirectAfterLogin } from "@/lib/auth/redirect";
import { PLANS, defaultSubscription } from "@/lib/subscription";
import { findDemoLogin } from "@/lib/demoLogins";

export const TEST_PASSWORD = "EmlakHub2026!";

export const TEST_ACCOUNTS = [
  {
    email: "admin@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.ADMIN,
    firstName: "Leyla",
    lastName: "Mammadova",
    displayName: "Leyla Mammadova",
    jobTitle: "Head of Ops",
    department: "ops",
    presence: "online",
    avatarId: "ocean",
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    email: "investor@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.INVESTOR,
    firstName: "Rashad",
    lastName: "Aliyev",
    displayName: "Rashad Aliyev",
    avatarId: "forest",
    subscription: defaultSubscription(PLANS.FREE),
  },
  {
    email: "dev@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.DEVELOPER,
    firstName: "Kamran",
    lastName: "Hasanov",
    displayName: "Kamran Hasanov",
    jobTitle: "Full-stack",
    department: "product",
    presence: "busy",
    avatarId: "grape",
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    email: "support@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.SUPPORT,
    firstName: "Nigar",
    lastName: "Ismayilova",
    displayName: "Nigar Ismayilova",
    jobTitle: "L1 Support",
    department: "support",
    presence: "online",
    avatarId: "teal",
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    email: "soc@emlakhub.net",
    password: TEST_PASSWORD,
    role: ROLES.SOC,
    firstName: "Orkhan",
    lastName: "Huseynov",
    displayName: "Orkhan Huseynov",
    jobTitle: "SOC Analyst",
    department: "security",
    presence: "away",
    avatarId: "rose",
    subscription: defaultSubscription(PLANS.PRO),
  },
];

export function resolveTestAccount(email, password) {
  const normalized = email.trim().toLowerCase();
  const builtIn = TEST_ACCOUNTS.find(
    (acc) => acc.email === normalized && acc.password === password
  );
  if (builtIn) return builtIn;
  return findDemoLogin(email, password);
}

export { redirectAfterLogin };
