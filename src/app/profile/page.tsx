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
  LogIn,
  UserPlus,
  User,
} from "lucide-react";

function getInitials(name?: string): string {
  if (!name) return "R";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const { user, isLoading, logout, replayTour } = useAuth();
  const [readingHours, setReadingHours] = useState("0");
  const [stats, setStats] = useState({
    booksRead: 0,
    currentlyReading: 0,
    bookmarks: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [tourMessage, setTourMessage] = useState("");

  useEffect(() => {
    // If not logged in, reset stats cleanly to 0
    if (!user) {
      setStats({ booksRead: 0, currentlyReading: 0, bookmarks: 0 });
      setReadingHours("0");
      return;
    }

    async function loadRealStats() {
      setStatsLoading(true);
      try {
        const [libRes, progRes, bmRes] = await Promise.all([
          fetch("/api/library"),
          fetch("/api/progress"),
          fetch("/api/bookmarks"),
        ]);

        let booksRead = 0;
        let currentlyReading = 0;
        let totalSeconds = 0;
        let bookmarksCount = 0;

        if (libRes.ok) {
          const library = await libRes.json();
          if (Array.isArray(library)) {
            booksRead = library.filter(
              (i: any) => i.status === "completed" || i.progress?.completed
            ).length;
            currentlyReading = library.filter(
              (i: any) =>
                i.status === "reading" ||
                (i.progress && !i.progress.completed && i.progress.currentPage > 1)
            ).length;
          }
        }

        if (progRes.ok) {
          const prog = await progRes.json();
          if (Array.isArray(prog)) {
            totalSeconds = prog.reduce((acc: number, p: any) => acc + (p.timeSpentSeconds || 0), 0);
          }
        }

        if (bmRes.ok) {
          const bm = await bmRes.json();
          if (Array.isArray(bm)) {
            bookmarksCount = bm.length;
          }
        } else {
          bookmarksCount = store.getBookmarks().length;
        }

        setStats({
          booksRead,
          currentlyReading,
          bookmarks: bookmarksCount,
        });
        setReadingHours((totalSeconds / 3600).toFixed(1));
      } catch (err) {
        console.error("Failed to load user statistics:", err);
      } finally {
        setStatsLoading(false);
      }
    }

    loadRealStats();
  }, [user]);

  const handleReplayTour = async () => {
    await replayTour();
    setTourMessage("Product tour reset. Return to the home page or browse to experience the guided tour!");
    setTimeout(() => setTourMessage(""), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Profile Card */}
        {isLoading ? (
          <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-xs mb-8 animate-pulse">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-3xl bg-[var(--bg-subtle)] shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-6 w-48 bg-[var(--bg-subtle)] rounded-lg" />
                <div className="h-4 w-32 bg-[var(--bg-subtle)] rounded-lg" />
                <div className="h-4 w-56 bg-[var(--bg-subtle)] rounded-lg" />
              </div>
            </div>
          </div>
        ) : !user ? (
          /* Guest / Unauthenticated State */
          <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="w-24 h-24 rounded-3xl border-2 border-[var(--border)] bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center shrink-0 shadow-xs">
                <User className="w-12 h-12 stroke-[1.5]" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                    Guest Reader
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--muted)] border border-[var(--border)]">
                    Not Signed In
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] max-w-xl">
                  You are exploring READORA in guest mode. Sign in to your account to save books, track reading hours, capture highlights, and sync your library across devices.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Free Account</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated User State */
          <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-[var(--border)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-hover)] shrink-0 shadow-xs flex items-center justify-center text-white">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name || "Reader Profile"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <span className="font-editorial text-3xl font-bold tracking-tight">
                    {getInitials(user.name)}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                    {user.name}
                  </h1>
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--primary)]">
                    {user.role === "admin" ? "Curator Admin" : "Library Member"}
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)]">{user.email}</p>
                <p className="text-xs text-[var(--muted)] pt-1">
                  Reading Sanctuary Member since {new Date(user.joined_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </p>

                {user.role === "admin" && (
                  <div className="pt-2">
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-light)] text-[var(--primary)] hover:opacity-90 text-xs font-bold transition-all"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Open Admin Console</span>
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Reading Statistics
            </h2>
            {!user && (
              <span className="text-[11px] text-[var(--muted)]">
                Sign in to record your stats
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--muted)]">Books Read</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <span className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                {statsLoading ? "—" : stats.booksRead}
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
                {statsLoading ? "—" : stats.currentlyReading}
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
                {statsLoading ? "—" : `${readingHours}h`}
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
                {statsLoading ? "—" : stats.bookmarks}
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
              className="px-5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
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
