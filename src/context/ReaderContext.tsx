"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { Book, Bookmark, Highlight, ReadingProgress } from "@/lib/types";
import { store } from "@/lib/data/storage";
import { soundManager, SoundProfile } from "@/lib/sound";

export type ReaderTheme = "paper" | "warm" | "sepia" | "dark" | "midnight";
export type ReaderFont = "serif" | "sans" | "readable" | "mono";
export type AnimationSpeed = "fast" | "normal" | "slow";

interface ReaderContextType {
  book: Book | null;
  setBook: (book: Book) => void;
  currentPage: number;
  totalPages: number;
  currentChapterTitle: string;
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
  font: ReaderFont;
  setFont: (font: ReaderFont) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  lineHeight: number;
  setLineHeight: (height: number) => void;
  textAlign: "left" | "justify";
  setTextAlign: (align: "left" | "justify") => void;
  pageMode: "scroll" | "paged";
  setPageMode: (mode: "scroll" | "paged") => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (volume: number) => void;
  soundProfile: SoundProfile;
  setSoundProfile: (profile: SoundProfile) => void;
  animation3d: boolean;
  setAnimation3d: (enabled: boolean) => void;
  animationSpeed: AnimationSpeed;
  setAnimationSpeed: (speed: AnimationSpeed) => void;
  hasFullAccess: boolean;
  previewLimit: number | null;
  watermarkText: string | null;
  bookmarks: Bookmark[];
  isBookmarked: boolean;
  toggleBookmark: () => void;
  removeBookmark: (page: number) => void;
  goToPage: (page: number, chapterTitle?: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  highlights: Highlight[];
  addHighlight: (text: string, color: Highlight["color"], note?: string) => void;
  removeHighlight: (id: string) => void;
  readingTimeSeconds: number;
  isCompleted: boolean;
  markCompleted: () => void;
  resetProgress: () => void;
}

const ReaderContext = createContext<ReaderContextType | undefined>(undefined);

export function ReaderProvider({
  book: initialBook,
  initialHasFullAccess,
  children,
}: {
  book: Book;
  initialHasFullAccess?: boolean;
  children: React.ReactNode;
}) {
  const [book, setBook] = useState<Book>(initialBook);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [currentChapterTitle, setCurrentChapterTitle] = useState<string>("");
  const [theme, setTheme] = useState<ReaderTheme>("paper");
  const [font, setFont] = useState<ReaderFont>("serif");
  const [fontSize, setFontSize] = useState<number>(16);
  const [lineHeight, setLineHeight] = useState<number>(1.65);
  const [textAlign, setTextAlign] = useState<"left" | "justify">("left");
  const [pageMode, setPageMode] = useState<"scroll" | "paged">("paged");
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(false);
  const [soundVolume, setSoundVolumeState] = useState<number>(0.8);
  const [soundProfile, setSoundProfileState] = useState<SoundProfile>("parchment");
  const [animation3d, setAnimation3dState] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeedState] = useState<AnimationSpeed>("normal");
  const isInitiallyFree =
    initialBook.accessType === "FREE" || (initialBook.price === 0 && !initialBook.accessType);
  const effectiveFull = initialHasFullAccess !== undefined ? initialHasFullAccess : isInitiallyFree;
  const [hasFullAccess, setHasFullAccess] = useState<boolean>(effectiveFull);
  const [previewLimit, setPreviewLimit] = useState<number | null>(
    !effectiveFull ? initialBook.previewPages || 10 : null
  );
  const [watermarkText, setWatermarkText] = useState<string | null>(null);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [readingTimeSeconds, setReadingTimeSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from storage & check server access
  useEffect(() => {
    setSoundEnabledState(soundManager.isEnabled());
    setSoundVolumeState(soundManager.getVolume());
    setSoundProfileState(soundManager.getSoundProfile());

    const savedTheme = localStorage.getItem("readora_reader_theme") as ReaderTheme;
    if (savedTheme) setTheme(savedTheme);

    const savedFont = localStorage.getItem("readora_reader_font") as ReaderFont;
    if (savedFont) setFont(savedFont);

    const savedFontSize = localStorage.getItem("readora_reader_font_size");
    if (savedFontSize) setFontSize(Number(savedFontSize));

    const savedLineHeight = localStorage.getItem("readora_reader_line_height");
    if (savedLineHeight) setLineHeight(Number(savedLineHeight));

    const savedAlign = localStorage.getItem("readora_reader_text_align") as "left" | "justify";
    if (savedAlign) setTextAlign(savedAlign);

    const saved3d = localStorage.getItem("readora_reader_3d");
    if (saved3d !== null) setAnimation3dState(saved3d === "true");

    const savedSpeed = localStorage.getItem("readora_reader_speed") as AnimationSpeed;
    if (savedSpeed) setAnimationSpeedState(savedSpeed);

    // Load server access & preview limits
    async function checkAccess() {
      // Check local storage library items first
      const localLibrary = store.getLibrary();
      const localPurchased = localLibrary.some(
        (item) =>
          (item.bookId === initialBook.id || item.bookId === initialBook.slug) &&
          (item.status === "purchased" || (item as any).isPurchased)
      );

      if (localPurchased) {
        setHasFullAccess(true);
        setPreviewLimit(null);
      }

      try {
        const res = await fetch(`/api/books/${initialBook.id}/access`);
        if (res.ok) {
          const data = await res.json();
          const full = Boolean(data.hasFullAccess) || localPurchased;
          setHasFullAccess(full);
          setWatermarkText(data.watermark || null);
          if (full) {
            setPreviewLimit(null);
          } else {
            setPreviewLimit(data.preview?.allowedPages || initialBook.previewPages || 10);
            setIsCompleted(false);
          }
        }
      } catch {
        // fallback
      }
    }
    checkAccess();

    // Book progress & bookmarks
    const savedProgress = store.getProgress(initialBook.id);
    if (savedProgress) {
      setCurrentPage(savedProgress.currentPage || 1);
      setCurrentChapterTitle(
        savedProgress.currentChapter || initialBook.tableOfContents?.[0]?.title || ""
      );
      // Strictly prevent preview books from entering completed state
      if (initialBook.accessType === "FREE") {
        setIsCompleted(savedProgress.completed || false);
      } else {
        setIsCompleted(false);
      }
      setReadingTimeSeconds(savedProgress.timeSpentSeconds || 0);
    } else {
      setCurrentChapterTitle(initialBook.tableOfContents?.[0]?.title || "Chapter 1");
    }

    setBookmarks(store.getBookmarks(initialBook.id));
    setHighlights(store.getHighlights(initialBook.id));
  }, [initialBook.id, initialBook.tableOfContents]);

  // Reading timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setReadingTimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save appearance preferences
  const handleSetTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem("readora_reader_theme", newTheme);
  };

  const handleSetFont = (newFont: ReaderFont) => {
    setFont(newFont);
    localStorage.setItem("readora_reader_font", newFont);
  };

  const handleSetFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem("readora_reader_font_size", size.toString());
  };

  const handleSetLineHeight = (height: number) => {
    setLineHeight(height);
    localStorage.setItem("readora_reader_line_height", height.toString());
  };

  const handleSetTextAlign = (align: "left" | "justify") => {
    setTextAlign(align);
    localStorage.setItem("readora_reader_text_align", align);
  };

  const handleSetPageMode = (mode: "scroll" | "paged") => {
    setPageMode(mode);
    localStorage.setItem("readora_reader_page_mode", mode);
  };

  const handleSetSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundManager.setEnabled(enabled);
  };

  const handleSetSoundVolume = (volume: number) => {
    setSoundVolumeState(volume);
    soundManager.setVolume(volume);
  };

  const handleSetSoundProfile = (profile: SoundProfile) => {
    setSoundProfileState(profile);
    soundManager.setSoundProfile(profile, true);
  };

  const handleSetAnimation3d = (enabled: boolean) => {
    setAnimation3dState(enabled);
    localStorage.setItem("readora_reader_3d", enabled ? "true" : "false");
  };

  const handleSetAnimationSpeed = (speed: AnimationSpeed) => {
    setAnimationSpeedState(speed);
    localStorage.setItem("readora_reader_speed", speed);
  };

  // Debounced progress persistence to SQLite API & localStorage
  const persistProgress = useCallback(
    (page: number, chapter?: string) => {
      if (!book) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const percentage = Math.min(100, Math.round((page / book.pages) * 100));
        const progressData: ReadingProgress = {
          id: `prog-${book.id}`,
          userId: "current-user",
          bookId: book.id,
          bookTitle: book.title,
          bookCover: book.coverUrl,
          author: book.author,
          currentPage: page,
          totalPages: book.pages,
          currentChapter: chapter || currentChapterTitle,
          percentage,
          lastOpened: new Date().toISOString(),
          timeSpentSeconds: readingTimeSeconds,
          completed: page >= book.pages,
        };

        store.saveProgress(progressData);

        try {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookId: book.id,
              currentPage: page,
              totalPages: book.pages,
              currentChapter: chapter || currentChapterTitle,
              percentage,
              timeSpentSeconds: readingTimeSeconds,
              completed: page >= book.pages,
            }),
          });
        } catch {
          // local storage backup preserved
        }
      }, 1000);
    },
    [book, currentChapterTitle, readingTimeSeconds]
  );

  const goToPage = useCallback(
    (page: number, chapterTitle?: string) => {
      const targetPage = Math.max(1, page);
      setCurrentPage(targetPage);
      if (chapterTitle) setCurrentChapterTitle(chapterTitle);
      persistProgress(targetPage, chapterTitle);
    },
    [persistProgress]
  );

  const nextPage = useCallback(() => {
    if (!book) return;
    if (currentPage < book.pages) {
      goToPage(currentPage + 1);
    }
  }, [book, currentPage, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // Bookmarking
  const isBookmarked = bookmarks.some((b) => b.page === currentPage);

  const toggleBookmark = () => {
    if (!book) return;
    soundManager.playBookmark();

    if (isBookmarked) {
      store.removeBookmark(book.id, currentPage);
      setBookmarks((prev) => prev.filter((b) => b.page !== currentPage));
    } else {
      const newBookmark: Bookmark = {
        id: `bm-${Date.now()}`,
        userId: "current-user",
        bookId: book.id,
        page: currentPage,
        chapterTitle: currentChapterTitle,
        snippet: `Page ${currentPage} bookmark`,
        createdAt: new Date().toISOString(),
      };
      store.addBookmark(newBookmark);
      setBookmarks((prev) => [newBookmark, ...prev]);
    }
  };

  const removeBookmark = (page: number) => {
    if (!book) return;
    store.removeBookmark(book.id, page);
    setBookmarks((prev) => prev.filter((b) => b.page !== page));
  };

  // Highlights
  const addHighlight = (text: string, color: Highlight["color"], note?: string) => {
    if (!book) return;
    const newHl: Highlight = {
      id: `hl-${Date.now()}`,
      userId: "current-user",
      bookId: book.id,
      page: currentPage,
      chapterTitle: currentChapterTitle,
      selectedText: text,
      color,
      note,
      createdAt: new Date().toISOString(),
    };
    store.addHighlight(newHl);
    setHighlights((prev) => [newHl, ...prev]);
  };

  const removeHighlight = (id: string) => {
    store.removeHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const markCompleted = () => {
    // Strictly prevent preview/demo readers from triggering volume completion
    if (!hasFullAccess) return;
    setIsCompleted(true);
    soundManager.playCompletion();
    if (book) {
      goToPage(book.pages);
    }
  };

  const resetProgress = () => {
    setIsCompleted(false);
    goToPage(1);
  };

  return (
    <ReaderContext.Provider
      value={{
        book,
        setBook,
        currentPage,
        totalPages: book?.pages || 1,
        currentChapterTitle,
        theme,
        setTheme: handleSetTheme,
        font,
        setFont: handleSetFont,
        fontSize,
        setFontSize: handleSetFontSize,
        lineHeight,
        setLineHeight: handleSetLineHeight,
        textAlign,
        setTextAlign: handleSetTextAlign,
        pageMode,
        setPageMode: handleSetPageMode,
        soundEnabled,
        setSoundEnabled: handleSetSoundEnabled,
        soundVolume,
        setSoundVolume: handleSetSoundVolume,
        soundProfile,
        setSoundProfile: handleSetSoundProfile,
        animation3d,
        setAnimation3d: handleSetAnimation3d,
        animationSpeed,
        setAnimationSpeed: handleSetAnimationSpeed,
        hasFullAccess,
        previewLimit,
        watermarkText,
        bookmarks,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        goToPage,
        nextPage,
        prevPage,
        highlights,
        addHighlight,
        removeHighlight,
        readingTimeSeconds,
        isCompleted,
        markCompleted,
        resetProgress,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);
  if (!context) {
    throw new Error("useReader must be used within a ReaderProvider");
  }
  return context;
}
