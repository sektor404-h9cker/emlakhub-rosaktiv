/**
 * =============================================================================
 * РОЛИ И КОЛЛЕКЦИИ FIRESTORE
 * =============================================================================
 * users/{uid}     — профиль: role, blocked, email, displayName
 * lots/{id}       — лоты (демо + будущие из админки)
 * payments/{id}   — оплаты / подписки
 * chats/{uid}/messages/{msgId} — чат поддержки (uid клиента)
 * =============================================================================
 */

/** Роли доступа к терминалу */
export const ROLES = {
  ADMIN: "admin",
  DEVELOPER: "developer",
  SUPPORT: "support",
  INVESTOR: "investor",
};

/** Человекочитаемые ярлыки */
export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Админ",
  [ROLES.DEVELOPER]: "Разработчик",
  [ROLES.SUPPORT]: "Поддержка",
  [ROLES.INVESTOR]: "Инвестор",
};

/** Кто может зайти в /admin/* (часть разделов — по привилегиям) */
export const ADMIN_ROLES = [ROLES.ADMIN, ROLES.DEVELOPER, ROLES.SUPPORT];

/** Кто может зайти в /dashboard (инвесторский терминал) */
export const TERMINAL_ROLES = [
  ROLES.ADMIN,
  ROLES.DEVELOPER,
  ROLES.SUPPORT,
  ROLES.INVESTOR,
];

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function canAccessTerminal(role) {
  return TERMINAL_ROLES.includes(role);
}

/** Имена коллекций — одно место, чтобы не опечататься */
export const COLLECTIONS = {
  USERS: "users",
  LOTS: "lots",
  PAYMENTS: "payments",
  CHATS: "chats",
  MESSAGES: "messages",
  SETTINGS: "settings",
};
