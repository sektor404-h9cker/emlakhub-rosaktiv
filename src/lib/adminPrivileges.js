/**
 * Привилегии админ-панели по ролям (дефолт + динамическая матрица)
 */

import { ROLES } from "@/lib/roles";

export const PRIV = {
  USERS: "users",
  STAFF: "staff",
  FINANCE: "finance",
  SUPPORT: "support",
  SYSTEM: "system",
  SECURITY: "security",
  TEAM: "team",
  TASKS: "tasks",
  SETTINGS: "settings",
  LOTS: "lots",
};

export const PRIV_LABELS = {
  [PRIV.USERS]: "Клиенты",
  [PRIV.STAFF]: "Сотрудники",
  [PRIV.FINANCE]: "Финансы",
  [PRIV.SUPPORT]: "Поддержка",
  [PRIV.SYSTEM]: "Система",
  [PRIV.SECURITY]: "Безопасность",
  [PRIV.TEAM]: "Чат команды",
  [PRIV.TASKS]: "Задачи",
  [PRIV.SETTINGS]: "Настройки",
  [PRIV.LOTS]: "Лоты",
};

/** Матрица по умолчанию */
export const DEFAULT_ROLE_PRIVILEGES = {
  [ROLES.ADMIN]: [
    PRIV.USERS,
    PRIV.STAFF,
    PRIV.FINANCE,
    PRIV.SUPPORT,
    PRIV.SYSTEM,
    PRIV.SECURITY,
    PRIV.TEAM,
    PRIV.TASKS,
    PRIV.SETTINGS,
    PRIV.LOTS,
  ],
  [ROLES.DEVELOPER]: [
    PRIV.USERS,
    PRIV.STAFF,
    PRIV.SUPPORT,
    PRIV.SYSTEM,
    PRIV.SECURITY,
    PRIV.TEAM,
    PRIV.TASKS,
    PRIV.LOTS,
  ],
  [ROLES.SUPPORT]: [PRIV.SUPPORT, PRIV.TEAM, PRIV.TASKS],
  [ROLES.SOC]: [PRIV.SECURITY, PRIV.SUPPORT, PRIV.TEAM, PRIV.TASKS],
  [ROLES.INVESTOR]: [],
};

/** @deprecated alias - используйте DEFAULT_ROLE_PRIVILEGES */
export const ROLE_PRIVILEGES = DEFAULT_ROLE_PRIVILEGES;

export function hasPrivilege(role, priv, matrix = DEFAULT_ROLE_PRIVILEGES) {
  return (matrix[role] || []).includes(priv);
}

export function roleHasAnyAdminAccess(role, matrix = DEFAULT_ROLE_PRIVILEGES) {
  return (matrix[role] || []).length > 0;
}

export function adminHomeForRole(role, matrix = DEFAULT_ROLE_PRIVILEGES) {
  const list = matrix[role] || [];
  if (list.includes(PRIV.USERS)) return "/admin/users";
  if (list.includes(PRIV.STAFF)) return "/admin/staff";
  if (list.includes(PRIV.TASKS)) return "/admin/tasks";
  if (list.includes(PRIV.SUPPORT)) return "/admin/support";
  if (list.includes(PRIV.TEAM)) return "/admin/team";
  if (list.includes(PRIV.SYSTEM)) return "/admin/system";
  if (list.includes(PRIV.SECURITY)) return "/admin/security";
  if (list.includes(PRIV.FINANCE)) return "/admin/finance";
  if (list.includes(PRIV.SETTINGS)) return "/admin/settings";
  return "/dashboard";
}

export function clonePrivileges(matrix = DEFAULT_ROLE_PRIVILEGES) {
  return Object.fromEntries(
    Object.entries(matrix).map(([k, v]) => [k, [...v]])
  );
}

/** Профиль и журнал действий - любой, у кого есть хоть один доступ в /admin */
export function isSoftAdminPath(pathname) {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin/profile") ||
    pathname.startsWith("/admin/activity")
  );
}
