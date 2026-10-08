/**
 * =============================================================================
 * Сессия пользователя — httpOnly cookie + JWT (jose)
 * =============================================================================
 * Cookie: eh_session
 * Payload: { sub: userId, email, role }
 * =============================================================================
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";

export const SESSION_COOKIE = "eh_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 14 дней

const DEV_ONLY_SECRET = "dev-only-change-me-in-production";
const sessionTestStore = new AsyncLocalStorage();

/** Test-only: run a route handler with a raw session JWT. Production never sets this store. */
export function withSessionToken(token, fn) {
  return sessionTestStore.run(token, fn);
}

function secretKey() {
  const raw = process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET || "";
  if (process.env.NODE_ENV === "production") {
    if (raw.length < 32 || raw === DEV_ONLY_SECRET || raw === "secret123") {
      throw new Error("SESSION_SECRET is missing or too weak for production");
    }
  }
  return new TextEncoder().encode(raw || DEV_ONLY_SECRET);
}

export async function createSessionToken(payload) {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
    sessionVersion: Number(payload.sessionVersion || 0),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionVersion: Number(payload.sessionVersion || 0),
    };
  } catch {
    return null;
  }
}

/** JWT is valid only while it matches the user row and the account is not blocked. */
export async function resolveLiveSession(token) {
  const parsed = await verifySessionToken(token);
  if (!parsed?.userId || !isDatabaseConfigured()) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
      select: {
        id: true,
        email: true,
        role: true,
        blocked: true,
        sessionVersion: true,
      },
    });
    if (!user || user.blocked) return null;
    if (Number(user.sessionVersion || 0) !== parsed.sessionVersion) return null;
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionVersion: user.sessionVersion,
    };
  } catch (err) {
    console.error("[session]", err);
    return null;
  }
}

export async function setSessionCookie(token) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function clearSessionCookie() {
  try {
    const jar = await cookies();
    jar.delete(SESSION_COOKIE);
  } catch (err) {
    if (sessionTestStore.getStore() === undefined) throw err;
  }
}

export async function getSessionFromCookies() {
  const override = sessionTestStore.getStore();
  if (override !== undefined) return resolveLiveSession(override || "");
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return resolveLiveSession(token);
}

export async function revokeUserSessions(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}

export async function revokeAllSessions() {
  await prisma.user.updateMany({
    data: { sessionVersion: { increment: 1 } },
  });
}
