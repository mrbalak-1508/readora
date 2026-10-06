import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageNumber: string }> }
) {
  try {
    const { id, pageNumber } = await params;
    const pageNum = parseInt(pageNumber, 10);

    if (isNaN(pageNum) || pageNum < 1) {
      return NextResponse.json({ error: "Invalid page number" }, { status: 400 });
    }

    const user = await getCurrentUser();

    // 1. Find book in database by id or slug
    const book = await prisma.book.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        title: true,
        accessType: true,
        price: true,
        pages: true,
        previewPages: true,
        watermarkEnabled: true,
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 2. Check Entitlements / Permissions
    let hasFullAccess = false;

    if (book.accessType === "FREE" || book.price === 0) {
      hasFullAccess = true;
    } else if (user) {
      if (user.role === "ADMIN") {
        hasFullAccess = true;
      } else {
        const entitlement = await prisma.bookEntitlement.findUnique({
          where: {
            userId_bookId: {
              userId: user.id,
              bookId: book.id,
            },
          },
        });

        if (entitlement && entitlement.active) {
          hasFullAccess = true;
        } else {
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
          }
        }
      }
    }

    // 3. Validate Preview Limit
    const previewLimit = book.previewPages || 10;

    if (!hasFullAccess && pageNum > previewLimit) {
      return NextResponse.json(
        {
          allowed: false,
          error: `Page ${pageNum} is locked. Free preview is limited to ${previewLimit} pages.`,
          previewLimit,
          requiresPurchase: true,
          price: book.price,
        },
        { status: 403 }
      );
    }

    // 4. Validate page within document range
    if (book.pages > 0 && pageNum > book.pages) {
      return NextResponse.json(
        {
          allowed: false,
          error: `Page ${pageNum} is beyond document end (${book.pages} pages).`,
        },
        { status: 404 }
      );
    }

    // 5. Watermark text for authenticated users
    const watermark =
      user && book.watermarkEnabled
        ? `${user.name || user.email} • Readora Digital Library`
        : null;

    return NextResponse.json({
      allowed: true,
      pageNumber: pageNum,
      totalPages: book.pages,
      hasFullAccess,
      watermark,
    });
  } catch (error: any) {
    console.error("Page verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
