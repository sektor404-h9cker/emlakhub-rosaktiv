import { NextResponse } from "next/server";
import { PLAN_PRICES } from "@/lib/subscription";
import { isDatabaseConfigured } from "@/lib/db/config";
import { resolvePlan } from "@/lib/growth/service";
import { PAYMENT_PROVIDER } from "@/lib/payments/provider";

export async function GET() {
  const keys = Object.keys(PLAN_PRICES);
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      automatic: false,
      mode: PAYMENT_PROVIDER.id,
      plans: keys.map((key) => ({ key, ...PLAN_PRICES[key], currency: "AZN" })),
    });
  }
  const plans = [];
  for (const key of keys) {
    const price = await resolvePlan(key);
    plans.push({ key, ...price });
  }
  return NextResponse.json({
    automatic: false,
    mode: PAYMENT_PROVIDER.id,
    plans,
  });
}
