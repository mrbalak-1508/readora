"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen } from "lucide-react";
import { store } from "@/lib/data/storage";
import { ReadingProgress } from "@/lib/types";

export function ContinueReadingSection() {
  const [activeProgress, setActiveProgress] = useState<ReadingProgress[]>([]);

  useEffect(() => {
    const list = store.getAllProgress().filter((p) => !p.completed && p.percentage > 0);
    setActiveProgress(list);
  }, []);

  if (activeProgress.length === 0) return null;

  const current = activeProgress[0];

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-editorial text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Continue Reading
        </h2>
        <Link
          href="/library"
          className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <span>View Library</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:border-[var(--accent)]/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Book thumbnail */}
          <div className="relative w-16 h-24 sm:w-20 sm:h-28 shrink-0 rounded-md overflow-hidden book-cover-shadow bg-[var(--bg-subtle)]">
            <Image
              src={current.bookCover || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400"}
              alt={current.bookTitle || "Current Book"}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>

          {/* Details & Progress */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--text-main)] truncate">
                  {current.bookTitle}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {current.author ? `by ${current.author}` : "Book in Progress"}
                </p>
              </div>
              <span className="text-xs font-semibold text-[var(--accent)] bg-[var(--accent-light)] px-2.5 py-1 rounded-full">
                {current.percentage}% completed
              </span>
            </div>

            <div className="mt-3 text-xs text-[var(--text-muted)] truncate">
              Current chapter: <span className="font-medium text-[var(--text-main)]">{current.currentChapter || `Page ${current.currentPage}`}</span>
            </div>

            {/* Progress Bar */}
            <div className="mt-2 w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                style={{ width: `${current.percentage}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          <Link
            href={`/reader/${current.bookId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Continue Reading</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
