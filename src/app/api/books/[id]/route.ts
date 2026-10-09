import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

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
      coverUrl: book.coverPath || "/placeholder-cover.jpg",
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

    const body = await request.json();

    const existingBook = await prisma.book.findUnique({ where: { id } });
    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

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
        ...(body.description && { description: body.description }),
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
      },
    });

    // Log admin activity
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "BOOK_UPDATE",
        targetType: "BOOK",
        targetId: updated.id,
        details: JSON.stringify({ title: updated.title, status: updated.status }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      book: {
        ...updated,
        coverUrl: updated.coverPath || "/placeholder-cover.jpg",
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
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "BOOK_DELETE",
        targetType: "BOOK",
        targetId: id,
        details: JSON.stringify({ title: book.title }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Book removed successfully" });
  } catch (error: any) {
    console.error("Book deletion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
