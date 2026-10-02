"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Tag, ArrowRight, X } from "lucide-react";
import { store } from "@/lib/data/storage";
import { Book } from "@/lib/types";
import Image from "next/image";

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [results, setResults] = useState<Book[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBooks(store.getBooks());
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(books.slice(0, 4));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.books)) {
            setResults(data.books);
            setSelectedIndex(0);
            return;
          }
        }
      } catch (err) {
        console.error("Search fetch error, fallback to memory:", err);
      }

      // Memory fallback
      const q = query.toLowerCase();
      const filtered = books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          (b.categoryName || "").toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
      setResults(filtered);
      setSelectedIndex(0);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, books]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        if (results[selectedIndex]) {
          router.push(`/books/${results[selectedIndex].slug}`);
          onClose();
        } else if (query.trim()) {
          router.push(`/explore?q=${encodeURIComponent(query)}`);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, query, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-xl border border-[var(--border-main)] shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border-main)] gap-3">
          <Search className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, genres, or keywords..."
            className="w-full bg-transparent text-base outline-none text-[var(--text-main)] placeholder:text-[var(--text-subtle)]"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-[var(--text-muted)] bg-[var(--bg-subtle)] border border-[var(--border-main)] rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length > 0 ? (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-xs font-medium text-[var(--text-subtle)] uppercase tracking-wider">
                {query ? "Matching Books" : "Recommended & Popular"}
              </div>
              {results.map((book, idx) => (
                <div
                  key={book.id}
                  onClick={() => {
                    router.push(`/books/${book.slug}`);
                    onClose();
                  }}
                  className={`flex items-center gap-3.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                    selectedIndex === idx
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "hover:bg-[var(--bg-subtle)] text-[var(--text-main)]"
                  }`}
                >
                  <div className="relative w-11 h-14 shrink-0 rounded overflow-hidden shadow-sm bg-[var(--bg-subtle)]">
                    <Image
                      src={book.coverUrl}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="44px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{book.title}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {book.author} • <span className="font-medium">{book.categoryName}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 opacity-50 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-[var(--text-muted)]">
              No stories found for &ldquo;{query}&rdquo;.
              <div className="mt-2 text-xs text-[var(--text-subtle)]">
                Try searching by genre, author, or keyword.
              </div>
            </div>
          )}

          {/* Quick Category shortcuts */}
          {!query && (
            <div className="mt-3 pt-3 border-t border-[var(--border-main)] px-2">
              <div className="text-xs font-medium text-[var(--text-subtle)] mb-2 px-1">
                Browse Popular Genres
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: "Self Development", slug: "self-development" },
                  { name: "Business", slug: "business" },
                  { name: "Technology", slug: "technology" },
                  { name: "Hindi Literature", slug: "hindi" },
                  { name: "Philosophy", slug: "philosophy" },
                ].map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => {
                      router.push(`/explore?category=${c.slug}`);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-[var(--bg-subtle)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] text-[var(--text-muted)] transition-colors"
                  >
                    <Tag className="w-3 h-3 opacity-60" />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[var(--bg-subtle)]/50 border-t border-[var(--border-main)] flex items-center justify-between text-xs text-[var(--text-subtle)]">
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>•</span>
            <span>↵ to select</span>
          </div>
          <button
            onClick={() => {
              router.push(query ? `/explore?q=${encodeURIComponent(query)}` : "/explore");
              onClose();
            }}
            className="hover:text-[var(--accent)] transition-colors flex items-center gap-1 font-medium"
          >
            <span>View all in Explore</span>
            <BookOpen className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
