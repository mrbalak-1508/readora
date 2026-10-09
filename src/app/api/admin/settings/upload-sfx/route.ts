import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".wav",
  ".ogg",
  ".m4a",
  ".aac",
  ".flac",
  ".weba",
  ".webm",
]);

const MAX_SFX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // 1. Authorization: strictly ADMIN only
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admin privileges required to upload sound effects" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No audio file provided in upload" },
        { status: 400 }
      );
    }

    // 2. Size Validation
    if (file.size > MAX_SFX_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed SFX size is 10MB.` },
        { status: 400 }
      );
    }

    // 3. Extension Validation
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format "${ext}". Supported formats: .mp3, .wav, .ogg, .m4a, .aac, .weba`,
        },
        { status: 400 }
      );
    }

    // 4. Save to public directory for direct, fast HTTP access by web audio players
    const uploadDir = path.resolve(process.cwd(), "public", "uploads", "sfx");
    await fs.mkdir(uploadDir, { recursive: true });

    const rawBase = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 32) || "audio";
    const uniqueFileName = `sfx_${Date.now()}_${rawBase}${ext}`;
    const targetFilePath = path.join(uploadDir, uniqueFileName);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(targetFilePath, Buffer.from(arrayBuffer));

    const publicUrl = `/uploads/sfx/${uniqueFileName}`;

    // 5. Persist to site settings database
    try {
      await prisma.siteSetting.upsert({
        where: { key: "reader_sound_url" },
        create: {
          key: "reader_sound_url",
          value: JSON.stringify(publicUrl),
          description: "Custom SFX audio URL",
        },
        update: {
          value: JSON.stringify(publicUrl),
        },
      });

      await prisma.siteSetting.upsert({
        where: { key: "reader_sound_profile" },
        create: {
          key: "reader_sound_profile",
          value: JSON.stringify("custom"),
          description: "Reader sound profile",
        },
        update: {
          value: JSON.stringify("custom"),
        },
      });
    } catch (dbErr: any) {
      console.warn("Could not auto-save to prisma settings table:", dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || "audio/*",
      message: "SFX audio uploaded successfully",
    });
  } catch (error: any) {
    console.error("SFX audio upload failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process audio upload" },
      { status: 500 }
    );
  }
}
