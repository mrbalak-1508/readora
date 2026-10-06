"use client";

import React from "react";
import { useReader } from "@/context/ReaderContext";
import { X, Bookmark, Trash2, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface BookmarksSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookmarksSheet({ isOpen, onClose }: BookmarksSheetProps) {
  const { bookmarks, goToPage, toggleBookmark, removeBookmark, currentPage, isBookmarked } = useReader();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border-main)] p-6 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)] mb-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-editorial text-lg font-bold text-[var(--text-main)]">
              Bookmarks
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick bookmark current page action */}
        <div className="mb-4">
          <button
            onClick={toggleBookmark}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 border transition-all ${
              isBookmarked
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "bg-[var(--bg-subtle)] text-[var(--text-main)] border-[var(--border-main)] hover:border-[var(--accent)]"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{isBookmarked ? "Page is Bookmarked" : `Bookmark Current Page (${currentPage})`}</span>
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
                className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] cursor-pointer transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[var(--accent)]">
                      Page {bm.page}
                    </span>
                    <span className="text-[10px] text-[var(--text-subtle)]">
                      {formatDate(bm.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] truncate mt-1">
                    {bm.chapterTitle || bm.snippet || `Marker on page ${bm.page}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bm.page);
                    }}
                    className="p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-50 group-hover:opacity-100 transition-all"
                    title="Delete Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center text-xs text-[var(--text-muted)]">
              No bookmarks yet.
              <div className="mt-1 text-[var(--text-subtle)]">
                Save pages you want to revisit anytime.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
