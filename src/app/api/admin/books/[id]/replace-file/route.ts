import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { saveSecureFile, validateAndExtractFile } from "@/lib/storage";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const changeSummary = formData.get("changeSummary") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const book = await prisma.book.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const validated = await validateAndExtractFile(file, "book");
    if (validated.error || !validated.file) {
      return NextResponse.json({ error: validated.error || "Invalid file" }, { status: 422 });
    }

    // Check magic bytes
    const buffer = validated.file.buffer;
    const isPdf = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    const isEpub = buffer[0] === 0x50 && buffer[1] === 0x4b;

    if (!isPdf && !isEpub) {
      return NextResponse.json(
        { error: "Invalid file signature. File header must match PDF (%PDF-) or EPUB (PK\\x03\\x04)." },
        { status: 422 }
      );
    }

    const detectedFormat = isPdf ? "PDF" : "EPUB";

    // Extract pages for PDF
    let extractedPages = book.pages || 1;
    if (isPdf) {
      try {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer, { max: 1 });
        extractedPages = parsed.numpages || extractedPages;
      } catch {}
    }

    // Save to private storage
    const saved = await saveSecureFile(validated.file, "books");
    const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
    const nextVersion = (book.versions[0]?.versionNumber || 0) + 1;

    // Create BookVersion snapshot
    let versionRecord: any = null;
    if ((prisma as any).bookVersion?.create) {
      versionRecord = await (prisma as any).bookVersion.create({
        data: {
          bookId: book.id,
          versionNumber: nextVersion,
          filePath: saved.relativePath,
          fileName: file.name,
          fileSize: file.size,
          changeSummary: changeSummary || `Replaced manuscript file with ${file.name} (v${nextVersion})`,
          createdBy: admin.name || admin.email,
        },
      }).catch(() => null);
    }

    // Create BookAsset record
    if ((prisma as any).bookAsset?.create) {
      await (prisma as any).bookAsset.create({
        data: {
          bookId: book.id,
          assetType: detectedFormat === "PDF" ? "ORIGINAL_PDF" : "ORIGINAL_EPUB",
          filePath: saved.relativePath,
          fileName: file.name,
          mimeType: validated.file.mimeType,
          fileSize: file.size,
          version: nextVersion,
          checksum,
        },
      }).catch(() => null);
    }

    // Update Book
    const updatedBook = await prisma.book.update({
      where: { id: book.id },
      data: {
        filePath: saved.relativePath,
        fileName: file.name,
        fileSize: file.size,
        mimeType: validated.file.mimeType,
        format: detectedFormat,
        pages: extractedPages,
      },
    });

    return NextResponse.json({
      success: true,
      message: `File replaced successfully. Created version ${nextVersion}.`,
      book: updatedBook,
      version: versionRecord,
    });
  } catch (error: any) {
    console.error("Replace file error:", error);
    return NextResponse.json({ error: error.message || "Failed to replace file" }, { status: 500 });
  }
}
