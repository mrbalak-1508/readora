import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId } = await params;

    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id: bookId }, { slug: bookId }],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { revisions: true },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Manuscript validation rules for publishing
    const validationWarnings: string[] = [];
    if (!book.title.trim()) validationWarnings.push("Book title cannot be empty");
    if (!book.author.trim()) validationWarnings.push("Author name is missing");
    if (book.chapters.length === 0) {
      validationWarnings.push("Manuscript must contain at least one chapter before publishing");
    } else {
      const nonEmptyChapters = book.chapters.filter((ch) => (ch.content?.length || 0) > 10);
      if (nonEmptyChapters.length === 0) {
        validationWarnings.push("All chapters are currently empty. Add content to publish.");
      }
    }

    const isPublishable = validationWarnings.length === 0;

    return NextResponse.json({
      book,
      validation: {
        isPublishable,
        warnings: validationWarnings,
      },
    });
  } catch (error: any) {
    console.error("Written book fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch book" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId } = await params;
    const body = await request.json();

    const book = await prisma.book.findFirst({
      where: { OR: [{ id: bookId }, { slug: bookId }] },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.author !== undefined) updateData.author = body.author.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status; // DRAFT, PUBLISHED, ARCHIVED
    if (body.categoryName !== undefined) updateData.categoryName = body.categoryName;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.coverPath !== undefined) updateData.coverPath = body.coverPath;
    if (body.accessType !== undefined) updateData.accessType = body.accessType;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.originalPrice !== undefined) updateData.originalPrice = Number(body.originalPrice);
    if (body.discount !== undefined) updateData.discount = Number(body.discount);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.previewChapters !== undefined) updateData.previewChapters = Number(body.previewChapters);
    if (body.allowDownload !== undefined) updateData.allowDownload = Boolean(body.allowDownload);
    if (body.allowPrint !== undefined) updateData.allowPrint = Boolean(body.allowPrint);
    if (body.allowCopy !== undefined) updateData.allowCopy = Boolean(body.allowCopy);
    if (body.allowFreeToc !== undefined) updateData.allowFreeToc = Boolean(body.allowFreeToc);

    // If publishing, ensure valid
    if (body.status === "PUBLISHED") {
      const chaptersCount = await prisma.chapter.count({
        where: { bookId: book.id },
      });
      if (chaptersCount === 0) {
        return NextResponse.json(
          { error: "Cannot publish a book with zero chapters. Add a chapter first." },
          { status: 422 }
        );
      }
    }

    const updated = await prisma.book.update({
      where: { id: book.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, book: updated });
  } catch (error: any) {
    console.error("Written book update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update book" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId } = await params;

    const book = await prisma.book.findFirst({
      where: { OR: [{ id: bookId }, { slug: bookId }] },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await prisma.book.delete({
      where: { id: book.id },
    });

    return NextResponse.json({ success: true, message: "Book deleted" });
  } catch (error: any) {
    console.error("Written book delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete book" }, { status: 500 });
  }
}
