"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Eye,
  RefreshCw,
  FolderTree,
  BookOpen,
} from "lucide-react";

interface AdminStats {
  totalBooks: number;
  publishedBooks: number;
  totalUsers: number;
  activeReaders: number;
  booksCompleted: number;
  readingHours: string;
  trendDays: Array<{ day: string; date: string; reads: number; users: number; books: number }>;
  categoryDistribution: Array<{ name: string; count: number }>;
  mostReadBooks: Array<{
    id: string;
    slug: string;
    title: string;
    author: string;
    readCount: number;
    categoryName: string;
    coverPath: string;
    status: string;
    pages: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load analytics stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const metrics = [
    {
      label: "Active Readers",
      value: stats ? stats.activeReaders.toString() : "...",
      change: "Active reading sessions in progress",
      icon: Users,
    },
    {
      label: "Completed Reads",
      value: stats ? stats.booksCompleted.toString() : "...",
      change: "Finished cover-to-cover",
      icon: CheckCircle,
    },
    {
      label: "Immersion Recorded",
      value: stats ? `${stats.readingHours} hrs` : "...",
      change: "Prisma ReadingProgress aggregate",
      icon: Clock,
    },
    {
      label: "Catalog Volume Size",
      value: stats ? stats.totalBooks.toString() : "...",
      change: stats ? `${stats.publishedBooks} published titles` : "SQLite volumes",
      icon: BookOpen,
    },
  ];

  const maxTrend = Math.max(...(stats?.trendDays?.map((t) => t.reads) || [10]), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Intelligence Telemetry
            </span>
            <span className="text-xs text-[var(--muted)]">Prisma SQLite Aggregations</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Platform Analytics & Pacing
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Quantitative engagement signals, reading depth, completion rates, and reader retention.
          </p>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
          title="Refresh analytics data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-xs transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span className="font-bold">{m.label}</span>
                <div className="p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--primary)]">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-editorial text-3xl font-bold text-[var(--foreground)] mt-3">
                {m.value}
              </div>
              <div className="text-[11px] text-[var(--muted)] font-medium mt-1">
                {m.change}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reading Activity & Pacing Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Engagement Graph Simulated with Clean SVG */}
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                7-Day Reading Immersion Velocity
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Daily reading progress signals recorded across all digital volumes
              </p>
            </div>
            <div className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--primary)]">
              Total Logged: {stats?.readingHours || "0"} hrs
            </div>
          </div>

          {/* Bar Chart Bars */}
          <div className="h-52 flex items-end gap-3 sm:gap-6 pt-6 border-b border-[var(--border)] pb-2">
            {stats?.trendDays?.map((item, idx) => {
              const heightPercent = Math.max(14, Math.round((item.reads / maxTrend) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-full flex items-end justify-center h-44">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[42px] bg-gradient-to-t from-[var(--primary)] to-[var(--primary)]/70 hover:to-[var(--primary)] rounded-t-xl transition-all duration-300 relative"
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-[var(--background)] text-[10px] py-0.5 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-mono">
                        {item.reads} reads
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[var(--muted)] group-hover:text-[var(--foreground)]">
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-[var(--muted)]">
            <span>7 Days Ago</span>
            <span className="font-semibold text-[var(--foreground)]">Daily peak: {maxTrend} active reads</span>
            <span>Today</span>
          </div>
        </div>

        {/* Most Read Volumes Ranking */}
        <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              Leaderboard Volumes
            </h2>
            <Link href="/admin/books" className="text-xs font-bold text-[var(--primary)] hover:underline">
              All Books
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.mostReadBooks?.map((book, idx) => (
              <div
                key={book.id}
                className="flex items-center justify-between text-xs py-2.5 border-b border-[var(--border)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono text-xs text-[var(--primary)] font-bold w-5">
                    #{idx + 1}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-[var(--foreground)] truncate">{book.title}</div>
                    <div className="text-[11px] text-[var(--muted)] truncate">{book.author}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-[var(--foreground)]">
                    {book.readCount.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--muted)]">completions</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
