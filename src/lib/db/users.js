/**
 * Пользователи PostgreSQL — CRUD для админки + терминал
 */
import prisma from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { mapUserToProfile } from "@/lib/db/userMapper";
import { PLANS } from "@/lib/subscription";
import { ROLES } from "@/lib/roles";

export async function listUsers({ role } = {}) {
  const where = role ? { role } : {};
  const rows = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapUserToProfile);
}

export async function getUserById(id) {
  const row = await prisma.user.findUnique({ where: { id } });
  return mapUserToProfile(row);
}

export async function createUser({
  email,
  password,
  displayName,
  firstName,
  lastName,
  phone,
  company,
  role = ROLES.INVESTOR,
  jobTitle,
  department,
}) {
  const normalized = String(email || "")
    .trim()
    .toLowerCase();
  if (!normalized || !password || String(password).length < 8) {
    const err = new Error("Email and password (min 8) required");
    err.status = 400;
    throw err;
  }
  const exists = await prisma.user.findUnique({ where: { email: normalized } });
  if (exists) {
    const err = new Error("Email already exists");
    err.status = 409;
    throw err;
  }
  const passwordHash = await hashPassword(password);
  const isStaff = role !== ROLES.INVESTOR;
  const row = await prisma.user.create({
    data: {
      email: normalized,
      passwordHash,
      displayName: displayName || normalized.split("@")[0],
      firstName: firstName || null,
      lastName: lastName || null,
      phone: phone || null,
      company: company || null,
      role,
      jobTitle: jobTitle || null,
      department: department || null,
      subscriptionPlan: isStaff ? PLANS.PRO : PLANS.FREE,
      subscriptionStartsAt: isStaff ? new Date() : null,
      subscriptionExpiresAt: isStaff
        ? new Date(Date.now() + 365 * 86400000)
        : null,
    },
  });
  return mapUserToProfile(row);
}

export async function updateUser(id, patch) {
  const data = {};
  const map = {
    displayName: "displayName",
    firstName: "firstName",
    lastName: "lastName",
    phone: "phone",
    company: "company",
    role: "role",
    blocked: "blocked",
    jobTitle: "jobTitle",
    department: "department",
    avatarId: "avatarId",
    presence: "presence",
    lastIp: "lastIp",
    lastGeo: "lastGeo",
    lastDevice: "lastDevice",
  };
  for (const [k, col] of Object.entries(map)) {
    if (patch[k] !== undefined) data[col] = patch[k];
  }
  if (patch.password) {
    data.passwordHash = await hashPassword(patch.password);
  }
  if (patch.password || patch.blocked === true) {
    data.sessionVersion = { increment: 1 };
  }
  if (patch.subscriptionPlan) {
    data.subscriptionPlan = patch.subscriptionPlan;
    if (patch.subscriptionPlan === PLANS.FREE) {
      data.subscriptionStartsAt = null;
      data.subscriptionExpiresAt = null;
    }
  }
  if (patch.subscriptionStartsAt != null) {
    data.subscriptionStartsAt = patch.subscriptionStartsAt
      ? new Date(patch.subscriptionStartsAt)
      : null;
  }
  if (patch.subscriptionExpiresAt != null) {
    data.subscriptionExpiresAt = patch.subscriptionExpiresAt
      ? new Date(patch.subscriptionExpiresAt)
      : null;
  }
  const row = await prisma.user.update({ where: { id }, data });
  return mapUserToProfile(row);
}

export async function deleteUser(id) {
  await prisma.user.delete({ where: { id } });
  return { ok: true };
}

/** Стереть чувствительные поля, аккаунт оставить */
export async function wipeUserSensitive(id) {
  const row = await prisma.user.update({
    where: { id },
    data: {
      phone: null,
      company: null,
      lastIp: null,
      lastGeo: null,
      lastDevice: null,
    },
  });
  return mapUserToProfile(row);
}
