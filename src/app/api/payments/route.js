/**
 * Платежи — заявка pending, не списание.
 * Подтверждает админ. Если базы нет, не подставляем локальный «оплачено».
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireConsent, canManagePayments } from "@/lib/auth/guards";
import {
  createPaymentIntent,
  listAllPayments,
  listPaymentsForUser,
} from "@/lib/db/payments";
import { mapPaymentToClient } from "@/lib/db/userMapper";

function apiError(err) {
  const status = err.status || 500;
  if (status >= 500) console.error("[payments]", err);
  const error =
    status >= 500
      ? "Платежи временно недоступны. Попробуйте позже."
      : err.message || "Request failed";
  return NextResponse.json(
    { error, unavailable: status >= 500 },
    { status: status >= 500 ? 503 : status }
  );
}

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ payments: [], configured: false });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    let rows;
    if (canManagePayments(session.role)) {
      rows = await listAllPayments();
    } else {
      rows = await listPaymentsForUser(session.userId);
    }
    return NextResponse.json({
      configured: true,
      payments: rows.map(mapPaymentToClient),
    });
  } catch (e) {
    return apiError(e);
  }
}

export async function POST(request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireConsent(await getSessionFromCookies());
    const body = await request.json();
    const planKey = body.planKey || "month";
    const row = await createPaymentIntent({
      userId: session.userId,
      planKey,
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `Payment pending: ${row.planId} ₼${row.amount}`,
        level: "info",
      },
    });
    return NextResponse.json({
      payment: mapPaymentToClient(row),
    });
  } catch (e) {
    return apiError(e);
  }
}
