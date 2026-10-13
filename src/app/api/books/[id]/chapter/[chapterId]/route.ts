import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { checkBookEntitlement } from "@/lib/auth/entitlements";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const { id, chapterId } = await params;
    const user = await getCurrentUser();

    // 1. Check book entitlement
    const entitlement = await checkBookEntitlement(id, user);
    if (!entitlement.book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const { book, hasFullAccess, allowedPreviewChapters, watermarkText } = entitlement;

    // 2. Fetch target chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        bookId: book.id,
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found in this book" }, { status: 404 });
    }

    // 3. Determine if chapter is within preview
    // If user does not have full access, check whether chapter is within preview limit
    if (!hasFullAccess) {
      const allChapters = await prisma.chapter.findMany({
        where: { bookId: book.id },
        orderBy: { order: "asc" },
        select: { id: true, order: true },
      });

      const chapterIndex = allChapters.findIndex((c) => c.id === chapter.id);

      if (chapterIndex >= allowedPreviewChapters) {
        return NextResponse.json(
          {
            allowed: false,
            locked: true,
            error: `Chapter "${chapter.title}" requires full purchase. Free preview is limited to ${allowedPreviewChapters} chapter(s).`,
            previewLimit: allowedPreviewChapters,
            requiresPurchase: true,
            price: book.price,
            currency: book.currency || "INR",
          },
          { status: 403 }
        );
      }
    }

    // 4. Return chapter payload with watermark if eligible
    return NextResponse.json({
      allowed: true,
      locked: false,
      chapter: {
        id: chapter.id,
        title: chapter.title,
        subtitle: chapter.subtitle,
        order: chapter.order,
        page: chapter.page,
        content: chapter.content,
        wordCount: chapter.wordCount,
        readingTimeMinutes: chapter.readingTimeMinutes,
      },
      watermark: watermarkText,
    });
  } catch (error: any) {
    console.error("Chapter access retrieval error:", error);
    return NextResponse.json({ error: "Failed to retrieve chapter content" }, { status: 500 });
  }
}
