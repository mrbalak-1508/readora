import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getPaymentProvider, fulfillPaidOrder } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      orderId,
      providerPaymentId,
      providerOrderId,
      providerSignature,
      provider = "razorpay",
    } = body;

    if (!orderId || !providerPaymentId) {
      return NextResponse.json({ error: "Missing verification parameters" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Verify payment server-side via provider abstraction
    const paymentGateway = getPaymentProvider(provider);
    const isValid = await paymentGateway.verifyPayment({
      orderId,
      providerPaymentId,
      providerOrderId,
      providerSignature,
    });

    if (!isValid) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // Fulfill order idempotently and create BookEntitlement
    const fulfilledOrder = await fulfillPaidOrder(orderId, {
      provider,
      providerPaymentId,
      providerOrderId,
      amount: order.totalAmount,
      currency: order.currency,
    });

    const primaryBookId = fulfilledOrder.items[0]?.bookId;

    return NextResponse.json({
      success: true,
      orderNumber: fulfilledOrder.orderNumber,
      bookId: primaryBookId,
      message: "Payment successfully verified and book unlocked.",
    });
  } catch (error: any) {
    console.error("Payment verification server error:", error);
    return NextResponse.json({ error: error.message || "Verification failed" }, { status: 500 });
  }
}
