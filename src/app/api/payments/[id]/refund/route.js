import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/lib/db/config";
import { getSessionFromCookies } from "@/lib/auth/session";
import { requireAdmin, canManagePayments } from "@/lib/auth/guards";
import { refundPayment } from "@/lib/db/payments";
import { mapPaymentToClient } from "@/lib/db/userMapper";

export async function POST(request, context) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }
  try {
    const session = await requireAdmin(await getSessionFromCookies());
    if (!canManagePayments(session.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const payment = await refundPayment({
      paymentId: id,
      adminEmail: session.email,
      reason: body.reason || "refund",
    });
    return NextResponse.json({ payment: mapPaymentToClient(payment), automatic: false });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Request failed" }, { status: err.status || 500 });
  }
}
