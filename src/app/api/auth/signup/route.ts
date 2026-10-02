import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, avatarPath } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        avatarPath: avatarPath || null,
        role: "USER",
        onboardingCompleted: false,
      },
    });

    // Set secure HTTP-only cookie
    await setSessionCookie(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarPath: user.avatarPath,
          onboardingCompleted: user.onboardingCompleted,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup route error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
