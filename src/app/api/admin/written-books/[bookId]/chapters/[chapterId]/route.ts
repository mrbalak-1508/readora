import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200)); // ~200 WPM
}

function countWords(htmlOrText: string): number {
  if (!htmlOrText) return 0;
  const clean = htmlOrText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!clean) return 0;
  return clean.split(" ").length;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        revisions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json({ chapter });
  } catch (error: any) {
    console.error("Chapter fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch chapter" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { bookId, chapterId } = await params;
    const body = await request.json();

    const existingChapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!existingChapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle?.trim();
    if (body.status !== undefined) updateData.status = body.status; // DRAFT or PUBLISHED
    if (body.previewAllowed !== undefined) updateData.previewAllowed = Boolean(body.previewAllowed);
    if (body.isSection !== undefined) updateData.isSection = Boolean(body.isSection);

    let shouldCreateRevision = Boolean(body.createRevision);

    if (body.content !== undefined) {
      updateData.content = body.content;
      const words = countWords(body.content);
      updateData.wordCount = words;
      updateData.readingTimeMinutes = calculateReadingTime(words);

      // Auto-create revision if character diff is large (>100 chars)
      const prevLen = existingChapter.content?.length || 0;
      const newLen = body.content.length;
      if (Math.abs(newLen - prevLen) > 100) {
        shouldCreateRevision = true;
      }
    }

    if (body.contentJson !== undefined) {
      updateData.contentJson =
        typeof body.contentJson === "string" ? body.contentJson : JSON.stringify(body.contentJson);
    }

    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: updateData,
    });

    // Create Revision snapshot
    if (shouldCreateRevision) {
      await prisma.chapterRevision.create({
        data: {
          chapterId: updated.id,
          bookId: updated.bookId,
          title: updated.title,
          content: updated.content,
          contentJson: updated.contentJson,
          wordCount: updated.wordCount,
          editorId: admin.id,
          editorName: admin.name || admin.email,
          revisionNote: body.revisionNote || (body.createRevision ? "Explicit manual save snapshot" : "Autosave revision snapshot"),
        },
      });
    }

    // Touch book's updatedAt
    await prisma.book.update({
      where: { id: updated.bookId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, chapter: updated });
  } catch (error: any) {
    console.error("Chapter update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update chapter" }, { status: 500 });
  }
}

// Action dispatcher (e.g. Duplicate)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { chapterId } = await params;
    const body = await request.json();

    if (body.action === "duplicate") {
      const source = await prisma.chapter.findUnique({
        where: { id: chapterId },
      });

      if (!source) {
        return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
      }

      const duplicated = await prisma.chapter.create({
        data: {
          bookId: source.bookId,
          title: `${source.title} (Copy)`,
          subtitle: source.subtitle,
          content: source.content,
          contentJson: source.contentJson,
          order: source.order + 1,
          status: "DRAFT",
          wordCount: source.wordCount,
          readingTimeMinutes: source.readingTimeMinutes,
          previewAllowed: source.previewAllowed,
          isSection: source.isSection,
          parentId: source.parentId,
        },
      });

      return NextResponse.json({ success: true, chapter: duplicated }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Chapter action error:", error);
    return NextResponse.json({ error: error.message || "Failed to perform action" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { chapterId } = await params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    return NextResponse.json({ success: true, message: "Chapter deleted" });
  } catch (error: any) {
    console.error("Chapter delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete chapter" }, { status: 500 });
  }
}
