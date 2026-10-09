"use client";

import React, { forwardRef } from "react";
import { PdfPage } from "./PdfPage";
import { PageData } from "@/lib/pagination";
import { Lock, Sparkles } from "lucide-react";

interface BookPageProps {
  bookId: string;
  pageNumber: number;
  totalPages: number;
  bookTitle: string;
  author?: string;
  isPdfBook?: boolean;
  pageData?: PageData;
  isCover?: boolean;
  isBackCover?: boolean;
  width?: number;
  height?: number;
  scale?: number;
  watermark?: string | null;
  hasFullAccess?: boolean;
  previewLimit?: number;
  price?: number;
  currency?: string;
  theme?: "paper" | "warm" | "sepia" | "dark" | "midnight";
  font?: "serif" | "sans" | "readable" | "mono";
  fontSize?: number;
  lineHeight?: number;
  textAlign?: "left" | "justify";
  isActiveWindow?: boolean;
  onPageRendered?: (pageNum: number, totalPages: number) => void;
  onUnlockRequest?: () => void;
  className?: string;
}

export const BookPage = forwardRef<HTMLDivElement, BookPageProps>(function BookPage(
  {
    bookId,
    pageNumber,
    totalPages,
    bookTitle,
    author,
    isPdfBook = true,
    pageData,
    isCover = false,
    isBackCover = false,
    width,
    height,
    scale = 1.0,
    watermark,
    hasFullAccess = true,
    previewLimit = 10,
    price,
    currency = "INR",
    theme = "paper",
    font = "serif",
    fontSize = 16,
    lineHeight = 1.75,
    textAlign = "left",
    isActiveWindow = true,
    onPageRendered,
    onUnlockRequest,
    className = "",
  },
  ref
) {
  // Theme backgrounds for the physical page leaf
  const themeClasses = {
    paper: "bg-[#FFFFFF] text-[#1E1E24] border-[#E8E4DB]",
    warm: "bg-[#FDFBF7] text-[#2C2724] border-[#EADFCB]",
    sepia: "bg-[#F4ECD8] text-[#3D2E1E] border-[#E2D5BE]",
    dark: "bg-[#1E1C22] text-[#E0DED9] border-[#2C2933]",
    midnight: "bg-[#0F1117] text-[#D8DEE9] border-[#1E2330]",
  }[theme];

  const fontClasses = {
    serif: "font-serif",
    sans: "font-sans",
    readable: "font-editorial",
    mono: "font-mono",
  }[font] || "font-serif";

  const isLocked = !hasFullAccess && previewLimit ? pageNumber > previewLimit : false;

  // Responsive typography: On compact/mobile screens (< 420px), slightly adjust
  // font size and line height so text never clips or overflows the physical page leaf.
  const isCompact = width ? width < 420 : true;
  const effectiveFontSize = isCompact ? Math.max(12.5, Math.min(fontSize, 15)) : fontSize;
  const effectiveLineHeight = isCompact ? Math.min(lineHeight, 1.62) : lineHeight;

  return (
    <div
      ref={ref}
      data-density={isCover || isBackCover ? "hard" : "soft"}
      className={`page book-page-leaf flex flex-col ${
        isPdfBook ? "items-center justify-center" : "justify-between"
      } overflow-hidden relative shadow-sm ${themeClasses} ${
        isCover ? "book-page-cover" : isBackCover ? "book-page-back-cover" : ""
      } ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
      }}
    >
      {/* Subtle Inner Paper Texture & Spine Shadow */}
      <div className="absolute inset-0 pointer-events-none book-leaf-spine-shadow z-10" />

      {/* RENDER CONTENT: VISUAL PDF CANVAS OR EDITORIAL TEXT FORMAT */}
      {isPdfBook ? (
        <div className="w-full h-full flex items-center justify-center relative overflow-hidden z-0">
          <PdfPage
            bookId={bookId}
            pageNumber={pageNumber}
            width={width}
            height={height}
            scale={scale}
            watermark={watermark}
            hasFullAccess={hasFullAccess}
            previewLimit={previewLimit}
            price={price}
            currency={currency}
            isActiveWindow={isActiveWindow}
            onPageRendered={onPageRendered}
            onUnlockRequest={onUnlockRequest}
          />
        </div>
      ) : (
        <div className="flex-1 w-full h-full p-2.5 xs:p-3.5 sm:p-5 md:p-6 flex flex-col justify-between relative overflow-hidden z-0 select-text">
          {/* LOCKED PREVIEW STATE */}
          {isLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--coral)]/15 text-[var(--coral)] flex items-center justify-center mb-2 sm:mb-3 shadow-xs">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] bg-[var(--coral)]/10 px-2.5 py-0.5 sm:py-1 rounded-full mb-1.5 sm:mb-2">
                Preview Concluded ({previewLimit} Pages)
              </span>
              <h4 className="font-editorial text-base sm:text-lg font-bold text-[var(--foreground)] mb-1">
                Page {pageNumber} is Locked
              </h4>
              <p className="text-[11px] sm:text-xs text-[var(--muted)] max-w-xs mb-3 sm:mb-4 leading-relaxed">
                Unlock the complete edition of &ldquo;{bookTitle}&rdquo; to access all {totalPages} pages.
              </p>
              {onUnlockRequest && (
                <button
                  onClick={onUnlockRequest}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Unlock Full Book {price ? `• ₹${price}` : ""}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Running Header */}
              <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-black/8 dark:border-white/8 text-[9px] sm:text-[11px] font-mono opacity-50 uppercase tracking-widest shrink-0 select-none">
                <span className="truncate max-w-[55%]">{bookTitle}</span>
                <span className="truncate max-w-[45%] text-right">{pageData?.chapterTitle || `Page ${pageNumber}`}</span>
              </div>

              {/* Editorial Page Content */}
              <div className="my-1 sm:my-2 flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-0.5 scrollbar-none select-text break-words">
                {pageNumber === 1 && (
                  <div className="mb-1.5 sm:mb-3 text-center">
                    <span className="text-[8.5px] sm:text-[10px] tracking-widest font-mono uppercase opacity-50 block mb-0.5">
                      Chapter One
                    </span>
                    <h2 className="font-editorial text-base sm:text-xl font-bold tracking-tight">
                      {pageData?.chapterTitle || bookTitle}
                    </h2>
                    <div className="w-6 sm:w-8 h-0.5 bg-[var(--primary)]/30 mx-auto mt-1 sm:mt-1.5" />
                  </div>
                )}

                <article
                  className={`${fontClasses} leading-relaxed transition-all break-words hyphens-auto`}
                  style={{
                    fontSize: `${effectiveFontSize}px`,
                    lineHeight: effectiveLineHeight,
                    textAlign: textAlign,
                  }}
                >
                  {pageData?.paragraphs && pageData.paragraphs.length > 0 ? (
                    pageData.paragraphs.map((para, idx) => (
                      <p
                        key={idx}
                        className={`mb-1.5 sm:mb-2.5 indent-3 sm:indent-6 break-words ${
                          pageNumber === 1 && idx === 0
                            ? "first-letter:font-editorial first-letter:text-3xl sm:first-letter:text-5xl first-letter:float-left first-letter:mr-2 first-letter:font-bold first-letter:leading-none first-letter:text-[var(--primary)]"
                            : ""
                        }`}
                      >
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="opacity-80 italic text-sm">Continuation of text...</p>
                  )}
                </article>
              </div>

              {/* Running Footer & Watermark */}
              <div className="pt-1 sm:pt-2 border-t border-black/8 dark:border-white/8 flex flex-col gap-0.5 shrink-0 select-none">
                <div className="flex items-center justify-between text-[9px] sm:text-[11px] font-mono opacity-45">
                  <span className="truncate max-w-[65%]">{author || "READORA Edition"}</span>
                  <span className="tabular-nums font-medium">{pageNumber}</span>
                </div>
                {watermark && !isLocked && (
                  <div className="text-center opacity-25 text-[8px] sm:text-[9px] font-mono truncate pointer-events-none tracking-tight">
                    {watermark}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* DISCREET PAGE NUMBER & WATERMARK (Bottom outer area for PDF) */}
      {isPdfBook && !isCover && !isBackCover && (
        <div className="absolute bottom-2 inset-x-3 pointer-events-none z-20 flex items-center justify-between text-[9px] font-mono select-none">
          {watermark && !isLocked ? (
            <span className="opacity-25 truncate max-w-[70%]">{watermark}</span>
          ) : (
            <span />
          )}
          {pageNumber > 0 && (
            <span className="opacity-35 tracking-wider ml-auto tabular-nums">{pageNumber}</span>
          )}
        </div>
      )}
    </div>
  );
});

BookPage.displayName = "BookPage";
