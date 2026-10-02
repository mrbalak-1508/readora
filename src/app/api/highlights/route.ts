import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

async function resolveValidUser(payloadUserId?: string): Promise<string | null> {
  const sessionUser = await getCurrentUser();
  if (sessionUser?.id) return sessionUser.id;

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

    // Unauthenticated visitors have no highlights
    if (!userId) {
      return NextResponse.json([]);
    }

    const where: any = { userId };
    if (bookParam) {
      const book = await prisma.book.findFirst({
        where: { OR: [{ id: bookParam }, { slug: bookParam }] },
        select: { id: true },
      });
      if (book) where.bookId = book.id;
    }

    const highlights = await prisma.highlight.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(highlights);
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
    if (!userId) {
      return NextResponse.json({ error: "Please sign in to save highlights." }, { status: 401 });
    }

    const highlight = await prisma.highlight.create({
      data: {
        userId,
        bookId: book.id,
        page: Number(body.page) || 1,
        chapterTitle: body.chapterTitle || "Chapter 1",
        selectedText: body.selectedText || "",
        color: body.color || "yellow",
        note: body.note || null,
      },
    });
    return NextResponse.json(highlight, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to delete highlights." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.highlight.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
