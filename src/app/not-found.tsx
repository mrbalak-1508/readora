import React from "react";
import Link from "next/link";
import { EmptyShelfIllustration } from "@/components/illustrations";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
      <div className="mb-6">
        <EmptyShelfIllustration size={280} className="mx-auto drop-shadow-xs" />
      </div>

      <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
        Looks like this page got lost between the shelves.
      </h1>

      <p className="text-sm text-[var(--muted)] max-w-md mt-2">
        The book or passage you were seeking might have been moved or returned to the archives.
      </p>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm active:scale-98"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Library</span>
      </Link>
    </div>
  );
}
