import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Book } from "@/lib/types";
import { BookOpen, Star, ArrowRight, Sparkles } from "lucide-react";

interface FeaturedSectionProps {
  books: Book[];
}

export function FeaturedSection({ books }: FeaturedSectionProps) {
  if (books.length === 0) return null;

  const mainBook = books.find((b) => b.featured) || books[0];
  const secondaryBooks = books.filter((b) => b.id !== mainBook.id).slice(0, 3);

  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Featured Collection</span>
          </div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Stories Worth Getting Lost In
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Expansive narratives and transformative ideas handpicked by our editorial curators.
          </p>
        </div>
        <Link
          href="/explore?filter=featured"
          className="hidden sm:flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
        >
          <span>View all featured</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Large Featured Layout */}
        <div className="lg:col-span-8 rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center book-cover-shadow">
          {/* Main Book Cover */}
          <Link
            href={`/books/${mainBook.slug}`}
            className="relative w-44 sm:w-56 aspect-[2/3] shrink-0 rounded-2xl overflow-hidden book-cover-shadow book-spine group cursor-pointer"
          >
            <Image
              src={mainBook.coverUrl}
              alt={mainBook.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 180px, 230px"
            />
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white">
              {mainBook.accessType === "FREE" ? "Free" : mainBook.accessType === "PREVIEW" ? "Preview" : `₹${mainBook.price || 199}`}
            </div>
          </Link>

          {/* Main Info */}
          <div className="flex-1 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
                  {mainBook.categoryName}
                </span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{mainBook.rating.toFixed(1)}</span>
                </div>
              </div>

              <Link href={`/books/${mainBook.slug}`}>
                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors leading-tight">
                  {mainBook.title}
                </h3>
              </Link>
              <p className="text-sm font-medium text-[var(--muted)] mt-1">
                by {mainBook.author}
              </p>

              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mt-4 line-clamp-4">
                {mainBook.description}
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border)] flex items-center gap-3">
              <Link
                href={`/read/${mainBook.id}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
              >
                <BookOpen className="w-4 h-4" />
                <span>
                  {mainBook.accessType === "FREE"
                    ? "Read Free"
                    : mainBook.accessType === "PREVIEW"
                    ? "Read Free Preview"
                    : "Read Book"}
                </span>
              </Link>

              <Link
                href={`/books/${mainBook.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs sm:text-sm font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <span>Book Details</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Secondary Books Column */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          {secondaryBooks.map((b) => (
            <Link
              key={b.id}
              href={`/books/${b.slug}`}
              className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] transition-all flex items-center gap-4 group"
            >
              <div className="relative w-16 aspect-[2/3] shrink-0 rounded-lg overflow-hidden book-cover-shadow book-spine">
                <Image src={b.coverUrl} alt={b.title} fill className="object-cover" sizes="64px" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold text-[var(--secondary)] uppercase tracking-wider block">
                  {b.categoryName}
                </span>
                <h4 className="font-editorial text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors truncate">
                  {b.title}
                </h4>
                <p className="text-xs text-[var(--muted)] truncate">{b.author}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <span className="font-semibold text-amber-500 flex items-center gap-0.5">
                    ★ {b.rating.toFixed(1)}
                  </span>
                  <span>•</span>
                  <span>{b.accessType === "FREE" ? "Free" : `₹${b.price || 199}`}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
