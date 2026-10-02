"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { store } from "@/lib/data/storage";
import {
  BookOpen,
  Bookmark,
  Clock,
  Sparkles,
  Shield,
  LogOut,
  RotateCcw,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

export default function ProfilePage() {
  const { user, logout, replayTour } = useAuth();
  const [readingHours, setReadingHours] = useState("0");
  const [stats, setStats] = useState({
    booksRead: 0,
    currentlyReading: 0,
    bookmarks: 0,
  });
  const [tourMessage, setTourMessage] = useState("");

  useEffect(() => {
    const library = store.getLibrary();
    const allProgress = store.getAllProgress();
    const completed = library.filter((i) => i.status === "completed").length;
    const reading = library.filter((i) => i.status === "reading").length;
    const totalSeconds = allProgress.reduce((acc, p) => acc + (p.timeSpentSeconds || 0), 0);
    const bookmarksCount = store.getBookmarks().length;

    setStats({
      booksRead: completed,
      currentlyReading: reading,
      bookmarks: bookmarksCount,
    });
    setReadingHours((totalSeconds / 3600).toFixed(1));
  }, []);

  const handleReplayTour = async () => {
    await replayTour();
    setTourMessage("Product tour reset. Return to the home page or browse to experience the guided tour!");
    setTimeout(() => setTourMessage(""), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Profile Card */}
        <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-[var(--border)] bg-[var(--accent-light)] shrink-0 shadow-xs">
              <Image
                src={user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"}
                alt={user?.name || "Reader Profile"}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                  {user?.name || "Avid Reader"}
                </h1>
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--primary)]">
                  {user?.role === "admin" ? "Curator Admin" : "Library Member"}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)]">{user?.email || "reader@readora.library"}</p>
              <p className="text-xs text-[var(--muted)] pt-1">
                Reading Sanctuary Member since {new Date(user?.joined_at || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => logout()}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards (Section 35: Books Read, Currently Reading, Reading Time, Bookmarks) */}
        <div className="mb-8">
          <h2 className="font-editorial text-xl font-bold text-[var(--foreground)] mb-4">
            Reading Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Books Read</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                {stats.booksRead}
              </span>
              <span className="text-[11px] text-[var(--muted)] block mt-1">Completed volumes</span>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Currently Reading</span>
                <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                {stats.currentlyReading}
              </span>
              <span className="text-[11px] text-[var(--muted)] block mt-1">Active titles</span>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Reading Time</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                {readingHours}h
              </span>
              <span className="text-[11px] text-[var(--muted)] block mt-1">Total engaged</span>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Bookmarks</span>
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                {stats.bookmarks}
              </span>
              <span className="text-[11px] text-[var(--muted)] block mt-1">Saved passages</span>
            </div>
          </div>
        </div>

        {/* Guided Tour Preference */}
        <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-8 border border-[var(--border)] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Product Walkthrough & Onboarding
                </h3>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Want a refresher on the READORA library layout, reader shortcuts, and catalog discovery?
              </p>
            </div>

            <button
              onClick={handleReplayTour}
              className="px-5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-all flex items-center gap-2 shadow-xs shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Tour
            </button>
          </div>

          {tourMessage && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              {tourMessage}
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
