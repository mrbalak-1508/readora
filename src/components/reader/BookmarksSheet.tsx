"use client";

import React, { useState } from "react";
import { useReader } from "@/context/ReaderContext";
import { X, Bookmark, Trash2, ArrowRight, Highlighter, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BookmarksSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarksSheet({ isOpen, onClose }: BookmarksSheetProps) {
  const {
    bookmarks,
    highlights,
    goToPage,
    toggleBookmark,
    removeBookmark,
    removeHighlight,
    currentPage,
    isBookmarked,
  } = useReader();

  const [activeTab, setActiveTab] = useState<"bookmarks" | "highlights">("bookmarks");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-[var(--card)] border-l border-[var(--border)] p-6 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div className="flex items-center gap-2">
            {activeTab === "bookmarks" ? (
              <Bookmark className="w-4 h-4 text-[var(--primary)]" />
            ) : (
              <Highlighter className="w-4 h-4 text-[var(--accent)]" />
            )}
            <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              {activeTab === "bookmarks" ? "Bookmarks" : "Highlights & Notes"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-[var(--bg-subtle)] rounded-xl mb-4 border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab("bookmarks")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "bookmarks"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks ({bookmarks.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("highlights")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "highlights"
                ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlights ({highlights.length})</span>
          </button>
        </div>

        {activeTab === "bookmarks" ? (
          <>
            {/* Quick bookmark current page action */}
            <div className="mb-4">
              <button
                onClick={toggleBookmark}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  isBookmarked
                    ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-xs"
                    : "bg-[var(--bg-subtle)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--primary)]"
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>
                  {isBookmarked
                    ? "Page is Bookmarked"
                    : `Bookmark Current Page (${currentPage})`}
                </span>
              </button>
            </div>

            {/* Bookmarks List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {bookmarks.length > 0 ? (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => {
                      goToPage(bm.page, bm.chapterTitle);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[var(--primary)]">
                          Page {bm.page}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] opacity-70">
                          {formatDate(bm.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)] truncate mt-1">
                        {bm.chapterTitle || bm.snippet || `Marker on page ${bm.page}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(bm.page);
                        }}
                        className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-50 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-[var(--primary)] opacity-60 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-xs text-[var(--muted)]">
                  No bookmarks yet.
                  <div className="mt-1 opacity-70">
                    Save pages you want to revisit anytime.
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Highlights List */
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {highlights.length > 0 ? (
              highlights.map((hl) => (
                <div
                  key={hl.id}
                  onClick={() => {
                    goToPage(hl.page);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          hl.color === "yellow"
                            ? "bg-amber-400"
                            : hl.color === "green"
                            ? "bg-emerald-400"
                            : hl.color === "pink"
                            ? "bg-pink-400"
                            : hl.color === "coral"
                            ? "bg-rose-400"
                            : hl.color === "blue"
                            ? "bg-sky-400"
                            : "bg-purple-400"
                        }`}
                      />
                      <span className="font-semibold text-xs text-[var(--primary)]">
                        Page {hl.page}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[var(--muted)] opacity-70">
                        {formatDate(hl.createdAt)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHighlight(hl.id);
                        }}
                        className="p-1 rounded-md text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                        title="Delete Highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[var(--foreground)] italic line-clamp-2 leading-relaxed border-l-2 border-[var(--primary)]/30 pl-2">
                    "{hl.selectedText}"
                  </p>

                  {hl.note && (
                    <div className="flex items-start gap-1.5 p-2 rounded-lg bg-[var(--bg-subtle)] text-[11px] text-[var(--foreground)]">
                      <FileText className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{hl.note}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-[var(--muted)]">
                No highlights yet.
                <div className="mt-1 opacity-70">
                  Select text in the document to highlight and take marginal notes.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
