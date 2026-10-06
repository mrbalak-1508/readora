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

  return (
    <div
      ref={ref}
      data-density={isCover || isBackCover ? "hard" : "soft"}
      className={`page book-page-leaf flex flex-col justify-between overflow-hidden relative shadow-sm ${themeClasses} ${
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
        <div className="flex-1 w-full h-full flex items-center justify-center relative overflow-hidden z-0">
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
        <div className="flex-1 w-full h-full p-3 sm:p-5 md:p-6 flex flex-col justify-between relative overflow-hidden z-0 select-text">
          {/* LOCKED PREVIEW STATE */}
          {isLocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--coral)]/15 text-[var(--coral)] flex items-center justify-center mb-3 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--coral)] bg-[var(--coral)]/10 px-3 py-1 rounded-full mb-2">
                Preview Concluded ({previewLimit} Pages)
              </span>
              <h4 className="font-editorial text-lg font-bold text-[var(--foreground)] mb-1.5">
                Page {pageNumber} is Locked
              </h4>
              <p className="text-xs text-[var(--muted)] max-w-xs mb-4 leading-relaxed">
                Unlock the complete edition of &ldquo;{bookTitle}&rdquo; to access all {totalPages} pages.
              </p>
              {onUnlockRequest && (
                <button
                  onClick={onUnlockRequest}
                  className="px-5 py-2 rounded-full bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Unlock Full Book {price ? `• ₹${price}` : ""}</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Running Header */}
              <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-black/8 dark:border-white/8 text-[10px] sm:text-[11px] font-mono opacity-50 uppercase tracking-widest shrink-0 select-none">
                <span className="truncate max-w-[60%]">{bookTitle}</span>
                <span className="truncate max-w-[40%] text-right">{pageData?.chapterTitle || `Page ${pageNumber}`}</span>
              </div>

              {/* Editorial Page Content */}
              <div className="my-1.5 sm:my-2 flex-1 min-h-0 overflow-y-auto pr-0.5 scrollbar-thin">
                {pageNumber === 1 && (
                  <div className="mb-2.5 sm:mb-3 text-center">
                    <span className="text-[9px] sm:text-[10px] tracking-widest font-mono uppercase opacity-50 block mb-0.5">
                      Chapter One
                    </span>
                    <h2 className="font-editorial text-lg sm:text-xl font-bold tracking-tight">
                      {pageData?.chapterTitle || bookTitle}
                    </h2>
                    <div className="w-8 h-0.5 bg-[var(--primary)]/30 mx-auto mt-1.5" />
                  </div>
                )}

                <article
                  className={`${fontClasses} leading-relaxed transition-all`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: lineHeight,
                    textAlign: textAlign,
                  }}
                >
                  {pageData?.paragraphs && pageData.paragraphs.length > 0 ? (
                    pageData.paragraphs.map((para, idx) => (
                      <p
                        key={idx}
                        className={`mb-4 indent-4 sm:indent-6 ${
                          pageNumber === 1 && idx === 0
                            ? "first-letter:font-editorial first-letter:text-4xl sm:first-letter:text-5xl first-letter:float-left first-letter:mr-2.5 first-letter:font-bold first-letter:leading-none first-letter:text-[var(--primary)]"
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

              {/* Running Footer */}
              <div className="pt-2 sm:pt-2.5 border-t border-black/8 dark:border-white/8 flex items-center justify-between text-[10px] sm:text-[11px] font-mono opacity-40 shrink-0 select-none">
                <span className="truncate">{author || "READORA Edition"}</span>
                <span>{pageNumber}</span>
              </div>
            </>
          )}

          {/* Watermark Overlay for Text Book */}
          {watermark && !isLocked && (
            <div className="absolute inset-x-2 bottom-2 pointer-events-none text-center opacity-20 text-[9px] font-mono select-none truncate">
              {watermark}
            </div>
          )}
        </div>
      )}

      {/* DISCREET PAGE NUMBER FOIL BADGE (Bottom outer corner for PDF) */}
      {isPdfBook && !isCover && !isBackCover && pageNumber > 0 && (
        <div className="absolute bottom-2 right-3 pointer-events-none z-20 text-[9px] font-mono opacity-35 tracking-wider select-none">
          {pageNumber}
        </div>
      )}
    </div>
  );
});

BookPage.displayName = "BookPage";
