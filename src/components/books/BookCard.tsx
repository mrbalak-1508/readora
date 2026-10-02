"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Book } from "@/lib/types";
import { BookOpen, Bookmark, Star, Check } from "lucide-react";
import { store } from "@/lib/data/storage";
import { soundManager } from "@/lib/sound";

interface BookCardProps {
  book: Book;
  progress?: number;
  priority?: boolean;
}

export function BookCard({ book, progress, priority = false }: BookCardProps) {
  const [inLibrary, setInLibrary] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    setInLibrary(store.isInLibrary(book.id));
  }, [book.id]);

  const toggleLibrary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playBookmark();
    if (inLibrary) {
      store.removeFromLibrary(book.id);
      setInLibrary(false);
    } else {
      store.addToLibrary(book, "saved");
      setInLibrary(true);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  };

  const getAccessBadge = () => {
    if (book.accessType === "FREE") {
      return { text: "Free", color: "bg-[#83B89F]/90 text-white" };
    }
    if (book.accessType === "PREVIEW") {
      return { text: "Preview", color: "bg-[#8DB8D8]/90 text-white" };
    }
    if (book.accessType === "SUBSCRIPTION" || book.accessType === "FREE_WITH_SUBSCRIPTION") {
      return { text: "Premium", color: "bg-[#5A3E85]/90 text-white" };
    }
    if (book.price && book.price > 0) {
      return { text: `₹${book.price}`, color: "bg-[#1F1C22]/85 text-white" };
    }
    return null;
  };

  const badge = getAccessBadge();

  return (
    <div id="tour-book-card" className="group relative flex flex-col">
      {/* Book Cover Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[var(--bg-subtle)] book-cover-shadow book-spine transition-transform duration-300 ease-out group-hover:-translate-y-1.5">
        {/* Cover Link */}
        <Link
          href={`/books/${book.slug}`}
          className="absolute inset-0 z-0 block cursor-pointer"
          aria-label={book.title}
        >
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />

          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Hover Quick Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10 pointer-events-auto">
          <Link
            href={`/read/${book.id}`}
            onClick={() => {
              soundManager.playBookOpen();
            }}
            className="flex-1 py-1.5 px-3 rounded-lg bg-[var(--primary)] text-xs font-bold text-white shadow-lg hover:bg-[var(--primary-hover)] flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>

          <button
            onClick={toggleLibrary}
            className={`p-1.5 rounded-lg backdrop-blur-sm shadow-lg transition-all ${
              inLibrary
                ? "bg-[var(--secondary)] text-white"
                : "bg-white/95 text-[var(--foreground)] hover:bg-white"
            }`}
            title={inLibrary ? "Saved to Library" : "Add to Library"}
            aria-label="Toggle Library"
          >
            {inLibrary ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>

        {/* Progress bar overlay if active */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10 pointer-events-none">
            <div
              className="h-full bg-[var(--secondary)] transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}

        {/* Access Model Badge */}
        {badge && (
          <div
            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-xs z-10 pointer-events-none ${badge.color}`}
          >
            {badge.text}
          </div>
        )}
      </div>

      {/* Book Metadata Below Cover */}
      <div className="mt-3 flex flex-col flex-1">
        <Link
          href={`/books/${book.slug}`}
          className="font-editorial font-bold text-sm text-[var(--foreground)] line-clamp-1 hover:text-[var(--primary)] transition-colors"
          title={book.title}
        >
          {book.title}
        </Link>
        <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
          {book.author}
        </p>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--muted)]">
          <span className="truncate">{book.categoryName}</span>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{book.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      {showToast && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-[var(--foreground)] text-[var(--background)] text-[10px] font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 whitespace-nowrap">
          Saved to Library
        </div>
      )}
    </div>
  );
}
