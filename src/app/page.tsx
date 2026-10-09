import React from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BookHero } from "@/components/books/BookHero";
import { ContinueReadingSection } from "@/components/books/ContinueReadingSection";
import { FeaturedSection } from "@/components/books/FeaturedSection";
import { TrendingCarousel } from "@/components/books/TrendingCarousel";
import { BrowseByMood } from "@/components/books/BrowseByMood";
import { CategoryPills } from "@/components/books/CategoryPills";
import { BookGrid } from "@/components/books/BookGrid";
import { prisma } from "@/lib/prisma";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";
import { CATEGORIES } from "@/lib/data/mockCategories";
import { Book } from "@/lib/types";

export const metadata = {
  title: "READORA — Premium Digital Library & eBook Platform",
  description:
    "Every story deserves a beautiful place to be read. Discover curated volumes, preview freely, and immerse yourself in 3D realistic reading.",
};

async function getBooks(): Promise<Book[]> {
  try {
    const books = await prisma.book.findMany({
      where: { status: "PUBLISHED" },
      include: {
        chapters: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (books.length === 0) return MOCK_BOOKS;

    return books.map((b) => ({
      ...b,
      isbn: b.isbn || undefined,
      publisher: b.publisher || undefined,
      publicationDate: b.publicationDate || "2024",
      categoryId: b.categoryId || "general",
      categoryName: b.categoryName || "Curated",
      coverUrl: b.coverPath || "/placeholder-cover.jpg",
      fileUrl: b.filePath || undefined,
      fileSize: b.fileSize ?? undefined,
      sampleContent: b.sampleContent || undefined,
      tags: JSON.parse(b.tags || "[]"),
      accessType: b.accessType as any,
      price: b.price,
      originalPrice: b.originalPrice ?? undefined,
      discount: b.discount,
      currency: b.currency,
      previewType: b.previewType as any,
      previewPages: b.previewPages,
      format: (b.format || "interactive").toLowerCase() as any,
      chapters: b.chapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        page: ch.page,
        content: ch.content || undefined,
      })),
      tableOfContents: b.chapters.map((ch) => ({
        title: ch.title,
        page: ch.page,
      })),
      createdAt: b.createdAt.toISOString(),
    }));
  } catch {
    return MOCK_BOOKS;
  }
}

export default async function HomePage() {
  const books = await getBooks();
  const categories = CATEGORIES;

  // Split into curated sections
  const popularBooks = [...books].sort((a, b) => b.readCount - a.readCount);
  const newReleases = [...books].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recommendedBooks = [...books].filter((b) => b.rating >= 4.8).slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
        {/* 1. Cinematic Digital Library Hero */}
        <BookHero books={books} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          {/* 2. Continue Reading (Dynamic user check) */}
          <ContinueReadingSection />

          {/* 3. Featured Collection: "Stories Worth Getting Lost In" */}
          <FeaturedSection books={books} />

          {/* 4. Trending Now Carousel */}
          <TrendingCarousel books={books} />

          {/* 5. Browse by Reading Mood */}
          <BrowseByMood />

          {/* 6. Dynamic Curated Categories */}
          <CategoryPills categories={categories} />

          {/* 7. Popular This Week */}
          <BookGrid
            books={popularBooks.slice(0, 5)}
            title="Popular This Week"
            subtitle="The most engaged and frequently unlocked volumes across our reading community."
            columns={5}
          />

          {/* 8. New Releases */}
          <BookGrid
            books={newReleases.slice(0, 5)}
            title="New Releases"
            subtitle="Fresh acquisitions and contemporary literature added to the Readora collection."
            columns={5}
          />

          {/* 9. Recommended For You */}
          <BookGrid
            books={recommendedBooks}
            title="Recommended For You"
            subtitle="Distinguished titles with exceptional reader acclaim."
            columns={5}
          />
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
