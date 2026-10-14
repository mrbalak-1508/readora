"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useReader } from "@/context/ReaderContext";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Bookmark as BookmarkIcon,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  List,
} from "lucide-react";
import { HighlightPopup } from "./HighlightPopup";

interface WrittenReaderProps {
  onOpenToc?: () => void;
  onOpenSettings?: () => void;
  onUnlockRequest?: () => void;
}

export function WrittenReader({
  onOpenToc,
  onOpenSettings,
  onUnlockRequest,
}: WrittenReaderProps) {
  const {
    book,
    currentPage,
    setTotalPages,
    theme,
    font,
    fontSize,
    lineHeight,
    textAlign,
    hasFullAccess,
    previewLimit,
    bookmarks,
    toggleBookmark,
    goToPage,
    markCompleted,
  } = useReader();

  const chapters = useMemo(() => {
    if (book?.chapters && book.chapters.length > 0) {
      return book.chapters;
    }
    // Fallback if book has sample content or description but no explicit chapter rows
    if (book?.sampleContent || book?.description) {
      const content = book.sampleContent || book.description || "";
      return [
        {
          id: "ch-sample-1",
          title: "Introduction & Overview",
          page: 1,
          previewAllowed: true,
          content: content
            .split("\n\n")
            .filter(Boolean)
            .map((p) => `<p>${p.trim()}</p>`)
            .join(""),
        },
      ];
    }
    return [];
  }, [book]);

  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selection popup for text highlights
  const [selectionPopup, setSelectionPopup] = useState<{
    position: { top: number; left: number };
    selectedText: string;
    pageNumber: number;
  } | null>(null);

  // Set total pages in ReaderContext to number of chapters
  useEffect(() => {
    if (chapters.length > 0) {
      setTotalPages(chapters.length);
    }
  }, [chapters.length, setTotalPages]);

  // Synchronize chapter index when currentPage changes from outside (Toolbar, TOC, Bookmarks, Search)
  useEffect(() => {
    if (chapters.length === 0) return;
    // Try exact page match first
    const matchIdx = chapters.findIndex((ch) => ch.page === currentPage);
    if (matchIdx !== -1) {
      if (matchIdx !== currentChapterIndex) {
        setCurrentChapterIndex(matchIdx);
      }
    } else {
      // Or clamped index
      const clampedIdx = Math.max(0, Math.min(currentPage - 1, chapters.length - 1));
      if (clampedIdx !== currentChapterIndex) {
        setCurrentChapterIndex(clampedIdx);
      }
    }
  }, [currentPage, chapters]);

  const currentChapter = chapters[currentChapterIndex] || null;

  // Preview restriction: for written books, previewLimit or previewChapters restricts access
  const allowedPreviewChapters = book?.previewChapters || 1;
  const isChapterLocked =
    !hasFullAccess &&
    currentChapterIndex >= allowedPreviewChapters &&
    currentChapter?.previewAllowed === false;

  // Scroll to top when changing chapter
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentChapterIndex]);

  // Is current chapter bookmarked
  const isCurrentBookmarked = useMemo(() => {
    if (!currentChapter) return false;
    return bookmarks.some(
      (b) =>
        b.chapterId === currentChapter.id ||
        b.chapterTitle === currentChapter.title ||
        b.page === (currentChapter.page || currentChapterIndex + 1)
    );
  }, [bookmarks, currentChapter, currentChapterIndex]);

  const navigateToChapter = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, chapters.length - 1));
      setCurrentChapterIndex(clamped);
      const ch = chapters[clamped];
      if (ch && goToPage) {
        goToPage(ch.page || clamped + 1, ch.title);
      }
    },
    [chapters, goToPage]
  );

  const handlePrev = useCallback(() => {
    if (currentChapterIndex > 0) {
      navigateToChapter(currentChapterIndex - 1);
    }
  }, [currentChapterIndex, navigateToChapter]);

  const handleNext = useCallback(() => {
    if (currentChapterIndex < chapters.length - 1) {
      navigateToChapter(currentChapterIndex + 1);
    } else {
      markCompleted?.();
    }
  }, [currentChapterIndex, chapters.length, navigateToChapter, markCompleted]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Text selection handler
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionPopup(null);
      return;
    }
    const text = selection.toString().trim();
    if (text.length > 2) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionPopup({
        position: {
          top: Math.max(10, rect.top - 50),
          left: Math.max(10, rect.left + rect.width / 2 - 120),
        },
        selectedText: text,
        pageNumber: currentChapter?.page || currentChapterIndex + 1,
      });
    }
  };

  if (!book || chapters.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-xs opacity-70">
        <BookOpen className="w-8 h-8 mb-2 opacity-50" />
        <p className="font-editorial text-base font-bold">No Written Chapters Available</p>
        <p className="mt-1">This book does not have published written chapters yet.</p>
      </div>
    );
  }

  // Font styling class
  const fontClass =
    font === "serif"
      ? "font-serif"
      : font === "sans"
      ? "font-sans"
      : font === "mono"
      ? "font-mono"
      : "font-serif";

  // Reading time estimate
  const wordCount = (currentChapter?.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className={`flex-1 overflow-y-auto px-4 sm:px-8 pt-6 sm:pt-10 pb-36 sm:pb-16 transition-colors duration-200 select-text ${fontClass}`}
    >
      <div className="w-full max-w-3xl lg:max-w-4xl mx-auto space-y-8">
        {/* Chapter Header */}
        <header className="border-b border-current/15 pb-6 space-y-3">
          <div className="flex items-center justify-between text-xs opacity-60 uppercase tracking-widest font-sans font-bold">
            <span className="flex items-center gap-1.5">
              <span>Chapter {currentChapterIndex + 1} of {chapters.length}</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                <span>~{readingTime} min</span>
              </span>
            </span>

            <button
              onClick={() => toggleBookmark?.()}
              className={`p-1.5 rounded-lg border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-sans font-bold ${
                isCurrentBookmarked ? "text-[var(--primary)] border-[var(--primary)]" : ""
              }`}
              title={isCurrentBookmarked ? "Remove Bookmark" : "Bookmark this chapter"}
            >
              <BookmarkIcon className={`w-3.5 h-3.5 ${isCurrentBookmarked ? "fill-current" : ""}`} />
              <span>{isCurrentBookmarked ? "Saved" : "Bookmark"}</span>
            </button>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
          </h1>

          {currentChapter?.subtitle && (
            <div className="text-base sm:text-lg italic opacity-75 font-serif pt-1">
              {currentChapter.subtitle}
            </div>
          )}
        </header>

        {/* Content Body */}
        {isChapterLocked ? (
          <div className="p-8 sm:p-10 rounded-3xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-6 text-center my-8 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--primary)] mx-auto flex items-center justify-center font-bold">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h2 className="font-editorial text-2xl font-bold">
                Sample Preview Limit Reached
              </h2>
              <p className="text-xs opacity-75 max-w-md mx-auto font-sans leading-relaxed">
                You have reached the end of the free preview for <strong className="font-serif">"{book.title}"</strong>. Unlock the complete digital edition to continue reading remaining chapters.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 font-sans">
              <button
                onClick={onUnlockRequest}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  Unlock Full Book {(book.price ?? 0) > 0 ? `(₹${book.price})` : ""}
                </span>
              </button>

              <button
                onClick={handlePrev}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Free Chapters
              </button>
            </div>
          </div>
        ) : (
          <article
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: lineHeight,
              textAlign: textAlign,
            }}
            className="prose-reading space-y-6 leading-relaxed selection:bg-[var(--accent-light)] selection:text-[var(--primary)]"
            dangerouslySetInnerHTML={{
              __html:
                currentChapter?.content ||
                `<p class="italic opacity-60">This chapter contains no text yet.</p>`,
            }}
          />
        )}

        {/* Bottom Chapter Navigation Bar */}
        <footer className="pt-8 border-t border-current/15 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 font-sans text-xs">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentChapterIndex === 0}
            className="flex-1 py-3.5 px-4 rounded-2xl border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-25 disabled:pointer-events-none transition-all flex items-center justify-start gap-2.5 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[50px]"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <div className="text-left min-w-0">
              <div className="text-[10px] opacity-60 uppercase font-bold">Previous</div>
              <div className="font-bold truncate max-w-[200px]">
                {currentChapterIndex > 0
                  ? chapters[currentChapterIndex - 1]?.title
                  : "Beginning of Book"}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={onOpenToc}
            className="py-3.5 px-5 rounded-2xl border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-bold flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[50px]"
          >
            <List className="w-4 h-4" />
            <span>Contents</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-3.5 px-4 rounded-2xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all shadow-md flex items-center justify-end gap-2.5 cursor-pointer touch-manipulation active:scale-[0.98] min-h-[50px]"
          >
            <div className="text-right min-w-0">
              <div className="text-[10px] text-white/75 uppercase font-bold">
                {currentChapterIndex === chapters.length - 1 ? "Finish Read" : "Next"}
              </div>
              <div className="font-bold truncate max-w-[200px]">
                {currentChapterIndex === chapters.length - 1
                  ? "Mark Completed"
                  : chapters[currentChapterIndex + 1]?.title}
              </div>
            </div>
            {currentChapterIndex === chapters.length - 1 ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-300" />
            ) : (
              <ChevronRight className="w-4 h-4 shrink-0" />
            )}
          </button>
        </footer>
      </div>

      {/* Text Highlight Floating Toolbar */}
      {selectionPopup && (
        <HighlightPopup
          position={selectionPopup.position}
          selectedText={selectionPopup.selectedText}
          pageNumber={selectionPopup.pageNumber}
          onClose={() => setSelectionPopup(null)}
        />
      )}
    </div>
  );
}
