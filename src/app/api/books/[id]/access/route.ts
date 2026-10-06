import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    // Find the book by id or slug
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    let hasFullAccess = false;
    let accessReason = "NONE";

    // 1. FREE book: full access to everyone
    if (book.accessType === "FREE" || book.price === 0) {
      hasFullAccess = true;
      accessReason = "FREE_BOOK";
    }

    // 2. User logged in: Check Entitlements, Admin role, or Subscriptions
    if (user && !hasFullAccess) {
      if (user.role === "ADMIN") {
        hasFullAccess = true;
        accessReason = "ADMIN_PRIVILEGE";
      } else {
        // Check direct entitlement (purchase or gift) by id or slug
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
          hasFullAccess = true;
          accessReason = "PURCHASED";
        } else {
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
            hasFullAccess = true;
            accessReason = "PURCHASED";
            // Ensure entitlement is synced in database
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
          } else {
            // Check active subscription if eligible
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
              hasFullAccess = true;
              accessReason = "ACTIVE_SUBSCRIPTION";
            }
          }
        }
      }
    }

    // Determine preview limits if no full access
    const previewPagesAllowed = book.previewPages || 10;
    const previewType = book.previewType || "PAGES";

    // Watermark generation for paid / licensed content
    const watermarkText =
      hasFullAccess && user && book.watermarkEnabled
        ? `Licensed to ${user.email} • Readora Digital Library`
        : null;

    // SECURITY: If NOT full access, filter chapters and content strictly on the server!
    // Never send full content over the wire when user only has preview access.
    const allChapters = book.chapters || [];
    let deliveredChapters = allChapters;
    let maxPagesDelivered = book.pages;

    if (!hasFullAccess) {
      maxPagesDelivered = Math.min(book.pages, previewPagesAllowed);
      deliveredChapters = allChapters.filter((ch) => ch.page <= previewPagesAllowed);
    }

    return NextResponse.json({
      bookId: book.id,
      slug: book.slug,
      title: book.title,
      author: book.author,
      format: book.format,
      pages: book.pages,
      accessType: book.accessType,
      price: book.price,
      hasFullAccess,
      accessReason,
      preview: {
        isPreview: !hasFullAccess,
        previewType,
        maxPages: maxPagesDelivered,
        allowedPages: previewPagesAllowed,
      },
      watermark: watermarkText,
      chapters: deliveredChapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        page: ch.page,
        content: ch.content,
      })),
      sampleContent: book.sampleContent,
    });
  } catch (error: any) {
    console.error("Book access error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve access" }, { status: 500 });
  }
}
