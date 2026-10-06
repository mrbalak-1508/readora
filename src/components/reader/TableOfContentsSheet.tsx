"use client";

import React from "react";
import { useReader } from "@/context/ReaderContext";
import { X, BookOpen, Check } from "lucide-react";

interface TableOfContentsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TableOfContentsSheet({ isOpen, onClose }: TableOfContentsSheetProps) {
  const { book, currentPage, goToPage } = useReader();

  if (!isOpen || !book) return null;

  const rawToc =
    book.tableOfContents && book.tableOfContents.length > 0
      ? book.tableOfContents
      : book.chapters && book.chapters.length > 0
      ? book.chapters.map((ch) => ({ title: ch.title, page: ch.page }))
      : Array.from({ length: Math.min(book.pages || 1, 20) }, (_, i) => ({
          title: i === 0 ? "Cover Page" : `Section / Page ${i + 1}`,
          page: i + 1,
        }));

  const toc = rawToc;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Slide-out Panel */}
      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border-r border-[var(--border-main)] p-6 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)] mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-editorial text-lg font-bold text-[var(--text-main)]">
              Table of Contents
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-[var(--text-muted)] mb-3 px-1 truncate font-medium">
          {book.title}
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {toc.length > 0 ? (
            toc.map((item, idx) => {
              const isCurrent = currentPage >= item.page && (idx === toc.length - 1 || currentPage < (toc[idx + 1]?.page || Infinity));
              return (
                <button
                  key={idx}
                  onClick={() => {
                    goToPage(item.page, item.title);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors ${
                    isCurrent
                      ? "bg-[var(--accent-light)] text-[var(--accent)] font-semibold"
                      : "hover:bg-[var(--bg-subtle)] text-[var(--text-main)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-mono text-[10px] text-[var(--text-subtle)] w-5 shrink-0">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="truncate">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[var(--text-subtle)]">
                    <span>p. {item.page}</span>
                    {isCurrent && <Check className="w-3 h-3 text-[var(--accent)]" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              Continuous single-scroll publication.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <span>{toc.length} Sections</span>
          <span>{book.pages} Total Pages</span>
        </div>
      </div>
    </div>
  );
}
