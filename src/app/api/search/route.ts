import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (Math.max(1, page) - 1) * limit;

    if (!query) {
      const [total, books] = await Promise.all([
        prisma.book.count(),
        prisma.book.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return NextResponse.json({
        books: books.map((b) => ({ ...b, coverUrl: b.coverPath || "/placeholder-cover.jpg" })),
        total,
        page,
        limit,
      });
    }

    const where = {
      OR: [
        { title: { contains: query } },
        { author: { contains: query } },
        { description: { contains: query } },
        { categoryName: { contains: query } },
        { tags: { contains: query } },
        { isbn: { contains: query } },
      ],
    };

    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        skip,
        take: limit,
        orderBy: { readCount: "desc" },
      }),
    ]);

    return NextResponse.json({
      books: books.map((b) => ({ ...b, coverUrl: b.coverPath || "/placeholder-cover.jpg" })),
      total,
      page,
      limit,
    });
  } catch (error: any) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Failed to search books" }, { status: 500 });
  }
}
