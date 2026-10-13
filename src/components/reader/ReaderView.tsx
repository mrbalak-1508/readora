"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useReader } from "@/context/ReaderContext";
import { ReaderToolbar } from "./ReaderToolbar";
import { ReaderSettingsModal } from "./ReaderSettingsModal";
import { BookmarksSheet } from "./BookmarksSheet";
import { SearchInsideSheet } from "./SearchInsideSheet";
import { CompletionModal } from "./CompletionModal";
import { PreviewPaywallModal } from "./PreviewPaywallModal";
import { TableOfContentsSheet } from "./TableOfContentsSheet";
import { WrittenReader } from "./WrittenReader";
import { PdfReader } from "./PdfReader";
import { EpubReader } from "./EpubReader";

export function ReaderView() {
  const {
    book,
    theme,
    hasFullAccess,
    previewLimit,
    readingTimeSeconds,
    resetProgress,
  } = useReader();

  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);

  // Format detection
  const isPdfBook = useMemo(() => {
    if (!book) return false;
    const fmt = (book.format || "").toLowerCase();
    const mime = ((book as any).mimeType || "").toLowerCase();
    const name = (book.fileName || "").toLowerCase();
    const file = ((book as any).filePath || book.fileUrl || "").toLowerCase();
    return (
      fmt === "pdf" ||
      mime.includes("pdf") ||
      name.endsWith(".pdf") ||
      file.endsWith(".pdf")
    );
  }, [book]);

  const isEpubBook = useMemo(() => {
    if (!book) return false;
    const fmt = (book.format || "").toLowerCase();
    const mime = ((book as any).mimeType || "").toLowerCase();
    const name = (book.fileName || "").toLowerCase();
    const file = ((book as any).filePath || book.fileUrl || "").toLowerCase();
    return (
      fmt === "epub" ||
      mime.includes("epub") ||
      name.endsWith(".epub") ||
      file.endsWith(".epub")
    );
  }, [book]);

  const isWrittenBook = !isPdfBook && !isEpubBook;

  // DRM & Security enforcement
  const allowCopy = Boolean((book as any)?.allowCopy);
  const allowPrint = Boolean((book as any)?.allowPrint);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (!allowCopy) e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      if (!allowCopy) e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!allowPrint && (e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [allowCopy, allowPrint]);

  // Background Theme Styling
  const themeBgClasses = {
    paper: "bg-[#faf7f2] text-[#2c2925]",
    warm: "bg-[#fdfbf7] text-[#2c2523]",
    sepia: "bg-[#f4ecd8] text-[#433422]",
    dark: "bg-[#1c1d1f] text-[#d6d8da]",
    midnight: "bg-[#0d1117] text-[#c9d1d9]",
  }[theme] || "bg-[#faf7f2] text-[#2c2925]";

  return (
    <div
      className={`min-h-screen h-screen flex flex-col overflow-hidden transition-colors duration-300 ${themeBgClasses}`}
      onContextMenu={(e) => {
        if (!allowCopy) e.preventDefault();
      }}
    >
      {!allowPrint && (
        <style dangerouslySetInnerHTML={{ __html: "@media print { body { display: none !important; } }" }} />
      )}
      {/* Top Reader Header */}
      <div className="w-full shrink-0 z-30">
        <ReaderToolbar
          onOpenBookmarks={() => setIsBookmarksOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenToc={() => setIsTocOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onComplete={() => setIsCompletionOpen(true)}
          onUnlockBook={() => setIsPaywallOpen(true)}
          hasPdfFile={isPdfBook}
        />
      </div>

      {/* Main Specialized Reading Canvas */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {isPdfBook && (
          <PdfReader
            onUnlockRequest={() => setIsPaywallOpen(true)}
            onOpenToc={() => setIsTocOpen(true)}
          />
        )}

        {isEpubBook && (
          <EpubReader
            onUnlockRequest={() => setIsPaywallOpen(true)}
            onOpenToc={() => setIsTocOpen(true)}
          />
        )}

        {isWrittenBook && (
          <WrittenReader
            onUnlockRequest={() => setIsPaywallOpen(true)}
            onOpenToc={() => setIsTocOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Sheets & Modals */}
      <TableOfContentsSheet
        isOpen={isTocOpen}
        onClose={() => setIsTocOpen(false)}
      />

      <BookmarksSheet
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
      />

      <SearchInsideSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenBookmarks={() => setIsBookmarksOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {book && (
        <>
          <PreviewPaywallModal
            book={book}
            isOpen={isPaywallOpen}
            onClose={() => setIsPaywallOpen(false)}
            previewPages={previewLimit || 10}
          />

          <CompletionModal
            book={book}
            isOpen={isCompletionOpen && hasFullAccess}
            onClose={() => setIsCompletionOpen(false)}
            readingTimeSeconds={readingTimeSeconds}
            onReadAgain={resetProgress}
            hasFullAccess={hasFullAccess}
          />
        </>
      )}
    </div>
  );
}
