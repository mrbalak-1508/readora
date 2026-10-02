"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { EmptyShelfIllustration } from "@/components/illustrations";
import { RefreshCw, ArrowLeft } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side error gracefully
    console.error("Readora caught route error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-[var(--background)] px-6 py-12 text-center">
      <div className="mb-6">
        <EmptyShelfIllustration size={260} className="mx-auto drop-shadow-xs" />
      </div>

      <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[var(--coral)]/10 text-[var(--coral)] mb-3">
        Unexpected Bookmark Slip
      </span>

      <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
        Something ruffled our library pages
      </h1>

      <p className="text-sm text-[var(--muted)] max-w-md mt-2">
        We encountered a momentary disturbance while loading this story. You can retry reading or head back to the main shelves.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm active:scale-98 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] text-xs font-bold hover:bg-[var(--background-soft)] transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </Link>
      </div>
    </div>
  );
}
