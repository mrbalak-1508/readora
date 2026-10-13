import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    // 1. Parallel Core Counts
    const [
      totalBooks,
      publishedBooks,
      draftBooks,
      archivedBooks,
      totalUsers,
      totalReaders,
      processingFailures,
      paidOrdersAggregate,
      subscriptionsCount,
      activeReaders,
      booksCompleted,
      progressAggregate,
      mostReadBooks,
      recentBooks,
      recentlyUpdatedBooks,
      recentActivities,
      categories,
      allUsers,
      allProgress,
      totalReviews,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { status: "PUBLISHED" } }),
      prisma.book.count({ where: { status: "DRAFT" } }),
      prisma.book.count({ where: { status: "ARCHIVED" } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.uploadJob.count({ where: { status: "FAILED" } }),
      prisma.order.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true },
      }),
      prisma.subscription.count({
        where: { status: "ACTIVE" },
      }),
      prisma.readingProgress.count({ where: { completed: false } }),
      prisma.readingProgress.count({ where: { completed: true } }),
      prisma.readingProgress.aggregate({
        _sum: { timeSpentSeconds: true },
      }),
      prisma.book.findMany({
        take: 5,
        orderBy: { readCount: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          readCount: true,
          categoryName: true,
          coverPath: true,
          status: true,
          pages: true,
        },
      }),
      prisma.book.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          categoryName: true,
          createdAt: true,
          status: true,
          format: true,
        },
      }),
      prisma.book.findMany({
        take: 8,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          author: true,
          categoryName: true,
          coverPath: true,
          createdAt: true,
          updatedAt: true,
          status: true,
          format: true,
          accessType: true,
          price: true,
          pages: true,
        },
      }),
      ((prisma as any).adminActivity?.findMany
        ? (prisma as any).adminActivity.findMany({
            take: 8,
            orderBy: { createdAt: "desc" },
            include: {
              admin: { select: { name: true, email: true } },
            },
          }).catch(() => [])
        : Promise.resolve([])),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { books: true } },
        },
      }),
      prisma.user.findMany({
        select: { createdAt: true },
      }),
      prisma.readingProgress.findMany({
        select: { updatedAt: true, timeSpentSeconds: true, completed: true },
      }),
      prisma.review.count(),
    ]);

    const totalSeconds = progressAggregate._sum.timeSpentSeconds || 0;
    const readingHours = (totalSeconds / 3600).toFixed(1);
    const sales = paidOrdersAggregate._sum.totalAmount || 0;
    // Estimate subscription revenue from active subs or paid subscription items
    const subscriptionRevenue = Math.round(subscriptionsCount * 499); // default monthly rate

    // 2. Compute 7-day Day-by-Day Reading Activity & New Users Trends
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const trendDays: { day: string; date: string; reads: number; users: number; books: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split("T")[0];

      // Match user signups on this day
      const userCount = allUsers.filter((u) => u.createdAt.toISOString().startsWith(dateStr)).length;
      // Match active progress on this day
      const progressCount = allProgress.filter((p) => p.updatedAt.toISOString().startsWith(dateStr)).length;
      // Match books added on this day
      const bookCount = recentBooks.filter((b) => b.createdAt.toISOString().startsWith(dateStr)).length;

      trendDays.push({
        day: dayName,
        date: dateStr,
        reads: progressCount,
        users: userCount,
        books: bookCount,
      });
    }

    // 3. Category distribution
    const categoryDistribution = categories.map((c) => ({
      name: c.name,
      count: c._count.books,
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    return NextResponse.json({
      totalBooks,
      publishedBooks,
      draftBooks,
      archivedBooks,
      processingFailures,
      totalUsers,
      totalReaders,
      sales,
      subscriptionRevenue,
      subscriptionsCount,
      totalReviews,
      activeReaders,
      booksCompleted,
      readingHours,
      mostReadBooks,
      recentBooks,
      recentlyUpdatedBooks,
      recentActivities,
      trendDays,
      categoryDistribution,
    });
  } catch (error: any) {
    console.error("Admin stats query error:", error);
    return NextResponse.json({ error: "Failed to query library analytics" }, { status: 500 });
  }
}
