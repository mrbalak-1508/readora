import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to checkout" }, { status: 401 });
    }

    const body = await request.json();
    const { bookId, planId, couponCode, provider = "razorpay" } = body;

    let subtotal = 0;
    let title = "";
    let itemBookId: string | null = null;
    let itemType: "BOOK" | "SUBSCRIPTION" = "BOOK";

    if (bookId) {
      const book = await prisma.book.findFirst({
        where: {
          OR: [{ id: bookId }, { slug: bookId }],
        },
      });

      if (!book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      // Check if user already owns the book
      const existingEntitlement = await prisma.bookEntitlement.findUnique({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: book.id,
          },
        },
      });

      if (existingEntitlement?.active) {
        return NextResponse.json(
          { error: "You already own full access to this book." },
          { status: 400 }
        );
      }

      subtotal = book.price || 0;
      title = book.title;
      itemBookId = book.id;
    } else if (planId) {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: {
          OR: [{ id: planId }, { slug: planId }],
        },
      });

      if (!plan) {
        return NextResponse.json({ error: "Subscription plan not found" }, { status: 404 });
      }

      subtotal = plan.price;
      title = plan.name;
      itemType = "SUBSCRIPTION";
    } else {
      return NextResponse.json({ error: "Invalid checkout request: missing item" }, { status: 400 });
    }

    // Apply Coupon if supplied
    let discountAmount = 0;
    let couponRecord = null;

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.trim().toUpperCase() },
      });

      if (coupon && coupon.active) {
        const isNotExpired = !coupon.endDate || new Date(coupon.endDate) > new Date();
        const meetsMinAmount = subtotal >= coupon.minOrderAmount;

        if (isNotExpired && meetsMinAmount) {
          if (coupon.discountType === "PERCENTAGE") {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
              discountAmount = coupon.maxDiscountAmount;
            }
          } else {
            discountAmount = coupon.discountValue;
          }
          couponRecord = coupon;
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create Order with PENDING status in DB
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "PENDING",
        subtotal,
        discountAmount,
        totalAmount,
        currency: "INR",
        paymentProvider: provider,
        couponId: couponRecord?.id,
        items: {
          create: {
            bookId: itemBookId,
            title,
            price: totalAmount,
            quantity: 1,
            metadata: JSON.stringify({ itemType }),
          },
        },
      },
    });

    // If order total is 0 (100% coupon or promo), immediately fulfill and unlock!
    if (totalAmount === 0) {
      if (itemBookId) {
        await prisma.bookEntitlement.upsert({
          where: {
            userId_bookId: {
              userId: user.id,
              bookId: itemBookId,
            },
          },
          update: { active: true, source: "PROMO", orderId: order.id },
          create: {
            userId: user.id,
            bookId: itemBookId,
            orderId: order.id,
            source: "PROMO",
            active: true,
          },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID", paymentMethod: "free_promo" },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        isZeroAmount: true,
      });
    }

    // Call payment provider abstraction
    const paymentGateway = getPaymentProvider(provider);
    const providerOrder = await paymentGateway.createOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: totalAmount,
      currency: "INR",
      userEmail: user.email,
      userName: user.name,
      bookTitle: title,
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount,
      currency: "INR",
      paymentData: providerOrder,
    });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to initiate payment" }, { status: 500 });
  }
}
