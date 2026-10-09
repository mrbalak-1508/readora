"use client";

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import HTMLFlipBook, { IFlipBookMethods } from "react-pageflip";
import { BookPage } from "./BookPage";
import { useReaderDimensions } from "@/hooks/reader/useReaderDimensions";
import { soundManager } from "@/lib/sound";
import { PageData } from "@/lib/pagination";

export interface BookReaderHandle {
  flipNext: () => void;
  flipPrev: () => void;
  turnToPage: (pageNum: number) => void;
  getCurrentPage: () => number;
}

interface BookReaderProps {
  bookId: string;
  totalPages: number;
  bookTitle: string;
  author?: string;
  isPdfBook?: boolean;
  pagesData?: PageData[];
  initialPage?: number;
  hasFullAccess?: boolean;
  previewLimit?: number;
  price?: number;
  currency?: string;
  watermark?: string | null;
  theme?: "paper" | "warm" | "sepia" | "dark" | "midnight";
  font?: "serif" | "sans" | "readable" | "mono";
  fontSize?: number;
  lineHeight?: number;
  textAlign?: "left" | "justify";
  zoom?: number;
  soundEnabled?: boolean;
  spreadMode?: "dual" | "single";
  touchTurnEnabled?: boolean;
  onPageChange?: (pageNumber: number) => void;
  onUnlockRequest?: () => void;
}

export const BookReader = forwardRef<BookReaderHandle, BookReaderProps>(function BookReader(
  {
    bookId,
    totalPages,
    bookTitle,
    author,
    isPdfBook = true,
    pagesData,
    initialPage = 1,
    hasFullAccess = true,
    previewLimit = 10,
    price,
    currency = "INR",
    watermark,
    theme = "paper",
    font = "serif",
    fontSize = 16,
    lineHeight = 1.75,
    textAlign = "left",
    zoom = 1.0,
    soundEnabled = false,
    spreadMode = "dual",
    touchTurnEnabled = true,
    onPageChange,
    onUnlockRequest,
  },
  ref
) {
  const flipBookRef = useRef<IFlipBookMethods | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Dynamic responsive dimensions keeping PDF aspect ratio and spread mode
  const { pageWidth, pageHeight, isMobile } = useReaderDimensions(0.707, spreadMode);
  const isPortraitMode = isMobile || spreadMode === "single";

  // Prevent duplicate page turns from concurrent calls
  const isFlippingRef = useRef(false);

  // Pan / Drag State when zoomed in
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset pan when zoom returns to 1.0 or book changes
  useEffect(() => {
    if (zoom <= 1.0) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom, bookId]);

  // Max pan constraints based on current zoom level
  const totalDeckWidth = isPortraitMode ? pageWidth : pageWidth * 2;
  const maxPanX = Math.max(0, (totalDeckWidth * zoom - totalDeckWidth) / 2 + 80);
  const maxPanY = Math.max(0, (pageHeight * zoom - pageHeight) / 2 + 80);

  // Mouse pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1.0) return;
    if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || zoom <= 1.0) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
    setPan({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch pan event handlers (when zoomed in, pan instead of flip)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1.0 || e.touches.length !== 1) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    panStartRef.current = { ...pan };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || zoom <= 1.0 || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const newX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.x + dx));
    const newY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.y + dy));
    setPan({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Expose imperative methods to parent toolbar and navigation
  useImperativeHandle(
    ref,
    () => ({
      flipNext: () => {
        if (isFlippingRef.current) return;
        const step = isPortraitMode ? 1 : 2;
        const targetPage = Math.min(totalPages, currentPage + step);
        if (targetPage === currentPage) return;

        isFlippingRef.current = true;
        setTimeout(() => {
          isFlippingRef.current = false;
        }, 700);

        try {
          const pf = flipBookRef.current?.pageFlip();
          if (pf) {
            const currentZero = pf.getCurrentPageIndex();
            const targetZero = targetPage - 1;
            if (currentZero !== currentPage - 1) {
              pf.turnToPage(currentPage - 1);
            }
            pf.flipNext();
            // Guarantee reliable state update even if PageFlip animation skips onFlip
            setTimeout(() => {
              try {
                const afterZero = pf.getCurrentPageIndex();
                if (afterZero !== targetZero) {
                  pf.turnToPage(targetZero);
                  setCurrentPage(targetPage);
                  onPageChange?.(targetPage);
                }
              } catch {}
            }, 680);
            return;
          }
        } catch (err) {
          console.warn("flipNext error, using fallback:", err);
        }
        // Fallback if flipbook instance is unavailable
        if (soundEnabled) soundManager.playPageTurn();
        setCurrentPage(targetPage);
        onPageChange?.(targetPage);
      },
      flipPrev: () => {
        if (isFlippingRef.current) return;
        const step = isPortraitMode ? 1 : 2;
        const targetPage = Math.max(1, currentPage - step);
        if (targetPage === currentPage) return;

        isFlippingRef.current = true;
        setTimeout(() => {
          isFlippingRef.current = false;
        }, 700);

        try {
          const pf = flipBookRef.current?.pageFlip();
          if (pf) {
            const currentZero = pf.getCurrentPageIndex();
            const targetZero = targetPage - 1;
            if (currentZero !== currentPage - 1) {
              pf.turnToPage(currentPage - 1);
            }
            pf.flipPrev();
            // Guarantee reliable state update even if PageFlip animation skips onFlip
            setTimeout(() => {
              try {
                const afterZero = pf.getCurrentPageIndex();
                if (afterZero !== targetZero) {
                  pf.turnToPage(targetZero);
                  setCurrentPage(targetPage);
                  onPageChange?.(targetPage);
                }
              } catch {}
            }, 680);
            return;
          }
        } catch (err) {
          console.warn("flipPrev error, using fallback:", err);
        }
        // Fallback if flipbook instance is unavailable
        if (soundEnabled) soundManager.playPageTurn();
        setCurrentPage(targetPage);
        onPageChange?.(targetPage);
      },
      turnToPage: (targetPage: number) => {
        const clamped = Math.max(1, Math.min(totalPages, targetPage));
        const zeroIndex = clamped - 1;
        try {
          const pf = flipBookRef.current?.pageFlip();
          if (pf) {
            pf.turnToPage(zeroIndex);
          }
        } catch (err) {
          console.warn("turnToPage error, using fallback:", err);
        }
        if (soundEnabled) soundManager.playPageTurn();
        setCurrentPage(clamped);
        onPageChange?.(clamped);
      },
      getCurrentPage: () => currentPage,
    }),
    [currentPage, totalPages, isPortraitMode, soundEnabled, onPageChange]
  );

  // Sync external page changes (from TOC, Bookmarks, Search, Keyboard)
  useEffect(() => {
    if (initialPage && initialPage !== currentPage) {
      setCurrentPage(initialPage);
      const zeroIndex = Math.max(0, Math.min(totalPages - 1, initialPage - 1));
      try {
        const currentZero = flipBookRef.current?.pageFlip()?.getCurrentPageIndex();
        if (currentZero !== undefined && currentZero !== zeroIndex) {
          flipBookRef.current?.pageFlip()?.turnToPage(zeroIndex);
        }
      } catch {}
    }
  }, [initialPage, totalPages, currentPage]);

  const handleFlip = useCallback(
    (e: { data: number }) => {
      isFlippingRef.current = false;
      const newPage = e.data + 1;
      setCurrentPage(newPage);

      if (soundEnabled) {
        soundManager.playPageTurn();
      }

      if (onPageChange) {
        onPageChange(newPage);
      }
    },
    [soundEnabled, onPageChange]
  );

  const pageNumbers = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);

  return (
    <div
      className={`w-full h-full flex items-center justify-center relative overflow-hidden ${
        zoom > 1.0 ? "cursor-grab active:cursor-grabbing select-none" : ""
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Scaled & Pannable Book Container */}
      <div
        suppressHydrationWarning
        className="relative flex items-center justify-center will-change-transform"
        style={{
          width: `${totalDeckWidth}px`,
          height: `${pageHeight}px`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDraggingRef.current ? "none" : "transform 0.15s ease-out",
        }}
      >
        {/* Subtle center spine shadow in two-page desktop spread */}
        {!isPortraitMode && (
          <div
            className="book-spine pointer-events-none z-30"
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "4px",
              transform: "translateX(-50%)",
              boxShadow: "0 0 18px 3px rgba(0, 0, 0, 0.45)",
            }}
          />
        )}

        {/* Outer Edge Thickness Depth Effect */}
        <div
          className="absolute inset-0 pointer-events-none rounded-sm shadow-2xl -z-10"
          style={{
            boxShadow:
              theme === "dark" || theme === "midnight"
                ? "0 20px 45px -10px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.6)"
                : "0 22px 48px -12px rgba(45,30,20,0.35), 0 4px 12px rgba(0,0,0,0.15)",
          }}
        />

        {isMounted && pageNumbers.length > 0 ? (
          <HTMLFlipBook
            key={`flipbook-${isPortraitMode}-${hasFullAccess ? "unlocked" : "locked"}-${theme}`}
            ref={flipBookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={200}
            maxWidth={800}
            minHeight={280}
            maxHeight={1100}
            showCover={false}
            mobileScrollSupport={false}
            useMouseEvents={Boolean(touchTurnEnabled && zoom <= 1.0)}
            disableFlipByClick={true}
            drawShadow={true}
            flippingTime={650}
            usePortrait={isPortraitMode}
            startPage={Math.max(0, initialPage - 1)}
            onFlip={handleFlip}
            renderOnlyPageLengthChange={false}
            className="book-canvas-deck shadow-2xl rounded-sm"
            style={{ margin: "0 auto", display: "block" }}
          >
            {pageNumbers.map((pageNum) => {
              const isCover = pageNum === 1;
              const isBackCover = pageNum === totalPages && totalPages > 1;

              return (
                <BookPage
                  key={`page-${pageNum}`}
                  bookId={bookId}
                  pageNumber={pageNum}
                  totalPages={totalPages}
                  bookTitle={bookTitle}
                  author={author}
                  isPdfBook={isPdfBook}
                  pageData={pagesData?.[pageNum - 1]}
                  isCover={isCover}
                  isBackCover={isBackCover}
                  width={pageWidth}
                  height={pageHeight}
                  watermark={watermark}
                  hasFullAccess={hasFullAccess}
                  previewLimit={previewLimit}
                  price={price}
                  currency={currency}
                  theme={theme}
                  font={font}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  textAlign={textAlign}
                  onUnlockRequest={onUnlockRequest}
                />
              );
            })}
          </HTMLFlipBook>
        ) : (
          <div
            className="book-canvas-deck shadow-2xl rounded-sm bg-black/5 dark:bg-white/5 animate-pulse"
            style={{ width: `${totalDeckWidth}px`, height: `${pageHeight}px` }}
          />
        )}
      </div>
    </div>
  );
});

BookReader.displayName = "BookReader";
