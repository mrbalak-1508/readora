import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSafeStoragePath } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
      select: {
        id: true,
        coverPath: true,
      },
    });

    if (!book || !book.coverPath) {
      return NextResponse.json({ error: "Cover not found" }, { status: 404 });
    }

    // If external URL, redirect directly
    if (book.coverPath.startsWith("http://") || book.coverPath.startsWith("https://")) {
      return NextResponse.redirect(book.coverPath);
    }

    const absolutePath = resolveSafeStoragePath(book.coverPath);
    if (!absolutePath || !existsSync(absolutePath)) {
      return NextResponse.json({ error: "Storage cover missing on server" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".gif": "image/gif",
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
  } catch (error: any) {
    console.error("Cover file serving error:", error);
    return NextResponse.json({ error: "Internal cover serving error" }, { status: 500 });
  }
}
