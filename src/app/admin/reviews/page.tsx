"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  MessageSquare,
  BookOpen,
  User,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { showConfirmAlert, showToastAlert, showErrorAlert } from "@/lib/alerts";

interface ReviewUser {
  id: string;
  name: string;
  email: string;
  avatarPath?: string | null;
  role: string;
}

interface ReviewBook {
  id: string;
  title: string;
  slug: string;
  coverPath?: string;
  author: string;
  rating: number;
  ratingCount: number;
}

interface AdminReview {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  user: ReviewUser;
  book: ReviewBook;
}

interface AdminReviewStats {
  totalReviews: number;
  averageRating: number;
  distribution: Record<number, number>;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [stats, setStats] = useState<AdminReviewStats>({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [booksList, setBooksList] = useState<{ id: string; title: string }[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [bookFilter, setBookFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (ratingFilter !== "ALL") params.set("rating", ratingFilter);
      if (bookFilter !== "ALL") params.set("bookId", bookFilter);

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        throw new Error("Failed to load reviews");
      }
    } catch (err: any) {
      console.error("Error fetching admin reviews:", err);
      showErrorAlert("Reviews Error", "Could not fetch review data from the database.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ratingFilter, bookFilter]);

  // Initial books list for dropdown filter
  useEffect(() => {
    async function loadBooks() {
      try {
        const res = await fetch("/api/books");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setBooksList(data.map((b) => ({ id: b.id, title: b.title })));
          }
        }
      } catch (e) {
        console.warn("Could not load book dropdown:", e);
      }
    }
    loadBooks();
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Moderation: Delete review
  const handleDelete = async (review: AdminReview) => {
    const confirmed = await showConfirmAlert(
      "Remove Review?",
      `Are you sure you want to delete the review by "${review.user?.name || "Anonymous"}" on "${review.book?.title}"? This will update the book's overall rating score.`,
      "Delete Review",
      "Cancel"
    );

    if (!confirmed) return;

    setDeletingId(review.id);
    try {
      const res = await fetch(`/api/admin/reviews?reviewId=${review.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        showToastAlert("Review removed successfully", "success");
        setReviews((prev) => prev.filter((r) => r.id !== review.id));
        setStats((prev) => ({
          ...prev,
          totalReviews: Math.max(0, prev.totalReviews - 1),
        }));
      } else {
        throw new Error(data.error || "Failed to delete review");
      }
    } catch (err: any) {
      showErrorAlert("Delete Failed", err.message || "Could not delete review.");
    } finally {
      setDeletingId(null);
    }
  };

  const positiveReviews =
    (stats.distribution[5] || 0) + (stats.distribution[4] || 0);
  const criticalReviews =
    (stats.distribution[1] || 0) + (stats.distribution[2] || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
            <MessageSquare className="w-4 h-4" />
            <span>Community Moderation</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-1">
            Reader Reviews & Ratings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Audit literary feedback, inspect user ratings, and moderate reviews across the entire catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchReviews()}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted)] block">Total Reviews</span>
          <span className="font-editorial text-3xl font-bold text-[var(--foreground)] mt-1 block">
            {stats.totalReviews}
          </span>
          <span className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-[var(--primary)]" /> Across all catalog volumes
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted)] block">Global Rating Average</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
              {stats.averageRating.toFixed(1)}
            </span>
            <div className="flex items-center text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block font-mono">
            Out of 5.0 maximum
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted)] block">Positive (4–5 Stars)</span>
          <span className="font-editorial text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {positiveReviews}
          </span>
          <span className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {stats.totalReviews > 0
              ? `${Math.round((positiveReviews / stats.totalReviews) * 100)}% approval`
              : "No ratings yet"}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-medium text-[var(--muted)] block">Critical (1–2 Stars)</span>
          <span className="font-editorial text-3xl font-bold text-rose-600 mt-1 block">
            {criticalReviews}
          </span>
          <span className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-rose-500" /> Requires editorial attention
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reader, review text, or book title..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-semibold outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="ALL">All Star Ratings</option>
              <option value="5">5 Stars (Masterpiece)</option>
              <option value="4">4 Stars (Recommended)</option>
              <option value="3">3 Stars (Good)</option>
              <option value="2">2 Stars (Fair)</option>
              <option value="1">1 Star (Critical)</option>
            </select>
          </div>

          {/* Book Filter */}
          <div>
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] font-semibold outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="ALL">All Volumes</option>
              {booksList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchQuery || ratingFilter !== "ALL" || bookFilter !== "ALL") && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)]">
            <span className="text-[var(--muted)]">
              Filtering by:{" "}
              {searchQuery && <strong className="text-[var(--foreground)]">"{searchQuery}" </strong>}
              {ratingFilter !== "ALL" && (
                <strong className="text-amber-600">[{ratingFilter} Stars] </strong>
              )}
              {bookFilter !== "ALL" && (
                <strong className="text-[var(--primary)]">[Specific Volume]</strong>
              )}
            </span>
            <button
              onClick={() => {
                setSearchQuery("");
                setRatingFilter("ALL");
                setBookFilter("ALL");
              }}
              className="text-[11px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Reviews Table / Feed */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              All Reader Submissions
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[var(--accent-light)] text-[var(--primary)] border border-[var(--primary)]/20">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-[var(--muted)] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
            <p>Loading reader impressions...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-20 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="font-editorial text-base font-bold text-[var(--foreground)]">
              No reviews found
            </p>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              {searchQuery || ratingFilter !== "ALL" || bookFilter !== "ALL"
                ? "No reader reviews match the selected filter criteria."
                : "No reader reviews have been submitted for published books yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {reviews.map((rev) => {
              const userInitial = rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "U";

              return (
                <div
                  key={rev.id}
                  className="p-5 sm:p-6 hover:bg-[var(--background)]/50 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-5"
                >
                  {/* Left: Book & Reviewer Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Book Thumbnail */}
                    <div className="w-14 h-20 rounded-xl bg-[var(--background)] border border-[var(--border)] overflow-hidden shrink-0 relative shadow-2xs">
                      {rev.book?.coverPath ? (
                        <Image
                          src={rev.book.coverPath}
                          alt={rev.book.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                          <BookOpen className="w-5 h-5 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 flex-1 min-w-0">
                      {/* Book Reference */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/books/${rev.book?.slug || rev.book?.id}`}
                          target="_blank"
                          className="font-editorial text-sm font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1 group"
                        >
                          <span className="truncate max-w-[280px]">{rev.book?.title}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--primary)] shrink-0" />
                        </Link>
                        <span className="text-[11px] text-[var(--muted)]">
                          by {rev.book?.author}
                        </span>
                      </div>

                      {/* Reviewer Details */}
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center">
                          {userInitial}
                        </div>
                        <span className="font-semibold text-[var(--foreground)]">
                          {rev.user?.name || "Anonymous Reader"}
                        </span>
                        <span className="text-[11px] text-[var(--muted)] font-mono">
                          ({rev.user?.email})
                        </span>
                        {rev.user?.role === "ADMIN" && (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300">
                            Curator
                          </span>
                        )}
                      </div>

                      {/* Review Text */}
                      {rev.reviewText ? (
                        <p className="text-xs sm:text-sm text-[var(--foreground)]/90 leading-relaxed font-serif pt-1 whitespace-pre-line bg-[var(--card)] p-3 rounded-xl border border-[var(--border)]/80">
                          "{rev.reviewText}"
                        </p>
                      ) : (
                        <p className="text-xs text-[var(--muted)] italic pt-1">
                          Rated without commentary.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Rating, Timestamp & Moderation Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-xl">
                      <div className="flex items-center text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? "fill-amber-500" : "text-[var(--border)]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 font-mono">
                        {rev.rating}.0
                      </span>
                    </div>

                    <span className="text-[11px] text-[var(--muted)] font-mono">
                      {new Date(rev.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>

                    <button
                      onClick={() => handleDelete(rev)}
                      disabled={deletingId === rev.id}
                      className="px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Moderate and delete this review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
