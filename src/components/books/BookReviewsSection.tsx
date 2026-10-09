"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { soundManager } from "@/lib/sound";
import {
  Star,
  Lock,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Trash2,
  Edit3,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";

interface ReviewUser {
  id: string;
  name: string;
  avatarPath?: string | null;
  role: string;
}

interface ReviewItem {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  reviewText?: string | null;
  createdAt: string;
  user: ReviewUser;
}

interface BookReviewsSectionProps {
  bookId: string;
  bookTitle: string;
  initialRating?: number;
  initialRatingCount?: number;
}

const RATING_LABELS: Record<number, string> = {
  1: "Needs Improvement",
  2: "Fair Read",
  3: "Good Read",
  4: "Very Recommended",
  5: "Exceptional Masterpiece",
};

export function BookReviewsSection({
  bookId,
  bookTitle,
  initialRating = 4.8,
  initialRatingCount = 1,
}: BookReviewsSectionProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = useState(initialRatingCount);
  const [averageRating, setAverageRating] = useState(initialRating);
  const [distribution, setDistribution] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  });

  const [userReview, setUserReview] = useState<ReviewItem | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTextInput, setReviewTextInput] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    if (!bookId) return;
    try {
      const res = await fetch(`/api/books/${bookId}/reviews`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalReviews(data.totalReviews || 0);
        setAverageRating(data.averageRating || initialRating);
        setDistribution(data.distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

        if (data.userReview) {
          setUserReview(data.userReview);
          setRatingInput(data.userReview.rating);
          setReviewTextInput(data.userReview.reviewText || "");
        } else {
          setUserReview(null);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch book reviews:", err);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, initialRating]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMessage("Please sign in to write a review.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
    soundManager.playClick();

    try {
      const res = await fetch(`/api/books/${bookId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingInput,
          reviewText: reviewTextInput.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to post review");
      }

      setSuccessMessage(resData.message || "Review published successfully!");
      setIsEditing(false);
      await fetchReviews();
      setTimeout(() => setSuccessMessage(""), 3500);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not publish review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Review Deletion
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to remove this review?")) return;

    setIsDeleting(true);
    setErrorMessage("");
    try {
      const res = await fetch(`/api/books/${bookId}/reviews?reviewId=${reviewId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete review");
      }

      setUserReview(null);
      setReviewTextInput("");
      setRatingInput(5);
      setIsEditing(false);
      setSuccessMessage("Review deleted.");
      await fetchReviews();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || "Could not delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const currentPath = pathname || `/books/${bookId}`;
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
  const signupUrl = `/signup?redirect=${encodeURIComponent(currentPath)}`;

  const activeStarRating = hoverRating || ratingInput;

  return (
    <section className="mt-16 mb-16 overflow-hidden max-w-full" id="reviews-section">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs space-y-6 sm:space-y-8 max-w-full overflow-hidden">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--secondary)]">
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>Reader Community</span>
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-1 break-words">
              Reader Impressions & Reviews
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 break-words">
              Authentic reviews and literary evaluations for <em className="font-serif">"{bookTitle}"</em>
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[var(--background)] border border-[var(--border)] px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl shrink-0 w-fit self-start sm:self-auto">
            <div className="flex items-center text-amber-500">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-[var(--foreground)] font-editorial">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-[11px] text-[var(--muted)] font-mono">/ 5.0</span>
              </div>
              <span className="text-[10px] text-[var(--muted)] block">
                {totalReviews} verified {totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Breakdown & Overview Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 bg-[var(--background)]/70 border border-[var(--border)] rounded-2xl p-4 sm:p-6 max-w-full overflow-hidden">
          {/* Big Score Box */}
          <div className="flex flex-col items-center justify-center text-center p-3 sm:p-4 border-b md:border-b-0 md:border-r border-[var(--border)]">
            <span className="font-editorial text-4xl sm:text-5xl font-bold text-[var(--foreground)]">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1 my-2 text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(averageRating) ? "fill-amber-400" : "text-[var(--border)]"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-[var(--muted)]">
              Based on {totalReviews} community {totalReviews === 1 ? "rating" : "ratings"}
            </span>
          </div>

          {/* Distribution Bars */}
          <div className="md:col-span-2 flex flex-col justify-center space-y-2 min-w-0">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2 sm:gap-3 text-xs min-w-0">
                  <div className="flex items-center gap-1 w-10 sm:w-12 shrink-0 font-medium text-[var(--muted)]">
                    <span>{stars}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-[var(--card)] border border-[var(--border)] overflow-hidden min-w-0">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stars >= 4
                          ? "bg-amber-400"
                          : stars === 3
                          ? "bg-amber-500/70"
                          : "bg-rose-400/80"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 sm:w-10 text-right font-mono text-[11px] text-[var(--muted)] shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AUTHORIZATION GATE: Review Form for Authorized Users OR Callout for Guests */}
        <div className="min-w-0">
          {user ? (
            /* ======================================================== */
            /* AUTHORIZED USER: Can write, edit or view their own review */
            /* ======================================================== */
            <div className="bg-[var(--accent-light)]/40 border border-[var(--primary)]/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-[var(--foreground)] block truncate">
                      {userReview && !isEditing ? "Your Published Review" : userReview ? "Edit Your Review" : "Write a Reader Review"}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] flex items-center gap-1 flex-wrap break-all">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Logged in as <strong>{user.name}</strong> ({user.role})</span>
                    </span>
                  </div>
                </div>

                {userReview && !isEditing && (
                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => handleDeleteReview(userReview.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* View published user review card if already submitted and not in edit mode */}
              {userReview && !isEditing ? (
                <div className="space-y-3 pt-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= userReview.rating ? "fill-amber-400" : "text-[var(--border)]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[var(--foreground)]">
                        {RATING_LABELS[userReview.rating]}
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--muted)] font-mono">
                      {new Date(userReview.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {userReview.reviewText && (
                    <p className="text-sm text-[var(--foreground)]/90 leading-relaxed font-serif whitespace-pre-line bg-[var(--card)] p-3.5 sm:p-4 rounded-2xl border border-[var(--border)] break-words break-all">
                      "{userReview.reviewText}"
                    </p>
                  )}
                </div>
              ) : (
                /* Review submission form (New or Editing) */
                <form onSubmit={handleSubmitReview} className="space-y-4 pt-1 min-w-0">
                  {/* Interactive Star Picker */}
                  <div>
                    <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                      Your Rating <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => {
                              setRatingInput(star);
                              soundManager.playClick();
                            }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                            title={`${star} Stars - ${RATING_LABELS[star]}`}
                          >
                            <Star
                              className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                                star <= activeStarRating
                                  ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                                  : "text-[var(--border)] hover:text-amber-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        {RATING_LABELS[activeStarRating]}
                      </span>
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-[var(--foreground)]">
                        Your Literary Review (Optional)
                      </label>
                      <span className="text-[11px] text-[var(--muted)] font-mono">
                        {reviewTextInput.length} / 2500
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={reviewTextInput}
                      onChange={(e) => setReviewTextInput(e.target.value)}
                      maxLength={2500}
                      placeholder="Share your thoughts on the prose, character development, themes, or insights gained from reading this volume..."
                      className="w-full px-3.5 sm:px-4 py-3 rounded-2xl text-sm bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent placeholder:text-[var(--muted)]/60 font-serif leading-relaxed"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span className="break-words">{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span className="break-words">{successMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>{userReview ? "Update Review" : "Publish Review"}</span>
                        </>
                      )}
                    </button>

                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          if (userReview) {
                            setRatingInput(userReview.rating);
                            setReviewTextInput(userReview.reviewText || "");
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* UNAUTHORIZED / GUEST USER: Secure Access Gate Banner    */
            /* ======================================================== */
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--bg-subtle)] via-[var(--card)] to-[var(--accent-light)]/30 p-4 sm:p-8 shadow-xs max-w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[11px] font-bold">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Member-Exclusive Sanctuary</span>
                  </div>
                  <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[var(--foreground)] break-words">
                    Sign in to Rate & Review This Volume
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed break-words">
                    To maintain the highest literary integrity in the Readora catalog, reviewing and rating books is reserved for authorized readers. Sign in to your account to share your perspective.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                  <Link
                    href={loginUrl}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs text-center"
                  >
                    <User className="w-4 h-4" />
                    <span>Sign In to Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={signupUrl}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors text-center"
                  >
                    <span>Create Account</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Community Reviews Feed */}
        <div className="space-y-4 pt-4 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              All Community Reviews ({reviews.length})
            </h3>
            {reviews.length > 0 && (
              <span className="text-xs text-[var(--muted)] font-mono shrink-0">
                Chronological order
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--muted)] space-y-2">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--primary)]" />
              <p>Loading reader impressions...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-10 sm:py-12 px-4 rounded-3xl bg-[var(--background)]/60 border border-dashed border-[var(--border)] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center mx-auto">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="font-editorial text-base font-bold text-[var(--foreground)]">
                No reviews yet for this edition
              </p>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                {user
                  ? "Be the first verified reader to review this book above!"
                  : "Sign in and be the first verified reader to leave your review and rating."}
              </p>
              {!user && (
                <Link
                  href={loginUrl}
                  className="inline-block mt-2 text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  Sign In to be the first reviewer →
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {reviews.map((rev) => {
                const isCurrentUser = user && user.id === rev.userId;
                const isAdmin = user && user.role === "admin";
                const initial = rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "R";

                return (
                  <article key={rev.id} className="py-5 sm:py-6 first:pt-2 space-y-3 min-w-0">
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                        {/* Avatar */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[var(--foreground)] truncate max-w-[150px] sm:max-w-none">
                              {rev.user?.name || "Anonymous Bibliophile"}
                            </span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                                You
                              </span>
                            )}
                            {rev.user?.role === "ADMIN" && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                                Curator
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--muted)] font-mono block">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars & Delete */}
                      <div className="flex items-center justify-between xs:justify-end gap-2.5 shrink-0 pl-11 xs:pl-0">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? "fill-amber-400" : "text-[var(--border)]"
                              }`}
                            />
                          ))}
                        </div>

                        {(isCurrentUser || isAdmin) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Review Content */}
                    {rev.reviewText ? (
                      <p className="text-xs sm:text-sm text-[var(--foreground)]/90 leading-relaxed font-serif pl-0 sm:pl-12 whitespace-pre-line break-words break-all">
                        {rev.reviewText}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted)] italic pl-0 sm:pl-12">
                        Rated {rev.rating} out of 5 stars without written comments.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
