import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { validateAndExtractFile, saveSecureFile } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file =
      (formData.get("file") as File | null) ||
      (formData.get("cover") as File | null) ||
      (formData.get("coverFile") as File | null);

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const validation = await validateAndExtractFile(file, "cover");
    if (validation.error || !validation.file) {
      return NextResponse.json(
        { error: validation.error || "Invalid cover image" },
        { status: 400 }
      );
    }

    // Save in storage/covers
    const saved = await saveSecureFile(validation.file, "covers");

    // Also persist a copy to public/covers for instant static availability
    try {
      const publicCoversDir = path.resolve(process.cwd(), "public", "covers");
      await fs.mkdir(publicCoversDir, { recursive: true });
      const publicFilePath = path.join(publicCoversDir, saved.safeFileName);
      await fs.writeFile(publicFilePath, validation.file.buffer);
    } catch (fsErr) {
      console.warn("Could not write cover to public/covers:", fsErr);
    }

    const publicUrl = `/covers/${saved.safeFileName}`;

    return NextResponse.json({
      success: true,
      filePath: publicUrl, // Using publicUrl allows immediate static rendering everywhere
      storagePath: saved.relativePath,
      url: publicUrl,
      fileName: saved.safeFileName,
    });
  } catch (error: any) {
    console.error("Cover upload API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload cover image" },
      { status: 500 }
    );
  }
}
