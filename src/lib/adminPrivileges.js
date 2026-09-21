/**
 * Привилегии админ-панели по ролям
 */

import { ROLES } from "@/lib/firebase/constants";

export const PRIV = {
  USERS: "users",
  FINANCE: "finance",
  SUPPORT: "support",
  SYSTEM: "system",
  SECURITY: "security",
};

/** Матрица: что видит роль в /admin */
export const ROLE_PRIVILEGES = {
  [ROLES.ADMIN]: [
    PRIV.USERS,
    PRIV.FINANCE,
    PRIV.SUPPORT,
    PRIV.SYSTEM,
    PRIV.SECURITY,
  ],
  [ROLES.DEVELOPER]: [
    PRIV.USERS,
    PRIV.SUPPORT,
    PRIV.SYSTEM,
    PRIV.SECURITY,
  ],
  [ROLES.SUPPORT]: [PRIV.SUPPORT],
  [ROLES.INVESTOR]: [],
};

export function hasPrivilege(role, priv) {
  return (ROLE_PRIVILEGES[role] || []).includes(priv);
}

export function adminHomeForRole(role) {
  const list = ROLE_PRIVILEGES[role] || [];
  if (list.includes(PRIV.USERS)) return "/admin/users";
  if (list.includes(PRIV.SUPPORT)) return "/admin/support";
  if (list.includes(PRIV.SYSTEM)) return "/admin/system";
  if (list.includes(PRIV.SECURITY)) return "/admin/security";
  if (list.includes(PRIV.FINANCE)) return "/admin/finance";
  return "/dashboard";
}
