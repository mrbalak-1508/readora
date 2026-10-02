import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { validateAndExtractFile, saveSecureFile } from "@/lib/storage";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // 1. Server-side Authorization Guard: Strictly ADMIN only
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Administrator access required to upload books" },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const title = (formData.get("title") as string)?.trim();
    if (!title) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }

    const author = (formData.get("author") as string)?.trim() || "Unknown Author";
    const description = (formData.get("description") as string)?.trim() || "";
    const categoryId = (formData.get("categoryId") as string) || null;
    const categoryName = (formData.get("categoryName") as string) || "General";
    const language = (formData.get("language") as string) || "English";
    const isbn = (formData.get("isbn") as string) || null;
    const publisher = (formData.get("publisher") as string) || "Readora Press";
    const publicationDate = (formData.get("publicationDate") as string) || new Date().toISOString().split("T")[0];
    const pages = parseInt((formData.get("pages") as string) || "200", 10);
    const featured = formData.get("featured") === "true";
    const status = (formData.get("status") as string) || "PUBLISHED";
    const format = (formData.get("format") as string)?.toUpperCase() || "INTERACTIVE";
    const sampleContent = (formData.get("sampleContent") as string) || null;
    const rawTags = (formData.get("tags") as string) || "";
    const tagsArray = rawTags.split(",").map((t) => t.trim()).filter(Boolean);

    // Pricing & Access Rules (Requirement 30)
    const accessType = (formData.get("accessType") as string) || "ONE_TIME_PURCHASE";
    const price = parseFloat((formData.get("price") as string) || "199");
    const originalPrice = parseFloat((formData.get("originalPrice") as string) || "299");
    const discount = parseInt((formData.get("discount") as string) || "0", 10);
    const previewType = (formData.get("previewType") as string) || "PAGES";
    const previewPages = parseInt((formData.get("previewPages") as string) || "10", 10);
    const previewPercentage = parseInt((formData.get("previewPercentage") as string) || "15", 10);
    const previewChapters = parseInt((formData.get("previewChapters") as string) || "2", 10);
    const watermarkEnabled = formData.get("watermarkEnabled") !== "false";

    // 2. Parse Sequential Pages Data
    const rawPagesData = formData.get("pagesData") as string | null;
    let pagesList: Array<{ pageNumber: number; title: string; content: string }> = [];
    if (rawPagesData) {
      try {
        pagesList = JSON.parse(rawPagesData);
      } catch (e) {
        console.warn("Failed to parse pagesData JSON:", e);
      }
    }

    // 3. Validate and Save Exact Book File (PDF / EPUB)
    let savedBookFilePath: string | null = null;
    let savedBookFileName: string | null = null;
    let savedBookMime: string | null = null;
    let savedBookSize: number | null = null;

    const bookFile = formData.get("bookFile") as File | null;
    if (bookFile && bookFile.size > 0) {
      const validation = await validateAndExtractFile(bookFile, "book");
      if (validation.error || !validation.file) {
        return NextResponse.json({ error: validation.error || "Invalid book file" }, { status: 400 });
      }

      const saved = await saveSecureFile(validation.file, "books");
      savedBookFilePath = saved.relativePath;
      savedBookFileName = validation.file.fileName;
      savedBookMime = validation.file.mimeType;
      savedBookSize = validation.file.size;
    }

    // 4. Validate and Save Cover File
    let coverPath = (formData.get("coverUrl") as string) || "/placeholder-cover.jpg";
    const coverFile = formData.get("coverFile") as File | null;
    if (coverFile && coverFile.size > 0) {
      const validation = await validateAndExtractFile(coverFile, "cover");
      if (validation.error || !validation.file) {
        return NextResponse.json({ error: validation.error || "Invalid cover image" }, { status: 400 });
      }

      const saved = await saveSecureFile(validation.file, "covers");
      coverPath = saved.relativePath;
    }

    // 5. Generate unique slug
    let baseSlug = generateSlug(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (await prisma.book.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    // 6. Connect or create Author
    let authorSlug = generateSlug(author);
    let authorRecord = await prisma.author.findUnique({ where: { slug: authorSlug } });
    if (!authorRecord) {
      authorRecord = await prisma.author.create({
        data: {
          name: author,
          slug: authorSlug,
          bio: `Distinguished author in the Readora library.`,
        },
      });
    }

    // 7. Connect or verify Category
    let resolvedCategoryId = categoryId;
    if (resolvedCategoryId) {
      const catExists = await prisma.category.findUnique({ where: { id: resolvedCategoryId } });
      if (!catExists) {
        resolvedCategoryId = null;
      }
    }

    const calculatedPages = pagesList.length > 0 ? pagesList.length : (isNaN(pages) ? 200 : pages);

    // 8. Create Book record in SQLite
    const newBook = await prisma.book.create({
      data: {
        slug: uniqueSlug,
        title,
        author,
        authorId: authorRecord.id,
        description,
        coverPath,
        filePath: savedBookFilePath,
        fileName: savedBookFileName,
        mimeType: savedBookMime,
        fileSize: savedBookSize,
        format,
        isbn,
        language,
        categoryId: resolvedCategoryId,
        categoryName,
        tags: JSON.stringify(tagsArray),
        publisher,
        publicationDate,
        pages: calculatedPages,
        featured,
        status,
        sampleContent,
        accessType,
        price: isNaN(price) ? 0 : price,
        originalPrice: isNaN(originalPrice) ? null : originalPrice,
        discount: isNaN(discount) ? 0 : discount,
        currency: "INR",
        previewType,
        previewPages: isNaN(previewPages) ? 10 : previewPages,
        previewPercentage: isNaN(previewPercentage) ? 15 : previewPercentage,
        previewChapters: isNaN(previewChapters) ? 2 : previewChapters,
        watermarkEnabled,
      },
    });

    // 9. Save Sequential Pages into Chapter Records
    if (pagesList.length > 0) {
      for (let i = 0; i < pagesList.length; i++) {
        const p = pagesList[i];
        await prisma.chapter.create({
          data: {
            bookId: newBook.id,
            title: p.title?.trim() || `Page ${p.pageNumber || i + 1}`,
            page: p.pageNumber || i + 1,
            order: i + 1,
            content: p.content || "",
          },
        });
      }
    } else if (sampleContent) {
      await prisma.chapter.create({
        data: {
          bookId: newBook.id,
          title: "Chapter 1",
          page: 1,
          order: 1,
          content: sampleContent,
        },
      });
    }

    // 10. Log Admin Activity
    await prisma.adminActivity.create({
      data: {
        adminId: user.id,
        action: "BOOK_CREATE",
        targetType: "BOOK",
        targetId: newBook.id,
        details: JSON.stringify({
          title: newBook.title,
          format: newBook.format,
          accessType: newBook.accessType,
          price: newBook.price,
          hasLocalFile: !!savedBookFilePath,
          sequentialPagesCount: pagesList.length,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Book uploaded and published successfully",
      book: newBook,
    });
  } catch (error: any) {
    console.error("Admin book upload route error:", error);
    return NextResponse.json({ error: error.message || "Failed to process book upload" }, { status: 500 });
  }
}
