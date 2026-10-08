/**
 * Общее состояние админки: баннер системы, задачи, чат команды, привилегии.
 * Одна строка на всю платформу, чтобы сотрудники видели одно и то же.
 */
import prisma from "@/lib/db/prisma";

const ID = "main";

export async function readPlatformState() {
  const row = await prisma.platformState.findUnique({ where: { id: ID } });
  if (!row) return { system: null, ops: null };
  return { system: row.system, ops: row.ops };
}

export async function writePlatformState({ system, ops }) {
  return prisma.platformState.upsert({
    where: { id: ID },
    create: { id: ID, system, ops },
    update: { system, ops },
  });
}
