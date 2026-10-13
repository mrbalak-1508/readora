import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";
import { generateSlug } from "@/lib/utils";

export const dynamic = "force-dynamic";

function resolveCoverUrl(bookId: string, coverPath?: string | null): string {
  if (!coverPath) return "/placeholder-cover.jpg";
  if (coverPath.startsWith("http://") || coverPath.startsWith("https://") || coverPath.startsWith("/")) {
    return coverPath;
  }
  return `/api/files/covers/${bookId}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("q");

    const where: any = {};
    if (category && category !== "all") {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
      ];
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (books.length === 0) {
      return NextResponse.json(MOCK_BOOKS);
    }

    const formatted = books.map((b) => ({
      ...b,
      coverUrl: resolveCoverUrl(b.id, b.coverPath),
      tags: JSON.parse(b.tags || "[]"),
      accessType: b.accessType || "FREE",
      price: b.price ?? 0,
      originalPrice: b.originalPrice ?? undefined,
      discount: b.discount ?? 0,
      currency: b.currency || "INR",
      previewType: b.previewType || "PAGES",
      previewPages: b.previewPages ?? 10,
      previewPercentage: b.previewPercentage ?? 15,
      previewChapters: b.previewChapters ?? 2,
      watermarkEnabled: b.watermarkEnabled ?? true,
      chapters: b.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        page: ch.page,
        content: ch.content,
      })),
      tableOfContents: b.chapters.map((ch) => ({
        title: ch.title,
        page: ch.page,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("Prisma SQLite fetch error, fallback to memory:", error);
    return NextResponse.json(MOCK_BOOKS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || !body.title.trim()) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }

    // 1. Generate guaranteed unique slug
    const rawSlugInput = body.slug ? body.slug.trim() : body.title.trim();
    const baseSlug = generateSlug(rawSlugInput) || `book-${Date.now()}`;
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (await prisma.book.findFirst({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 2. Resolve author relation if authorId not provided
    let resolvedAuthorId = body.authorId || null;
    if (!resolvedAuthorId && body.author) {
      const existingAuthor = await prisma.author.findFirst({
        where: { name: body.author.trim() },
      });
      if (existingAuthor) {
        resolvedAuthorId = existingAuthor.id;
      }
    }

    const bookData: any = {
      slug: uniqueSlug,
      title: body.title.trim(),
      author: body.author?.trim() || "Readora Editorial",
      description: body.description?.trim() || "An authored digital volume.",
      coverPath: body.coverUrl || body.coverPath || "/placeholder-cover.jpg",
      filePath: body.filePath || null,
      fileName: body.fileName || null,
      mimeType: body.mimeType || null,
      fileSize: body.fileSize ? Number(body.fileSize) : null,
      format: (body.format || "interactive").toUpperCase(),
      isbn: body.isbn?.trim() || null,
      language: body.language || "English",
      categoryName: body.categoryName || "Literature",
      tags: JSON.stringify(body.tags || []),
      publisher: body.publisher?.trim() || null,
      publicationDate: body.publicationDate || null,
      pages: Number(body.pages) || 200,
      featured: Boolean(body.featured),
      trending: Boolean(body.trending),
      popular: Boolean(body.popular),
      status: body.status || "PUBLISHED",
      rating: 5.0,
      sampleContent: body.sampleContent || null,
      accessType: body.accessType || "ONE_TIME_PURCHASE",
      price: Number(body.price) || 0,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : null,
      discount: Number(body.discount) || 0,
      currency: body.currency || "INR",
      previewType: body.previewType || "PAGES",
      previewPages:
        (Number(body.pages) || 200) > 1
          ? Math.max(1, Math.min(Number(body.previewPages) || 10, (Number(body.pages) || 200) - 1))
          : 1,
      previewPercentage: Number(body.previewPercentage) || 15,
      previewChapters: Number(body.previewChapters) || 1,
      watermarkEnabled: body.watermarkEnabled !== undefined ? Boolean(body.watermarkEnabled) : true,
      allowDownload: Boolean(body.allowDownload),
      allowPrint: Boolean(body.allowPrint),
      allowCopy: Boolean(body.allowCopy),
      allowFreeToc: body.allowFreeToc !== undefined ? Boolean(body.allowFreeToc) : true,
    };

    if (body.categoryId) {
      bookData.categoryId = body.categoryId;
    }

    if (resolvedAuthorId) {
      bookData.authorRef = { connect: { id: resolvedAuthorId } };
    }

    let newBook;
    try {
      newBook = await prisma.book.create({
        data: bookData,
      });
    } catch (createError: any) {
      // 1. Prisma P2002: unique constraint failed on slug
      if (createError.code === "P2002") {
        const fallbackSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
        newBook = await prisma.book.create({
          data: {
            ...bookData,
            slug: fallbackSlug,
          },
        });
      }
      // 2. Stale in-memory client compatibility (strips extended fields not yet recognized by running process)
      else if (createError.message?.includes("Unknown argument")) {
        console.warn("Retrying book creation with core schema fields due to in-memory client:", createError.message);
        const {
          allowDownload,
          allowPrint,
          allowCopy,
          allowFreeToc,
          authorId,
          authorRef,
          ...coreData
        } = bookData;

        newBook = await prisma.book.create({
          data: coreData,
        });
      } else {
        throw createError;
      }
    }

    // Automatically create initial BookAsset and BookVersion if manuscript file was supplied
    if (newBook.filePath) {
      try {
        if ((prisma as any).bookAsset?.create) {
          await (prisma as any).bookAsset.create({
            data: {
              bookId: newBook.id,
              assetType: newBook.format === "PDF" ? "ORIGINAL_PDF" : "ORIGINAL_EPUB",
              filePath: newBook.filePath,
              fileName: newBook.fileName || `${newBook.title}.pdf`,
              mimeType: newBook.mimeType || "application/pdf",
              fileSize: newBook.fileSize || 0,
              version: 1,
              checksum: body.checksum || "",
            },
          }).catch(() => {});
        }

        if ((prisma as any).bookVersion?.create) {
          await (prisma as any).bookVersion.create({
            data: {
              bookId: newBook.id,
              versionNumber: 1,
              filePath: newBook.filePath,
              fileName: newBook.fileName || `${newBook.title}.pdf`,
              fileSize: newBook.fileSize || 0,
              changeSummary: "Initial publication manuscript",
            },
          }).catch(() => {});
        }

        if (body.uploadJobId && (prisma as any).uploadJob?.update) {
          await (prisma as any).uploadJob.update({
            where: { id: body.uploadJobId },
            data: { bookId: newBook.id },
          }).catch(() => {});
        }
      } catch (assetErr) {
        console.warn("Could not create initial asset/version audit trail:", assetErr);
      }
    }

    return NextResponse.json(newBook, { status: 201 });
  } catch (error: any) {
    console.error("Prisma book creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create book record" }, { status: 500 });
  }
}
