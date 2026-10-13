import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Written books are books with format = "INTERACTIVE" or "WRITTEN" or books created via editor
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { format: "WRITTEN" },
          { format: "INTERACTIVE" },
          { filePath: null },
        ],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            status: true,
            order: true,
            wordCount: true,
            isSection: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = books.map((b) => {
      const totalWords = b.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      const publishedChapters = b.chapters.filter((ch) => ch.status === "PUBLISHED").length;
      return {
        ...b,
        totalWords,
        chaptersCount: b.chapters.length,
        publishedChaptersCount: publishedChapters,
        coverUrl: b.coverPath || "/placeholder-cover.jpg",
      };
    });

    return NextResponse.json({ books: formatted });
  } catch (error: any) {
    console.error("Written books fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch written books" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { title, author, categoryId, categoryName, description, accessType, price, language } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }

    const baseSlug = generateSlug(title) || `written-book-${Date.now()}`;
    let uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    let counter = 1;
    while (await prisma.book.findFirst({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}-${Date.now().toString().slice(-4)}`;
      counter++;
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        slug: uniqueSlug,
        author: author?.trim() || admin.name || "Curator",
        description: description?.trim() || "An authored digital manuscript.",
        categoryId: categoryId || undefined,
        categoryName: categoryName || "Literature",
        language: language || "English",
        coverPath: "/placeholder-cover.jpg",
        format: "WRITTEN",
        status: "DRAFT",
        pages: 1,
        accessType: accessType || "FREE",
        price: Number(price) || 0,
        chapters: {
          create: [
            {
              title: "Chapter 1: The Beginning",
              subtitle: "An opening reflection",
              slug: "chapter-1-the-beginning",
              order: 0,
              status: "DRAFT",
              content: "<p>Begin typing your chapter content here...</p>",
              contentJson: JSON.stringify({
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Begin typing your chapter content here..." }],
                  },
                ],
              }),
              wordCount: 6,
              readingTimeMinutes: 1,
              previewAllowed: true,
            },
          ],
        },
      },
      include: {
        chapters: true,
      },
    });

    return NextResponse.json({ success: true, book: newBook }, { status: 201 });
  } catch (error: any) {
    console.error("Written book creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create written book" }, { status: 500 });
  }
}
