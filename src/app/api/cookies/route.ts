import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (user) {
      const consent = await prisma.cookieConsent.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (consent) {
        return NextResponse.json({ consent });
      }
    }
    return NextResponse.json({ consent: null });
  } catch (error: any) {
    console.error("Cookie consent GET error:", error);
    return NextResponse.json({ consent: null });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const {
      necessary = true,
      analytics = false,
      functional = false,
      marketing = false,
      anonymousId = null,
    } = body;

    const consent = await prisma.cookieConsent.create({
      data: {
        userId: user ? user.id : null,
        anonymousId,
        necessary: true, // Always true
        analytics: Boolean(analytics),
        functional: Boolean(functional),
        marketing: Boolean(marketing),
        consentVersion: "1.0",
      },
    });

    return NextResponse.json({ success: true, consent });
  } catch (error: any) {
    console.error("Cookie consent POST error:", error);
    return NextResponse.json({ error: "Failed to record cookie consent" }, { status: 500 });
  }
}
