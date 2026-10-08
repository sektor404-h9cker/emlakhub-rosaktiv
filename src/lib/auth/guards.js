/**
 * Проверки прав на сервере (API routes)
 */
import { ADMIN_ROLES, ROLES } from "@/lib/roles";
import { isProActive } from "@/lib/subscription";
import { mapUserToProfile } from "@/lib/db/userMapper";
import { assertCurrentConsent } from "@/lib/legal/consent";

export function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

export function requireSession(session) {
  if (!session?.userId) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return session;
}

export async function requireAdmin(session) {
  requireSession(session);
  if (!isAdminRole(session.role)) {
    const err = new Error("Forbidden");
    err.status = 403;
    throw err;
  }
  await assertCurrentConsent(session.userId);
  return session;
}

export async function requireConsent(session) {
  requireSession(session);
  await assertCurrentConsent(session.userId);
  return session;
}

export function requireProUser(userRow) {
  const profile = mapUserToProfile(userRow);
  if (isAdminRole(profile.role)) return profile;
  if (!isProActive(profile.subscription)) {
    const err = new Error("Subscription required");
    err.status = 403;
    throw err;
  }
  return profile;
}

export function canManagePayments(role) {
  return role === ROLES.ADMIN || role === ROLES.DEVELOPER;
}
