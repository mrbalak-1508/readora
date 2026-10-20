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
  const touchStartRef = React.useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    setInLibrary(store.isInLibrary(book.id));
  }, [book.id]);

  const openReader = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.stopPropagation();
    }
    soundManager.playBookOpen();
    try {
      router.push(`/read/${book.id}`);
    } catch {
      window.location.assign(`/read/${book.id}`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;
    // Intentional tap: finger moved less than 14px within 600ms
    if (deltaX < 14 && deltaY < 14 && deltaTime < 600) {
      openReader(e);
    }
  };

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
    <div className="group relative flex flex-col w-full select-none">
      {/* Book Cover Container: 1-Tap Target on Mobile & Click Target on Desktop */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button") || target.closest("a")) return;
          openReader(e);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl bg-[var(--bg-subtle)] book-cover-shadow book-spine transition-all duration-300 ease-out sm:hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer touch-manipulation"
        aria-label={`Read "${book.title}"`}
        title={`Click to read "${book.title}"`}
      >
        <Image
          src={book.coverUrl}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-cover transition-transform duration-500 sm:group-hover:scale-105 pointer-events-none select-none"
          priority={priority}
        />

        {/* Subtle gradient vignette on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Access Model Badge: Top Right */}
        {badge && (
          <div
            className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md z-10 pointer-events-none select-none ${badge.color}`}
          >
            {badge.text}
          </div>
        )}


        {/* Desktop Quick Action Buttons (Reveals on Hover) */}
        <div className="hidden sm:flex absolute bottom-3 left-3 right-3 items-center justify-between gap-2 opacity-0 translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 transition-all duration-300 z-20 pointer-events-none sm:group-hover:pointer-events-auto">
          <button
            type="button"
            onClick={openReader}
            className="flex-1 py-1.5 px-3 rounded-xl bg-[var(--primary)] text-xs font-bold text-white shadow-lg hover:bg-[var(--primary-hover)] flex items-center justify-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read</span>
          </button>

          <Link
            href={`/books/${book.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-xl bg-white/95 text-[var(--foreground)] hover:bg-white backdrop-blur-sm shadow-lg transition-all cursor-pointer"
            title="View Synopsis & Reviews"
            aria-label="View Details"
          >
            <Info className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
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

      {/* Mobile Dedicated "Read" & "Save" Action Bar: 100% Touch-Friendly */}
      <div className="mt-2 sm:hidden flex items-center gap-1.5 w-full">
        <button
          type="button"
          onClick={openReader}
          className="flex-1 py-2 px-3 rounded-xl bg-[var(--primary)] active:bg-[var(--primary-hover)] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>Read</span>
        </button>
        <button
          type="button"
          onClick={toggleLibrary}
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card)] active:bg-[var(--bg-subtle)] text-[var(--foreground)] active:scale-95 transition-all cursor-pointer shrink-0"
          title={inLibrary ? "Saved to Library" : "Add to Library"}
          aria-label="Toggle Library"
        >
          {inLibrary ? (
            <Check className="w-3.5 h-3.5 text-[var(--secondary)]" />
          ) : (
            <Bookmark className="w-3.5 h-3.5 text-[var(--muted)]" />
          )}
        </button>
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
