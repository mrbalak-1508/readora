import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SETTINGS: Record<string, any> = {
  reader_sound_profile: "parchment",
  reader_sound_volume: 0.8,
  reader_sound_url: "",
  reader_default_sound: false,
  reader_default_3d: true,
  reader_watermark_enabled: true,
};

// GET: Public endpoint to fetch site/reader settings
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();
    const result: Record<string, any> = { ...DEFAULT_SETTINGS };

    for (const s of settings) {
      try {
        result[s.key] = JSON.parse(s.value);
      } catch {
        result[s.key] = s.value;
      }
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (err: any) {
    console.warn("Failed to fetch site settings from DB, using defaults:", err?.message);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

// POST: Admin-only endpoint to update site settings
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const updates = Object.entries(body);
    for (const [key, value] of updates) {
      const stringValue = typeof value === "string" ? JSON.stringify(value) : JSON.stringify(value);

      await prisma.siteSetting.upsert({
        where: { key },
        create: {
          key,
          value: stringValue,
          description: `Config for ${key}`,
        },
        update: {
          value: stringValue,
        },
      });
    }

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (err: any) {
    console.error("Failed to update site settings:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
