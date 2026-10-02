import { NextResponse } from "next/server";
import { getPaymentProvider, fulfillPaidOrder } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    const provider = getPaymentProvider("razorpay");
    const result = await provider.handleWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json({ error: result.message || "Invalid signature" }, { status: 400 });
    }

    if (result.event === "payment.captured" && result.orderId) {
      await fulfillPaidOrder(result.orderId, {
        provider: "razorpay",
        providerPaymentId: `wh_${Date.now()}`,
        amount: 0,
        currency: "INR",
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}
