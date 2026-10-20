import React from "react";
import { BookOpen } from "lucide-react";

export default function ReaderLoading() {
  return (
    <div className="min-h-screen h-screen flex flex-col bg-[#faf7f2] dark:bg-[#0d1117] text-[#2c2925] dark:text-[#c9d1d9] overflow-hidden select-none transition-colors duration-200">
      {/* Top Header Placeholder */}
      <header className="w-full h-12 sm:h-13 border-b border-black/10 dark:border-white/10 px-3 sm:px-6 flex items-center justify-between gap-3 bg-white/70 dark:bg-[#161b22]/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-1">
            <div className="w-32 sm:w-48 h-3.5 rounded-md bg-neutral-200/80 dark:bg-neutral-800 animate-pulse" />
            <div className="w-20 sm:w-28 h-2.5 rounded-md bg-neutral-200/60 dark:bg-neutral-800/60 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-16 sm:w-24 h-7 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 animate-pulse" />
          <div className="w-8 h-8 rounded-lg bg-neutral-200/80 dark:bg-neutral-800 animate-pulse" />
        </div>
      </header>

      {/* Main Reading Canvas Skeleton */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
        <div className="w-full max-w-2xl aspect-[1/1.35] max-h-[78vh] rounded-none bg-white dark:bg-[#161719] shadow-xl sm:shadow-2xl border border-black/5 dark:border-white/5 flex flex-col items-center justify-center p-8 space-y-5 relative overflow-hidden animate-in fade-in duration-150">
          {/* Subtle Shimmer Sweep */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-black/[0.03] dark:via-white/[0.04] to-transparent pointer-events-none" />

          {/* Book Icon Pulse */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen className="w-8 h-8 animate-pulse" />
            </div>
            <div className="absolute -inset-2 rounded-2xl border-2 border-amber-500/20 dark:border-amber-400/20 animate-ping opacity-30" />
          </div>

          <div className="text-center space-y-2 max-w-xs">
            <h2 className="font-editorial text-lg sm:text-xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
              Opening Manuscript
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Streaming pages into Readora Reader...
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="w-48 h-1 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full w-2/3 animate-[pulse_1s_infinite]" />
          </div>
        </div>
      </main>
    </div>
  );
}
