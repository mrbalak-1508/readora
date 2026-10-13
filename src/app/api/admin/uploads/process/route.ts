import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { saveSecureFile, validateAndExtractFile } from "@/lib/storage";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Validate PDF magic bytes: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
function isValidPdfSignature(buffer: Buffer): boolean {
  if (buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

// Validate EPUB zip signature: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
function isValidEpubSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

export async function POST(request: NextRequest) {
  let jobId: string | null = null;
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bookId = formData.get("bookId") as string | null;
    const formatOverride = formData.get("format") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded" }, { status: 400 });
    }

    const originalName = file.name || "manuscript.pdf";
    const fileSize = file.size;
    const lowerName = originalName.toLowerCase();
    const isEpub = lowerName.endsWith(".epub") || formatOverride?.toLowerCase() === "epub";
    const detectedType = isEpub ? "EPUB" : "PDF";

    // 1. Create UploadJob in SQLite (safe check against stale in-memory clients)
    let uploadJob: any = null;
    if ((prisma as any).uploadJob?.create) {
      try {
        uploadJob = await (prisma as any).uploadJob.create({
          data: {
            bookId: bookId || undefined,
            fileName: originalName,
            fileType: detectedType,
            fileSize,
            status: "UPLOADING",
            progress: 10,
            stage: "VALIDATING_SIGNATURE",
          },
        });
        jobId = uploadJob.id;
      } catch (e) {
        console.warn("UploadJob tracking skipped:", e);
      }
    }

    // 2. Validate file with storage helper
    const validatedResult = await validateAndExtractFile(file, "book");
    if (validatedResult.error || !validatedResult.file) {
      if (jobId && (prisma as any).uploadJob?.update) {
        await (prisma as any).uploadJob.update({
          where: { id: jobId },
          data: {
            status: "FAILED",
            errorMessage: validatedResult.error || "File validation failed",
            stage: "VALIDATION_ERROR",
          },
        }).catch(() => {});
      }
      return NextResponse.json({ error: validatedResult.error }, { status: 422 });
    }

    const fileBuffer = validatedResult.file.buffer;

    const updateJob = async (data: any) => {
      if (jobId && (prisma as any).uploadJob?.update) {
        try {
          return await (prisma as any).uploadJob.update({ where: { id: jobId }, data });
        } catch {
          return null;
        }
      }
      return null;
    };

    // 3. Strict Server-Side Magic Byte Signature Verification
    if (detectedType === "PDF") {
      if (!isValidPdfSignature(fileBuffer)) {
        const errorMsg = "Invalid file signature. File header does not match standard PDF (%PDF-). File may be corrupted or disguised.";
        await updateJob({
          status: "FAILED",
          errorMessage: errorMsg,
          stage: "SIGNATURE_MISMATCH",
        });
        return NextResponse.json({ error: errorMsg }, { status: 422 });
      }
    } else if (detectedType === "EPUB") {
      if (!isValidEpubSignature(fileBuffer)) {
        const errorMsg = "Invalid file signature. File header does not match valid EPUB ZIP container (PK\\x03\\x04).";
        await updateJob({
          status: "FAILED",
          errorMessage: errorMsg,
          stage: "SIGNATURE_MISMATCH",
        });
        return NextResponse.json({ error: errorMsg }, { status: 422 });
      }
    }

    await updateJob({
      progress: 40,
      stage: "EXTRACTING_METADATA",
    });

    // 4. Extract Page Count & Metadata
    let extractedPages = 1;
    let extractedMetadata: any = {};

    if (detectedType === "PDF") {
      try {
        const pdfParse = require("pdf-parse");
        const parsedData = await pdfParse(fileBuffer, { max: 1 });
        extractedPages = parsedData.numpages || 1;
        extractedMetadata = {
          pages: extractedPages,
          info: parsedData.info || {},
        };
      } catch (pdfErr) {
        // Fallback regex page count search
        const contentStr = fileBuffer.toString("latin1");
        const pageMatches = contentStr.match(/\/Type\s*\/Page\b/g);
        extractedPages = pageMatches ? pageMatches.length : 1;
        extractedMetadata = { pages: extractedPages, fallback: true };
      }
    } else {
      // EPUB basic metadata
      extractedPages = Math.max(1, Math.round(fileSize / (1024 * 30))); // approx 30kb per reflowable page
      extractedMetadata = { format: "EPUB", estimatedPages: extractedPages };
    }

    await updateJob({
      progress: 70,
      stage: "PERSISTING_SECURE_STORAGE",
    });

    // 5. Store securely in private storage (storage/books/)
    const saved = await saveSecureFile(validatedResult.file, "books");
    const checksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 6. If bookId exists, attach asset and create BookVersion
    if (bookId) {
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });

      if (book) {
        const nextVersionNumber = (book.versions[0]?.versionNumber || 0) + 1;

        // Create BookAsset safely
        if ((prisma as any).bookAsset?.create) {
          await (prisma as any).bookAsset.create({
            data: {
              bookId: book.id,
              assetType: detectedType === "PDF" ? "ORIGINAL_PDF" : "ORIGINAL_EPUB",
              filePath: saved.relativePath,
              fileName: originalName,
              mimeType: validatedResult.file.mimeType,
              fileSize,
              version: nextVersionNumber,
              checksum,
              metadata: JSON.stringify(extractedMetadata),
            },
          }).catch(() => {});
        }

        // Create BookVersion audit trail safely
        if ((prisma as any).bookVersion?.create) {
          await (prisma as any).bookVersion.create({
            data: {
              bookId: book.id,
              versionNumber: nextVersionNumber,
              filePath: saved.relativePath,
              fileName: originalName,
              fileSize,
              changeSummary: `Uploaded ${detectedType} file (${originalName}, ${(fileSize / (1024 * 1024)).toFixed(1)}MB)`,
              createdBy: admin.name || admin.email,
            },
          }).catch(() => {});
        }

        // Update book record
        await prisma.book.update({
          where: { id: book.id },
          data: {
            filePath: saved.relativePath,
            fileName: originalName,
            fileSize,
            mimeType: validatedResult.file.mimeType,
            format: detectedType,
            pages: Math.max(book.pages || 1, extractedPages),
          },
        });
      }
    }

    // 7. Mark UploadJob as READY
    const completedJob = await updateJob({
      status: "READY",
      progress: 100,
      stage: "COMPLETE",
      metadata: JSON.stringify({
        pages: extractedPages,
        checksum,
        storagePath: saved.relativePath,
      }),
    });

    return NextResponse.json({
      success: true,
      job: completedJob,
      file: {
        fileName: originalName,
        storagePath: saved.relativePath,
        fileSize,
        pages: extractedPages,
        format: detectedType,
        checksum,
      },
    });
  } catch (error: any) {
    console.error("Upload processing server error:", error);
    if (jobId) {
      await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorMessage: error.message || "Internal processing error",
          stage: "SERVER_ERROR",
        },
      }).catch(() => {});
    }
    return NextResponse.json({ error: error.message || "Failed to process upload" }, { status: 500 });
  }
}
