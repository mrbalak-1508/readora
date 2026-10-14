"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import {
  ArrowLeft,
  Bookmark,
  Search,
  Sliders,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Lock,
  Sparkles,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Hand,
  Highlighter,
  List,
} from "lucide-react";

interface ReaderToolbarProps {
  onOpenBookmarks: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenToc?: () => void;
  onComplete: () => void;
  onUnlockBook?: () => void;
  hasPdfFile?: boolean;
}

export function ReaderToolbar({
  onOpenBookmarks,
  onOpenSearch,
  onOpenSettings,
  onOpenToc,
  onComplete,
  onUnlockBook,
  hasPdfFile = false,
}: ReaderToolbarProps) {
  const {
    book,
    currentPage,
    totalPages,
    goToPage,
    fontSize,
    setFontSize,
    zoom,
    setZoom,
    fitMode,
    setFitMode,
    isBookmarked,
    toggleBookmark,
    theme,
    setTheme,
    hasFullAccess,
    isPanMode,
    setIsPanMode,
  } = useReader();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const backUrl = book?.slug
    ? `/books/${book.slug}`
    : book?.id
    ? `/books/${book.id}`
    : "/library";

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePageInput = (val: string) => {
    const p = parseInt(val, 10);
    if (!isNaN(p)) {
      goToPage?.(Math.max(1, Math.min(p, totalPages)));
    }
  };

  const themeBarClasses = {
    paper: "bg-[#FFFFFF]/95 border-[#E5E0D4] text-[#1E1C24] shadow-xs",
    warm: "bg-[#FDF9F2]/95 border-[#E6DCC6] text-[#2C261E] shadow-xs",
    sepia: "bg-[#F4ECD8]/95 border-[#D8CCA8] text-[#3A2E1D] shadow-xs",
    dark: "bg-[#18191c]/95 border-[#282a2e] text-[#E4DFEA] shadow-md shadow-black/40",
    midnight: "bg-[#0d1017]/95 border-[#1c2230] text-[#DCE4F2] shadow-md shadow-black/50",
  }[theme] || "bg-white/95 border-black/10 text-neutral-900";

  return (
    <header className={`w-full h-12 sm:h-13 border-b backdrop-blur-xl px-2 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-2 select-none z-30 shrink-0 transition-colors duration-200 ${themeBarClasses}`}>
      {/* Left: Exit Link & Book Title */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink">
        <Link
          href={backUrl}
          className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold text-current opacity-80 hover:opacity-100 hover:bg-current/10 transition-all cursor-pointer shrink-0"
          title="Exit to Book Details"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="font-medium hidden sm:inline">Library</span>
        </Link>

        <div className="h-4 w-[1px] bg-current/15 hidden sm:block shrink-0" />

        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-editorial text-xs sm:text-sm font-bold text-current truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-sm">
            {book?.title}
          </span>
          {!hasFullAccess && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-gradient-to-r from-[#D95D4D] to-[#E97868] px-1.5 py-0.5 rounded-full shadow-2xs shrink-0">
              <Lock className="w-2.5 h-2.5" />
              <span className="hidden xs:inline">Preview</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Streamlined Page Navigator Pill (Desktop) */}
      <div className="hidden sm:flex items-center gap-1 bg-current/5 rounded-xl px-1.5 py-1 border border-current/10 shrink-0">
        <button
          type="button"
          onClick={() => goToPage?.(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1 rounded-lg text-current opacity-70 hover:opacity-100 disabled:opacity-25 disabled:pointer-events-none hover:bg-current/10 transition-all cursor-pointer"
          title="Previous Page (Arrow Up / Left)"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 font-mono text-xs px-1">
          <input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => handlePageInput(e.target.value)}
            className="w-10 sm:w-11 text-center font-bold bg-transparent border-none text-current focus:bg-current/10 rounded-md outline-hidden p-0.5 text-xs"
            aria-label="Current Page Number"
          />
          <span className="opacity-50 text-[11px]">/ {totalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => goToPage?.(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1 rounded-lg text-current opacity-70 hover:opacity-100 disabled:opacity-25 disabled:pointer-events-none hover:bg-current/10 transition-all cursor-pointer"
          title="Next Page (Arrow Down / Right)"
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Functional Controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* PDF-Specific Controls: Fit Mode, Hand Pan, Zoom (Desktop) */}
        {hasPdfFile && (
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {/* Fit Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setFitMode(fitMode === "width" ? "page" : "width");
                setZoom(1.0);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                fitMode === "width"
                  ? "bg-current/10 border-current/20 text-current font-bold"
                  : "border-transparent text-current opacity-70 hover:opacity-100 hover:bg-current/5"
              }`}
              title={fitMode === "width" ? "Fit Page Height" : "Fit Screen Width"}
            >
              <Maximize className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span className="hidden lg:inline text-[11px]">
                {fitMode === "width" ? "Fit Width" : "Fit Page"}
              </span>
            </button>

            {/* Text Select & Hand (Move) Mode Strip */}
            <div className="flex items-center gap-0.5 bg-current/5 rounded-lg p-0.5 border border-current/10">
              <button
                type="button"
                onClick={() => setIsPanMode(false)}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  !isPanMode
                    ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                    : "text-current opacity-70 hover:opacity-100 hover:bg-current/10"
                }`}
                title="Text Selection Tool: Click to select & highlight text"
                aria-label="Select Text"
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsPanMode(true)}
                className={`p-1 rounded-md transition-all cursor-pointer ${
                  isPanMode
                    ? "bg-[var(--primary)] text-white shadow-xs font-semibold"
                    : "text-current opacity-70 hover:opacity-100 hover:bg-current/10"
                }`}
                title="Move Page (Hand Tool): Click and drag to pan the document"
                aria-label="Move Page"
              >
                <Hand className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-0.5 bg-current/5 rounded-lg p-0.5 border border-current/10">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
                disabled={zoom <= 0.7}
                className="p-1 rounded-md text-current opacity-70 hover:opacity-100 disabled:opacity-25 cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="text-[10px] font-mono font-semibold px-1 min-w-8 text-center opacity-85 hover:opacity-100 hover:text-[var(--primary)] cursor-pointer"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.15).toFixed(2)))}
                disabled={zoom >= 3.0}
                className="p-1 rounded-md text-current opacity-70 hover:opacity-100 disabled:opacity-25 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Non-PDF Typography Font Size Controls (Desktop) */}
        {!hasPdfFile && (
          <div className="hidden sm:flex items-center gap-0.5 bg-current/5 rounded-lg p-0.5 border border-current/10">
            <button
              type="button"
              onClick={() => setFontSize(Math.max(12, fontSize - 1))}
              disabled={fontSize <= 12}
              className="p-1 px-1.5 rounded-md text-current opacity-75 hover:opacity-100 disabled:opacity-30 text-xs font-bold cursor-pointer"
              title="Decrease Text Size (A-)"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize(16)}
              className="text-[10px] font-mono font-semibold px-1 min-w-8 text-center opacity-85 hover:opacity-100 hover:text-[var(--primary)] cursor-pointer"
              title="Reset Font Size to 16px"
            >
              {fontSize}px
            </button>
            <button
              type="button"
              onClick={() => setFontSize(Math.min(32, fontSize + 1))}
              disabled={fontSize >= 32}
              className="p-1 px-1.5 rounded-md text-current opacity-75 hover:opacity-100 disabled:opacity-30 text-xs font-bold cursor-pointer"
              title="Increase Text Size (A+)"
            >
              A+
            </button>
          </div>
        )}

        {/* Table of Contents Quick Button */}
        {onOpenToc && (
          <button
            type="button"
            onClick={onOpenToc}
            className="p-1.5 sm:p-2 rounded-lg text-current opacity-75 hover:opacity-100 hover:bg-current/10 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
            title="Table of Contents & Chapters"
            aria-label="Table of Contents"
          >
            <List className="w-4 h-4" />
          </button>
        )}

        {/* Theme Swatches (Desktop) */}
        <div className="hidden xl:flex items-center gap-1 p-1 bg-current/5 rounded-lg border border-current/10">
          {[
            { id: "paper", color: "#FFFFFF", title: "Paper" },
            { id: "warm", color: "#FDF8F0", title: "Warm Ivory" },
            { id: "sepia", color: "#F4ECD8", title: "Sepia" },
            { id: "dark", color: "#222026", title: "Dark" },
            { id: "midnight", color: "#0F1117", title: "Midnight" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id as any)}
              className={`w-3.5 h-3.5 rounded-full border transition-all cursor-pointer ${
                theme === t.id
                  ? "ring-2 ring-[var(--primary)] scale-110 border-transparent shadow-xs"
                  : "border-black/20 dark:border-white/20 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: t.color }}
              title={`Switch to ${t.title} Theme`}
            />
          ))}
        </div>

        {/* Bookmark Current Page */}
        <button
          type="button"
          onClick={toggleBookmark}
          className={`p-1.5 sm:p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer touch-manipulation ${
            isBookmarked
              ? "text-[var(--coral)] bg-[var(--coral)]/10"
              : "text-current opacity-75 hover:opacity-100 hover:bg-current/10"
          }`}
          title={isBookmarked ? "Page Bookmarked" : "Bookmark this Page"}
          aria-label="Bookmark"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
        </button>

        {/* Search Inside (Desktop) */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-1.5 sm:p-2 rounded-lg text-current opacity-75 hover:opacity-100 hover:bg-current/10 transition-colors hidden sm:flex items-center justify-center cursor-pointer touch-manipulation"
          title="Search in book"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Reader Settings Modal */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 rounded-lg text-current opacity-75 hover:opacity-100 hover:bg-current/10 transition-colors flex items-center justify-center cursor-pointer touch-manipulation"
          title="Appearance & Typography"
          aria-label="Reader Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle (Desktop) */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 sm:p-2 rounded-lg text-current opacity-75 hover:opacity-100 hover:bg-current/10 transition-colors hidden md:block cursor-pointer touch-manipulation"
          title="Toggle Fullscreen (F)"
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Unlock Book OR Finish */}
        {!hasFullAccess ? (
          <button
            type="button"
            onClick={onUnlockBook || onComplete}
            className="ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D95D4D] to-[#E97868] text-white text-xs font-bold hover:opacity-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer shrink-0 touch-manipulation active:scale-95"
            title="Unlock Full Edition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden xs:inline">Unlock</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="ml-0.5 sm:ml-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1 shadow-xs cursor-pointer shrink-0 touch-manipulation active:scale-95"
            title="Mark Completed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Finish</span>
          </button>
        )}
      </div>
    </header>
  );
}
