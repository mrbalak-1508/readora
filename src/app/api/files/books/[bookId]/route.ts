import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSafeStoragePath } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync } from "fs";

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
        title: true,
        filePath: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        status: true,
      },
    });

    if (!book || !book.filePath) {
      return NextResponse.json({ error: "Book file not found" }, { status: 404 });
    }

    const absolutePath = resolveSafeStoragePath(book.filePath);
    if (!absolutePath || !existsSync(absolutePath)) {
      return NextResponse.json({ error: "Storage file missing on server" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(absolutePath);
    const contentType = book.mimeType || "application/pdf";
    const filename = book.fileName || `${book.title}.pdf`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error: any) {
    console.error("Book file serving error:", error);
    return NextResponse.json({ error: "Internal file serving error" }, { status: 500 });
  }
}
