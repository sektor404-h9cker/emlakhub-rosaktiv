import { NextResponse } from "next/server";
import { verifyWebhook } from "@/lib/payments/provider";

export async function POST() {
  try {
    await verifyWebhook();
    return NextResponse.json({ ok: false }, { status: 501 });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Платёжный провайдер не подключён.", automatic: false },
      { status: err.status || 501 }
    );
  }
}
