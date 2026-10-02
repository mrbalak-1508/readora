import React from "react";
import { notFound } from "next/navigation";
import { ReaderProvider } from "@/context/ReaderContext";
import { ReaderView } from "@/components/reader/ReaderView";
import { prisma } from "@/lib/prisma";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";
import { Book } from "@/lib/types";

interface PageProps {
  params: Promise<{ bookId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { bookId } = await params;
  try {
    const book = await prisma.book.findFirst({
      where: { OR: [{ id: bookId }, { slug: bookId }] },
    });
    if (book) {
      return {
        title: `Reading: ${book.title} — READORA`,
        description: `Read "${book.title}" by ${book.author} in the READORA digital reader.`,
      };
    }
  } catch {
    // fallback
  }
  return {
    title: "READORA Reader",
  };
}

export default async function ReadPage({ params }: PageProps) {
  const { bookId } = await params;

  let book: Book | null = null;

  try {
    const dbBook = await prisma.book.findFirst({
      where: {
        OR: [{ id: bookId }, { slug: bookId }],
      },
      include: {
        chapters: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (dbBook) {
      book = {
        ...dbBook,
        isbn: dbBook.isbn || undefined,
        publisher: dbBook.publisher || undefined,
        publicationDate: dbBook.publicationDate || "2024",
        categoryId: dbBook.categoryId || "general",
        categoryName: dbBook.categoryName || "Curated",
        coverUrl: dbBook.coverPath || "/placeholder-cover.jpg",
        fileUrl: dbBook.filePath || undefined,
        fileSize: dbBook.fileSize ?? undefined,
        sampleContent: dbBook.sampleContent || undefined,
        tags: JSON.parse(dbBook.tags || "[]"),
        accessType: dbBook.accessType as any,
        price: dbBook.price,
        originalPrice: dbBook.originalPrice ?? undefined,
        discount: dbBook.discount,
        currency: dbBook.currency,
        previewType: dbBook.previewType as any,
        previewPages: dbBook.previewPages,
        format: (dbBook.format || "interactive").toLowerCase() as any,
        chapters: dbBook.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          page: ch.page,
          content: ch.content || undefined,
        })),
        tableOfContents: dbBook.chapters.map((ch) => ({
          title: ch.title,
          page: ch.page,
        })),
        createdAt: dbBook.createdAt.toISOString(),
      };
    }
  } catch (err) {
    console.error("Reader database query fallback:", err);
  }

  // Fallback to MOCK_BOOKS
  if (!book) {
    const found = MOCK_BOOKS.find((b) => b.id === bookId || b.slug === bookId);
    if (found) {
      book = found;
    }
  }

  if (!book) {
    notFound();
  }

  return (
    <ReaderProvider book={book}>
      <ReaderView />
    </ReaderProvider>
  );
}
