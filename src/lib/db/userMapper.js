/**
 * Prisma User → формат профиля для фронта (AuthContext)
 */
import { PLANS } from "@/lib/subscription";

export function mapUserToProfile(row) {
  if (!row) return null;
  const startsAt = row.subscriptionStartsAt
    ? row.subscriptionStartsAt.getTime()
    : null;
  const expiresAt = row.subscriptionExpiresAt
    ? row.subscriptionExpiresAt.getTime()
    : null;

  return {
    id: row.id,
    uid: row.id,
    email: row.email,
    firstName: row.firstName || "",
    lastName: row.lastName || "",
    displayName:
      row.displayName ||
      [row.firstName, row.lastName].filter(Boolean).join(" ") ||
      row.email,
    phone: row.phone || "",
    company: row.company || "",
    role: row.role,
    blocked: row.blocked,
    jobTitle: row.jobTitle || "",
    department: row.department || "",
    avatarId: row.avatarId || "ocean",
    presence: row.presence || "online",
    lastIp: row.lastIp || "",
    lastGeo: row.lastGeo || "",
    lastDevice: row.lastDevice || "",
    subscription: {
      plan: row.subscriptionPlan || PLANS.FREE,
      startsAt,
      expiresAt,
      source: "postgres",
      updatedAt: row.updatedAt?.getTime?.() || Date.now(),
    },
    usage: { lotOpens: [], lotOpenCount: 0 },
  };
}

export function mapPaymentToClient(row) {
  return {
    id: row.id,
    userId: row.userId,
    userEmail: row.user?.email || row.userEmail,
    amount: Number(row.amount),
    currency: row.currency,
    planId: row.planId,
    planDays: row.planDays,
    status: row.status,
    activeFrom: row.activeFrom?.getTime?.() || null,
    activeTo: row.activeTo?.getTime?.() || null,
    createdAt: row.createdAt?.getTime?.() || Date.now(),
    confirmedAt: row.confirmedAt?.getTime?.() || null,
    note: row.note || "",
  };
}
