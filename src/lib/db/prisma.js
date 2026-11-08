/**
 * =============================================================================
 * Prisma Client — единственная точка доступа к PostgreSQL
 * =============================================================================
 * Файл: src/lib/db/prisma.js
 * Использование: только из Route Handlers (src/app/api/**) и server actions.
 * НЕ импортировать в client components ("use client").
 * =============================================================================
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

function isCurrentClient(client) {
  const fields = client?._runtimeDataModel?.models?.User?.fields;
  const hasSession = Array.isArray(fields) && fields.some((field) => field.name === "sessionVersion");
  return Boolean(client?.user?.findMany && client?.herracSyncState?.findUnique && hasSession);
}

const cached = globalForPrisma.prisma;
if (cached && !isCurrentClient(cached)) {
  cached.$disconnect?.().catch(() => {});
  globalForPrisma.prisma = undefined;
}

const databaseUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

/** @type {PrismaClient} */
export const prisma = isCurrentClient(globalForPrisma.prisma)
  ? globalForPrisma.prisma
  : new PrismaClient({
      datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
      log:
        process.env.NODE_ENV === "development"
          ? ["error", "warn"]
          : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
