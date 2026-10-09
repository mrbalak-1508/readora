"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useReader } from "@/context/ReaderContext";
import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { BookmarksSheet } from "./BookmarksSheet";
import { SearchInsideSheet } from "./SearchInsideSheet";
import { HighlightPopup } from "./HighlightPopup";
import { CompletionModal } from "./CompletionModal";
import { PreviewPaywallModal } from "./PreviewPaywallModal";
import { soundManager } from "@/lib/sound";
import { Highlight } from "@/lib/types";
import { BookReader, BookReaderHandle } from "./BookReader";
import { getPdfDocument } from "@/lib/pdf/pdfjs";
import { paginateBook, PageData } from "@/lib/pagination";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Sliders,
  Lock,
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

  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Spread mode: "dual" (two open pages side-by-side) or "single" (focused single leaf)
  const [spreadMode, setSpreadMode] = useState<"dual" | "single">("dual");

  // 3D BookReader imperative handle and controls
  const bookReaderRef = useRef<BookReaderHandle>(null);
  const [zoom, setZoom] = useState<number>(1.0);
  const serverWatermark = watermarkText || null;

  // Determine if this is a direct visual PDF book (must have .pdf extension or PDF format)
  const isPdfBook = Boolean(
    book?.format?.toLowerCase() === "pdf" ||
    (book as any)?.format?.toUpperCase?.() === "PDF" ||
    (book as any)?.mimeType === "application/pdf" ||
    book?.fileName?.toLowerCase().endsWith(".pdf") ||
    book?.fileUrl?.toLowerCase().endsWith(".pdf") ||
    (book as any)?.filePath?.toLowerCase()?.endsWith(".pdf")
  );

  // Paginate text / interactive format books for editorial reading
  const textPages = useMemo<PageData[]>(() => {
    if (!isPdfBook && book) {
      return paginateBook(book);
    }
    return [];
  }, [isPdfBook, book]);

  const [pdfTotalPages, setPdfTotalPages] = useState<number | null>(() => {
    return isPdfBook && book?.pages && book.pages > 1 ? book.pages : null;
  });

  useEffect(() => {
    if (isPdfBook && book?.id) {
      getPdfDocument(book.id)
        .then((pdf) => {
          if (pdf?.numPages) {
            setPdfTotalPages(pdf.numPages);
          }
        })
        .catch((err) => {
          console.warn("PDF metadata load notice:", err?.message);
        });
    }
  }, [isPdfBook, book?.id]);

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

  const totalPages = Math.max(
    1,
    isPdfBook ? (pdfTotalPages || book?.pages || 1) : (textPages.length || book?.pages || 1)
  );
  const safePage = Math.max(1, Math.min(totalPages, currentPage));
  const isDual = spreadMode === "dual";

  // Cooldown timer to prevent accidental double-skips
  const lastNavTimeRef = useRef<number>(0);

  const handleNext = () => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 300) return;
    lastNavTimeRef.current = now;

    if (!hasFullAccess && previewLimit && safePage >= previewLimit) {
      setIsPaywallOpen(true);
      return;
    }

    if (safePage < totalPages) {
      if (bookReaderRef.current) {
        bookReaderRef.current.flipNext();
      } else {
        if (soundEnabled) {
          soundManager.playPageTurn();
        }
        goToPage(Math.min(totalPages, safePage + (isDual ? 2 : 1)));
      }
    } else {
      if (!hasFullAccess) {
        setIsPaywallOpen(true);
        return;
      }
      markCompleted();
      setIsCompletionOpen(true);
    }
  };

  const handlePrev = () => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 300) return;
    lastNavTimeRef.current = now;

    if (safePage > 1) {
      if (bookReaderRef.current) {
        bookReaderRef.current.flipPrev();
      } else {
        if (soundEnabled) {
          soundManager.playPageTurn();
        }
        goToPage(Math.max(1, safePage - (isDual ? 2 : 1)));
      }
    }
  };

  const handleReaderPageChange = useCallback(
    (newPage: number) => {
      goToPage(newPage, textPages?.[newPage - 1]?.chapterTitle);
    },
    [goToPage, textPages]
  );

  // Debounced Reading Progress Auto-save (500–1500ms)
  useEffect(() => {
    if (!book?.id || safePage < 1) return;

    const timer = setTimeout(() => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          currentPage: safePage,
          totalPages: totalPages,
          percentage: Math.round((safePage / Math.max(1, totalPages)) * 100),
        }),
      }).catch(() => {});
    }, 1000);

    return () => clearTimeout(timer);
  }, [book?.id, safePage, totalPages]);

  // Keyboard navigation & Zoom shortcuts (+ / - / 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoom((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoom((z) => Math.max(1.0, Number((z - 0.25).toFixed(2))));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1.0);
      } else if (e.key === "Escape") {
        setIsBookmarksOpen(false);
        setIsSearchOpen(false);
        setIsSettingsOpen(false);
        setIsPaywallOpen(false);
        setSelectionPopup(null);
        setActiveHighlightNote(null);
        setZoom(1.0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [safePage, totalPages, hasFullAccess, previewLimit, isDual, isPdfBook]);

  // Handle tap / click on the reader stage: Left 35% -> Prev, Right 35% -> Next, Center 30% -> Toggle chrome
  const handleStageClick = (e: React.MouseEvent<HTMLElement>) => {
    if (zoom > 1.0) return;

    // Ignore clicks on buttons, links, inputs, sliders, modals
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, a, input, select, textarea, [role='button'], footer, header")) {
      return;
    }

    // Ignore if selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 1) {
      return;
    }

    const stageRect = containerRef.current?.getBoundingClientRect();
    if (!stageRect) return;

    const clickX = e.clientX - stageRect.left;
    const width = stageRect.width;
    const ratio = clickX / width;

    if (ratio < 0.35) {
      handlePrev();
    } else if (ratio > 0.65) {
      handleNext();
    } else {
      setShowChrome((prev) => !prev);
    }
  };

  const handleStageTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1.0) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleStageTouchEnd = (e: React.TouchEvent) => {
    if (zoom > 1.0 || touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Detect horizontal swipe gesture (> 36px and dominant over vertical)
    if (Math.abs(diffX) > 36 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX < 0) {
        handleNext(); // swipe left -> next page
      } else {
        handlePrev(); // swipe right -> prev page
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



  if (!book) return null;

  const progressPercentage = Math.min(100, Math.round((safePage / totalPages) * 100));


  return (
    <div
      className={`h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col justify-between ${themeClasses} transition-colors duration-400 select-text relative`}
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
        className={`fixed top-2 sm:top-3 left-2 right-2 sm:left-6 sm:right-6 max-w-5xl mx-auto z-50 transition-all duration-300 pointer-events-auto ${
          showChrome ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0 pointer-events-none"
        }`}
      >
        <ReaderToolbar
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
          hasPdfFile={isPdfBook}
          zoom={zoom}
          onZoomIn={() => setZoom((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))))}
          onZoomOut={() => setZoom((z) => Math.max(1.0, Number((z - 0.25).toFixed(2))))}
        />
      </div>

      {/* Free Preview Interactive Luxury HUD Pill */}
      {!hasFullAccess && previewLimit && (
        <div
          className={`fixed top-14 sm:top-[70px] left-2 right-2 sm:left-6 sm:right-6 max-w-xl mx-auto z-40 transition-all duration-300 pointer-events-auto ${
            showChrome ? "translate-y-0 opacity-100" : "-translate-y-28 opacity-0 pointer-events-none"
          }`}
        >
          <div className="bg-gradient-to-r from-[#D95D4D] via-[#E87564] to-[#F18D7E] text-white shadow-xl shadow-[#D95D4D]/25 border border-white/35 rounded-2xl sm:rounded-full px-3 sm:px-5 py-1.5 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 text-amber-200 flex items-center justify-center shrink-0 shadow-inner">
                <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm tracking-tight truncate">
                  <span>Preview</span>
                  <span className="opacity-60 hidden xs:inline">•</span>
                  <span className="font-mono text-[11px] sm:text-xs font-normal opacity-90 truncate">
                    Page {safePage}/{previewLimit}
                  </span>
                </div>
                {/* Visual miniature progress bar */}
                <div className="w-20 sm:w-32 bg-black/25 rounded-full h-1 mt-0.5 sm:mt-1 overflow-hidden">
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
              className="px-3 sm:px-4 py-1.5 rounded-full bg-white text-[#D95D4D] hover:bg-[#FFF9F7] text-[11px] sm:text-xs font-bold transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-1 sm:gap-1.5 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
              <span>Unlock Book {book.price ? `• ₹${book.price}` : ""}</span>
            </button>
          </div>
        </div>
      )}


      {/* Left & Right Desk Margin Ergonomic Floating Navigation Pills */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handlePrev();
        }}
        disabled={safePage <= 1}
        className="fixed left-0.5 sm:left-3 lg:left-6 top-1/2 -translate-y-1/2 z-40 w-8 sm:w-11 h-12 sm:h-16 rounded-lg sm:rounded-2xl bg-black/50 sm:bg-white/80 dark:bg-black/70 hover:bg-black/80 sm:hover:bg-white dark:hover:bg-black/90 text-white sm:text-current shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center backdrop-blur-md border border-white/20 dark:border-white/10 group touch-manipulation pointer-events-auto"
        title="Previous Page (← or Page Up)"
        aria-label="Previous Page"
      >
        <ChevronLeft className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:-translate-x-0.5" />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleNext();
        }}
        disabled={safePage >= totalPages}
        className="fixed right-0.5 sm:right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 w-8 sm:w-11 h-12 sm:h-16 rounded-lg sm:rounded-2xl bg-black/50 sm:bg-white/80 dark:bg-black/70 hover:bg-black/80 sm:hover:bg-white dark:hover:bg-black/90 text-white sm:text-current shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center backdrop-blur-md border border-white/20 dark:border-white/10 group touch-manipulation pointer-events-auto"
        title="Next Page (→ or Space)"
        aria-label="Next Page"
      >
        <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* MAIN READING STAGE */}
      <main
        ref={containerRef}
        onClick={handleStageClick}
        onTouchStart={handleStageTouchStart}
        onTouchEnd={handleStageTouchEnd}
        onMouseUp={handleMouseUp}
        className="flex-1 w-full max-w-7xl mx-auto px-1 sm:px-4 pt-14 sm:pt-16 pb-16 sm:pb-24 flex items-center justify-center relative z-10 perspective-book min-h-0 cursor-default select-text overflow-hidden"
      >
        <div className="w-full h-full flex items-center justify-center relative min-h-0 overflow-hidden">
          <BookReader
            ref={bookReaderRef}
            bookId={book.id}
            totalPages={totalPages}
            bookTitle={book.title}
            author={book.author}
            isPdfBook={isPdfBook}
            pagesData={textPages}
            initialPage={safePage}
            hasFullAccess={hasFullAccess}
            previewLimit={previewLimit ?? undefined}
            price={book.price}
            currency={book.currency}
            watermark={serverWatermark}
            theme={theme}
            font={font}
            fontSize={fontSize}
            lineHeight={lineHeight}
            textAlign={textAlign}
            zoom={zoom}
            soundEnabled={soundEnabled}
            spreadMode={spreadMode}
            onPageChange={handleReaderPageChange}
            onUnlockRequest={() => setIsPaywallOpen(true)}
          />

          {/* Zoom & Movable Pan HUD Pill */}
          {zoom > 1.0 && (
            <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 bg-black/85 dark:bg-black/90 text-white backdrop-blur-xl px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 text-xs font-mono border border-white/20 select-none animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center gap-1.5 font-bold">
                <ZoomIn className="w-3.5 h-3.5 text-amber-300" />
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <span className="text-[11px] opacity-75 font-sans hidden sm:inline">
                Drag anywhere to move page
              </span>
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-sans font-semibold transition-all cursor-pointer flex items-center gap-1"
                title="Reset zoom to 100%"
              >
                <span>Reset Zoom</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Luxury Ergonomic Console */}
      <footer
        className={`fixed bottom-2 sm:bottom-4 left-2 right-2 sm:left-6 sm:right-6 max-w-4xl mx-auto z-40 transition-all duration-300 pointer-events-auto ${
          showChrome ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className={`h-12 sm:h-14 rounded-xl sm:rounded-2xl border backdrop-blur-2xl px-2.5 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-3 text-xs transition-all duration-300 shadow-xl ${themeBarClasses}`}>
          {/* Quick jump to start & Table of contents */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (bookReaderRef.current) {
                  bookReaderRef.current.turnToPage(1);
                }
                goToPage(1);
              }}
              disabled={safePage <= 1}
              className="hidden sm:flex p-1.5 sm:p-2 min-w-[36px] min-h-[36px] items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation cursor-pointer"
              title="First Page"
              aria-label="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              disabled={safePage <= 1}
              className="p-1.5 sm:p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-75 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation cursor-pointer active:scale-95 pointer-events-auto"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="hidden xs:flex items-center gap-1 ml-0.5 text-xs font-mono font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg">
              {progressPercentage}%
            </div>
          </div>

          {/* Interactive Scrubbing Slider */}
          <div className="flex-1 max-w-md mx-1 sm:mx-2 flex items-center gap-1.5 sm:gap-3">
            <span className="font-mono text-[11px] opacity-50 hidden sm:inline">1</span>
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
                if (bookReaderRef.current) {
                  bookReaderRef.current.turnToPage(val);
                }
                goToPage(val);
              }}
              className="w-full accent-[var(--primary)] cursor-pointer h-2 rounded-full bg-current/15 hover:bg-current/25 transition-colors touch-manipulation py-2"
              aria-label="Reading progress slider"
            />
            <span className="font-mono text-[11px] opacity-50 hidden sm:inline">{totalPages}</span>
          </div>

          {/* Next / Last Page Navigation & Page Indicator */}
          <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 text-current">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              disabled={safePage >= totalPages}
              className="p-1.5 sm:p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-75 hover:opacity-100 disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation cursor-pointer active:scale-95 pointer-events-auto"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                const target = !hasFullAccess && previewLimit ? previewLimit : totalPages;
                if (bookReaderRef.current) {
                  bookReaderRef.current.turnToPage(target);
                }
                goToPage(target);
              }}
              className="hidden sm:flex p-1.5 sm:p-2 min-w-[36px] min-h-[36px] items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-colors touch-manipulation cursor-pointer"
              title="Last Page"
              aria-label="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            <span className="font-mono text-[10px] sm:text-[11px] font-semibold opacity-85 px-1 whitespace-nowrap">
              <span className="hidden sm:inline">Page </span>{safePage}/{totalPages}
            </span>

            {/* Quick Zoom Buttons (Desktop only) */}
            <div className="hidden md:flex items-center gap-0.5 border-l border-current/15 pl-1.5 ml-1">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1.0, Number((z - 0.25).toFixed(2))))}
                disabled={zoom <= 1.0}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 opacity-70">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.25).toFixed(2))))}
                disabled={zoom >= 2.0}
                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 opacity-70 hover:opacity-100 disabled:opacity-30 transition-colors cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 opacity-75 hover:opacity-100 transition-colors ml-0.5 touch-manipulation cursor-pointer active:scale-95"
              title="Reader Settings"
              aria-label="Reader Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Discreet Mobile Page Indicator when Chrome is hidden */}
      {!showChrome && (
        <div className="fixed bottom-3 right-3 sm:right-6 z-30 pointer-events-none transition-opacity duration-300">
          <div className="px-2.5 py-1 rounded-full bg-black/60 dark:bg-white/20 text-white text-[10px] font-mono backdrop-blur-md shadow-md opacity-60">
            {safePage} / {totalPages}
          </div>
        </div>
      )}

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
      <BookmarksSheet isOpen={isBookmarksOpen} onClose={() => setIsBookmarksOpen(false)} />
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

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
