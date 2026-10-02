"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { store } from "@/lib/data/storage";
import { Highlight, Book } from "@/lib/types";
import { Highlighter, ArrowLeft, Trash2, BookOpen, Quote } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function NotesPage() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    setHighlights(store.getHighlights());
    setBooks(store.getBooks());
  }, []);

  const handleDelete = (id: string) => {
    store.removeHighlight(id);
    setHighlights(store.getHighlights());
  };

  const getBook = (bookId: string) => books.find((b) => b.id === bookId);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/library"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Library</span>
          </Link>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)]">
                Highlights & Notes
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                Passages, reflections, and marginalia captured during your reading sessions.
              </p>
            </div>
            <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-main)] px-3 py-1.5 rounded-full font-medium">
              {highlights.length} passages saved
            </div>
          </div>

          {highlights.length > 0 ? (
            <div className="space-y-6">
              {highlights.map((item) => {
                const book = getBook(item.bookId);
                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-card)] shadow-sm hover:border-[var(--accent)]/30 transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Quote className="w-4 h-4 text-[var(--accent)]" />
                        <span className="text-xs font-semibold text-[var(--text-main)]">
                          {book?.title || "Book Passage"}
                        </span>
                        <span className="text-xs text-[var(--text-subtle)]">•</span>
                        <span className="text-xs text-[var(--text-muted)]">
                          Page {item.page} {item.chapterTitle ? `(${item.chapterTitle})` : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[var(--text-subtle)]">
                          {formatDate(item.createdAt)}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-[var(--text-subtle)] hover:text-red-500 transition-colors"
                          title="Delete Highlight"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Highlighted text block */}
                    <blockquote className="border-l-2 border-[var(--accent)] pl-4 py-1 italic font-editorial text-base sm:text-lg text-[var(--text-main)] leading-relaxed">
                      &ldquo;{item.selectedText}&rdquo;
                    </blockquote>

                    {/* Note if attached */}
                    {item.note && (
                      <div className="pt-2 text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)]/70 p-3 rounded-xl border border-[var(--border-main)]">
                        <span className="font-semibold text-[var(--text-main)] block mb-0.5">
                          Personal Note:
                        </span>
                        {item.note}
                      </div>
                    )}

                    {/* Jump to book */}
                    {book && (
                      <div className="pt-2 flex justify-end">
                        <Link
                          href={`/reader/${book.id}?page=${item.page}`}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline font-medium"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Jump to Page in Reader →</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--border-main)] bg-[var(--bg-card)] p-8">
              <Highlighter className="w-10 h-10 text-[var(--text-subtle)] mx-auto mb-3" />
              <h3 className="font-editorial text-xl font-bold text-[var(--text-main)]">
                No highlights yet.
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
                While reading in the reader, select any text passage to highlight and capture notes.
              </p>
              <Link
                href="/explore"
                className="mt-5 inline-block px-5 py-2.5 rounded-full bg-[var(--accent)] text-white text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
              >
                Browse Books to Read
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
