"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { BookCard } from "@/components/books/BookCard";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";
import { store } from "@/lib/data/storage";
import { Book } from "@/lib/types";
import { soundManager } from "@/lib/sound";
import { useAuth } from "@/context/AuthContext";
import {
  BookOpen,
  Bookmark,
  Star,
  Check,
  Calendar,
  Layers,
  Globe,
  Share2,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Eye,
  ShieldCheck,
} from "lucide-react";

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params?.slug as string;

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [inLibrary, setInLibrary] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [accessReason, setAccessReason] = useState("");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      if (!slug) return;
      setLoading(true);

      try {
        // Fetch book data
        const res = await fetch("/api/books");
        if (res.ok) {
          const allBooks: Book[] = await res.json();
          const found = allBooks.find((b) => b.slug === slug || b.id === slug);
          if (found) {
            setBook(found);
            setInLibrary(store.isInLibrary(found.id));
            const related = allBooks.filter(
              (b) => b.id !== found.id && (b.categoryId === found.categoryId || b.language === found.language)
            );
            setRelatedBooks(related.slice(0, 5));

            // Check server-side access entitlement
            try {
              const accessRes = await fetch(`/api/books/${found.id}/access`);
              if (accessRes.ok) {
                const accessData = await accessRes.json();
                setHasFullAccess(accessData.hasFullAccess);
                setAccessReason(accessData.accessReason);
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch book from API:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--background)]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <h2 className="font-editorial text-3xl font-bold text-[var(--foreground)]">
            Volume Not Found
          </h2>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 max-w-md">
            Looks like this volume got lost between the library shelves. Explore our catalog for other curated readings.
          </p>
          <Link
            href="/explore"
            className="mt-6 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
          >
            Return to Explore
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const toggleLibrary = () => {
    soundManager.playBookmark();
    if (inLibrary) {
      store.removeFromLibrary(book.id);
      setInLibrary(false);
      triggerToast("Removed from Library");
    } else {
      store.addToLibrary(book, "saved");
      setInLibrary(true);
      triggerToast("Saved to Your Library");
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 2500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Read "${book.title}" on READORA Digital Library`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Link copied to clipboard");
    }
  };

  const isFree = book.accessType === "FREE" || book.price === 0;
  const isPreviewable = book.accessType === "PREVIEW" || book.accessType === "ONE_TIME_PURCHASE" || book.accessType === "FREE_WITH_SUBSCRIPTION";
  const previewPages = book.previewPages || 10;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      {/* Schema.org Book Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            author: {
              "@type": "Person",
              name: book.author,
            },
            isbn: book.isbn || undefined,
            publisher: {
              "@type": "Organization",
              name: book.publisher || "Readora Press",
            },
            datePublished: book.publicationDate,
            inLanguage: book.language,
            numberOfPages: book.pages,
            description: book.description,
            image: book.coverUrl,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: book.rating,
              reviewCount: book.ratingCount || 1,
            },
            offers: {
              "@type": "Offer",
              price: isFree ? "0.00" : (book.price || 0).toFixed(2),
              priceCurrency: book.currency || "INR",
              availability: "https://schema.org/InStock",
            },
          }),
        }}
      />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Book Presentation Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start mb-16">
            {/* Left Cover Column */}
            <div className="md:col-span-4 flex flex-col items-center">
              <div className="relative w-64 sm:w-72 aspect-[2/3] rounded-2xl overflow-hidden book-cover-shadow book-spine bg-[var(--card)] border border-black/5">
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 260px, 320px"
                />
              </div>

              {/* Cover badges */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors py-1.5 px-3 rounded-full bg-[var(--card)] border border-[var(--border)]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
                <div className="text-xs text-[var(--muted)]">
                  Format: <span className="uppercase font-bold text-[var(--foreground)]">{book.format}</span>
                </div>
              </div>
            </div>

            {/* Right Information Column */}
            <div className="md:col-span-8 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Link
                    href={`/explore?category=${book.categoryId}`}
                    className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full hover:opacity-80 transition-opacity"
                  >
                    {book.categoryName}
                  </Link>

                  {/* Access Status Pill */}
                  {hasFullAccess ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3D785D] bg-[#83B89F]/20 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Full Access Unlocked</span>
                    </span>
                  ) : isFree ? (
                    <span className="text-[11px] font-bold text-[#3D785D] bg-[#83B89F]/20 px-2.5 py-0.5 rounded-full">
                      Free Library Access
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[var(--secondary)] bg-[var(--secondary)]/15 px-2.5 py-0.5 rounded-full">
                      Free Preview Available ({previewPages} pages)
                    </span>
                  )}
                </div>

                <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
                  {book.title}
                </h1>
                <p className="text-base sm:text-lg font-medium text-[var(--muted)] mt-1.5">
                  by <span className="text-[var(--foreground)] font-semibold">{book.author}</span>
                </p>

                {/* Rating & Engagement */}
                <div className="mt-4 flex items-center gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                    <span>{book.rating.toFixed(2)}</span>
                    <span className="text-[var(--muted)] font-normal text-xs">
                      ({book.ratingCount} reviews)
                    </span>
                  </div>
                  <span className="text-[var(--muted)] opacity-40">•</span>
                  <div className="text-[var(--muted)]">
                    <span className="font-bold text-[var(--foreground)]">{book.readCount.toLocaleString()}</span> readers
                  </div>
                </div>
              </div>

              {/* Dynamic Action Buttons based on Access Status */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                  {hasFullAccess || isFree ? (
                    <Link
                      href={`/read/${book.id}`}
                      onClick={() => soundManager.playBookOpen()}
                      className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs text-center"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{hasFullAccess ? "Continue Reading" : "Read Free Now"}</span>
                    </Link>
                  ) : (
                    <>
                      {/* One Time Purchase CTA */}
                      <button
                        onClick={() => setIsCheckoutOpen(true)}
                        className="inline-flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs text-center cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Buy & Read — ₹{book.price || 199}</span>
                      </button>

                      {/* Free Preview CTA */}
                      {isPreviewable && (
                        <Link
                          href={`/read/${book.id}`}
                          onClick={() => soundManager.playBookOpen()}
                          className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-all shadow-2xs text-center"
                        >
                          <Eye className="w-4 h-4 text-[var(--secondary)]" />
                          <span>Read Free Preview</span>
                        </Link>
                      )}
                    </>
                  )}

                  {/* Add to Library Toggle */}
                  <button
                    onClick={toggleLibrary}
                    className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold border transition-colors cursor-pointer ${
                      inLibrary
                        ? "bg-[var(--card)] border-[var(--secondary)] text-[var(--secondary)]"
                        : "bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {inLibrary ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    <span>{inLibrary ? "In Library" : "Save to Library"}</span>
                  </button>
                </div>

                {!hasFullAccess && !isFree && (
                  <p className="text-xs text-[var(--muted)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>
                      Includes full reading comfort: 3D page flip, audio effects, personal bookmarks & highlights.
                    </span>
                  </p>
                )}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-[var(--border)] text-xs">
                <div>
                  <span className="text-[var(--muted)] block">Pages</span>
                  <span className="font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--primary)]" />
                    {book.pages} pages
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Est. Reading Time</span>
                  <span className="font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--secondary)]" />
                    ~{Math.round(book.pages * 1.4)} mins
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Language</span>
                  <span className="font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5 text-[var(--soft-blue)]" />
                    {book.language}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--muted)] block">Published</span>
                  <span className="font-bold text-[var(--foreground)] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                    {book.publicationDate}
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              <div>
                <h2 className="font-editorial text-xl font-bold text-[var(--foreground)] mb-2">
                  About the Book
                </h2>
                <p className="text-sm text-[var(--muted)] leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  <span className="text-xs text-[var(--muted)] mr-1">Tags:</span>
                  {book.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/explore?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1 rounded-xl text-xs bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table of Contents Section */}
          {book.tableOfContents && book.tableOfContents.length > 0 && (
            <div className="mb-16 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                  Table of Contents
                </h2>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {book.tableOfContents.map((item, index) => (
                  <Link
                    key={index}
                    href={`/read/${book.id}?page=${item.page}`}
                    className="py-3.5 flex items-center justify-between group hover:text-[var(--primary)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[var(--muted)] opacity-60 w-6">
                        0{index + 1}
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)]">
                        {item.title}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--muted)]">Page {item.page}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Books */}
          {relatedBooks.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
                  More from {book.categoryName}
                </h2>
                <Link
                  href={`/explore?category=${book.categoryId}`}
                  className="text-xs font-bold text-[var(--primary)] hover:underline"
                >
                  View full category →
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-6">
                {relatedBooks.map((b) => (
                  <BookCard key={b.id} book={b} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Checkout Drawer / Modal */}
      <CheckoutModal
        book={book}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setHasFullAccess(true);
          triggerToast("Book unlocked successfully!");
        }}
      />

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--foreground)] text-[var(--background)] text-xs font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      <Footer />
      <MobileNav />
    </div>
  );
}
