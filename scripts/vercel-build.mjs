/**
 * Vercel build. Migrations stay in `npm run build` for CI and local Postgres.
 * The production Prisma Postgres password is rejected, and Prisma reports that
 * as P1001, so a migrate step here stops the site from deploying.
 */
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["prisma", "generate"]);
run("npx", ["next", "build"]);
