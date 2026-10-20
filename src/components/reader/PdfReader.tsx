"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useReader } from "@/context/ReaderContext";
import { PdfPage } from "./PdfPage";
import { HighlightPopup } from "./HighlightPopup";
import { getPdfDocument } from "@/lib/pdf/pdfjs";
import { Highlight } from "@/lib/types";
import Link from "next/link";
import {
  Lock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  Hand,
  Highlighter,
  ZoomIn,
  ZoomOut,
  Copy,
  Trash2,
  X,
  Check,
  FileText,
} from "lucide-react";

interface PdfReaderProps {
  onUnlockRequest?: () => void;
  onOpenToc?: () => void;
}

export function PdfReader({ onUnlockRequest, onOpenToc }: PdfReaderProps) {
  const {
    book,
    currentPage,
    totalPages,
    setTotalPages,
    goToPage,
    hasFullAccess,
    previewLimit,
    watermarkText,
    zoom,
    setZoom,
    fitMode,
    isPanMode,
    setIsPanMode,
    removeHighlight,
  } = useReader();

  const [loadingDoc, setLoadingDoc] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(900);
  const [containerHeight, setContainerHeight] = useState<number>(800);

  // Text selection highlight popup state
  const [selectionPopup, setSelectionPopup] = useState<{
    position: { top: number; left: number };
    selectedText: string;
    pageNumber: number;
  } | null>(null);

  // Active clicked existing highlight details popup
  const [activeHighlightDetail, setActiveHighlightDetail] = useState<{
    highlight: Highlight;
    position: { top: number; left: number };
  } | null>(null);

  const [copiedHighlight, setCopiedHighlight] = useState(false);

  // Smooth Pan & Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScrollRef = useRef(false);
  const isUserScrollingRef = useRef(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Monitor container dimensions for responsive canvas sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setContainerWidth(el.clientWidth || window.innerWidth);
      setContainerHeight(el.clientHeight || window.innerHeight);
    };

    updateSize();
    const ro = new ResizeObserver(() => updateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch document total pages & load document
  useEffect(() => {
    if (!book?.id) return;

    if (!book.fileUrl && !(book as any).filePath) {
      setLoadError("Manuscript file has not been configured on this book record.");
      setLoadingDoc(false);
      return;
    }

    setLoadingDoc(true);
    setLoadError(null);
    getPdfDocument(book.id)
      .then((pdf) => {
        setTotalPages(pdf.numPages);
        setLoadingDoc(false);
      })
      .catch((err) => {
        console.error("PDF load error:", err);
        setLoadError(err.message || "Unable to stream PDF manuscript.");
        setLoadingDoc(false);
      });
  }, [book?.id, book?.fileUrl, setTotalPages]);

  // Smooth vertical scroll to target page (programmatic: toolbar, TOC, bookmarks)
  const scrollToPage = useCallback(
    (targetPage: number, smooth: boolean = true) => {
      const clamped = Math.max(1, Math.min(targetPage, totalPages));
      goToPage?.(clamped);

      const targetEl = document.getElementById(`pdf-page-${clamped}`);
      if (targetEl && containerRef.current) {
        isProgrammaticScrollRef.current = true;
        isUserScrollingRef.current = false;
        targetEl.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "start",
        });
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 400);
      }
    },
    [totalPages, goToPage]
  );

  // Scroll to active page only when triggered from outside (TOC/Toolbar), NOT when user is actively scrolling
  useEffect(() => {
    if (isProgrammaticScrollRef.current || isDraggingRef.current || isUserScrollingRef.current) return;
    const targetEl = document.getElementById(`pdf-page-${currentPage}`);
    if (targetEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      if (elRect.bottom < containerRect.top || elRect.top > containerRect.bottom) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [currentPage]);

  // Handle user scrolling container to flag manual scroll activity
  const handleContainerScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    if (userScrollTimeoutRef.current) {
      clearTimeout(userScrollTimeoutRef.current);
    }
    userScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 350);
  }, []);

  // IntersectionObserver to sync active page number during vertical scroll
  useEffect(() => {
    if (loadingDoc || loadError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScrollRef.current || isDraggingRef.current) return;

        let bestEntry: IntersectionObserverEntry | null = null;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (!bestEntry || entry.intersectionRatio > bestEntry.intersectionRatio) {
              bestEntry = entry;
            }
          }
        }

        if (bestEntry?.target?.id) {
          const match = bestEntry.target.id.match(/^pdf-page-(\d+)$/);
          if (match) {
            const pageNum = parseInt(match[1], 10);
            if (pageNum && pageNum !== currentPage) {
              isUserScrollingRef.current = true;
              goToPage?.(pageNum);
            }
          }
        }
      },
      {
        root: containerRef.current,
        threshold: [0.1, 0.4, 0.7],
      }
    );

    observerRef.current = observer;

    const pageElements = containerRef.current?.querySelectorAll("[data-pdf-page-wrapper]");
    pageElements?.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [loadingDoc, loadError, totalPages, currentPage, goToPage]);

  // Keyboard navigation & space pan activation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === "Space" && !e.repeat) {
        setIsSpacePanning(true);
      } else if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        scrollToPage(currentPage + 1, true);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToPage(currentPage - 1, true);
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToPage(1, true);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToPage(totalPages, true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [currentPage, totalPages, scrollToPage]);

  // Ctrl + Wheel / Trackpad pinch to Zoom smoothly
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom((z) => Math.min(3.0, Math.max(0.7, +(z + delta).toFixed(2))));
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [setZoom]);

  // Compute responsive page width with TRUE zoom scaling across screen sizes
  const pageRenderWidth = useMemo(() => {
    const available = containerWidth > 0 ? containerWidth : 900;
    let baseWidth = 850;

    if (available < 640) {
      baseWidth = available;
    } else if (available < 1024) {
      baseWidth = Math.min(available - 24, 850);
    } else if (fitMode === "width") {
      // Natural comfortable reading width that fills screen in width mode
      baseWidth = Math.max(available - 48, 600);
    } else {
      baseWidth = Math.min(available - 48, 760);
    }

    return Math.round(baseWidth * zoom);
  }, [containerWidth, fitMode, zoom]);

  const pageRenderHeight = useMemo(() => {
    const availableH = containerHeight > 0 ? containerHeight : 800;
    if (fitMode === "page") {
      return Math.round(Math.max(availableH - 80, 400) * zoom);
    }
    return undefined;
  }, [containerHeight, fitMode, zoom]);

  // Active render window with hysteresis to eliminate canvas remount thrashing on scroll
  const [renderedPages, setRenderedPages] = useState<Set<number>>(() => new Set([1, 2, 3]));

  useEffect(() => {
    setRenderedPages((prev) => {
      const next = new Set<number>();
      const minWindow = Math.max(1, currentPage - 2);
      const maxWindow = Math.min(totalPages, currentPage + 2);
      for (let i = minWindow; i <= maxWindow; i++) {
        next.add(i);
      }
      // Retain already-rendered pages within a comfortable radius (+/- 4) to prevent thrashing
      for (const p of prev) {
        if (Math.abs(p - currentPage) <= 4 && p <= totalPages) {
          next.add(p);
        }
      }
      return next;
    });
  }, [currentPage, totalPages]);

  // Render all pages in continuous vertical scroll mode
  const pageList = useMemo(() => {
    const arr: number[] = [];
    const limit = !hasFullAccess && previewLimit ? Math.min(previewLimit, totalPages) : totalPages;
    for (let i = 1; i <= limit; i++) {
      arr.push(i);
    }
    return arr;
  }, [totalPages, hasFullAccess, previewLimit]);

  // ==========================================
  // BULLETPROOF PAN & DRAG (MOVEABLE PAGE) LOGIC
  // ==========================================
  const startDragging = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);

    dragStartRef.current = {
      x: clientX,
      y: clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !dragStartRef.current || !containerRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      containerRef.current.scrollLeft = dragStartRef.current.scrollLeft - dx;
      containerRef.current.scrollTop = dragStartRef.current.scrollTop - dy;
    };

    const handleWindowMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };

    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 && e.button !== 1) return;

    // Middle click ALWAYS pans
    if (e.button === 1) {
      e.preventDefault();
      startDragging(e.clientX, e.clientY);
      return;
    }

    // If Hand Tool is active OR Space is held: ALWAYS PAN
    if (isPanMode || isSpacePanning) {
      e.preventDefault();
      startDragging(e.clientX, e.clientY);
      return;
    }

    // In Select Text mode:
    // If clicking outside the actual page canvas (e.g. background padding/margins):
    const target = e.target as HTMLElement;
    const isPageContent = !!target.closest("[data-pdf-page-wrapper]");
    if (!isPageContent && !target.closest("button") && !target.closest("#highlight-detail-card")) {
      startDragging(e.clientX, e.clientY);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("#highlight-detail-card") || target.closest("a")) {
      return;
    }

    if (e.touches.length === 1 && (isPanMode || isSpacePanning)) {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const startScrollLeft = containerRef.current?.scrollLeft || 0;
      const startScrollTop = containerRef.current?.scrollTop || 0;

      const handleTouchMove = (tm: TouchEvent) => {
        if (!containerRef.current || tm.touches.length !== 1) return;
        const t = tm.touches[0];
        containerRef.current.scrollLeft = startScrollLeft - (t.clientX - startX);
        containerRef.current.scrollTop = startScrollTop - (t.clientY - startY);
      };

      const handleTouchEnd = () => {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };

      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
    }
  };

  // ==========================================
  // TEXT SELECTION & HIGHLIGHT POPUP
  // ==========================================
  const handleSelectionCheck = useCallback(() => {
    if (isPanMode || isDraggingRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || text.length < 1) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Identify which page was selected
    const pageEl = (range.startContainer.parentElement?.closest("[data-page-number]") ||
      range.endContainer.parentElement?.closest("[data-page-number]")) as HTMLElement;

    const pageNum = pageEl
      ? parseInt(pageEl.dataset.pageNumber || `${currentPage}`, 10)
      : currentPage;

    setSelectionPopup({
      position: {
        top: Math.max(20, rect.top),
        left: rect.left + rect.width / 2,
      },
      selectedText: text,
      pageNumber: pageNum,
    });
  }, [isPanMode, currentPage]);

  // Listen globally on mouseup so selection is ALWAYS detected reliably
  useEffect(() => {
    const onGlobalMouseUp = () => {
      setTimeout(handleSelectionCheck, 30);
    };

    document.addEventListener("mouseup", onGlobalMouseUp);
    return () => document.removeEventListener("mouseup", onGlobalMouseUp);
  }, [handleSelectionCheck]);

  const handleHighlightClick = useCallback(
    (highlight: Highlight, position: { top: number; left: number }) => {
      setActiveHighlightDetail({
        highlight,
        position,
      });
    },
    []
  );

  return (
    <div
      className="flex-1 flex flex-col h-full w-full bg-[var(--background)] overflow-hidden relative"
      onMouseDown={(e) => {
        const target = e.target as HTMLElement;
        if (!target.closest(".readora-pdf-mark") && !target.closest("#highlight-detail-card")) {
          setActiveHighlightDetail(null);
        }
      }}
    >
      {/* Main Specialized Reading Canvas - Supports Natural Horizontal & Vertical Pan */}
      <div
        ref={containerRef}
        onScroll={handleContainerScroll}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`flex-1 overflow-auto p-0 sm:p-4 md:p-6 flex flex-col relative overscroll-contain transition-colors ${
          isPanMode || isSpacePanning || isDragging
            ? isDragging
              ? "cursor-grabbing select-none"
              : "cursor-grab select-none"
            : "cursor-default"
        }`}
        tabIndex={0}
      >
        {loadingDoc ? (
          <div className="m-auto text-center text-xs text-[var(--muted)] space-y-3 p-8">
            <RefreshCw className="w-7 h-7 animate-spin text-[var(--primary)] mx-auto opacity-80" />
            <p className="font-editorial text-base text-[var(--foreground)] font-bold">
              Preparing Manuscript
            </p>
            <p className="text-[11px] opacity-70">Streaming native document pages...</p>
          </div>
        ) : loadError ? (
          <div className="m-auto max-w-md w-full p-6 sm:p-8 rounded-none bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center font-bold">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--foreground)]">
                Unable to Open Manuscript
              </h2>
              <p className="text-xs text-[var(--muted)] leading-relaxed">{loadError}</p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => {
                  setLoadError(null);
                  setLoadingDoc(true);
                  if (book?.id) {
                    getPdfDocument(book.id)
                      .then((pdf) => {
                        setTotalPages(pdf.numPages);
                        setLoadingDoc(false);
                      })
                      .catch((err) => {
                        setLoadError(err.message || "Unable to stream PDF manuscript.");
                        setLoadingDoc(false);
                      });
                  }
                }}
                className="px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
              >
                Retry
              </button>
              <Link
                href="/library"
                className="px-5 py-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--background)] text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-center"
              >
                Return to Library
              </Link>
            </div>
          </div>
        ) : (
          /* Pure Document Stream: Centered when smaller, naturally left-anchored when wider */
          <div
            className="flex flex-col items-center gap-3 sm:gap-6 pb-40 sm:pb-28 mx-auto w-max min-w-full transition-all duration-75"
            style={{
              width: `${Math.round(pageRenderWidth)}px`,
            }}
          >
            {pageList.map((pgNum) => {
              const isRendered = renderedPages.has(pgNum);

              return (
                <div
                  key={pgNum}
                  data-pdf-page-wrapper="true"
                  id={`pdf-page-${pgNum}`}
                  className="w-full relative flex flex-col items-center"
                >
                  {/* Clean Page Frame with Shadow and Exact Dimensions */}
                  <div className="w-full bg-white dark:bg-[#161719] rounded-none border-none shadow-md sm:shadow-lg dark:shadow-2xl dark:shadow-black/80 overflow-visible transition-none">
                    {isRendered ? (
                      <PdfPage
                        bookId={book!.id}
                        pageNumber={pgNum}
                        width={pageRenderWidth}
                        height={pageRenderHeight}
                        fitMode={fitMode}
                        scale={1.0}
                        hasFullAccess={hasFullAccess}
                        previewLimit={previewLimit || undefined}
                        watermark={watermarkText}
                        onUnlockRequest={onUnlockRequest}
                        onHighlightClick={handleHighlightClick}
                        className="rounded-none border-none"
                      />
                    ) : (
                      /* Aspect-Ratio Placeholder while scrolled away */
                      <div
                        className="w-full flex items-center justify-center bg-stone-100 dark:bg-stone-900/50 text-[var(--muted)] text-xs font-mono rounded-none border-none"
                        style={{
                          height: `${Math.round(pageRenderWidth * 1.35)}px`,
                        }}
                      >
                        <span className="opacity-40">Page {pgNum}</span>
                      </div>
                    )}
                  </div>

                  {/* Subtle Page Divider Indicator */}
                  <div className="mt-1.5 text-[10px] font-mono text-[var(--muted)] opacity-40 select-none">
                    Page {pgNum} of {totalPages}
                  </div>
                </div>
              );
            })}

            {/* In-Stream Paywall Card for Preview Mode */}
            {!hasFullAccess && previewLimit && previewLimit < totalPages && (
              <div className="w-full my-6 p-8 sm:p-12 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-[var(--coral)]/10 text-[var(--coral)] mx-auto flex items-center justify-center font-bold">
                  <Lock className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                    Free Preview Completed
                  </h3>
                  <p className="text-xs text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                    You have read all {previewLimit} preview pages of{" "}
                    <strong className="text-[var(--foreground)]">"{book?.title}"</strong>. Purchase
                    this edition to unlock the remaining {totalPages - previewLimit} pages.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={onUnlockRequest}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Unlock Full Book (₹{book?.price || 0})</span>
                  </button>

                  <button
                    onClick={() => scrollToPage(1, true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer"
                  >
                    Back to Beginning
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FLOATING ACTION TOOLBAR: ZOOM & MOVE / SELECT CONTROLS */}
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] shadow-xl p-1 sm:p-1.5 rounded-full text-xs text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Crystal Clear Segmented Mode Toggle */}
        <div className="flex items-center p-0.5 bg-[var(--bg-subtle)] dark:bg-neutral-800/80 rounded-full border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setIsPanMode(false)}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
              !isPanMode
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            title="Text Selection Mode: Drag over words to select, highlight, and add notes."
            aria-label="Select Text"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Select Text</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPanMode(true)}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
              isPanMode
                ? "bg-[var(--primary)] text-white shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            title="Move Page Mode: Click and drag anywhere to pan/move the document."
            aria-label="Move Page"
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Move Page</span>
          </button>
        </div>

        <div className="h-4 w-[1px] bg-[var(--border)]" />

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
          disabled={zoom <= 0.7}
          className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-subtle)] disabled:opacity-30 cursor-pointer touch-manipulation"
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Value / Reset to 100% */}
        <button
          type="button"
          onClick={() => setZoom(1.0)}
          className="font-mono text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-1 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--foreground)] cursor-pointer touch-manipulation"
          title="Reset Zoom to 100%"
          aria-label="Reset Zoom"
        >
          {Math.round(zoom * 100)}%
        </button>

        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.0, +(z + 0.15).toFixed(2)))}
          disabled={zoom >= 3.0}
          className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-subtle)] disabled:opacity-30 cursor-pointer touch-manipulation"
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Scroll-to-Top Action */}
      <button
        type="button"
        onClick={() => scrollToPage(1, true)}
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-6 sm:right-6 p-2 sm:p-2.5 rounded-full bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] shadow-lg hover:shadow-xl transition-all cursor-pointer z-30 group touch-manipulation"
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* TEXT SELECTION HIGHLIGHT POPUP */}
      {selectionPopup && (
        <HighlightPopup
          position={selectionPopup.position}
          selectedText={selectionPopup.selectedText}
          pageNumber={selectionPopup.pageNumber}
          onClose={() => setSelectionPopup(null)}
        />
      )}

      {/* CLICKED EXISTING HIGHLIGHT DETAIL MODAL / POPOVER */}
      {activeHighlightDetail && (
        <div
          id="highlight-detail-card"
          style={{
            top: `${Math.max(16, activeHighlightDetail.position.top - 70)}px`,
            left: `${Math.max(16, Math.min(window.innerWidth - 280, activeHighlightDetail.position.left))}px`,
          }}
          className="fixed z-50 transform -translate-x-1/2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md space-y-2 text-xs"
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border)]">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  activeHighlightDetail.highlight.color === "yellow"
                    ? "bg-amber-400"
                    : activeHighlightDetail.highlight.color === "green"
                    ? "bg-emerald-400"
                    : activeHighlightDetail.highlight.color === "pink"
                    ? "bg-pink-400"
                    : activeHighlightDetail.highlight.color === "coral"
                    ? "bg-rose-400"
                    : activeHighlightDetail.highlight.color === "blue"
                    ? "bg-sky-400"
                    : "bg-purple-400"
                }`}
              />
              <span className="font-semibold text-[11px] text-[var(--foreground)]">
                Page {activeHighlightDetail.highlight.page} Highlight
              </span>
            </div>
            <button
              onClick={() => setActiveHighlightDetail(null)}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs italic text-[var(--foreground)] bg-[var(--bg-subtle)] p-2 rounded-lg border border-[var(--border)] line-clamp-3">
            "{activeHighlightDetail.highlight.selectedText}"
          </p>

          {activeHighlightDetail.highlight.note && (
            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 text-[var(--foreground)] text-[11px]">
              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold block text-[10px] text-amber-600 dark:text-amber-400">
                  Note
                </span>
                <span className="leading-relaxed">{activeHighlightDetail.highlight.note}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => {
                removeHighlight(activeHighlightDetail.highlight.id);
                setActiveHighlightDetail(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors text-[11px] font-semibold cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(activeHighlightDetail.highlight.selectedText);
                setCopiedHighlight(true);
                setTimeout(() => setCopiedHighlight(false), 800);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors text-[11px] font-semibold cursor-pointer shadow-xs"
            >
              {copiedHighlight ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
              <span>{copiedHighlight ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
