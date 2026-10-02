import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        progress: {
          where: { completed: true },
          select: { id: true },
        },
      },
    });

    const mapped = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase(),
      joined: new Date(u.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      lastActive: u.lastActiveAt
        ? new Date(u.lastActiveAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "Recent",
      booksRead: u.progress.length,
      status: "active" as const,
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: role.toUpperCase() },
      select: { id: true, name: true, role: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("Admin user PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
