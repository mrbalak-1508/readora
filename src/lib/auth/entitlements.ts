import { prisma } from "@/lib/prisma";
import { SessionUser } from "./session";

export interface BookEntitlementResult {
  hasFullAccess: boolean;
  accessReason: "FREE_BOOK" | "ADMIN_PRIVILEGE" | "PURCHASED" | "ACTIVE_SUBSCRIPTION" | "NONE";
  book: any | null;
  allowedPreviewPages: number;
  allowedPreviewChapters: number;
  watermarkText: string | null;
}

/**
 * Universal Server-Side Entitlement Check
 * Validates whether the given user has full access to the book.
 * If not, strictly determines allowed preview boundaries.
 */
export async function checkBookEntitlement(
  bookIdOrSlug: string,
  user?: SessionUser | null
): Promise<BookEntitlementResult> {
  const book = await prisma.book.findFirst({
    where: {
      OR: [{ id: bookIdOrSlug }, { slug: bookIdOrSlug }],
    },
    include: {
      chapters: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!book) {
    return {
      hasFullAccess: false,
      accessReason: "NONE",
      book: null,
      allowedPreviewPages: 0,
      allowedPreviewChapters: 0,
      watermarkText: null,
    };
  }

  // 1. FREE book: full access to everyone
  if (book.accessType === "FREE" || book.price === 0) {
    return {
      hasFullAccess: true,
      accessReason: "FREE_BOOK",
      book,
      allowedPreviewPages: book.pages,
      allowedPreviewChapters: book.chapters?.length || 0,
      watermarkText: null,
    };
  }

  // 2. User logged in: Check Entitlements, Admin role, or Subscriptions
  if (user) {
    if (user.role === "ADMIN") {
      return {
        hasFullAccess: true,
        accessReason: "ADMIN_PRIVILEGE",
        book,
        allowedPreviewPages: book.pages,
        allowedPreviewChapters: book.chapters?.length || 0,
        watermarkText: book.watermarkEnabled ? `Admin Preview • ${user.email}` : null,
      };
    }

    // Check direct entitlement
    const entitlement = await prisma.bookEntitlement.findFirst({
      where: {
        userId: user.id,
        active: true,
        OR: [
          { bookId: book.id },
          ...(book.slug ? [{ bookId: book.slug }] : []),
        ],
      },
    });

    if (entitlement) {
      return {
        hasFullAccess: true,
        accessReason: "PURCHASED",
        book,
        allowedPreviewPages: book.pages,
        allowedPreviewChapters: book.chapters?.length || 0,
        watermarkText: book.watermarkEnabled ? `Licensed to ${user.email} • Readora Digital Library` : null,
      };
    }

    // Check paid order
    const paidOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: "PAID",
        items: {
          some: {
            OR: [
              { bookId: book.id },
              ...(book.slug ? [{ bookId: book.slug }] : []),
            ],
          },
        },
      },
    });

    if (paidOrder) {
      // Sync entitlement
      await prisma.bookEntitlement.upsert({
        where: {
          userId_bookId: {
            userId: user.id,
            bookId: book.id,
          },
        },
        update: { active: true, source: "PURCHASE", orderId: paidOrder.id },
        create: {
          userId: user.id,
          bookId: book.id,
          orderId: paidOrder.id,
          source: "PURCHASE",
          active: true,
        },
      }).catch(() => {});

      return {
        hasFullAccess: true,
        accessReason: "PURCHASED",
        book,
        allowedPreviewPages: book.pages,
        allowedPreviewChapters: book.chapters?.length || 0,
        watermarkText: book.watermarkEnabled ? `Licensed to ${user.email} • Readora Digital Library` : null,
      };
    }

    // Check active subscription
    const activeSub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        status: "ACTIVE",
        currentPeriodEnd: { gte: new Date() },
      },
    });

    if (
      activeSub &&
      ["SUBSCRIPTION", "FREE_WITH_SUBSCRIPTION", "PREVIEW"].includes(book.accessType)
    ) {
      return {
        hasFullAccess: true,
        accessReason: "ACTIVE_SUBSCRIPTION",
        book,
        allowedPreviewPages: book.pages,
        allowedPreviewChapters: book.chapters?.length || 0,
        watermarkText: book.watermarkEnabled ? `Subscriber Copy • ${user.email}` : null,
      };
    }
  }

  // Not entitled: calculate preview limits
  const allowedPreviewPages = Math.min(book.pages, book.previewPages || 10);
  const allowedPreviewChapters = Math.max(1, book.previewChapters || 1);

  return {
    hasFullAccess: false,
    accessReason: "NONE",
    book,
    allowedPreviewPages,
    allowedPreviewChapters,
    watermarkText: null,
  };
}
