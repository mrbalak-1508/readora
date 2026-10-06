import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/books/[id]/reviews - Fetch all reviews and rating breakdown
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Resolve book by ID or slug
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        title: true,
        rating: true,
        ratingCount: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const reviews = await prisma.review.findMany({
      where: { bookId: book.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarPath: true,
            role: true,
          },
        },
      },
    });

    // Check currently authenticated session user
    const currentUser = await getCurrentUser();

    // Calculate rating statistics
    const totalReviews = reviews.length;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;

    for (const r of reviews) {
      const star = Math.min(5, Math.max(1, r.rating));
      distribution[star] = (distribution[star] || 0) + 1;
      sum += r.rating;
    }

    const averageRating =
      totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : book.rating || 5;

    const userReview = currentUser
      ? reviews.find((r) => r.userId === currentUser.id) || null
      : null;

    return NextResponse.json({
      success: true,
      reviews,
      totalReviews,
      averageRating,
      distribution,
      userReview,
      currentUserId: currentUser?.id || null,
      isAdmin: currentUser?.role === "ADMIN",
    });
  } catch (error: any) {
    console.error("GET book reviews error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/books/[id]/reviews - Create or update review (Authorized Users Only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Strict Authorization Guard: Only logged-in users may submit reviews
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          error: "Unauthorized: You must sign in to write a review.",
          requiresAuth: true,
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, reviewText } = body;

    // Validate rating (1 to 5)
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { error: "Please provide a valid rating between 1 and 5 stars." },
        { status: 400 }
      );
    }

    // Validate review text (optional or max 2500 chars)
    const trimmedText = typeof reviewText === "string" ? reviewText.trim() : "";
    if (trimmedText.length > 2500) {
      return NextResponse.json(
        { error: "Review text must be under 2,500 characters." },
        { status: 400 }
      );
    }

    // Resolve book
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Check if user already reviewed this book
    const existingReview = await prisma.review.findFirst({
      where: {
        bookId: book.id,
        userId: user.id,
      },
    });

    let savedReview;
    if (existingReview) {
      savedReview = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: numericRating,
          reviewText: trimmedText || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarPath: true,
              role: true,
            },
          },
        },
      });
    } else {
      savedReview = await prisma.review.create({
        data: {
          bookId: book.id,
          userId: user.id,
          rating: numericRating,
          reviewText: trimmedText || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarPath: true,
              role: true,
            },
          },
        },
      });
    }

    // Recalculate book aggregate rating and ratingCount
    const allBookReviews = await prisma.review.findMany({
      where: { bookId: book.id },
      select: { rating: true },
    });

    const newRatingCount = allBookReviews.length;
    const newAverage =
      newRatingCount > 0
        ? Number(
            (
              allBookReviews.reduce((acc, curr) => acc + curr.rating, 0) /
              newRatingCount
            ).toFixed(1)
          )
        : 5;

    await prisma.book.update({
      where: { id: book.id },
      data: {
        rating: newAverage,
        ratingCount: newRatingCount,
      },
    });

    return NextResponse.json({
      success: true,
      review: savedReview,
      averageRating: newAverage,
      totalReviews: newRatingCount,
      message: existingReview
        ? "Your review has been updated."
        : "Your review has been published.",
    });
  } catch (error: any) {
    console.error("POST book review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to post review" },
      { status: 500 }
    );
  }
}

// DELETE /api/books/[id]/reviews - Delete a review (Author or Admin Only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Please sign in." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "Review ID is required" },
        { status: 400 }
      );
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only review author or admin can delete
    if (review.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete another reader's review." },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Recalculate book aggregate rating
    const allBookReviews = await prisma.review.findMany({
      where: { bookId: review.bookId },
      select: { rating: true },
    });

    const newRatingCount = allBookReviews.length;
    const newAverage =
      newRatingCount > 0
        ? Number(
            (
              allBookReviews.reduce((acc, curr) => acc + curr.rating, 0) /
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

    return NextResponse.json({
      success: true,
      message: "Review removed successfully.",
      averageRating: newAverage,
      totalReviews: newRatingCount,
    });
  } catch (error: any) {
    console.error("DELETE book review error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}
