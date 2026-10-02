import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

async function resolveValidUser(payloadUserId?: string): Promise<string> {
  const sessionUser = await getCurrentUser();
  if (sessionUser?.id) return sessionUser.id;

  if (payloadUserId && payloadUserId !== "user-default") {
    const exists = await prisma.user.findUnique({
      where: { id: payloadUserId },
      select: { id: true },
    });
    if (exists) return exists.id;
  }

  const fallback = await prisma.user.findFirst({ select: { id: true } });
  if (fallback) return fallback.id;

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

    const where: any = { userId };
    if (bookParam) {
      const book = await prisma.book.findFirst({
        where: { OR: [{ id: bookParam }, { slug: bookParam }] },
        select: { id: true },
      });
      if (book) where.bookId = book.id;
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(bookmarks);
  } catch (error: any) {
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

    const book = await prisma.book.findFirst({
      where: { OR: [{ id: rawBookId }, { slug: rawBookId }] },
      select: { id: true },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const userId = await resolveValidUser(body.userId);

    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        bookId: book.id,
        page: Number(body.page) || 1,
        chapterTitle: body.chapterTitle || "Chapter 1",
        snippet: body.snippet || "",
      },
    });
    return NextResponse.json(bookmark, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.bookmark.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
