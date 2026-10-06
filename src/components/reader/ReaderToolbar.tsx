"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useReader } from "@/context/ReaderContext";
import {
  ArrowLeft,
  Bookmark,
  Search,
  Sliders,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  BookOpen,
  FileText,
  Lock,
  Sparkles,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ReaderToolbarProps {
  onOpenBookmarks: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onComplete: () => void;
  onUnlockBook?: () => void;
  spreadMode?: "single" | "dual";
  onToggleSpread?: () => void;
  hasPdfFile?: boolean;
  zoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

export function ReaderToolbar({
  onOpenBookmarks,
  onOpenSearch,
  onOpenSettings,
  onComplete,
  onUnlockBook,
  spreadMode = "dual",
  onToggleSpread,
  hasPdfFile = false,
  zoom = 1.0,
  onZoomIn,
  onZoomOut,
}: ReaderToolbarProps) {
  const {
    book,
    currentChapterTitle,
    isBookmarked,
    toggleBookmark,
    soundEnabled,
    setSoundEnabled,
    theme,
    setTheme,
    hasFullAccess,
  } = useReader();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const themeBarClasses = {
    paper: "bg-[#FFFFFF]/92 border-[#E5E0D4] text-[#1E1C24] shadow-md shadow-black/5",
    warm: "bg-[#FDF9F2]/95 border-[#E6DCC6] text-[#2C261E] shadow-md shadow-[#4A3820]/5",
    sepia: "bg-[#F4ECD8]/95 border-[#D8CCA8] text-[#3A2E1D] shadow-md shadow-[#4A3210]/8",
    dark: "bg-[#232028]/95 border-[#383340] text-[#E4DFEA] shadow-xl shadow-black/40",
    midnight: "bg-[#141720]/95 border-[#222938] text-[#DCE4F2] shadow-xl shadow-black/50",
  }[theme] || "bg-white/90 border-black/10 text-neutral-900";

  return (
    <header className={`fixed top-2 sm:top-3 left-2 right-2 sm:left-6 sm:right-6 max-w-5xl mx-auto z-40 h-12 sm:h-13 rounded-xl sm:rounded-2xl border backdrop-blur-xl px-2 sm:px-5 flex items-center justify-between gap-1.5 sm:gap-2 transition-all duration-300 ${themeBarClasses}`}>
      {/* Left: Exit to Details */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href={`/books/${book?.slug || ""}`}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 border border-current/15 transition-colors"
          title="Exit to Book Details"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-medium">Library</span>
        </Link>
      </div>

      {/* Center: Book & Chapter Info */}
      <div className="flex-1 min-w-0 text-center px-2 sm:px-4">
        <div className="flex items-center justify-center gap-1.5">
          <div className="font-editorial text-xs sm:text-sm font-bold text-current truncate tracking-tight">
            {book?.title}
          </div>
          {!hasFullAccess && (
            <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold text-white bg-gradient-to-r from-[#D95D4D] to-[#E97868] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs shrink-0">
              <Lock className="w-2.5 h-2.5" />
              <span>Preview</span>
            </span>
          )}
        </div>
        <div className="text-[10px] sm:text-[11px] text-current opacity-60 truncate hidden xs:block font-mono">
          {currentChapterTitle}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Spread Mode Switcher (Single vs Dual Page Spread) */}
        {onToggleSpread && (
          <button
            onClick={onToggleSpread}
            className="p-1.5 sm:p-2 rounded-xl text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden md:flex items-center gap-1"
            title={spreadMode === "dual" ? "Switch to Single Page View" : "Switch to Two-Page Book Spread"}
          >
            {spreadMode === "dual" ? (
              <BookOpen className="w-4 h-4 text-[var(--primary)]" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="text-[11px] font-medium hidden lg:inline">
              {spreadMode === "dual" ? "2-Page" : "1-Page"}
            </span>
          </button>
        )}


        {/* Quick Theme Swatches */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-current/5 rounded-xl border border-current/10">
          {[
            { id: "paper", color: "#FFFFFF", title: "Paper" },
            { id: "warm", color: "#FDF8F0", title: "Warm Ivory" },
            { id: "sepia", color: "#F4ECD8", title: "Sepia" },
            { id: "dark", color: "#222026", title: "Dark" },
            { id: "midnight", color: "#0F1117", title: "Midnight" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as any)}
              className={`w-4 h-4 rounded-full border transition-all ${
                theme === t.id
                  ? "ring-2 ring-[var(--primary)] scale-110 border-transparent shadow-xs"
                  : "border-black/20 dark:border-white/20 opacity-70 hover:opacity-100"
              }`}
              style={{ backgroundColor: t.color }}
              title={`Switch to ${t.title} Theme`}
            />
          ))}
        </div>

        {/* Sound Toggle with state indicator */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 sm:p-2 rounded-xl transition-all hidden sm:flex items-center justify-center ${
            soundEnabled
              ? "text-[var(--primary)] bg-[var(--primary)]/10 border border-[var(--primary)]/20"
              : "text-current opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 border border-transparent"
          }`}
          title={soundEnabled ? "Page Sound: ON (Click to Mute)" : "Page Sound: OFF (Click to Enable)"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[var(--primary)]" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Search Inside */}
        <button
          onClick={onOpenSearch}
          className="p-1.5 sm:p-2 rounded-xl text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden sm:flex items-center justify-center"
          title="Search in book"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Bookmark Current Page */}
        <button
          onClick={toggleBookmark}
          className={`p-1.5 sm:p-2 rounded-xl transition-colors flex items-center justify-center ${
            isBookmarked
              ? "text-[var(--coral)] bg-[var(--coral)]/10"
              : "text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
          title={isBookmarked ? "Page Bookmarked" : "Bookmark this Page"}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
        </button>

        {/* Reading Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 rounded-xl text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          title="Reader Typography & Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 sm:p-2 rounded-xl text-current opacity-75 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden md:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Finish Book (Full Access) OR Unlock Book (Preview) */}
        {hasFullAccess ? (
          <button
            onClick={onComplete}
            className="ml-0.5 sm:ml-1 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-[11px] sm:text-xs font-semibold hover:bg-[var(--primary-hover)] transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
            title="Mark Finished"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finish</span>
          </button>
        ) : (
          <button
            onClick={onUnlockBook || onComplete}
            className="ml-0.5 sm:ml-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D95D4D] to-[#E97868] text-white text-[11px] sm:text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            title="Unlock Full Edition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span className="hidden sm:inline">Unlock Book</span>
          </button>
        )}
      </div>
    </header>
  );
}
