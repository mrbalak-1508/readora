import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    // Guests/unauthenticated visitors have an empty library
    if (!user) {
      return NextResponse.json([]);
    }
    const userId = user.id;

    // Fetch library items, entitlements, and reading progress for authenticated user
    const [items, entitlements, progressList, subscription] = await Promise.all([
      prisma.libraryItem.findMany({
        where: { userId },
        include: { book: true },
        orderBy: { addedAt: "desc" },
      }),
      prisma.bookEntitlement.findMany({
        where: { userId, active: true },
        include: { book: true },
      }),
      prisma.readingProgress.findMany({
        where: { userId },
      }),
      prisma.subscription.findFirst({
        where: { userId, status: "ACTIVE" },
      }),
    ]);

    const progressMap = new Map(progressList.map((p) => [p.bookId, p]));
    const entitlementBookIds = new Set(entitlements.map((e) => e.bookId));

    // Combine into unified library items
    const combinedMap = new Map();

    for (const item of items) {
      const prog = progressMap.get(item.bookId);
      const isPurchased = entitlementBookIds.has(item.bookId) || item.status === "purchased";
      combinedMap.set(item.bookId, {
        id: item.id,
        userId: item.userId,
        bookId: item.bookId,
        status: isPurchased ? "purchased" : item.status,
        isPurchased,
        hasSubscription: !!subscription,
        addedAt: item.addedAt.toISOString(),
        progress: prog
          ? {
              currentPage: prog.currentPage,
              totalPages: prog.totalPages,
              percentage: prog.percentage,
              currentChapter: prog.currentChapter,
              completed: prog.completed,
              lastOpened: prog.lastOpened.toISOString(),
            }
          : undefined,
        book: {
          ...item.book,
          coverUrl: item.book.coverPath || "/placeholder-cover.jpg",
          tags: JSON.parse(item.book.tags || "[]"),
          format: (item.book.format || "interactive").toLowerCase(),
        },
      });
    }

    // Add any purchased entitlements not already in items
    for (const ent of entitlements) {
      if (!combinedMap.has(ent.bookId) && ent.book) {
        const prog = progressMap.get(ent.bookId);
        combinedMap.set(ent.bookId, {
          id: `ent-${ent.id}`,
          userId: ent.userId,
          bookId: ent.bookId,
          status: "purchased",
          isPurchased: true,
          hasSubscription: !!subscription,
          addedAt: ent.createdAt.toISOString(),
          progress: prog
            ? {
                currentPage: prog.currentPage,
                totalPages: prog.totalPages,
                percentage: prog.percentage,
                currentChapter: prog.currentChapter,
                completed: prog.completed,
                lastOpened: prog.lastOpened.toISOString(),
              }
            : undefined,
          book: {
            ...ent.book,
            coverUrl: ent.book.coverPath || "/placeholder-cover.jpg",
            tags: JSON.parse(ent.book.tags || "[]"),
            format: (ent.book.format || "interactive").toLowerCase(),
          },
        });
      }
    }

    return NextResponse.json(Array.from(combinedMap.values()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to add books to your library." }, { status: 401 });
    }
    const body = await request.json();
    const userId = user.id;
    const bookId = body.bookId;
    const status = body.status || "saved";

    if (!bookId) {
      return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const item = await prisma.libraryItem.upsert({
      where: {
        userId_bookId: { userId, bookId },
      },
      update: { status },
      create: {
        userId,
        bookId,
        status,
      },
      include: { book: true },
    });

    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to update your library." }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const userId = user.id;
    const bookId = searchParams.get("bookId");

    if (!bookId) return NextResponse.json({ error: "Missing bookId" }, { status: 400 });

    await prisma.libraryItem.deleteMany({
      where: {
        userId,
        bookId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
