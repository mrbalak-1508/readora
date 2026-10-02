import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { completed } = await request.json().catch(() => ({ completed: true }));

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { onboardingCompleted: completed ?? true },
    });

    return NextResponse.json({
      success: true,
      onboardingCompleted: updatedUser.onboardingCompleted,
    });
  } catch (error: any) {
    console.error("Onboarding route error:", error);
    return NextResponse.json({ error: "Failed to update onboarding status" }, { status: 500 });
  }
}
