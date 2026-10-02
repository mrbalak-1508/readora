import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

// Helper to resolve a valid userId from session, payload, or database
async function resolveValidUser(payloadUserId?: string): Promise<string> {
  // 1. Check active session cookie
  const sessionUser = await getCurrentUser();
  if (sessionUser?.id) {
    return sessionUser.id;
  }

  // 2. Check if payloadUserId exists in database
  if (payloadUserId && payloadUserId !== "user-default") {
    const exists = await prisma.user.findUnique({
      where: { id: payloadUserId },
      select: { id: true },
    });
    if (exists) return exists.id;
  }

  // 3. Fallback to default admin or reader account
  const fallback = await prisma.user.findFirst({
    select: { id: true },
  });
  if (fallback) return fallback.id;

  // 4. If no users exist, create guest reader
  const guest = await prisma.user.create({
    data: {
      id: "usr-guest-readora",
      email: "guest@readora.library",
      name: "Guest Reader",
      passwordHash: "$2a$10$w09uY4hK5YjW7P9HkUaW1.K2c2E3OQ0gU3C5A6y1K8V0s7m4c2P1y",
      role: "USER",
    },
  });
  return guest.id;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveValidUser(searchParams.get("userId") || undefined);
    const bookParam = searchParams.get("bookId");

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

    // 2. Resolve guaranteed valid userId (foreign key safe)
    const userId = await resolveValidUser(body.userId);

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
