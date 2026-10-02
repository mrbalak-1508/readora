import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const [plans, subscriptions] = await Promise.all([
      prisma.subscriptionPlan.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.subscription.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          plan: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
    const cancelledSubs = subscriptions.filter((s) => s.status === "CANCELLED" || s.cancelAtPeriodEnd);

    // Calculate MRR & ARR
    let mrr = 0;
    for (const sub of activeSubs) {
      if (sub.plan?.interval === "MONTHLY") {
        mrr += sub.plan.price;
      } else if (sub.plan?.interval === "YEARLY") {
        mrr += Math.round(sub.plan.price / 12);
      }
    }
    const arr = mrr * 12;

    // Plan distribution
    const planCounts: Record<string, number> = {};
    for (const sub of activeSubs) {
      const name = sub.plan?.name || "Unknown";
      planCounts[name] = (planCounts[name] || 0) + 1;
    }

    const churnRate =
      subscriptions.length > 0
        ? `${((cancelledSubs.length / subscriptions.length) * 100).toFixed(1)}%`
        : "0.0%";

    return NextResponse.json({
      metrics: {
        activeSubscribers: activeSubs.length,
        totalSubscribers: subscriptions.length,
        cancelledCount: cancelledSubs.length,
        mrr,
        arr,
        churnRate,
      },
      planDistribution: planCounts,
      plans: plans.map((p) => ({
        ...p,
        benefits: JSON.parse(p.benefits || "[]"),
      })),
      recentSubscriptions: subscriptions.slice(0, 10),
    });
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
    const { id, name, slug, price, interval, trialDays, active, featured, description, benefits } = body;

    const plan = await prisma.subscriptionPlan.upsert({
      where: { slug },
      update: {
        name,
        price: Number(price),
        interval,
        trialDays: Number(trialDays) || 0,
        active: Boolean(active),
        featured: Boolean(featured),
        description,
        benefits: JSON.stringify(benefits || []),
      },
      create: {
        id: id || `plan-${Date.now()}`,
        name,
        slug,
        price: Number(price),
        currency: "INR",
        interval,
        trialDays: Number(trialDays) || 0,
        active: Boolean(active),
        featured: Boolean(featured),
        description,
        benefits: JSON.stringify(benefits || []),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
