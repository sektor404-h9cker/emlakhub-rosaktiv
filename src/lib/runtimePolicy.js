/**
 * Демо-сессия разрешена только локально и только явным флагом.
 * Падение PostgreSQL в production не включает mock.
 */
export function allowDemoFallback() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ALLOW_DEMO === "1"
  );
}
