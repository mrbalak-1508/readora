import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const coupons = await prisma.coupon.findMany({
      include: {
        redemptions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(coupons);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const body = await request.json();
    const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, perUserLimit, active } = body;

    const coupon = await prisma.coupon.upsert({
      where: { code: code.trim().toUpperCase() },
      update: {
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
        active: Boolean(active),
      },
      create: {
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        perUserLimit: Number(perUserLimit) || 1,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
