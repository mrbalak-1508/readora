import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { checkBookEntitlement } from "@/lib/auth/entitlements";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    const entitlement = await checkBookEntitlement(id, user);

    if (!entitlement.book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const {
      book,
      hasFullAccess,
      accessReason,
      allowedPreviewPages,
      allowedPreviewChapters,
      watermarkText,
    } = entitlement;

    const allChapters = book.chapters || [];
    const isWritten = (book.format || "").toUpperCase() === "WRITTEN";

    // SECURITY: Strictly restrict content payload at server boundary for preview users
    const deliveredChapters = allChapters.map((ch: any, idx: number) => {
      let isAllowed = hasFullAccess;
      if (!isAllowed) {
        if (isWritten) {
          isAllowed = idx < allowedPreviewChapters;
        } else {
          isAllowed = ch.page <= allowedPreviewPages;
        }
      }

      return {
        id: ch.id,
        title: ch.title,
        subtitle: ch.subtitle,
        page: ch.page,
        order: ch.order,
        isSection: ch.isSection,
        wordCount: ch.wordCount,
        readingTimeMinutes: ch.readingTimeMinutes,
        previewAllowed: isAllowed,
        content: isAllowed ? ch.content : null,
      };
    });

    const maxPagesDelivered = hasFullAccess ? book.pages : allowedPreviewPages;

    return NextResponse.json({
      bookId: book.id,
      slug: book.slug,
      title: book.title,
      author: book.author,
      format: book.format,
      pages: book.pages,
      accessType: book.accessType,
      price: book.price,
      currency: book.currency || "INR",
      hasFullAccess,
      accessReason,
      allowDownload: book.allowDownload && hasFullAccess,
      allowPrint: book.allowPrint && hasFullAccess,
      allowCopy: book.allowCopy && hasFullAccess,
      preview: {
        isPreview: !hasFullAccess,
        previewType: book.previewType || "PAGES",
        maxPages: maxPagesDelivered,
        allowedPages: allowedPreviewPages,
        allowedChapters: allowedPreviewChapters,
      },
      watermark: watermarkText,
      chapters: deliveredChapters,
      sampleContent: book.sampleContent,
    });
  } catch (error: any) {
    console.error("Book access verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve access" },
      { status: 500 }
    );
  }
}
