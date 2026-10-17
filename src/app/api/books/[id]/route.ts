import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { validateAndExtractFile, saveSecureFile } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

function resolveCoverUrl(bookId: string, coverPath?: string | null): string {
  if (!coverPath) return "/placeholder-cover.jpg";
  if (coverPath.startsWith("http://") || coverPath.startsWith("https://") || coverPath.startsWith("/")) {
    return coverPath;
  }
  return `/api/files/covers/${bookId}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const formatted = {
      ...book,
      coverUrl: resolveCoverUrl(book.id, book.coverPath),
      tags: JSON.parse(book.tags || "[]"),
      chapters: book.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        page: ch.page,
        content: ch.content,
      })),
      tableOfContents: book.chapters.map((ch) => ({
        title: ch.title,
        page: ch.page,
      })),
    };

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const existingBook = await prisma.book.findUnique({ where: { id } });
    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    let uploadedCoverPath: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const coverFile =
        (formData.get("coverFile") as File | null) ||
        (formData.get("cover") as File | null) ||
        (formData.get("file") as File | null);

      if (coverFile && coverFile.size > 0) {
        const validation = await validateAndExtractFile(coverFile, "cover");
        if (validation.error || !validation.file) {
          return NextResponse.json({ error: validation.error || "Invalid cover image" }, { status: 400 });
        }
        const saved = await saveSecureFile(validation.file, "covers");
        uploadedCoverPath = `/covers/${saved.safeFileName}`;
        try {
          const publicCoversDir = path.resolve(process.cwd(), "public", "covers");
          await fs.mkdir(publicCoversDir, { recursive: true });
          await fs.writeFile(path.join(publicCoversDir, saved.safeFileName), validation.file.buffer);
        } catch {
          // Non-fatal on read-only serverless filesystems
        }
      }

      // Extract text fields from formData
      for (const [key, value] of formData.entries()) {
        if (key !== "coverFile" && key !== "cover" && key !== "file") {
          body[key] = value;
        }
      }
    } else {
      body = await request.json();
    }

    const finalCoverPath = uploadedCoverPath || body.coverPath || body.coverUrl;

    const targetPages = body.pages !== undefined ? Number(body.pages) : existingBook.pages;
    if (body.previewPages !== undefined && targetPages > 1 && Number(body.previewPages) >= targetPages) {
      return NextResponse.json(
        { error: `Free Preview Limit (${body.previewPages} pages) must be less than total pages (${targetPages} pages).` },
        { status: 400 }
      );
    }

    const updated = await prisma.book.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.author && { author: body.author }),
        ...(body.description !== undefined && { description: body.description }),
        ...(finalCoverPath !== undefined && { coverPath: finalCoverPath }),
        ...(body.status && { status: body.status.toUpperCase() }),
        ...(body.featured !== undefined && { featured: Boolean(body.featured) }),
        ...(body.pages !== undefined && { pages: Number(body.pages) }),
        ...(body.categoryName && { categoryName: body.categoryName }),
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.language && { language: body.language }),
        ...(body.readCount !== undefined && { readCount: Number(body.readCount) }),
        ...(body.price !== undefined && { price: Math.max(0, Number(body.price)) }),
        ...(body.originalPrice !== undefined && { originalPrice: Number(body.originalPrice) }),
        ...(body.accessType && { accessType: body.accessType.toUpperCase() }),
        ...(body.discount !== undefined && { discount: Number(body.discount) }),
        ...(body.sampleContent !== undefined && { sampleContent: body.sampleContent }),
        ...(body.format && { format: body.format.toUpperCase() }),
        ...(body.previewPages !== undefined && { previewPages: Number(body.previewPages) }),
        ...(body.filePath !== undefined && { filePath: body.filePath }),
        ...(body.fileName !== undefined && { fileName: body.fileName }),
        ...(body.fileSize !== undefined && { fileSize: body.fileSize ? Number(body.fileSize) : null }),
        ...(body.mimeType !== undefined && { mimeType: body.mimeType }),
      },
    });

    // Log admin activity
    if ((prisma as any).adminActivity?.create) {
      await (prisma as any).adminActivity.create({
        data: {
          adminId: admin.id,
          action: "BOOK_UPDATE",
          targetType: "BOOK",
          targetId: updated.id,
          details: JSON.stringify({ title: updated.title, status: updated.status, coverPath: updated.coverPath }),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      book: {
        ...updated,
        coverUrl: resolveCoverUrl(updated.id, updated.coverPath),
      },
    });
  } catch (error: any) {
    console.error("Book update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 403 });
    }

    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await prisma.book.delete({
      where: { id },
    });

    // Log admin activity
    if ((prisma as any).adminActivity?.create) {
      await (prisma as any).adminActivity.create({
        data: {
          adminId: admin.id,
          action: "BOOK_DELETE",
          targetType: "BOOK",
          targetId: id,
          details: JSON.stringify({ title: book.title }),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, message: "Book removed successfully" });
  } catch (error: any) {
    console.error("Book deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
