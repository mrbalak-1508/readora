"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReader } from "@/context/ReaderContext";
import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { TableOfContentsSheet } from "./TableOfContentsSheet";
import { BookmarksSheet } from "./BookmarksSheet";
import { SearchInsideSheet } from "./SearchInsideSheet";
import { HighlightPopup } from "./HighlightPopup";
import { CompletionModal } from "./CompletionModal";
import { PreviewPaywallModal } from "./PreviewPaywallModal";
import { paginateBook, PageData } from "@/lib/pagination";
import { soundManager } from "@/lib/sound";
import { Highlight } from "@/lib/types";
import {
  ChevronLeft,
  ChevronRight,
  Sliders,
  List,
  Lock,
  BookOpen,
  Trash2,
  X,
  Sparkles,
} from "lucide-react";

export function ReaderView() {
  const {
    book,
    currentPage,
    currentChapterTitle,
    theme,
    font,
    fontSize,
    lineHeight,
    textAlign,
    soundEnabled,
    animation3d,
    animationSpeed,
    hasFullAccess,
    previewLimit,
    watermarkText,
    goToPage,
    highlights,
    removeHighlight,
    readingTimeSeconds,
    markCompleted,
    resetProgress,
    isBookmarked,
    toggleBookmark,
  } = useReader();

  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Spread mode: "dual" (two open pages side-by-side) or "single" (focused single leaf)
  const [spreadMode, setSpreadMode] = useState<"dual" | "single">("dual");

  // Dual Reading Mode: "flow" (formatted reflowable leaves) or "pdf" (exact uploaded PDF facsimile)
  const [viewMode, setViewMode] = useState<"flow" | "pdf">("flow");
  const hasPdfFile = Boolean(book?.fileUrl || (book as any)?.filePath);

  // Track viewport size to default to single page on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSpreadMode("single");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Human Page Fold Animation State
  const [flipState, setFlipState] = useState<{
    direction: 1 | -1;
    sourceRightPage: PageData | null;
    targetLeftPage: PageData | null;
    targetRightPage: PageData | null;
    targetPageNum: number;
  } | null>(null);

  // Floating chrome auto-hide toggle
  const [showChrome, setShowChrome] = useState(true);

  // Touch swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Text selection popup
  const [selectionPopup, setSelectionPopup] = useState<{
    position: { top: number; left: number };
    text: string;
  } | null>(null);

  // Active highlight inspect modal / tooltip
  const [activeHighlightNote, setActiveHighlightNote] = useState<Highlight | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Paginate book into real distinct pages
  const pagesList = useMemo(() => {
    if (!book) return [];
    return paginateBook(book);
  }, [book]);

  const totalPages = pagesList.length > 0 ? pagesList.length : book?.pages || 1;
  const safePage = Math.max(1, Math.min(totalPages, currentPage));

  // Determine current active pages for Dual Spread:
  const isDual = spreadMode === "dual";
  const leftPageNum = isDual ? (safePage % 2 === 0 ? safePage - 1 : safePage) : safePage;
  const rightPageNum = isDual ? leftPageNum + 1 : safePage;

  const leftPageData = pagesList[leftPageNum - 1] || pagesList[0];
  const rightPageData = isDual && rightPageNum <= totalPages ? pagesList[rightPageNum - 1] : null;

  // Animation duration
  const animDuration =
    animationSpeed === "fast" ? 0.42 : animationSpeed === "slow" ? 0.85 : 0.58;

  const handleNext = () => {
    if (flipState) return; // Prevent double trigger while page is folding
    const step = isDual ? 2 : 1;
    const targetPage = safePage + step;

    // Check preview limit
    if (!hasFullAccess && previewLimit && targetPage > previewLimit) {
      setIsPaywallOpen(true);
      return;
    }

    if (safePage < totalPages) {
      soundManager.playPageTurn();
      if (animation3d) {
        setFlipState({
          direction: 1,
          sourceRightPage: isDual ? rightPageData : leftPageData,
          targetLeftPage: pagesList[targetPage - (isDual ? 1 : 1)] || null,
          targetRightPage: isDual ? pagesList[targetPage] || null : null,
          targetPageNum: Math.min(totalPages, targetPage),
        });
      } else {
        goToPage(Math.min(totalPages, targetPage), pagesList[targetPage - 1]?.chapterTitle);
      }
    } else {
      // In preview mode, reaching the end triggers the Paywall Modal, never the completion modal
      if (!hasFullAccess) {
        setIsPaywallOpen(true);
        return;
      }
      markCompleted();
      setIsCompletionOpen(true);
    }
  };

  const handlePrev = () => {
    if (flipState) return;
    const step = isDual ? 2 : 1;
    const targetPage = Math.max(1, safePage - step);

    if (safePage > 1) {
      soundManager.playPageTurn();
      if (animation3d) {
        setFlipState({
          direction: -1,
          sourceRightPage: isDual ? leftPageData : leftPageData,
          targetLeftPage: pagesList[targetPage - 1] || null,
          targetRightPage: isDual ? pagesList[targetPage] || null : null,
          targetPageNum: targetPage,
        });
      } else {
        goToPage(targetPage, pagesList[targetPage - 1]?.chapterTitle);
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Escape") {
        setIsTocOpen(false);
        setIsBookmarksOpen(false);
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsPaywallOpen(false);
        setSelectionPopup(null);
        setActiveHighlightNote(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [safePage, totalPages, hasFullAccess, previewLimit, isDual, flipState]);

  // Touch Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (Math.abs(diffX) < 10 && Math.abs(diffY) < 10) {
      const width = window.innerWidth;
      const tapX = e.changedTouches[0].clientX;
      if (tapX > width * 0.25 && tapX < width * 0.75) {
        setShowChrome((prev) => !prev);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Handle text selection
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 2) {
      const text = selection.toString().trim();
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPopup({
        position: {
          top: rect.top,
          left: rect.left + rect.width / 2,
        },
        text,
      });
    }
  };

  // Theme palettes
  const themeClasses = {
    paper: "reader-theme-paper bg-[#F7F5F0] text-[#1E1C24]",
    warm: "reader-theme-warm bg-[#F9F5EC] text-[#2C261E]",
    sepia: "reader-theme-sepia bg-[#F4ECD8] text-[#3A2E1D]",
    dark: "reader-theme-dark bg-[#1A1820] text-[#E0DCE6]",
    midnight: "reader-theme-midnight bg-[#0D0F14] text-[#D8E0EE]",
  }[theme];

  const bookDeckColors = {
    paper: "bg-[#FFFFFF] border-[#E8E2D5] text-[#1E1C24]",
    warm: "bg-[#FDF9F2] border-[#E6DCC6] text-[#2C261E]",
    sepia: "bg-[#F4ECD8] border-[#D8CCA8] text-[#3A2E1D]",
    dark: "bg-[#232028] border-[#383340] text-[#E4DFEA]",
    midnight: "bg-[#141720] border-[#222938] text-[#DCE4F2]",
  }[theme];

  // Matching Theme Bar Colors for top toolbar and bottom console
  const themeBarClasses = {
    paper: "bg-[#FFFFFF]/94 border-[#E5E0D4] text-[#1E1C24] shadow-md shadow-black/5",
    warm: "bg-[#FDF9F2]/95 border-[#E6DCC6] text-[#2C261E] shadow-md shadow-[#4A3820]/5",
    sepia: "bg-[#F4ECD8]/95 border-[#D8CCA8] text-[#3A2E1D] shadow-md shadow-[#4A3210]/8",
    dark: "bg-[#232028]/95 border-[#383340] text-[#E4DFEA] shadow-xl shadow-black/40",
    midnight: "bg-[#141720]/95 border-[#222938] text-[#DCE4F2] shadow-xl shadow-black/50",
  }[theme];

  const fontClasses = {
    serif: "font-serif",
    sans: "font-sans",
    readable: "font-sans tracking-wide",
    mono: "font-mono",
  }[font];

  // Helper to render text with highlighted spans
  const renderParagraphContent = (text: string, pageNum: number) => {
    if (!highlights || highlights.length === 0) return text;

    // Find all highlights relevant to this page or book
    const pageHighlights = highlights.filter(
      (h) => h.bookId === book?.id && text.includes(h.selectedText)
    );

    if (pageHighlights.length === 0) return text;

    // Break text into segments with highlights
    let elements: (string | React.ReactNode)[] = [text];

    for (const hl of pageHighlights) {
      const nextElements: (string | React.ReactNode)[] = [];

      for (const el of elements) {
        if (typeof el === "string") {
          const parts = el.split(hl.selectedText);
          parts.forEach((part, i) => {
            if (i > 0) {
              const colorClasses = {
                yellow: "bg-amber-300/60 dark:bg-amber-400/40 border-b-2 border-amber-400 text-inherit",
                green: "bg-emerald-300/60 dark:bg-emerald-400/40 border-b-2 border-emerald-400 text-inherit",
                pink: "bg-pink-300/60 dark:bg-pink-400/40 border-b-2 border-pink-400 text-inherit",
                blue: "bg-sky-300/60 dark:bg-sky-400/40 border-b-2 border-sky-400 text-inherit",
                purple: "bg-purple-300/60 dark:bg-purple-400/40 border-b-2 border-purple-400 text-inherit",
              }[hl.color] || "bg-amber-300/60 border-b-2 border-amber-400";

              nextElements.push(
                <mark
                  key={`${hl.id}-${i}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHighlightNote(hl);
                  }}
                  className={`cursor-pointer rounded px-0.5 transition-all hover:brightness-95 select-text ${colorClasses}`}
                  title={hl.note ? `Note: ${hl.note}` : "Click to view note or remove"}
                >
                  {hl.selectedText}
                </mark>
              );
            }
            if (part) nextElements.push(part);
          });
        } else {
          nextElements.push(el);
        }
      }
      elements = nextElements;
    }

    return elements;
  };

  if (!book) return null;

  const progressPercentage = Math.min(100, Math.round((safePage / totalPages) * 100));

  // Stack thickness in px to simulate physical page volume
  const leftStackPx = Math.max(2, Math.min(16, Math.round((safePage / totalPages) * 16)));
  const rightStackPx = Math.max(2, Math.min(16, Math.round(((totalPages - safePage) / totalPages) * 16)));

  return (
    <div
      className={`min-h-screen flex flex-col justify-between ${themeClasses} transition-colors duration-400 select-text relative overflow-x-hidden`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => {
        if (selectionPopup) setSelectionPopup(null);
      }}
    >
      {/* Ambient Reading Spotlight Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-500"
        style={{
          background:
            theme === "dark" || theme === "midnight"
              ? "radial-gradient(circle at 50% 45%, rgba(90, 62, 133, 0.22) 0%, rgba(0, 0, 0, 0.8) 100%)"
              : "radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.85) 0%, rgba(215, 205, 190, 0.45) 100%)",
        }}
      />

      {/* Floating Top Reading Toolbar */}
      <div
        className={`transition-all duration-300 z-40 ${
          showChrome ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <ReaderToolbar
          onOpenToc={() => setIsTocOpen(true)}
          onOpenBookmarks={() => setIsBookmarksOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onComplete={() => {
            if (!hasFullAccess) {
              setIsPaywallOpen(true);
              return;
            }
            markCompleted();
            setIsCompletionOpen(true);
          }}
          onUnlockBook={() => setIsPaywallOpen(true)}
          spreadMode={spreadMode}
          onToggleSpread={() => setSpreadMode(spreadMode === "dual" ? "single" : "dual")}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(viewMode === "flow" ? "pdf" : "flow")}
          hasPdfFile={hasPdfFile}
        />
      </div>

      {/* Free Preview Interactive Luxury HUD Pill */}
      {!hasFullAccess && previewLimit && (
        <div
          className={`fixed top-[70px] sm:top-[74px] left-3 right-3 sm:left-6 sm:right-6 max-w-xl mx-auto z-40 transition-all duration-300 pointer-events-auto ${
            showChrome ? "translate-y-0 opacity-100" : "-translate-y-28 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-gradient-to-r from-[#D95D4D] via-[#E87564] to-[#F18D7E] text-white shadow-xl shadow-[#D95D4D]/30 border border-white/35 rounded-2xl sm:rounded-full px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-full bg-white/20 text-amber-200 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight truncate">
                  <span>Free Preview</span>
                  <span className="opacity-60">•</span>
                  <span className="font-mono text-xs font-normal opacity-90">
                    Page {safePage} of {previewLimit}
                  </span>
                </div>
                {/* Visual miniature progress bar */}
                <div className="w-24 sm:w-32 bg-black/25 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="bg-white rounded-full h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((safePage / previewLimit) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsPaywallOpen(true)}
              className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white text-[#D95D4D] hover:bg-[#FFF9F7] text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Unlock Book {book.price ? `• ₹${book.price}` : ""}</span>
            </button>
          </div>
        </div>
      )}

      {/* Left & Right Desk Margin Navigation Click Zones */}
      <button
        onClick={handlePrev}
        disabled={safePage <= 1}
        className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-40 hover:opacity-100 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer hidden md:flex items-center gap-1 backdrop-blur-xs group"
        title="Previous Page (← or Page Up)"
      >
        <ChevronLeft className="w-6 h-6 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <button
        onClick={handleNext}
        className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-current opacity-40 hover:opacity-100 transition-all cursor-pointer hidden md:flex items-center gap-1 backdrop-blur-xs group"
        title="Next Page (→ or Space)"
      >
        <ChevronRight className="w-6 h-6 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* EXACT ORIGINAL PDF FACSIMILE VIEWER */}
      {viewMode === "pdf" && hasPdfFile && (
        <div className="pt-18 pb-6 px-2 sm:px-6 h-[100dvh] max-w-6xl mx-auto w-full flex flex-col z-20 relative animate-in fade-in duration-200">
          <div className="flex-1 bg-white dark:bg-[#1a1820] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden flex flex-col">
            <div className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-b border-[var(--border)] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  Original PDF Manuscript: {book.title}
                </span>
                <span className="hidden sm:inline text-neutral-500 dark:text-neutral-400 font-mono text-[11px]">
                  ({book.pages || 1} Pages)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewMode("flow")}
                className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1 shrink-0 ml-2"
              >
                Switch to Reflowable Reader →
              </button>
            </div>
            <iframe
              src={`/api/files/books/${book.id}#toolbar=1&navpanes=1`}
              className="w-full flex-1 border-0"
              title={`Original PDF Document: ${book.title}`}
            />
          </div>
        </div>
      )}

      {/* MAIN READING ENVIRONMENT: Physical Book Deck (Reflowable Flow Reader) */}
      {viewMode === "flow" && (
        <main
          ref={containerRef}
          onMouseUp={handleMouseUp}
          className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-8 py-18 sm:py-20 flex items-center justify-center relative z-10 perspective-book"
        >
        {/* PHYSICAL HARDCOVER BOOK CASING */}
        <div
          className={`w-full book-hardcover-deck ${bookDeckColors} border rounded-2xl relative shadow-2xl transition-all duration-400 overflow-hidden flex flex-col`}
          style={{
            minHeight: "75vh",
          }}
        >
          {/* Silk Ribbon Bookmark hanging from book casing */}
          {isBookmarked && (
            <div
              onClick={toggleBookmark}
              className="book-ribbon cursor-pointer"
              title="Page Bookmarked (Click to Remove Bookmark)"
            />
          )}

          {/* Decorative Headband & Tailband at spine ends */}
          {isDual && (
            <>
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-1.5 z-30 opacity-70"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #E97868, #E97868 3px, #FAF7F0 3px, #FAF7F0 6px)",
                }}
              />
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1.5 z-30 opacity-70"
                style={{
                  background:
                    "repeating-linear-gradient(45deg, #E97868, #E97868 3px, #FAF7F0 3px, #FAF7F0 6px)",
                }}
              />
            </>
          )}

          {/* Stacked Page Leaf Edges (Visual Volume Thickness) */}
          <div
            className="absolute top-3 bottom-3 left-0 pointer-events-none book-page-stack-left transition-all duration-500"
            style={{ width: `${leftStackPx}px` }}
          />
          <div
            className="absolute top-3 bottom-3 right-0 pointer-events-none book-page-stack-right transition-all duration-500"
            style={{ width: `${rightStackPx}px` }}
          />

          {/* Center Spine Gutter (Valley) for Dual Spread */}
          {isDual && <div className="book-spine-gutter" />}

          {/* Single-Page Left Spine Crease */}
          {!isDual && <div className="absolute top-0 bottom-0 left-0 w-16 pointer-events-none book-crease-single z-20" />}

          {/* PAGES CONTENT CONTAINER */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 relative h-full">
            {/* LEFT PAGE (Verso in Dual mode, or Single Page) */}
            <div
              className={`p-6 sm:p-12 lg:p-14 flex flex-col justify-between relative transition-all ${
                isDual ? "border-r border-black/5 dark:border-white/5" : "col-span-full max-w-3xl mx-auto w-full"
              }`}
            >
              {/* Left Page Running Header */}
              <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-black/8 dark:border-white/8 text-[11px] font-mono opacity-50 uppercase tracking-widest">
                <span className="truncate max-w-[200px]">{book.title}</span>
                <span>Page {leftPageNum}</span>
              </div>

              {/* Left Page Text Content */}
              <article
                className={`my-6 flex-1 ${fontClasses} leading-relaxed transition-all`}
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                  textAlign: textAlign,
                }}
              >
                {leftPageNum === 1 && (
                  <div className="mb-4 text-center">
                    <span className="text-[10px] tracking-widest font-mono uppercase opacity-50 block mb-1">
                      Chapter
                    </span>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight">
                      {leftPageData?.chapterTitle || book.title}
                    </h2>
                  </div>
                )}

                {leftPageData?.paragraphs && leftPageData.paragraphs.length > 0 ? (
                  leftPageData.paragraphs.map((para, idx) => (
                    <p
                      key={idx}
                      className={`mb-5 indent-4 sm:indent-8 ${
                        leftPageNum === 1 && idx === 0
                          ? "first-letter:font-editorial first-letter:text-5xl first-letter:float-left first-letter:mr-3 first-letter:font-bold first-letter:leading-none first-letter:text-[var(--primary)]"
                          : ""
                      }`}
                    >
                      {renderParagraphContent(para, leftPageNum)}
                    </p>
                  ))
                ) : (
                  <p>{book.description}</p>
                )}
              </article>

              {/* Left Page Footer */}
              <div className="pt-4 border-t border-black/8 dark:border-white/8 flex items-center justify-between text-[11px] font-mono opacity-40">
                <span>{leftPageData?.chapterTitle || book.author}</span>
                <span>{leftPageNum}</span>
              </div>
            </div>

            {/* RIGHT PAGE (Recto - shown in Dual spread mode) */}
            {isDual && (
              <div className="p-6 sm:p-12 lg:p-14 flex flex-col justify-between relative bg-white/5 dark:bg-black/5">
                {/* Right Page Running Header */}
                <div className="flex items-center justify-between pb-4 sm:pb-6 border-b border-black/8 dark:border-white/8 text-[11px] font-mono opacity-50 uppercase tracking-widest">
                  <span className="truncate max-w-[200px]">{rightPageData?.chapterTitle || currentChapterTitle}</span>
                  <span>{rightPageNum <= totalPages ? `Page ${rightPageNum}` : "—"}</span>
                </div>

                {/* Right Page Text Content */}
                <article
                  className={`my-6 flex-1 ${fontClasses} leading-relaxed transition-all`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    textAlign: textAlign,
                  }}
                >
                  {!hasFullAccess && previewLimit && rightPageNum > previewLimit ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-[var(--coral)]/10 via-[var(--coral)]/5 to-transparent rounded-2xl border border-[var(--coral)]/25">
                      <div className="w-12 h-12 rounded-full bg-[var(--coral)]/15 text-[var(--coral)] flex items-center justify-center mb-3 shadow-xs">
                        <Lock className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] bg-[var(--coral)]/10 px-3 py-1 rounded-full mb-2">
                        Preview Concluded ({previewLimit} Pages)
                      </span>
                      <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] mb-2">
                        Enjoying the story?
                      </h3>
                      <p className="text-xs text-[var(--muted)] max-w-xs mb-5 leading-relaxed">
                        You&apos;ve reached page {previewLimit}. To continue reading all chapters of &ldquo;{book.title}&rdquo;, unlock the full book with permanent digital ownership.
                      </p>
                      <button
                        onClick={() => setIsPaywallOpen(true)}
                        className="px-5 py-2.5 rounded-full bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Unlock Full Book • ₹{book.price || 199}</span>
                      </button>
                    </div>
                  ) : flipState?.direction === 1 && flipState.targetRightPage ? (
                    flipState.targetRightPage.paragraphs.map((para, idx) => (
                      <p key={idx} className="mb-5 indent-4 sm:indent-8">
                        {renderParagraphContent(para, flipState.targetPageNum + 1)}
                      </p>
                    ))
                  ) : rightPageData && rightPageNum <= totalPages ? (
                    rightPageData.paragraphs.map((para, idx) => (
                      <p key={idx} className="mb-5 indent-4 sm:indent-8">
                        {renderParagraphContent(para, rightPageNum)}
                      </p>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-8">
                      <BookOpen className="w-12 h-12 mb-3 stroke-1" />
                      <p className="font-editorial text-lg italic">End of Current Volume</p>
                    </div>
                  )}
                </article>

                {/* Right Page Footer */}
                <div className="pt-4 border-t border-black/8 dark:border-white/8 flex items-center justify-between text-[11px] font-mono opacity-40">
                  <span>{rightPageNum <= totalPages ? `READORA Edition` : ""}</span>
                  <span>{rightPageNum <= totalPages ? rightPageNum : ""}</span>
                </div>

                {/* Interactive Dog-Ear Corner Invitation on Right Bottom */}
                {rightPageNum < totalPages && !flipState && (
                  <div
                    onClick={handleNext}
                    className="book-dogear-corner"
                    title="Click or swipe to turn page"
                  />
                )}
              </div>
            )}

            {/* REALISTIC HUMAN PAGE FOLD & CURL ENGINE */}
            <AnimatePresence>
              {flipState && animation3d && (
                <motion.div
                  key="curling-leaf"
                  initial={{
                    rotateY: flipState.direction > 0 ? 0 : -180,
                    skewY: 0,
                  }}
                  animate={{
                    rotateY: flipState.direction > 0 ? -180 : 0,
                    skewY: [0, flipState.direction > 0 ? -3.5 : 3.5, 0],
                  }}
                  transition={{
                    duration: animDuration,
                    ease: [0.35, 0.8, 0.45, 1], // Ergonomic physical paper curve
                  }}
                  onAnimationComplete={() => {
                    const finalPage = flipState.targetPageNum;
                    goToPage(finalPage, pagesList[finalPage - 1]?.chapterTitle);
                    setFlipState(null);
                  }}
                  className={`absolute top-0 bottom-0 z-30 ${bookDeckColors} shadow-2xl overflow-hidden ${
                    isDual
                      ? "left-1/2 right-0 origin-left"
                      : "left-0 right-0 origin-left"
                  }`}
                  style={{
                    transformStyle: "preserve-3d",
                    willChange: "transform",
                  }}
                >
                  {/* Moving Dynamic Cylindrical Shading Highlight */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: animDuration, ease: "easeInOut" }}
                    className="absolute inset-0 pointer-events-none book-curl-highlight z-20"
                  />

                  {/* Dynamic Moving Drop Shadow under the bending ridge */}
                  <motion.div
                    initial={{ opacity: 0.1, scaleX: 0.2 }}
                    animate={{ opacity: [0.25, 0.7, 0.15], scaleX: [0.3, 1, 0.3] }}
                    transition={{ duration: animDuration, ease: "easeInOut" }}
                    className="absolute inset-0 pointer-events-none book-curl-shadow z-10"
                  />

                  {/* FRONT FACE OF TURNING LEAF (Recto) */}
                  <div
                    className="absolute inset-0 p-6 sm:p-12 lg:p-14 flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-black/8 dark:border-white/8 text-[11px] font-mono opacity-50 uppercase">
                      <span>{book.title}</span>
                      <span>Page {rightPageNum}</span>
                    </div>

                    <div className={`my-6 flex-1 ${fontClasses} opacity-80 leading-relaxed text-xs sm:text-sm line-clamp-12`}>
                      {flipState.sourceRightPage?.paragraphs?.[0] || book.description}
                    </div>

                    <div className="pt-4 border-t border-black/8 dark:border-white/8 text-[11px] font-mono opacity-40 text-right">
                      <span>READORA</span>
                    </div>
                  </div>

                  {/* BACK FACE OF TURNING LEAF (Verso - visible after 90 deg rotation) */}
                  <div
                    className="absolute inset-0 p-6 sm:p-12 lg:p-14 flex flex-col justify-between"
                    style={{
                      transform: "rotateY(180deg)",
                      backfaceVisibility: "hidden",
                    }}
                  >
                    <div className="flex items-center justify-between pb-4 border-b border-black/8 dark:border-white/8 text-[11px] font-mono opacity-50 uppercase">
                      <span>{book.title}</span>
                      <span>Page {flipState.targetPageNum}</span>
                    </div>

                    <div className={`my-6 flex-1 ${fontClasses} opacity-80 leading-relaxed text-xs sm:text-sm line-clamp-12`}>
                      {flipState.targetLeftPage?.paragraphs?.[0] || book.description}
                    </div>

                    <div className="pt-4 border-t border-black/8 dark:border-white/8 text-[11px] font-mono opacity-40 text-left">
                      <span>READORA</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dynamic Watermark for Paid Books */}
          {watermarkText && (
            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-mono text-[var(--muted)] opacity-30 pointer-events-none select-none">
              {watermarkText}
            </div>
          )}
        </div>
      </main>
      )}

      {/* Floating Bottom Ergonomic Console */}
      <footer
        className={`fixed bottom-4 left-3 right-3 sm:left-6 sm:right-6 max-w-3xl mx-auto z-40 transition-all duration-300 ${
          showChrome ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className={`h-13 rounded-2xl border backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-3 text-xs transition-all duration-300 ${themeBarClasses}`}>
          {/* Table of contents & percentage */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTocOpen(true)}
              className="p-1.5 rounded-xl text-current opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Table of Contents"
            >
              <List className="w-4 h-4 text-[var(--primary)]" />
            </button>
            <span className="font-mono font-bold text-current text-xs">
              {progressPercentage}%
            </span>
          </div>

          {/* Interactive Scrubbing Slider */}
          <div className="flex-1 max-w-md mx-2 flex items-center gap-3">
            <span className="font-mono text-[10px] opacity-50 hidden sm:inline">1</span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={safePage}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!hasFullAccess && previewLimit && val > previewLimit) {
                  setIsPaywallOpen(true);
                  return;
                }
                goToPage(val, pagesList[val - 1]?.chapterTitle);
              }}
              className="w-full accent-[var(--primary)] cursor-pointer h-1.5 rounded-full bg-current/15"
              aria-label="Reading progress slider"
            />
            <span className="font-mono text-[10px] opacity-50 hidden sm:inline">{totalPages}</span>
          </div>

          {/* Page Counter & Settings */}
          <div className="flex items-center gap-2 shrink-0 text-current opacity-80">
            <span className="font-mono text-[11px] font-medium hidden xs:inline">
              {isDual && rightPageNum <= totalPages ? `${leftPageNum}-${rightPageNum}` : safePage} / {totalPages}
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-xl hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="Reader Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Highlight / Note Popup on Selection */}
      {selectionPopup && (
        <HighlightPopup
          position={selectionPopup.position}
          selectedText={selectionPopup.text}
          onClose={() => setSelectionPopup(null)}
        />
      )}

      {/* Highlight Inspection / Note Viewer Modal */}
      {activeHighlightNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className={`w-full max-w-md ${bookDeckColors} border rounded-2xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <span className="text-xs font-bold font-mono uppercase tracking-wider opacity-60">
                Highlighted Passage
              </span>
              <button
                onClick={() => setActiveHighlightNote(null)}
                className="p-1 rounded-lg text-current opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border-l-3 border-[var(--primary)] text-sm italic font-editorial">
              &ldquo;{activeHighlightNote.selectedText}&rdquo;
            </div>

            {activeHighlightNote.note && (
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase opacity-50">Your Note:</span>
                <p className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded-xl">
                  {activeHighlightNote.note}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  removeHighlight(activeHighlightNote.id);
                  setActiveHighlightNote(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Highlight</span>
              </button>

              <button
                onClick={() => setActiveHighlightNote(null)}
                className="px-4 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawers & Modals */}
      <TableOfContentsSheet isOpen={isTocOpen} onClose={() => setIsTocOpen(false)} />
      <BookmarksSheet isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />
      <SearchInsideSheet isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ReaderSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Preview Paywall Modal */}
      <PreviewPaywallModal
        book={book}
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        previewPages={previewLimit || 10}
      />

      {/* Completion Modal - Exclusively for Full Access Readers */}
      <CompletionModal
        book={book}
        isOpen={isCompletionOpen && hasFullAccess}
        onClose={() => setIsCompletionOpen(false)}
        readingTimeSeconds={readingTimeSeconds}
        onReadAgain={resetProgress}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
