import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/admin/reviews - Admin full list & statistics for reviews
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const ratingFilter = searchParams.get("rating") || "ALL";
    const bookIdFilter = searchParams.get("bookId") || "ALL";

    const where: any = {};

    if (ratingFilter !== "ALL") {
      where.rating = Number(ratingFilter);
    }

    if (bookIdFilter !== "ALL") {
      where.bookId = bookIdFilter;
    }

    if (search) {
      where.OR = [
        { reviewText: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { book: { title: { contains: search } } },
      ];
    }

    const [reviews, totalCount, allReviews] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarPath: true,
              role: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverPath: true,
              author: true,
              rating: true,
              ratingCount: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
      prisma.review.findMany({
        select: { rating: true },
      }),
    ]);

    // Compute global metrics
    const totalPlatformReviews = allReviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of allReviews) {
      const star = Math.min(5, Math.max(1, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += r.rating;
    }

    const globalAverageRating =
      totalPlatformReviews > 0 ? Number((sum / totalPlatformReviews).toFixed(1)) : 5.0;

    return NextResponse.json({
      success: true,
      reviews,
      totalCount,
      stats: {
        totalReviews: totalPlatformReviews,
        averageRating: globalAverageRating,
        distribution,
      },
    });
  } catch (error: any) {
    console.error("Admin GET reviews error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch admin reviews" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reviews - Admin moderation deletion
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json({ error: "Review ID is required" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        book: { select: { id: true, title: true } },
        user: { select: { name: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate book aggregate rating
    const remainingBookReviews = await prisma.review.findMany({
      where: { bookId: review.bookId },
      select: { rating: true },
    });

    const newRatingCount = remainingBookReviews.length;
    const newAverage =
      newRatingCount > 0
        ? Number(
            (
              remainingBookReviews.reduce((acc, curr) => acc + curr.rating, 0) /
              newRatingCount
            ).toFixed(1)
          )
        : 4.8;

    await prisma.book.update({
      where: { id: review.bookId },
      data: {
        rating: newAverage,
        ratingCount: Math.max(1, newRatingCount),
      },
    });

    // Log admin moderation action
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "REVIEW_DELETE",
        targetType: "REVIEW",
        targetId: reviewId,
        details: JSON.stringify({
          bookTitle: review.book?.title,
          reviewer: review.user?.name,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Review successfully removed from the library catalog.",
    });
  } catch (error: any) {
    console.error("Admin DELETE review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove review" },
      { status: 500 }
    );
  }
}
