"use client";

import React from "react";
import { useReader } from "@/context/ReaderContext";
import { ChevronLeft, ChevronRight, CheckCircle2, List, Sliders, Bookmark } from "lucide-react";

interface MobileReaderBarProps {
  onOpenToc?: () => void;
  onOpenSettings?: () => void;
  onComplete?: () => void;
}

export function MobileReaderBar({
  onOpenToc,
  onOpenSettings,
  onComplete,
}: MobileReaderBarProps) {
  const {
    currentPage,
    totalPages,
    goToPage,
    theme,
    isBookmarked,
    toggleBookmark,
  } = useReader();

  const themeBarClasses =
    {
      paper: "bg-[#FFFFFF]/95 border-[#E5E0D4] text-[#1E1C24] shadow-lg shadow-black/5",
      warm: "bg-[#FDF9F2]/95 border-[#E6DCC6] text-[#2C261E] shadow-lg shadow-black/5",
      sepia: "bg-[#F4ECD8]/95 border-[#D8CCA8] text-[#3A2E1D] shadow-lg shadow-amber-950/10",
      dark: "bg-[#18191c]/95 border-[#282a2e] text-[#E4DFEA] shadow-xl shadow-black/50",
      midnight: "bg-[#0d1017]/95 border-[#1c2230] text-[#DCE4F2] shadow-xl shadow-black/60",
    }[theme] || "bg-white/95 border-black/10 text-neutral-900";

  const progressPercent =
    totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  return (
    <nav
      aria-label="Mobile Reader Navigation"
      className={`fixed bottom-0 inset-x-0 z-30 sm:hidden border-t backdrop-blur-xl transition-colors duration-200 select-none pb-[max(0.6rem,env(safe-area-inset-bottom,0.6rem))] pt-2 px-3 shadow-2xl ${themeBarClasses}`}
    >
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Previous Page Button */}
        <button
          type="button"
          onClick={() => goToPage?.(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-current font-bold text-xs disabled:opacity-20 disabled:pointer-events-none active:scale-95 transition-all bg-current/5 border border-current/10 cursor-pointer min-h-[42px] touch-manipulation shrink-0"
          title="Previous Page / Chapter"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-[11px]">Prev</span>
        </button>

        {/* Center Progress Scrubber & Page Indicator */}
        <div className="flex-1 flex flex-col items-center justify-center px-1.5 min-w-0">
          <div className="flex items-center justify-between w-full text-[11px] font-mono font-bold opacity-85 px-1 mb-1">
            <span className="truncate">
              {totalPages > 0 ? `${currentPage} / ${totalPages}` : "Reading"}
            </span>
            <span className="opacity-60 text-[10px]">{progressPercent}%</span>
          </div>

          <div className="w-full relative flex items-center">
            <input
              type="range"
              min={1}
              max={Math.max(1, totalPages)}
              value={currentPage}
              onChange={(e) => goToPage?.(Number(e.target.value))}
              className="w-full h-2 accent-[var(--primary)] bg-current/15 rounded-lg appearance-none cursor-pointer touch-manipulation"
              title={`Page ${currentPage} of ${totalPages}`}
              aria-label="Jump to page slider"
            />
          </div>
        </div>

        {/* Next / Complete Page Button */}
        <button
          type="button"
          onClick={() => {
            if (currentPage < totalPages) {
              goToPage?.(currentPage + 1);
            } else if (onComplete) {
              onComplete();
            }
          }}
          className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer min-h-[42px] touch-manipulation shrink-0 ${
            currentPage >= totalPages
              ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
              : "bg-current/5 border border-current/10 text-current"
          }`}
          title={currentPage >= totalPages ? "Finish Reading" : "Next Page / Chapter"}
          aria-label={currentPage >= totalPages ? "Finish Reading" : "Next Page"}
        >
          <span className="text-[11px]">{currentPage >= totalPages ? "Done" : "Next"}</span>
          {currentPage >= totalPages ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </nav>
  );
}
