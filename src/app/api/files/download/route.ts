import { NextRequest, NextResponse } from "next/server";
import { resolveSafeStoragePath } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const rawPath = request.nextUrl.searchParams.get("path");
    if (!rawPath) {
      return NextResponse.json({ error: "File path required" }, { status: 400 });
    }

    const absolutePath = resolveSafeStoragePath(rawPath);
    if (!absolutePath || !existsSync(absolutePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(absolutePath);
    const fileName = path.basename(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".epub": "application/epub+zip",
      ".txt": "text/plain",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Download error" }, { status: 500 });
  }
}
