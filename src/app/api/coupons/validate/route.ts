import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { code, amount } = await request.json();
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 404 });
    }

    if (coupon.endDate && new Date(coupon.endDate) < new Date()) {
      return NextResponse.json({ error: "This coupon code has expired" }, { status: 400 });
    }

    const subtotal = Number(amount) || 0;
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon` },
        { status: 400 }
      );
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discount),
      message: `Coupon applied: ₹${Math.round(discount)} off!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to validate coupon" }, { status: 500 });
  }
}
