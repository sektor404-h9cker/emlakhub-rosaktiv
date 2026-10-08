/**
 * Seed: первый админ + пустая база лотов
 * Запуск: npm run db:seed
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

/** Подхват .env / .env.local без dotenv-пакета */
function loadEnvFile(file) {
  const p = path.join(__dirname, "..", file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnvFile(".env");
loadEnvFile(".env.local");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@emlak.az";
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SEED_ADMIN_PASSWORD is required in production");
    }
    throw new Error(
      "Set SEED_ADMIN_PASSWORD in .env before npm run db:seed. No default password."
    );
  }
  if (process.env.NODE_ENV === "production") {
    if (password.length < 12 || password === "Admin123!" || password === "secret123") {
      throw new Error(
        "Production seed refused: use a unique password of at least 12 characters."
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      displayName: "Platform Admin",
      firstName: "Platform",
      lastName: "Admin",
      role: "admin",
      subscriptionPlan: "pro",
      subscriptionStartsAt: new Date(),
      subscriptionExpiresAt: new Date(Date.now() + 365 * 86400000),
    },
  });

  console.log("Admin ready:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
