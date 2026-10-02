"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Sparkles, ArrowRight, ShieldCheck, BookOpen } from "lucide-react";
import { Book } from "@/lib/types";
import { CheckoutModal } from "@/components/checkout/CheckoutModal";

interface PreviewPaywallModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  previewPages: number;
}

export function PreviewPaywallModal({
  book,
  isOpen,
  onClose,
  previewPages,
}: PreviewPaywallModalProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Paywall Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden text-center"
          >
            {/* Soft Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[var(--secondary)]/15 rounded-full blur-3xl pointer-events-none" />

            {/* Illustration / Icon Header */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--primary)] flex items-center justify-center mb-4 shadow-sm">
              <Lock className="w-8 h-8" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--secondary)] bg-[var(--secondary)]/10 px-3 py-1 rounded-full">
              End of Free Preview ({previewPages} pages)
            </span>

            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-3">
              You&apos;ve reached the end of the free preview.
            </h3>

            <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 max-w-sm mx-auto leading-relaxed">
              Continue reading <strong className="text-[var(--foreground)] font-semibold">&ldquo;{book.title}&rdquo;</strong> and keep every chapter, bookmark, and highlight within reach.
            </p>

            {/* Book Mini Card */}
            <div className="my-5 p-3.5 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] flex items-center gap-3.5 text-left">
              <div className="relative w-12 aspect-[2/3] rounded-lg overflow-hidden shrink-0 book-cover-shadow book-spine">
                <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="48px" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-editorial font-bold text-sm text-[var(--foreground)] truncate">
                  {book.title}
                </h4>
                <p className="text-xs text-[var(--muted)] truncate">by {book.author}</p>
                <span className="text-xs font-bold text-[var(--primary)] block mt-0.5">
                  ₹{book.price || 199} One-Time Lifetime Purchase
                </span>
              </div>
            </div>

            {/* Paywall CTA Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Buy This Book for ₹{book.price || 199}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/explore"
                className="w-full py-3 px-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Unlock All Books with Readora Premium</span>
              </Link>
            </div>

            {/* Gentle dismissal button so user isn't stuck */}
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)]">
              <button
                onClick={onClose}
                className="hover:underline hover:text-[var(--foreground)] transition-colors"
              >
                Stay on page {previewPages}
              </button>
              <Link href="/library" className="hover:underline hover:text-[var(--primary)]">
                Back to My Library
              </Link>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Embedded Checkout Modal */}
      <CheckoutModal
        book={book}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          onClose();
          window.location.reload();
        }}
      />
    </>
  );
}
