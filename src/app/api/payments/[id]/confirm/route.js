/**
 * POST /api/payments/[id]/confirm — админ подтверждает оплату → PRO
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin, canManagePayments } from "@/lib/auth/guards";
import { confirmPayment } from "@/lib/db/payments";
import { mapPaymentToClient, mapUserToProfile } from "@/lib/db/userMapper";

export async function POST(_request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    if (!canManagePayments(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const payment = await confirmPayment({
      paymentId: id,
      adminEmail: session.email,
    });
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
    });
    await prisma.auditLog.create({
      data: {
        actorId: session.userId,
        actorEmail: session.email,
        action: `Payment confirmed: ${id} → ${user?.email}`,
        level: "warn",
      },
    });
    return NextResponse.json({
      payment: mapPaymentToClient(payment),
      profile: mapUserToProfile(user),
    });
  } catch (e) {
    const status = e.status || 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}
