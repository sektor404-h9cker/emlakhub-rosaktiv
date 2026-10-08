/**
 * Production health. No credentials, paths, or stack traces.
 */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import prisma from "@/lib/db/prisma";

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, db: "unconfigured" }, { status: 503 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" });
  } catch (err) {
    console.error("[health]", err);
    return NextResponse.json({ ok: false, db: "down" }, { status: 503 });
  }
}
