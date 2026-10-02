"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BookCard } from "@/components/books/BookCard";
import { store } from "@/lib/data/storage";
import { Book, Category } from "@/lib/types";
import { Search, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { EmptyShelfIllustration } from "@/components/illustrations";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter states
  const searchQ = searchParams.get("q") || "";
  const selectedCat = searchParams.get("category") || "all";
  const selectedLang = searchParams.get("language") || "all";
  const selectedSort = searchParams.get("sort") || "popular";

  useEffect(() => {
    setBooks(store.getBooks());
    setCategories(store.getCategories());
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`/explore?${params.toString()}`);
  };

  const clearAllFilters = () => {
    router.replace("/explore");
  };

  // Filtered books
  const filteredBooks = useMemo(() => {
    return books
      .filter((book) => {
        // Query search
        if (searchQ) {
          const q = searchQ.toLowerCase();
          const matchTitle = book.title.toLowerCase().includes(q);
          const matchAuthor = book.author.toLowerCase().includes(q);
          const matchDesc = book.description.toLowerCase().includes(q);
          const matchTag = book.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchAuthor && !matchDesc && !matchTag) return false;
        }

        // Category filter
        if (selectedCat !== "all") {
          const cat = categories.find((c) => c.slug === selectedCat);
          if (cat && book.categoryId !== cat.id && (book.categoryName || "").toLowerCase() !== cat.name.toLowerCase()) {
            return false;
          }
        }

        // Language filter
        if (selectedLang !== "all") {
          if (selectedLang.toLowerCase() === "hindi" && book.language !== "Hindi") return false;
          if (selectedLang.toLowerCase() === "english" && book.language !== "English") return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (selectedSort === "popular") return b.readCount - a.readCount;
        if (selectedSort === "rating") return b.rating - a.rating;
        if (selectedSort === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (selectedSort === "az") return a.title.localeCompare(b.title);
        return 0;
      });
  }, [books, categories, searchQ, selectedCat, selectedLang, selectedSort]);

  const hasActiveFilters = searchQ || selectedCat !== "all" || selectedLang !== "all" || selectedSort !== "popular";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)]">
          Explore Digital Library
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Browse our extensive catalog across fiction, essays, tech, philosophy, and classical Indian literature.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-4 sm:p-5 shadow-sm mb-10 space-y-4">
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="Search by title, author, or keywords..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full text-sm bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
            />
            {searchQ && (
              <button
                onClick={() => updateParam("q", "")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-subtle)] hover:text-[var(--text-main)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-[var(--text-muted)]" />
            <select
              value={selectedSort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="py-2.5 px-3.5 rounded-full text-xs font-medium bg-[var(--bg-subtle)] border border-[var(--border-main)] text-[var(--text-main)] outline-none cursor-pointer focus:border-[var(--accent)]"
            >
              <option value="popular">Sort: Most Popular</option>
              <option value="recent">Sort: Recently Added</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="az">Sort: Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 no-scrollbar">
          <button
            onClick={() => updateParam("category", "all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedCat === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            All Genres
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam("category", c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                selectedCat === c.slug
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-main)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Language Filter & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-main)] text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-subtle)]">Language:</span>
            {["all", "English", "Hindi"].map((lang) => (
              <button
                key={lang}
                onClick={() => updateParam("language", lang.toLowerCase())}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  selectedLang === lang.toLowerCase()
                    ? "bg-[var(--accent-light)] text-[var(--accent)] border border-[var(--accent-border)]"
                    : "hover:text-[var(--text-main)]"
                }`}
              >
                {lang === "all" ? "All Languages" : lang}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Book Count Status */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs text-[var(--text-muted)] font-medium">
          Showing <span className="text-[var(--text-main)] font-semibold">{filteredBooks.length}</span> titles
        </span>
      </div>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8">
          <div className="mb-4">
            <EmptyShelfIllustration size={200} className="mx-auto" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
            We couldn&apos;t find that story.
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1.5 max-w-sm mx-auto">
            Try loosening your filters, checking for spelling variations, or exploring another literary category.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Suspense fallback={<div className="p-12 text-center text-sm text-[var(--text-muted)]">Loading books...</div>}>
          <ExploreContent />
        </Suspense>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
