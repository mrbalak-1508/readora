import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

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

    const revisions = await prisma.chapterRevision.findMany({
      where: { chapterId },
      orderBy: { createdAt: "desc" },
      take: 25,
    });

    return NextResponse.json({ revisions });
  } catch (error: any) {
    console.error("Revisions fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch revisions" }, { status: 500 });
  }
}

// Restore a revision
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
    const { revisionId } = body;

    if (!revisionId) {
      return NextResponse.json({ error: "revisionId is required" }, { status: 400 });
    }

    const revision = await prisma.chapterRevision.findUnique({
      where: { id: revisionId },
    });

    if (!revision || revision.chapterId !== chapterId) {
      return NextResponse.json({ error: "Revision not found" }, { status: 404 });
    }

    // Save existing as another revision before restoring
    const current = await prisma.chapter.findUnique({ where: { id: chapterId } });
    if (current) {
      await prisma.chapterRevision.create({
        data: {
          chapterId: current.id,
          bookId: current.bookId,
          title: current.title,
          content: current.content,
          contentJson: current.contentJson,
          wordCount: current.wordCount,
          editorId: admin.id,
          editorName: admin.name || admin.email,
          revisionNote: `Auto-saved prior to restoring revision from ${new Date(revision.createdAt).toLocaleString()}`,
        },
      });
    }

    // Restore
    const restored = await prisma.chapter.update({
      where: { id: chapterId },
      data: {
        title: revision.title,
        content: revision.content,
        contentJson: revision.contentJson,
        wordCount: revision.wordCount,
        readingTimeMinutes: Math.max(1, Math.round(revision.wordCount / 200)),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Revision restored successfully",
      chapter: restored,
    });
  } catch (error: any) {
    console.error("Revision restore error:", error);
    return NextResponse.json({ error: error.message || "Failed to restore revision" }, { status: 500 });
  }
}
