"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BookCard } from "@/components/books/BookCard";
import { useAuth } from "@/context/AuthContext";
import { store } from "@/lib/data/storage";
import { EmptyShelfIllustration } from "@/components/illustrations";
import {
  Bookmark,
  BookOpen,
  CheckCircle,
  Search,
  Sparkles,
  ShieldCheck,
  LogIn,
  UserPlus,
} from "lucide-react";

type LibraryCategoryTab = "all" | "reading" | "purchased" | "subscription" | "free" | "completed";

export default function LibraryPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [library, setLibrary] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<LibraryCategoryTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "title" | "progress">("recent");
  const [loading, setLoading] = useState(true);

  const loadLibrary = async () => {
    // If not authenticated, guest has empty library
    if (!user) {
      setLibrary([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        setLibrary(Array.isArray(data) ? data : []);
      } else {
        setLibrary(store.getLibrary());
      }
    } catch {
      setLibrary(store.getLibrary());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadLibrary();
    }
  }, [user, authLoading]);

  const filteredItems = useMemo(() => {
    return library
      .filter((item) => {
        const book = item.book;
        const progress = item.progress;

        // Categories:
        // Continue Reading, Purchased, Subscription, Free, Completed
        if (activeTab === "reading") {
          return progress && !progress.completed && progress.currentPage > 1;
        }
        if (activeTab === "purchased") {
          return item.isPurchased || item.status === "purchased";
        }
        if (activeTab === "subscription") {
          return (
            item.hasSubscription &&
            ["SUBSCRIPTION", "FREE_WITH_SUBSCRIPTION", "PREVIEW"].includes(book?.accessType)
          );
        }
        if (activeTab === "free") {
          return book?.accessType === "FREE" || book?.price === 0;
        }
        if (activeTab === "completed") {
          return progress?.completed || item.status === "completed";
        }

        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = book?.title?.toLowerCase().includes(q);
          const matchAuthor = book?.author?.toLowerCase().includes(q);
          if (!matchTitle && !matchAuthor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "title") return (a.book?.title || "").localeCompare(b.book?.title || "");
        if (sortBy === "progress") {
          const progA = a.progress?.percentage || 0;
          const progB = b.progress?.percentage || 0;
          return progB - progA;
        }
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      });
  }, [library, activeTab, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const reading = library.filter(
      (i) => i.progress && !i.progress.completed && i.progress.currentPage > 1
    ).length;
    const purchased = library.filter((i) => i.isPurchased || i.status === "purchased").length;
    const completed = library.filter((i) => i.progress?.completed || i.status === "completed").length;
    return { reading, purchased, completed, total: library.length };
  }, [library]);

  const tabs: { id: LibraryCategoryTab; label: string; count?: number }[] = [
    { id: "all", label: "All Shelves", count: stats.total },
    { id: "reading", label: "Continue Reading", count: stats.reading },
    { id: "purchased", label: "Purchased", count: stats.purchased },
    { id: "subscription", label: "Subscription" },
    { id: "free", label: "Free Books" },
    { id: "completed", label: "Completed", count: stats.completed },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-14 pb-20 md:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Guest notification banner */}
          {!authLoading && !user && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    You are exploring the Library as a Guest
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Sign in to sync your personal reading progress, access your purchased eBooks, and save books across all your devices.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                <Link
                  href="/login"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                Personal Sanctuary
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] mt-2">
                My Digital Library
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Your purchased volumes, active reading journeys, and saved titles.
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <Link
                href="/account/orders"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors shadow-2xs"
              >
                <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                <span>Order History</span>
              </Link>
              <Link
                href="/settings/subscription"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Subscription</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="p-3.5 sm:p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <span className="text-xs font-semibold text-[var(--muted)]">Total In Library</span>
              <div className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mt-1">{stats.total}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <span className="text-xs font-semibold text-[var(--muted)]">Continue Reading</span>
              <div className="text-xl sm:text-2xl font-bold text-[var(--primary)] mt-1">{stats.reading}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <span className="text-xs font-semibold text-[var(--muted)]">Purchased Volumes</span>
              <div className="text-xl sm:text-2xl font-bold text-[#3D785D] mt-1">{stats.purchased}</div>
            </div>
            <div className="p-3.5 sm:p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <span className="text-xs font-semibold text-[var(--muted)]">Completed</span>
              <div className="text-xl sm:text-2xl font-bold text-[var(--secondary)] mt-1">{stats.completed}</div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] mb-8">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-[var(--card)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === tab.id ? "bg-white/20 text-white" : "bg-[var(--bg-subtle)] text-[var(--muted)]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search within library */}
            <div className="relative min-w-[200px] sm:min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter library books..."
                className="w-full pl-9 pr-3 py-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Book List / Grid */}
          {loading || authLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center max-w-md mx-auto">
              <EmptyShelfIllustration size={220} className="mx-auto drop-shadow-xs" />
              <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-4">
                {!user ? "Your Personal Shelf is Waiting" : "No Books Found on this Shelf"}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1.5">
                {!user
                  ? "Sign in to access your saved titles, continue your reading journeys, and view purchases."
                  : activeTab === "purchased"
                  ? "You haven't purchased any individual books yet. Explore our catalog or subscribe to Readora Premium."
                  : activeTab === "reading"
                  ? "You don't have any books currently in progress."
                  : "Explore the Readora digital library and build your personal collection."}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {!user && (
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                )}
                <Link
                  href="/explore"
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                    !user
                      ? "border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                      : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Explore Books</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
              {filteredItems.map((item) => (
                <div key={item.id} className="relative group">
                  <BookCard book={item.book} progress={item.progress?.percentage} />

                  {/* Progress / Status Sub-tag */}
                  <div className="mt-2 text-[11px] text-[var(--muted)] flex items-center justify-between">
                    {item.isPurchased ? (
                      <span className="text-[#3D785D] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Purchased</span>
                      </span>
                    ) : item.progress?.currentPage ? (
                      <span className="font-mono text-[var(--primary)] font-semibold">
                        Page {item.progress.currentPage} ({item.progress.percentage}%)
                      </span>
                    ) : (
                      <span>Saved</span>
                    )}

                    <Link
                      href={`/read/${item.book?.id || item.bookId}`}
                      className="font-bold text-[var(--primary)] hover:underline"
                    >
                      Read →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
