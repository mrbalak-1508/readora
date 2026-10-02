import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    const plans = await prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { displayOrder: "asc" },
    });

    const formattedPlans = plans.map((p) => ({
      ...p,
      benefits: JSON.parse(p.benefits || "[]"),
    }));

    let userSubscription = null;
    if (user) {
      userSubscription = await prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "ACTIVE",
        },
        include: {
          plan: true,
        },
      });
    }

    return NextResponse.json({
      plans: formattedPlans,
      userSubscription,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
