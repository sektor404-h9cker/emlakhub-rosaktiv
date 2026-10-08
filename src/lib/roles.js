/**
 * Роли доступа. Источник правды — PostgreSQL `users.role`.
 */

export const ROLES = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  SUPPORT: "support",
  SOC: "soc",
  INVESTOR: "investor",
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Админ",
  [ROLES.DEVELOPER]: "Разработчик",
  [ROLES.SUPPORT]: "Поддержка",
  [ROLES.SOC]: "SOC / Security",
  [ROLES.INVESTOR]: "Инвестор",
};

export const ADMIN_ROLES = [
  ROLES.ADMIN,
  ROLES.DEVELOPER,
  ROLES.SUPPORT,
  ROLES.SOC,
];

export const TERMINAL_ROLES = [
  ROLES.ADMIN,
  ROLES.DEVELOPER,
  ROLES.SUPPORT,
  ROLES.SOC,
  ROLES.INVESTOR,
];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function canAccessTerminal(role) {
  return TERMINAL_ROLES.includes(role) || Boolean(role);
}
