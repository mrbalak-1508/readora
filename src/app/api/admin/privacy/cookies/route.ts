import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Curator access required" }, { status: 403 });
    }

    const [total, allRecords] = await Promise.all([
      prisma.cookieConsent.count(),
      prisma.cookieConsent.findMany({
        take: 100,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          necessary: true,
          functional: true,
          analytics: true,
          marketing: true,
          consentVersion: true,
          createdAt: true,
        },
      }),
    ]);

    let acceptedAll = 0;
    let rejectedNonEssential = 0;
    let functionalCount = 0;
    let analyticsCount = 0;
    let marketingCount = 0;

    for (const r of allRecords) {
      if (r.functional && r.analytics && r.marketing) acceptedAll++;
      if (!r.functional && !r.analytics && !r.marketing) rejectedNonEssential++;
      if (r.functional) functionalCount++;
      if (r.analytics) analyticsCount++;
      if (r.marketing) marketingCount++;
    }

    const totalCount = allRecords.length || 1;

    return NextResponse.json({
      totalConsents: total,
      analytics: {
        acceptedAllRate: `${Math.round((acceptedAll / totalCount) * 100)}%`,
        rejectedNonEssentialRate: `${Math.round((rejectedNonEssential / totalCount) * 100)}%`,
        functionalRate: `${Math.round((functionalCount / totalCount) * 100)}%`,
        analyticsRate: `${Math.round((analyticsCount / totalCount) * 100)}%`,
        marketingRate: `${Math.round((marketingCount / totalCount) * 100)}%`,
      },
      counts: {
        acceptedAll,
        rejectedNonEssential,
        functionalCount,
        analyticsCount,
        marketingCount,
      },
      recentRecords: allRecords.slice(0, 15),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
