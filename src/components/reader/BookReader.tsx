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
    onPageChange,
    onUnlockRequest,
  },
  ref
) {
  const flipBookRef = useRef<IFlipBookMethods | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);

  // Dynamic responsive dimensions keeping PDF aspect ratio and spread mode
  const { pageWidth, pageHeight, isMobile } = useReaderDimensions(0.707, spreadMode);
  const isPortraitMode = isMobile || spreadMode === "single";

  // Expose imperative methods to parent toolbar and navigation
  useImperativeHandle(
    ref,
    () => ({
      flipNext: () => {
        try {
          flipBookRef.current?.pageFlip()?.flipNext();
        } catch {}
      },
      flipPrev: () => {
        try {
          flipBookRef.current?.pageFlip()?.flipPrev();
        } catch {}
      },
      turnToPage: (targetPage: number) => {
        try {
          const zeroIndex = Math.max(0, Math.min(totalPages - 1, targetPage - 1));
          flipBookRef.current?.pageFlip()?.turnToPage(zeroIndex);
          setCurrentPage(targetPage);
        } catch {}
      },
      getCurrentPage: () => currentPage,
    }),
    [currentPage, totalPages]
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

  // Sliding active window for pre-rendering nearby pages without blank delays
  const activeRadius = totalPages <= 32 ? totalPages : 8;
  const pageNumbers = Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1);

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        transform: zoom > 1 ? `scale(${zoom})` : undefined,
        transformOrigin: "center center",
        transition: "transform 0.2s ease-out",
      }}
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle center spine shadow in two-page desktop spread */}
        {!isPortraitMode && (
          <div
            className="book-spine pointer-events-none z-30"
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              bottom: 0,
              width: "3px",
              transform: "translateX(-50%)",
              boxShadow: "0 0 16px 2px rgba(0, 0, 0, 0.4)",
            }}
          />
        )}

        {pageNumbers.length > 0 && (
          <HTMLFlipBook
            key={`flipbook-${isPortraitMode}-${hasFullAccess ? "unlocked" : "locked"}-${theme}`}
            ref={flipBookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            minWidth={240}
            maxWidth={800}
            minHeight={340}
            maxHeight={1100}
            showCover={false}
            mobileScrollSupport={false}
            useMouseEvents={true}
            drawShadow={true}
            flippingTime={600}
            usePortrait={isPortraitMode}
            startPage={Math.max(0, initialPage - 1)}
            onFlip={handleFlip}
            renderOnlyPageLengthChange={false}
            className="book-canvas-deck shadow-2xl rounded-sm"
          >
            {pageNumbers.map((pageNum) => {
              const isCover = pageNum === 1;
              const isBackCover = pageNum === totalPages && totalPages > 1;
              const isActiveWindow = Math.abs(pageNum - currentPage) <= activeRadius;

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
                  isActiveWindow={isActiveWindow}
                  onUnlockRequest={onUnlockRequest}
                />
              );
            })}
          </HTMLFlipBook>
        )}
      </div>
    </div>
  );
});

BookReader.displayName = "BookReader";
