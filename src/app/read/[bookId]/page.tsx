import React from "react";
import { notFound } from "next/navigation";
import { ReaderProvider } from "@/context/ReaderContext";
import { ReaderView } from "@/components/reader/ReaderView";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
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
  let initialHasFullAccess = false;

  try {
    const user = await getCurrentUser();

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
      // Determine server-side entitlement
      if (dbBook.accessType === "FREE" || dbBook.price === 0) {
        initialHasFullAccess = true;
      } else if (user) {
        if (user.role === "ADMIN") {
          initialHasFullAccess = true;
        } else {
          // Check BookEntitlement
          const entitlement = await prisma.bookEntitlement.findFirst({
            where: {
              userId: user.id,
              active: true,
              OR: [
                { bookId: dbBook.id },
                ...(dbBook.slug ? [{ bookId: dbBook.slug }] : []),
              ],
            },
          });

          if (entitlement) {
            initialHasFullAccess = true;
          } else {
            // Check paid Order
            const paidOrder = await prisma.order.findFirst({
              where: {
                userId: user.id,
                status: "PAID",
                items: {
                  some: {
                    OR: [
                      { bookId: dbBook.id },
                      ...(dbBook.slug ? [{ bookId: dbBook.slug }] : []),
                    ],
                  },
                },
              },
            });

            if (paidOrder) {
              initialHasFullAccess = true;
            } else {
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
                ["SUBSCRIPTION", "FREE_WITH_SUBSCRIPTION", "PREVIEW"].includes(dbBook.accessType)
              ) {
                initialHasFullAccess = true;
              }
            }
          }
        }
      }

      book = {
        ...dbBook,
        isbn: dbBook.isbn || undefined,
        publisher: dbBook.publisher || undefined,
        publicationDate: dbBook.publicationDate || "2024",
        categoryId: dbBook.categoryId || "general",
        categoryName: dbBook.categoryName || "Curated",
        coverUrl: dbBook.coverPath || "/placeholder-cover.jpg",
        fileUrl: dbBook.filePath || undefined,
        fileName: dbBook.fileName || undefined,
        fileSize: dbBook.fileSize ?? undefined,
        sampleContent: dbBook.sampleContent || undefined,
        tags: JSON.parse(dbBook.tags || "[]"),
        accessType: dbBook.accessType as any,
        price: dbBook.price,
        originalPrice: dbBook.originalPrice ?? undefined,
        discount: dbBook.discount,
        currency: dbBook.currency,
        previewType: dbBook.previewType as any,
        previewPages: initialHasFullAccess ? 0 : dbBook.previewPages,
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
      if (found.price === 0 || found.accessType === "FREE") {
        initialHasFullAccess = true;
      }
    }
  }

  if (!book) {
    notFound();
  }

  return (
    <ReaderProvider book={book} initialHasFullAccess={initialHasFullAccess}>
      <ReaderView />
    </ReaderProvider>
  );
}
