import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// Helper to resolve an authenticated userId from session or valid payload
async function resolveValidUser(payloadUserId?: string): Promise<string | null> {
  // 1. Check active session cookie
  const sessionUser = await getCurrentUser();
  if (sessionUser?.id) {
    return sessionUser.id;
  }

  // 2. Check if payloadUserId exists in database
  if (payloadUserId && payloadUserId !== "user-default" && payloadUserId !== "usr-admin-readora") {
    const exists = await prisma.user.findUnique({
      where: { id: payloadUserId },
      select: { id: true },
    });
    if (exists) return exists.id;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveValidUser(searchParams.get("userId") || undefined);
    const bookParam = searchParams.get("bookId");

    // Unauthenticated visitors have no private reading progress
    if (!userId) {
      return NextResponse.json(bookParam ? null : []);
    }

    if (bookParam) {
      const book = await prisma.book.findFirst({
        where: {
          OR: [{ id: bookParam }, { slug: bookParam }],
        },
        select: { id: true },
      });

      if (!book) {
        return NextResponse.json(null);
      }

      const progress = await prisma.readingProgress.findUnique({
        where: {
          userId_bookId: { userId, bookId: book.id },
        },
      });
      return NextResponse.json(progress);
    }

    const all = await prisma.readingProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(all);
  } catch (error: any) {
    console.error("Progress GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawBookId = body.bookId;

    if (!rawBookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    // 1. Resolve normalized book
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id: rawBookId }, { slug: rawBookId }],
      },
      select: {
        id: true,
        title: true,
        author: true,
        coverPath: true,
        pages: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 2. Resolve authenticated user
    const userId = await resolveValidUser(body.userId);
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to save your reading progress." }, { status: 401 });
    }

    const currentPage = Number(body.currentPage) || 1;
    const totalPages = Number(body.totalPages) || book.pages || 1;
    const percentage = Number(body.percentage) || Math.min(100, Math.round((currentPage / totalPages) * 100));
    const completed = Boolean(body.completed) || percentage >= 100;

    const progress = await prisma.readingProgress.upsert({
      where: {
        userId_bookId: { userId, bookId: book.id },
      },
      update: {
        currentPage,
        totalPages,
        currentChapter: body.currentChapter || "Chapter 1",
        percentage,
        timeSpentSeconds: Number(body.timeSpentSeconds) || 0,
        completed,
        completedAt: completed ? new Date() : null,
      },
      create: {
        userId,
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverPath,
        author: book.author,
        currentPage,
        totalPages,
        currentChapter: body.currentChapter || "Chapter 1",
        percentage,
        timeSpentSeconds: Number(body.timeSpentSeconds) || 0,
        completed,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json(progress);
  } catch (error: any) {
    console.error("Progress POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
