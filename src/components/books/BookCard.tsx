"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Book } from "@/lib/types";
import { BookOpen, Bookmark, Star, Check, Info } from "lucide-react";
import { store } from "@/lib/data/storage";
import { soundManager } from "@/lib/sound";

interface BookCardProps {
  book: Book;
  progress?: number;
  priority?: boolean;
}

export function BookCard({ book, progress, priority = false }: BookCardProps) {
  const router = useRouter();
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

  const handleCardCoverClick = (e: React.MouseEvent) => {
    // If the click is on an interactive child button, ignore
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("[data-no-reader]")) {
      return;
    }
    soundManager.playBookOpen();
    router.push(`/read/${book.id}`);
  };

  const getAccessBadge = () => {
    if (book.accessType === "FREE") {
      return { text: "Free", color: "bg-[#83B89F]/95 text-white shadow-xs" };
    }
    if (book.accessType === "PREVIEW") {
      return { text: "Preview", color: "bg-[#8DB8D8]/95 text-white shadow-xs" };
    }
    if (book.accessType === "SUBSCRIPTION" || book.accessType === "FREE_WITH_SUBSCRIPTION") {
      return { text: "Premium", color: "bg-[#5A3E85]/95 text-white shadow-xs" };
    }
    if (book.price && book.price > 0) {
      return { text: `₹${book.price}`, color: "bg-black/80 text-white shadow-xs" };
    }
    return null;
  };

  const badge = getAccessBadge();

  return (
    <div id="tour-book-card" className="group relative flex flex-col w-full select-none">
      {/* Book Cover Container: 1-Click Tap / Click Target */}
      <div
        onClick={handleCardCoverClick}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[var(--bg-subtle)] book-cover-shadow book-spine transition-all duration-300 ease-out cursor-pointer active:scale-[0.98] sm:hover:-translate-y-1.5 touch-manipulation"
      >
        {/* Underlying Next.js Link for Instant Prefetching & SEO */}
        <Link
          href={`/read/${book.id}`}
          prefetch={true}
          onClick={(e) => {
            e.stopPropagation();
            soundManager.playBookOpen();
          }}
          className="absolute inset-0 z-0 block"
          aria-label={`Read "${book.title}"`}
          title={`Click to read "${book.title}"`}
        >
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 sm:group-hover:scale-105"
            priority={priority}
          />

          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Access Model Badge: Top Right */}
        {badge && (
          <div
            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md z-10 pointer-events-none ${badge.color}`}
          >
            {badge.text}
          </div>
        )}

        {/* Mobile View: Sleek Floating "Read" Pill (Guarantees user knows single tap opens reader) */}
        <div className="sm:hidden absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold shadow-md flex items-center gap-1.5 backdrop-blur-md pointer-events-none z-10 animate-in fade-in duration-200">
          <BookOpen className="w-3 h-3" />
          <span>Read</span>
        </div>

        {/* Desktop Quick Action Buttons (Reveals on Hover, Never Blocks Mobile Taps) */}
        <div className="hidden sm:flex absolute bottom-3 left-3 right-3 items-center justify-between gap-2 opacity-0 translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 z-10 pointer-events-none sm:group-hover:pointer-events-auto">
          <Link
            href={`/read/${book.id}`}
            prefetch={true}
            onClick={(e) => {
              e.stopPropagation();
              soundManager.playBookOpen();
            }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-[var(--primary)] text-xs font-bold text-white shadow-lg hover:bg-[var(--primary-hover)] flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read</span>
          </Link>

          <Link
            href={`/books/${book.slug}`}
            data-no-reader="true"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-xl bg-white/95 text-[var(--foreground)] hover:bg-white backdrop-blur-sm shadow-lg transition-all"
            title="View Synopsis & Reviews"
            aria-label="View Details"
          >
            <Info className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={toggleLibrary}
            className={`p-1.5 rounded-xl backdrop-blur-sm shadow-lg transition-all cursor-pointer ${
              inLibrary
                ? "bg-[var(--secondary)] text-white"
                : "bg-white/95 text-[var(--foreground)] hover:bg-white"
            }`}
            title={inLibrary ? "Saved to Library" : "Add to Library"}
            aria-label="Toggle Library"
          >
            {inLibrary ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Reading progress bar overlay if active */}
        {progress !== undefined && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 z-10 pointer-events-none">
            <div
              className="h-full bg-[var(--secondary)] transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        )}
      </div>

      {/* Book Metadata Below Cover */}
      <div className="mt-2 sm:mt-2.5 flex flex-col flex-1 min-w-0">
        <Link
          href={`/books/${book.slug}`}
          data-no-reader="true"
          className="font-editorial font-bold text-xs sm:text-sm text-[var(--foreground)] line-clamp-1 hover:text-[var(--primary)] transition-colors break-words"
          title={book.title}
        >
          {book.title}
        </Link>
        <p className="text-[11px] sm:text-xs text-[var(--muted)] truncate mt-0.5">
          {book.author}
        </p>

        <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-[var(--muted)] gap-1.5 min-w-0">
          <span className="truncate">{book.categoryName}</span>
          <div className="flex items-center gap-1 text-amber-500 font-semibold shrink-0">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
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
