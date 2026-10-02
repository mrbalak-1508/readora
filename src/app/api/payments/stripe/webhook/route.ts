import { NextResponse } from "next/server";
import { getPaymentProvider, fulfillPaidOrder } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const provider = getPaymentProvider("stripe");
    const result = await provider.handleWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    if (result.event === "payment_intent.succeeded" && result.orderId) {
      await fulfillPaidOrder(result.orderId, {
        provider: "stripe",
        providerPaymentId: `wh_stripe_${Date.now()}`,
        amount: 0,
        currency: "INR",
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
