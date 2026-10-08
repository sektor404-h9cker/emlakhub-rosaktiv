/**
 * Хеширование паролей (bcrypt, cost 12)
 */
import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(String(plain), String(hash));
}

/** Known local seed password. Rejected in production so it cannot open a live admin. */
const KNOWN_DEV_PASSWORDS = new Set(["Admin123!"]);

export function isKnownDevPassword(plain) {
  return KNOWN_DEV_PASSWORDS.has(String(plain || ""));
}
