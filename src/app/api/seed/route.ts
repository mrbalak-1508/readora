import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOCK_BOOKS } from "@/lib/data/mockBooks";
import { CATEGORIES } from "@/lib/data/mockCategories";

export async function GET() {
  try {
    // 1. Seed Categories
    for (const cat of CATEGORIES) {
      await prisma.category.upsert({
        where: { slug: cat.slug },
        update: {
          name: cat.name,
          description: cat.description,
          imageUrl: cat.imageUrl,
          featured: cat.featured ?? false,
          sortOrder: cat.sort_order ?? 0,
        },
        create: {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          imageUrl: cat.imageUrl,
          featured: cat.featured ?? false,
          sortOrder: cat.sort_order ?? 0,
        },
      });
    }

    // 2. Seed Default Curator / Admin
    const adminUser = await prisma.user.upsert({
      where: { email: "curator@readora.library" },
      update: {
        avatarPath: null,
      },
      create: {
        id: "usr-admin-readora",
        email: "curator@readora.library",
        name: "Marcus Vance",
        passwordHash: "$2a$10$w09uY4hK5YjW7P9HkUaW1.K2c2E3OQ0gU3C5A6y1K8V0s7m4c2P1y",
        role: "ADMIN",
        avatarPath: null,
      },
    });

    // 3. Seed Books & Chapters
    for (const b of MOCK_BOOKS) {
      const book = await prisma.book.upsert({
        where: { slug: b.slug },
        update: {
          title: b.title,
          author: b.author,
          description: b.description,
          coverPath: b.coverUrl,
          format: b.format.toUpperCase(),
          isbn: b.isbn,
          language: b.language,
          categoryId: b.categoryId,
          categoryName: b.categoryName || "Curated",
          tags: JSON.stringify(b.tags),
          publisher: b.publisher,
          publicationDate: b.publicationDate,
          pages: b.pages,
          featured: b.featured ?? false,
          trending: b.trending ?? false,
          popular: b.popular ?? false,
          status: b.status.toUpperCase(),
          rating: b.rating,
          ratingCount: b.ratingCount,
          readCount: b.readCount,
          sampleContent: b.sampleContent,
          fileSize: 4500000,
        },
        create: {
          id: b.id,
          slug: b.slug,
          title: b.title,
          author: b.author,
          description: b.description,
          coverPath: b.coverUrl,
          format: b.format.toUpperCase(),
          isbn: b.isbn,
          language: b.language,
          categoryId: b.categoryId,
          categoryName: b.categoryName || "Curated",
          tags: JSON.stringify(b.tags),
          publisher: b.publisher,
          publicationDate: b.publicationDate,
          pages: b.pages,
          featured: b.featured ?? false,
          trending: b.trending ?? false,
          popular: b.popular ?? false,
          status: b.status.toUpperCase(),
          rating: b.rating,
          ratingCount: b.ratingCount,
          readCount: b.readCount,
          sampleContent: b.sampleContent,
          fileSize: 4500000,
        },
      });

      if (b.chapters && b.chapters.length > 0) {
        for (let i = 0; i < b.chapters.length; i++) {
          const ch = b.chapters[i];
          await prisma.chapter.upsert({
            where: { id: ch.id },
            update: {
              title: ch.title,
              page: ch.page,
              content: ch.content,
              order: i,
            },
            create: {
              id: ch.id,
              bookId: book.id,
              title: ch.title,
              page: ch.page,
              content: ch.content,
              order: i,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "READORA SQLite database successfully seeded with books, categories, and curator account.",
    });
  } catch (error: any) {
    console.error("Seeding error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
