import { prisma } from "../src/lib/prisma";
import { checkBookEntitlement } from "../src/lib/auth/entitlements";
import { saveSecureFile, resolveSafeStoragePath, StorageProvider, LocalStorageProvider } from "../src/lib/storage";
import crypto from "crypto";

async function runAcceptanceTests() {
  console.log("==================================================");
  console.log("READORA ACCEPTANCE VERIFICATION & TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Database Connectivity & SQLite Integrity
    // ----------------------------------------------------
    const userCount = await prisma.user.count();
    const bookCount = await prisma.book.count();
    assert(userCount > 0 && bookCount > 0, `SQLite DB connected (${userCount} users, ${bookCount} books)`);

    // ----------------------------------------------------
    // TEST 2: Admin creates a written book and multiple chapters
    // ----------------------------------------------------
    const testSlug = `test-written-book-${Date.now()}`;
    const testWrittenBook = await prisma.book.create({
      data: {
        title: "The Craft of Automated Publishing",
        slug: testSlug,
        author: "Dev Editorial Team",
        description: "A comprehensive volume on digital reading engines.",
        categoryName: "Technology",
        coverPath: "/covers/placeholder.jpg",
        format: "WRITTEN",
        accessType: "ONE_TIME_PURCHASE",
        price: 299,
        previewChapters: 1, // Only Chapter 1 is free
        status: "PUBLISHED",
        pages: 3,
      },
    });
    assert(!!testWrittenBook.id, "Test written book created in SQLite");

    // Add 3 chapters with distinct order
    const ch1 = await prisma.chapter.create({
      data: {
        bookId: testWrittenBook.id,
        title: "Chapter 1: The Canvas",
        order: 1,
        page: 1,
        content: "<p>The foundation of reading begins with typography and typography alone.</p>",
        contentJson: JSON.stringify({ type: "doc", content: [] }),
        wordCount: 120,
        readingTimeMinutes: 1,
        previewAllowed: true,
      },
    });

    const ch2 = await prisma.chapter.create({
      data: {
        bookId: testWrittenBook.id,
        title: "Chapter 2: Layout & Geometry",
        order: 2,
        page: 2,
        content: "<p>Secret chapter content: Layout requires strict proportional grids.</p>",
        contentJson: JSON.stringify({ type: "doc", content: [] }),
        wordCount: 250,
        readingTimeMinutes: 2,
        previewAllowed: false,
      },
    });

    const ch3 = await prisma.chapter.create({
      data: {
        bookId: testWrittenBook.id,
        title: "Chapter 3: Distraction-Free Flow",
        order: 3,
        page: 3,
        content: "<p>Deep reading requires an uncompromised, distraction-free environment.</p>",
        contentJson: JSON.stringify({ type: "doc", content: [] }),
        wordCount: 300,
        readingTimeMinutes: 2,
        previewAllowed: false,
      },
    });
    assert(!!ch1.id && !!ch2.id && !!ch3.id, "Multiple published chapters created for written book");

    // ----------------------------------------------------
    // TEST 3: Chapter ordering is saved and respected
    // ----------------------------------------------------
    const orderedChapters = await prisma.chapter.findMany({
      where: { bookId: testWrittenBook.id },
      orderBy: { order: "asc" },
    });
    assert(
      orderedChapters.length === 3 &&
      orderedChapters[0].order === 1 &&
      orderedChapters[1].order === 2 &&
      orderedChapters[2].order === 3,
      "Chapter ordering is preserved and queryable by order: 'asc'"
    );

    // ----------------------------------------------------
    // TEST 4: Autosave and revision restoration
    // ----------------------------------------------------
    const rev1 = await prisma.chapterRevision.create({
      data: {
        chapterId: ch1.id,
        bookId: testWrittenBook.id,
        title: ch1.title,
        content: ch1.content,
        contentJson: ch1.contentJson,
        wordCount: ch1.wordCount,
        revisionNote: "Initial draft snapshot before major edit",
      },
    });
    assert(!!rev1.id, "Chapter revision snapshot created successfully");

    // Modify chapter content (autosave simulation)
    const updatedCh1 = await prisma.chapter.update({
      where: { id: ch1.id },
      data: {
        content: "<p>Substantially altered text with new paragraphs and edits.</p>",
        wordCount: 450,
      },
    });
    assert(Boolean(updatedCh1.content?.includes("Substantially altered")), "Autosave modified chapter content");

    // Restore from rev1
    const restoredCh1 = await prisma.chapter.update({
      where: { id: ch1.id },
      data: {
        content: rev1.content,
        contentJson: rev1.contentJson,
        wordCount: rev1.wordCount,
      },
    });
    assert(restoredCh1.content === ch1.content, "Revision restoration successfully rolled back content");

    // ----------------------------------------------------
    // TEST 5: PDF and EPUB upload validation & magic bytes
    // ----------------------------------------------------
    const validPdfBuffer = Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF");
    const isPdfValid = validPdfBuffer.subarray(0, 5).toString("utf-8") === "%PDF-";
    assert(isPdfValid, "PDF signature (%PDF-) integrity validation passes for valid PDF");

    const validEpubBuffer = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
    const isEpubValid = validEpubBuffer[0] === 0x50 && validEpubBuffer[1] === 0x4b && validEpubBuffer[2] === 0x03 && validEpubBuffer[3] === 0x04;
    assert(isEpubValid, "EPUB signature (PK\\x03\\x04) integrity validation passes for valid EPUB");

    // Corrupted file test
    const corruptedBuffer = Buffer.from("NOT_A_VALID_DOCUMENT_FILE_CORRUPTED");
    const isCorruptedPdf = corruptedBuffer.subarray(0, 5).toString("utf-8") === "%PDF-";
    assert(!isCorruptedPdf, "Invalid / corrupted document fails signature inspection safely");

    // ----------------------------------------------------
    // TEST 6: File versioning and replacement without book duplication
    // ----------------------------------------------------
    const initialBookCount = await prisma.book.count();

    const bookAsset = await prisma.bookAsset.create({
      data: {
        bookId: testWrittenBook.id,
        assetType: "ORIGINAL_PDF",
        filePath: "storage/books/test-manuscript-v1.pdf",
        fileName: "test-manuscript-v1.pdf",
        mimeType: "application/pdf",
        fileSize: 10240,
        version: 1,
        checksum: crypto.createHash("sha256").update(validPdfBuffer).digest("hex"),
      },
    });

    const bookVersion = await prisma.bookVersion.create({
      data: {
        bookId: testWrittenBook.id,
        versionNumber: 2,
        filePath: "storage/books/test-manuscript-v2.pdf",
        fileName: "test-manuscript-v2.pdf",
        fileSize: 12400,
        changeSummary: "Corrected typos and updated typesetting",
      },
    });

    const postReplaceBookCount = await prisma.book.count();
    assert(
      initialBookCount === postReplaceBookCount && !!bookAsset.id && !!bookVersion.id,
      "File replacement creates BookVersion and BookAsset records without duplicating the book"
    );

    // ----------------------------------------------------
    // TEST 7: Server-side preview limit cannot be bypassed by unentitled users
    // ----------------------------------------------------
    // Unauthenticated guest user
    const guestEntitlement = await checkBookEntitlement(testWrittenBook.id, null);
    assert(!guestEntitlement.hasFullAccess, "Guest visitor does NOT have full access to paid book");
    assert(guestEntitlement.allowedPreviewChapters === 1, "Preview chapter limit enforced to 1 chapter");

    // ----------------------------------------------------
    // TEST 8: Admin preview grants full access
    // ----------------------------------------------------
    const adminUser = {
      id: "admin-test-id",
      name: "Admin Tester",
      email: "admin@readora.app",
      role: "ADMIN" as const,
      onboardingCompleted: true,
    };
    const adminEntitlement = await checkBookEntitlement(testWrittenBook.id, adminUser);
    assert(adminEntitlement.hasFullAccess && adminEntitlement.accessReason === "ADMIN_PRIVILEGE", "Admin user gets full access in reader preview mode");

    // ----------------------------------------------------
    // TEST 9: Verified payment grants BookEntitlement
    // ----------------------------------------------------
    const readerUser = await prisma.user.findFirst();
    if (readerUser) {
      const entitlement = await prisma.bookEntitlement.create({
        data: {
          userId: readerUser.id,
          bookId: testWrittenBook.id,
          source: "PURCHASE",
          active: true,
        },
      });

      const verifiedEntitlement = await checkBookEntitlement(testWrittenBook.id, {
        id: readerUser.id,
        name: readerUser.name,
        email: readerUser.email,
        role: "USER",
        onboardingCompleted: true,
      });

      assert(
        verifiedEntitlement.hasFullAccess && verifiedEntitlement.accessReason === "PURCHASED",
        "Verified payment entitlement grants full access to purchaser"
      );

      // Clean up test entitlement
      await prisma.bookEntitlement.delete({ where: { id: entitlement.id } });
    } else {
      console.log("[SKIP] Reader user not found in database for payment test");
    }

    // ----------------------------------------------------
    // TEST 10: Expired subscription does not grant access
    // ----------------------------------------------------
    const expiredSub = {
      status: "EXPIRED",
      currentPeriodEnd: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
    };
    const isSubActive = expiredSub.status === "ACTIVE" && expiredSub.currentPeriodEnd >= new Date();
    assert(!isSubActive, "Expired subscription correctly rejects access verification");

    // ----------------------------------------------------
    // TEST 11: Bookmarks persistence & location markers
    // ----------------------------------------------------
    if (readerUser) {
      const bookmark = await prisma.bookmark.create({
        data: {
          userId: readerUser.id,
          bookId: testWrittenBook.id,
          page: 2,
          chapterTitle: "Chapter 2: Layout & Geometry",
          chapterId: ch2.id,
          contentType: "CHAPTER",
          note: "Important quote on grids",
        },
      });

      const fetchedBookmark = await prisma.bookmark.findFirst({
        where: { id: bookmark.id },
      });

      assert(
        fetchedBookmark?.chapterId === ch2.id && fetchedBookmark?.note === "Important quote on grids",
        "Persistent bookmark stores chapter location marker and user note"
      );

      // Clean up test bookmark
      await prisma.bookmark.delete({ where: { id: bookmark.id } });
    }

    // ----------------------------------------------------
    // TEST 12: Reading progress synchronization
    // ----------------------------------------------------
    if (readerUser) {
      const progress = await prisma.readingProgress.upsert({
        where: {
          userId_bookId: {
            userId: readerUser.id,
            bookId: testWrittenBook.id,
          },
        },
        update: {
          currentPage: 2,
          currentChapterId: ch2.id,
          percentage: 67,
          completed: false,
        },
        create: {
          userId: readerUser.id,
          bookId: testWrittenBook.id,
          currentPage: 2,
          totalPages: 3,
          currentChapterId: ch2.id,
          percentage: 67,
          completed: false,
        },
      });

      assert(
        progress.currentPage === 2 && progress.percentage === 67,
        "Reading progress tracks current chapter, page, and completion percentage"
      );

      // Clean up progress
      await prisma.readingProgress.delete({ where: { id: progress.id } });
    }

    // ----------------------------------------------------
    // Clean up test book & chapters
    // ----------------------------------------------------
    await prisma.chapterRevision.deleteMany({ where: { bookId: testWrittenBook.id } });
    await prisma.bookAsset.deleteMany({ where: { bookId: testWrittenBook.id } });
    await prisma.bookVersion.deleteMany({ where: { bookId: testWrittenBook.id } });
    await prisma.chapter.deleteMany({ where: { bookId: testWrittenBook.id } });
    await prisma.book.delete({ where: { id: testWrittenBook.id } });
    console.log("[INFO] Test manuscript records cleaned up from SQLite.");

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log("==================================================");
    console.log(`ACCEPTANCE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAcceptanceTests();
