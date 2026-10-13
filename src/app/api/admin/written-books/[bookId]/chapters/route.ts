import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId } = await params;
    const body = await request.json();
    const { title, subtitle, isSection, parentId } = body;

    const book = await prisma.book.findFirst({
      where: { OR: [{ id: bookId }, { slug: bookId }] },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Determine order
    const maxOrderChapter = await prisma.chapter.findFirst({
      where: { bookId: book.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    const nextOrder = (maxOrderChapter?.order ?? -1) + 1;

    const chapterTitle = title?.trim() || (isSection ? `Part ${nextOrder + 1}: Section Title` : `Chapter ${nextOrder + 1}: Untitled`);
    const slug = generateSlug(chapterTitle) + `-${Date.now().toString().slice(-4)}`;

    const newChapter = await prisma.chapter.create({
      data: {
        bookId: book.id,
        title: chapterTitle,
        subtitle: subtitle || undefined,
        slug,
        order: nextOrder,
        isSection: Boolean(isSection),
        parentId: parentId || undefined,
        status: "DRAFT",
        content: isSection ? "" : "<p>Begin writing this chapter...</p>",
        contentJson: isSection
          ? null
          : JSON.stringify({
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Begin writing this chapter..." }],
                },
              ],
            }),
        wordCount: isSection ? 0 : 5,
        readingTimeMinutes: 1,
        previewAllowed: true,
      },
    });

    return NextResponse.json({ success: true, chapter: newChapter }, { status: 201 });
  } catch (error: any) {
    console.error("Chapter creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create chapter" }, { status: 500 });
  }
}

// Reorder chapters
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId } = await params;
    const body = await request.json();
    const { orderedChapterIds } = body;

    if (!Array.isArray(orderedChapterIds)) {
      return NextResponse.json({ error: "orderedChapterIds must be an array" }, { status: 400 });
    }

    const book = await prisma.book.findFirst({
      where: { OR: [{ id: bookId }, { slug: bookId }] },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Update order in transaction
    await prisma.$transaction(
      orderedChapterIds.map((id, index) =>
        prisma.chapter.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    return NextResponse.json({ success: true, message: "Chapters reordered" });
  } catch (error: any) {
    console.error("Chapter reorder error:", error);
    return NextResponse.json({ error: error.message || "Failed to reorder chapters" }, { status: 500 });
  }
}
