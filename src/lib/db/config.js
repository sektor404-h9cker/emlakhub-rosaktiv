/**
 * Проверка: настроена ли PostgreSQL (DATABASE_URL)
 */
export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
