import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "readora_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "USER" | "ADMIN";
  avatarPath?: string | null;
  onboardingCompleted: boolean;
  preferences?: any;
  createdAt?: Date | string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Simple signed session token format: userId:timestamp:signature
function createToken(userId: string): string {
  const secret = process.env.AUTH_SECRET || "readora-super-secret-key-production-safe-32chars";
  const timestamp = Date.now();
  const raw = `${userId}:${timestamp}`;
  // Basic deterministic signature for internal verification
  const sig = Buffer.from(`${raw}:${secret}`).toString("base64url");
  return `${raw}:${sig}`;
}

function parseToken(token: string): string | null {
  try {
    const secret = process.env.AUTH_SECRET || "readora-super-secret-key-production-safe-32chars";
    const parts = token.split(":");
    if (parts.length < 3) return null;
    const [userId, timestamp, sig] = parts;
    const expectedSig = Buffer.from(`${userId}:${timestamp}:${secret}`).toString("base64url");
    if (sig !== expectedSig) return null;
    return userId;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const token = createToken(userId);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const userId = parseToken(token);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatarPath: true,
        onboardingCompleted: true,
        preferences: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    let parsedPreferences = {};
    if (user.preferences) {
      try {
        parsedPreferences = JSON.parse(user.preferences);
      } catch {
        // safe
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role as "USER" | "ADMIN",
      avatarPath: user.avatarPath,
      onboardingCompleted: user.onboardingCompleted,
      preferences: parsedPreferences,
      createdAt: user.createdAt,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}
