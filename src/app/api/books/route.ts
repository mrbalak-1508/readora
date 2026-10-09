import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    const where: any = {};
    if (category && category !== "all") {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (books.length === 0) {
      return NextResponse.json(MOCK_BOOKS);
    }

    const formatted = books.map((b) => ({
      ...b,
      coverUrl: b.coverPath || "/placeholder-cover.jpg",
      tags: JSON.parse(b.tags || "[]"),
      accessType: b.accessType || "FREE",
      price: b.price ?? 0,
      originalPrice: b.originalPrice ?? undefined,
      discount: b.discount ?? 0,
      currency: b.currency || "INR",
      previewType: b.previewType || "PAGES",
      previewPages: b.previewPages ?? 10,
      previewPercentage: b.previewPercentage ?? 15,
      previewChapters: b.previewChapters ?? 2,
      watermarkEnabled: b.watermarkEnabled ?? true,
      chapters: b.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        page: ch.page,
        content: ch.content,
      })),
      tableOfContents: b.chapters.map((ch) => ({
        title: ch.title,
        page: ch.page,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Prisma SQLite fetch error, fallback to memory:", error);
    return NextResponse.json(MOCK_BOOKS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newBook = await prisma.book.create({
      data: {
        slug: body.slug || `book-${Date.now()}`,
        title: body.title,
        author: body.author,
        description: body.description,
        coverPath: body.coverUrl || body.coverPath || "/placeholder-cover.jpg",
        format: (body.format || "interactive").toUpperCase(),
        isbn: body.isbn,
        language: body.language || "English",
        categoryId: body.categoryId,
        categoryName: body.categoryName || "Literature",
        tags: JSON.stringify(body.tags || []),
        publisher: body.publisher,
        publicationDate: body.publicationDate,
        pages: Number(body.pages) || 200,
        featured: Boolean(body.featured),
        trending: Boolean(body.trending),
        popular: Boolean(body.popular),
        status: body.status || "PUBLISHED",
        rating: 5.0,
        sampleContent: body.sampleContent,
        accessType: body.accessType || "ONE_TIME_PURCHASE",
        price: Number(body.price) || 0,
        originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
        discount: Number(body.discount) || 0,
        currency: body.currency || "INR",
        previewType: body.previewType || "PAGES",
        previewPages:
          (Number(body.pages) || 200) > 1
            ? Math.max(1, Math.min(Number(body.previewPages) || 10, (Number(body.pages) || 200) - 1))
            : 1,
        previewPercentage: Number(body.previewPercentage) || 15,
        previewChapters: Number(body.previewChapters) || 2,
        watermarkEnabled: body.watermarkEnabled !== undefined ? Boolean(body.watermarkEnabled) : true,
      },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    console.error("Prisma book creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
