"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { Book } from "@/lib/types";
import { BookCard } from "./BookCard";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

interface TrendingCarouselProps {
  books: Book[];
}

export function TrendingCarousel({ books }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -340 : 340;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const trendingBooks = books.filter((b) => b.trending || b.popular);

  return (
    <section className="mb-14 sm:mb-20">
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[var(--accent)] shrink-0" />
            <h2 className="font-editorial text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-main)] truncate">
              Trending Now
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 line-clamp-1 sm:line-clamp-none">
            The books capturing readers&apos; minds across the platform this week.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 sm:p-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 sm:p-2 rounded-full border border-[var(--border-main)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scrolling shelf with smooth touch-pan-x for reliable mobile taps */}
      <div
        ref={scrollRef}
        className="flex gap-4 sm:gap-6 overflow-x-auto pb-6 pt-3 px-4 sm:px-6 lg:px-8 touch-pan-x no-scrollbar -mx-4 sm:-mx-6 lg:-mx-8"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {trendingBooks.map((book) => (
          <div key={book.id} className="w-38 sm:w-48 md:w-52 shrink-0">
            <BookCard book={book} />
          </div>
        ))}
      </div>
    </section>
  );
}
