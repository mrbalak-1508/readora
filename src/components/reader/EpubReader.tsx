"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useReader } from "@/context/ReaderContext";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RefreshCw,
  AlertTriangle,
  Lock,
  Sparkles,
  Bookmark as BookmarkIcon,
} from "lucide-react";

interface EpubReaderProps {
  onUnlockRequest?: () => void;
  onOpenToc?: () => void;
}

export function EpubReader({ onUnlockRequest, onOpenToc }: EpubReaderProps) {
  const {
    book,
    currentPage,
    setTotalPages,
    goToPage,
    theme,
    font,
    fontSize,
    lineHeight,
    hasFullAccess,
    previewLimit,
    bookmarks,
    toggleBookmark,
  } = useReader();

  const containerRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<any>(null);
  const renditionRef = useRef<any>(null);
  const lastPageRef = useRef<number>(currentPage);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCfi, setCurrentCfi] = useState<string | null>(null);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize Epub.js renderer
  useEffect(() => {
    let isCancelled = false;

    async function initEpub() {
      if (!containerRef.current || !book?.id) return;
      setLoading(true);
      setError(null);

      try {
        const ePub = (await import("epubjs")).default;
        if (isCancelled) return;

        // Fetch the EPUB file as JSON Base64 or arraybuffer
        const epubUrl = `/api/files/books/${book.id}?stream=reader&format=base64&_t=${Date.now()}`;
        const res = await fetch(epubUrl, {
          headers: { Accept: "application/json", "X-Readora-Reader": "1" },
        });
        if (!res.ok) throw new Error("Could not load EPUB manuscript.");
        if (isCancelled) return;

        let buffer: ArrayBuffer;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const payload = await res.json();
          const binaryStr = atob(payload.data);
          const len = binaryStr.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          buffer = bytes.buffer;
        } else {
          buffer = await res.arrayBuffer();
        }
        if (isCancelled) return;

        const epubBook = ePub(buffer);
        epubBookRef.current = epubBook;

        const rendition = epubBook.renderTo(containerRef.current, {
          width: "100%",
          height: "100%",
          flow: "scrolled-doc",
          spread: "none",
          allowScriptedContent: false, // Security: Disable untrusted script execution
        });
        renditionRef.current = rendition;

        // Register themes
        rendition.themes.register("paper", {
          body: { background: "#faf7f2 !important", color: "#2c2925 !important" },
        });
        rendition.themes.register("sepia", {
          body: { background: "#f4ecd8 !important", color: "#433422 !important" },
        });
        rendition.themes.register("dark", {
          body: { background: "#1c1d1f !important", color: "#d6d8da !important" },
        });

        const activeTheme = theme === "dark" || theme === "midnight" ? "dark" : theme === "sepia" ? "sepia" : "paper";
        rendition.themes.select(activeTheme);
        rendition.themes.fontSize(`${fontSize}px`);

        // Relocation event listener
        rendition.on("relocated", (location: any) => {
          if (isCancelled) return;
          const cfi = location.start.cfi;
          setCurrentCfi(cfi);

          if (location.start.percentage !== undefined) {
            const pct = Math.round(location.start.percentage * 100);
            setProgressPercent(pct);

            const total = book?.pages || 50;
            const estimatedPage = Math.max(1, Math.min(total, Math.round((pct / 100) * total)));
            lastPageRef.current = estimatedPage;
            goToPage?.(estimatedPage);

            // Preview limitation check
            if (!hasFullAccess && previewLimit && pct > previewLimit * 2) {
              setIsLocked(true);
            }
          }
        });

        await rendition.display();

        // Extract TOC
        epubBook.loaded.navigation.then((nav: any) => {
          if (!isCancelled && nav?.toc) {
            // TOC is available
          }
        });

        setLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("EPUB render error:", err);
          setError(err.message || "Failed to render EPUB manuscript.");
          setLoading(false);
        }
      }
    }

    initEpub();

    return () => {
      isCancelled = true;
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch {}
      }
      if (epubBookRef.current) {
        try {
          epubBookRef.current.destroy();
        } catch {}
      }
    };
  }, [book?.id]);

  // Sync external page changes (from Toolbar < / >, input, Bookmarks, TOC)
  useEffect(() => {
    if (!renditionRef.current) return;
    if (currentPage > lastPageRef.current) {
      renditionRef.current.next();
      lastPageRef.current = currentPage;
    } else if (currentPage < lastPageRef.current) {
      renditionRef.current.prev();
      lastPageRef.current = currentPage;
    }
  }, [currentPage]);

  // Sync typography changes to EPUB rendition
  useEffect(() => {
    if (!renditionRef.current) return;
    try {
      renditionRef.current.themes.fontSize(`${fontSize}px`);
      const activeTheme = theme === "dark" || theme === "midnight" ? "dark" : theme === "sepia" ? "sepia" : "paper";
      renditionRef.current.themes.select(activeTheme);
    } catch {}
  }, [fontSize, theme]);

  const handleNext = () => {
    if (isLocked) return;
    renditionRef.current?.next();
    lastPageRef.current = currentPage + 1;
    goToPage?.(currentPage + 1);
  };

  const handlePrev = () => {
    setIsLocked(false);
    renditionRef.current?.prev();
    lastPageRef.current = Math.max(1, currentPage - 1);
    goToPage?.(Math.max(1, currentPage - 1));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLocked]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[var(--background)] overflow-hidden relative select-none">
      {/* Main EPUB Viewport Canvas - Full Height */}
      <div className="flex-1 relative overflow-y-auto flex items-center justify-center p-2 sm:p-6">
        {loading && (
          <div className="text-center text-xs text-[var(--muted)] space-y-2 m-auto">
            <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mx-auto opacity-75" />
            <p>Rendering reflowable EPUB edition...</p>
          </div>
        )}

        {error && (
          <div className="text-center text-xs text-red-500 space-y-2 max-w-md p-6 bg-[var(--card)] border border-[var(--border)] rounded-none shadow-sm m-auto">
            <AlertTriangle className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="font-bold">EPUB Parsing Alert</p>
            <p className="text-[11px] opacity-80">{error}</p>
          </div>
        )}

        {isLocked && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="max-w-md w-full p-8 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--primary)] mx-auto flex items-center justify-center font-bold">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                  Free Sample Complete
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Unlock <strong className="text-[var(--foreground)]">"{book?.title}"</strong> to continue reading this reflowable EPUB book.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={onUnlockRequest}
                  className="w-full py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Unlock EPUB Edition (₹{book?.price || 0})</span>
                </button>
                <button
                  onClick={handlePrev}
                  className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
                >
                  Back to Free Section
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className={`w-full h-full max-w-4xl mx-auto rounded-none border-none shadow-none ${
            loading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
        />
      </div>
    </div>
  );
}
