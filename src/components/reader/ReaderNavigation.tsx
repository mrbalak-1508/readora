"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";

interface ReaderNavigationProps {
  currentPage: number;
  totalPages: number;
  isDual: boolean;
  isBookmarked?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onJumpToPage: (page: number) => void;
  onToggleBookmark?: () => void;
  className?: string;
}

export function ReaderNavigation({
  currentPage,
  totalPages,
  isDual,
  isBookmarked = false,
  onPrev,
  onNext,
  onJumpToPage,
  onToggleBookmark,
  className = "",
}: ReaderNavigationProps) {
  // Page range string: "24–25 / 180" or "24 / 180"
  const displayPageStr = isDual && currentPage < totalPages
    ? `${currentPage}–${currentPage + 1} / ${totalPages}`
    : `${currentPage} / ${totalPages}`;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-2 bg-white/80 dark:bg-[#18161D]/80 backdrop-blur-xl border border-black/10 dark:border-white/10 rounded-full shadow-lg text-xs font-mono select-none ${className}`}
    >
      {/* Previous Button */}
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 group"
        title="Previous Page (←)"
      >
        <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        <span className="hidden sm:inline text-[11px] font-sans font-medium">Prev</span>
      </button>

      {/* Page Progress Indicator & Slider */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-current tracking-wider whitespace-nowrap">
          {displayPageStr}
        </span>

        {/* Quick Page Slider */}
        <input
          type="range"
          min={1}
          max={Math.max(1, totalPages)}
          value={currentPage}
          onChange={(e) => onJumpToPage(Number(e.target.value))}
          className="w-20 sm:w-32 accent-[var(--primary)] h-1 rounded-lg cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          title={`Jump to page ${currentPage}`}
        />
      </div>

      {/* Right Controls: Bookmark Toggle & Next Button */}
      <div className="flex items-center gap-1.5">
        {onToggleBookmark && (
          <button
            onClick={onToggleBookmark}
            className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
              isBookmarked ? "text-[var(--primary)]" : "opacity-60 hover:opacity-100"
            }`}
            title={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        )}

        <button
          onClick={onNext}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 group"
          title="Next Page (→ or Space)"
        >
          <span className="hidden sm:inline text-[11px] font-sans font-medium">Next</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
