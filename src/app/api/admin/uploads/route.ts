import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const jobs = await prisma.uploadJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            slug: true,
            format: true,
          },
        },
      },
    });

    const counts = await prisma.uploadJob.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const statusCounts: Record<string, number> = {
      PENDING: 0,
      UPLOADING: 0,
      PROCESSING: 0,
      READY: 0,
      FAILED: 0,
    };
    counts.forEach((c) => {
      statusCounts[c.status] = c._count._all;
    });

    return NextResponse.json({
      jobs,
      counts: statusCounts,
      total: jobs.length,
    });
  } catch (error: any) {
    console.error("Upload jobs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch upload jobs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { action, jobId } = body;

    if (action === "retry" && jobId) {
      const job = await prisma.uploadJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }

      const updated = await prisma.uploadJob.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
          progress: 25,
          stage: "RETRYING_VALIDATION",
          errorMessage: null,
          retryCount: { increment: 1 },
        },
      });

      // If file exists on storage, re-verify
      return NextResponse.json({
        message: "Upload job retry initiated",
        job: updated,
      });
    }

    if (action === "clear-failed") {
      await prisma.uploadJob.deleteMany({
        where: { status: "FAILED" },
      });
      return NextResponse.json({ message: "Failed jobs cleared" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Upload job action error:", error);
    return NextResponse.json({ error: "Failed to process upload job action" }, { status: 500 });
  }
}
