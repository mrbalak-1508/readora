"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Book } from "@/lib/types";
import { Trophy, Clock, BookOpen, RotateCcw, ArrowRight } from "lucide-react";
import { formatReadingTime } from "@/lib/utils";

interface CompletionModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  readingTimeSeconds: number;
  onReadAgain: () => void;
  hasFullAccess?: boolean;
}

export function CompletionModal({
  book,
  isOpen,
  onClose,
  readingTimeSeconds,
  onReadAgain,
  hasFullAccess = true,
}: CompletionModalProps) {
  useEffect(() => {
    if (isOpen && hasFullAccess) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8A2846", "#D96282", "#E5A93C", "#3B82F6"],
        });
      } catch {
        // safe fallback
      }
    }
  }, [isOpen, hasFullAccess]);

  // NEVER show volume completion dialog in preview / demo mode
  if (!isOpen || !hasFullAccess) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-main)] p-6 sm:p-8 shadow-2xl z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center mx-auto mb-4 border border-[var(--accent-border)]">
          <Trophy className="w-7 h-7" />
        </div>

        <div className="text-xs uppercase font-semibold tracking-widest text-[var(--accent)] mb-1">
          Volume Completed
        </div>

        <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--text-main)] mb-2">
          You&apos;ve finished {book.title}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-6">
          Congratulations on completing this masterwork. Another chapter in your lifelong intellectual journey.
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 py-4 border-y border-[var(--border-main)] mb-6 text-left">
          <div className="bg-[var(--bg-subtle)] p-3 rounded-xl">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[var(--text-subtle)]" />
              <span>Time Spent</span>
            </div>
            <div className="font-editorial text-lg font-bold text-[var(--text-main)] mt-0.5">
              {formatReadingTime(readingTimeSeconds)}
            </div>
          </div>
          <div className="bg-[var(--bg-subtle)] p-3 rounded-xl">
            <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[var(--text-subtle)]" />
              <span>Pages Read</span>
            </div>
            <div className="font-editorial text-lg font-bold text-[var(--text-main)] mt-0.5">
              {book.pages} pages
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-2.5">
          <Link
            href="/library"
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--accent)] text-white text-xs sm:text-sm font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            <span>Back to My Library</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => {
              onReadAgain();
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--border-main)] text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Read Again from Beginning</span>
          </button>
        </div>
      </div>
    </div>
  );
}
