import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveSafeStoragePath } from "@/lib/storage";
import fs from "fs/promises";
import { existsSync } from "fs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    if (!bookId) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id: bookId }, { slug: bookId }],
      },
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

    const fileBuffer = await fs.readFile(/*turbopackIgnore: true*/ absolutePath);
    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "Book file is empty (0 bytes)" }, { status: 422 });
    }

    const contentType = book.mimeType || "application/pdf";
    const filename = book.fileName || `${book.title}.pdf`;
    const totalSize = fileBuffer.length;

    const isDownload =
      request.nextUrl.searchParams.get("download") === "1" ||
      request.nextUrl.searchParams.get("download") === "true";

    // Only send Content-Disposition if download was explicitly requested
    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      "Content-Length": totalSize.toString(),
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    };

    if (isDownload) {
      responseHeaders["Content-Disposition"] = `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
    }

    // Handle HTTP Range requests for PDF viewers
    const rangeHeader = request.headers.get("range");
    if (!isDownload && rangeHeader && rangeHeader.startsWith("bytes=")) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (!isNaN(start) && start < totalSize) {
        const safeEnd = Math.min(end, totalSize - 1);
        const chunk = fileBuffer.subarray(start, safeEnd + 1);

        return new NextResponse(chunk, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Range": `bytes ${start}-${safeEnd}/${totalSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunk.length.toString(),
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Book file serving error:", error);
    return NextResponse.json({ error: "Internal file serving error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
