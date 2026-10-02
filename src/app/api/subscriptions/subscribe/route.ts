import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await request.json();
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.active) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 404 });
    }

    const periodEnd = new Date();
    if (plan.interval === "YEARLY") {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    // Upsert user subscription
    const existingSub = await prisma.subscription.findFirst({
      where: { userId: user.id },
    });

    let subscription;
    if (existingSub) {
      subscription = await prisma.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
        include: { plan: true },
      });
    } else {
      subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
        include: { plan: true },
      });
    }

    // Create confirmation notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Welcome to Readora Premium!",
        message: `Your ${plan.name} membership is active. Enjoy unlimited access across all eligible volumes.`,
        type: "success",
        link: "/settings/subscription",
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
