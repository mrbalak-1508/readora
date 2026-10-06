"use client";

import React, { useState, useMemo } from "react";
import { useReader } from "@/context/ReaderContext";
import { X, Search, ArrowRight } from "lucide-react";

interface SearchInsideSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchInsideSheet({ isOpen, onClose }: SearchInsideSheetProps) {
  const { book, goToPage } = useReader();
  const [query, setQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!book || !query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: { page: number; chapterTitle: string; snippet: string }[] = [];

    // Search through chapter content
    book.chapters?.forEach((ch) => {
      if (ch.content) {
        const text = ch.content;
        const lower = text.toLowerCase();
        let startIndex = 0;
        let count = 0;

        while ((startIndex = lower.indexOf(q, startIndex)) !== -1 && count < 5) {
          const from = Math.max(0, startIndex - 40);
          const to = Math.min(text.length, startIndex + q.length + 60);
          const snippet = "..." + text.substring(from, to).replace(/\n/g, " ") + "...";
          results.push({
            page: ch.page,
            chapterTitle: ch.title,
            snippet,
          });
          startIndex += q.length;
          count++;
        }
      } else if (ch.title.toLowerCase().includes(q)) {
        results.push({
          page: ch.page,
          chapterTitle: ch.title,
          snippet: `Chapter heading: "${ch.title}"`,
        });
      }
    });

    // Search in sample content if available
    if (book.sampleContent && book.sampleContent.toLowerCase().includes(q)) {
      const text = book.sampleContent;
      const lower = text.toLowerCase();
      const idx = lower.indexOf(q);
      const from = Math.max(0, idx - 40);
      const to = Math.min(text.length, idx + q.length + 60);
      results.push({
        page: 1,
        chapterTitle: "Sample Content / Introduction",
        snippet: "..." + text.substring(from, to).replace(/\n/g, " ") + "...",
      });
    }

    // Search table of contents
    book.tableOfContents?.forEach((toc) => {
      if (toc.title.toLowerCase().includes(q) && !results.some((r) => r.page === toc.page)) {
        results.push({
          page: toc.page,
          chapterTitle: toc.title,
          snippet: `Section entry: "${toc.title}"`,
        });
      }
    });

    return results;
  }, [book, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[var(--bg-card)] border-l border-[var(--border-main)] p-6 shadow-2xl z-10 flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-main)] mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="font-editorial text-lg font-bold text-[var(--text-main)]">
              Search Inside Book
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search keywords or passages..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {query.trim().length >= 2 ? (
            searchResults.length > 0 ? (
              searchResults.map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    goToPage(res.page, res.chapterTitle);
                    onClose();
                  }}
                  className="p-3 rounded-xl border border-[var(--border-main)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] cursor-pointer transition-all space-y-1 group"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
                    <span>Page {res.page}</span>
                    <ArrowRight className="w-3 h-3 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="text-[11px] font-medium text-[var(--text-main)] truncate">
                    {res.chapterTitle}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed italic line-clamp-2">
                    {res.snippet}
                  </p>
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                No matching passages found for &ldquo;{query}&rdquo;.
              </div>
            )
          ) : (
            <div className="py-16 text-center text-xs text-[var(--text-subtle)]">
              Type at least 2 characters to search text within this volume.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
