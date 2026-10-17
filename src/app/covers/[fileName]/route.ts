import { NextRequest, NextResponse } from "next/server";
import { resolveSafeStoragePath } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    if (!fileName) {
      return new NextResponse(null, { status: 404 });
    }

    // Try resolving from covers/ or directly fileName
    const absolutePath =
      resolveSafeStoragePath(`covers/${fileName}`) ||
      resolveSafeStoragePath(fileName);

    if (!absolutePath || !existsSync(absolutePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const fileBuffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
    };
    const contentType = mimeMap[ext] || "image/jpeg";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
