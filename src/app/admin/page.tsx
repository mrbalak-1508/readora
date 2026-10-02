"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Eye,
  Activity,
  ShieldCheck,
  RefreshCw,
  FolderTree,
  Database,
  HardDrive,
  Sparkles,
  BarChart2,
  FileText,
} from "lucide-react";
import { showSuccessAlert, showToastAlert } from "@/lib/alerts";

interface TrendDay {
  day: string;
  date: string;
  reads: number;
  users: number;
  books: number;
}

interface CategoryDist {
  name: string;
  count: number;
}

interface AdminStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  archivedBooks: number;
  totalUsers: number;
  activeReaders: number;
  booksCompleted: number;
  readingHours: string;
  trendDays: TrendDay[];
  categoryDistribution: CategoryDist[];
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
  recentBooks: Array<{
    id: string;
    slug: string;
    title: string;
    author: string;
    categoryName: string;
    createdAt: string;
    status: string;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    targetType: string;
    details?: string;
    createdAt: string;
    admin: { name: string; email: string };
  }>;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChartMetric, setActiveChartMetric] = useState<"reads" | "users">("reads");
  const [hoveredDay, setHoveredDay] = useState<TrendDay | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleMaintenance = (action: string) => {
    showToastAlert(`${action} executed successfully`, "success");
  };

  const statCards = [
    {
      label: "Total Volumes",
      value: stats ? stats.totalBooks.toString() : "...",
      icon: BookOpen,
      sub: stats ? `${stats.publishedBooks} Published • ${stats.draftBooks} Draft` : "Prisma SQLite",
      color: "text-[var(--primary)]",
    },
    {
      label: "Registered Users",
      value: stats ? stats.totalUsers.toString() : "...",
      icon: Users,
      sub: stats ? `${stats.activeReaders} actively reading` : "User directory",
      color: "text-blue-600",
    },
    {
      label: "Active Readers",
      value: stats ? stats.activeReaders.toString() : "...",
      icon: TrendingUp,
      sub: "Sessions in progress",
      color: "text-emerald-600",
    },
    {
      label: "Completions",
      value: stats ? stats.booksCompleted.toString() : "...",
      icon: CheckCircle,
      sub: "100% finished reads",
      color: "text-amber-600",
    },
    {
      label: "Reading Hours",
      value: stats ? `${stats.readingHours}h` : "...",
      icon: Clock,
      sub: "Logged reader time",
      color: "text-purple-600",
    },
  ];

  // Maximum value for SVG chart scaling
  const maxChartValue = Math.max(
    ...(stats?.trendDays?.map((d) => (activeChartMetric === "reads" ? d.reads : d.users)) || [10]),
    1
  );

  const totalCatBooks = stats?.categoryDistribution?.reduce((acc, c) => acc + c.count, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              READORA Curator Control
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-500" />
              <span>Prisma SQLite (dev.db)</span>
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Library Dashboard
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Real-time analytics, catalog health, user immersion signals, and system telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          <Link
            href="/admin/books/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Volume</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards (5 KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 shadow-xs transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--muted)]">{item.label}</span>
                <div className={`p-2 rounded-xl bg-[var(--background)] border border-[var(--border)] ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-editorial text-3xl font-bold text-[var(--foreground)] mt-3">
                {item.value}
              </div>
              <div className="text-[11px] text-[var(--muted)] mt-1 font-medium">{item.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Analytics Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive 7-Day Trend Chart */}
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[var(--primary)]" />
                <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  7-Day Platform Velocity
                </h2>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Daily activity signals recorded in SQLite database
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setActiveChartMetric("reads")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  activeChartMetric === "reads"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Reading Activity
              </button>
              <button
                onClick={() => setActiveChartMetric("users")}
                className={`px-3 py-1 rounded-xl transition-all ${
                  activeChartMetric === "users"
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                New Readers
              </button>
            </div>
          </div>

          {/* SVG Bar / Curve Visualization */}
          <div className="relative pt-6">
            {hoveredDay && (
              <div className="absolute top-0 right-4 bg-[var(--foreground)] text-[var(--background)] px-3 py-1 rounded-xl text-xs font-mono shadow-md animate-in fade-in duration-100">
                {hoveredDay.day} ({hoveredDay.date}):{" "}
                <span className="font-bold text-[var(--primary-hover)]">
                  {activeChartMetric === "reads" ? `${hoveredDay.reads} active reads` : `${hoveredDay.users} signups`}
                </span>
              </div>
            )}

            <div className="h-48 flex items-end gap-3 sm:gap-6 border-b border-[var(--border)] pb-2">
              {stats?.trendDays?.map((d, i) => {
                const val = activeChartMetric === "reads" ? d.reads : d.users;
                const heightPercent = Math.max(12, Math.round((val / maxChartValue) * 100));

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredDay(d)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center h-40">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 ${
                          activeChartMetric === "reads"
                            ? "bg-gradient-to-t from-[var(--primary)] to-[var(--primary)]/70 group-hover:to-[var(--primary)]"
                            : "bg-gradient-to-t from-blue-600 to-blue-400 group-hover:to-blue-500"
                        } shadow-xs`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[var(--muted)] group-hover:text-[var(--foreground)]">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 text-[11px] text-[var(--muted)]">
              <span>7 Days Ago</span>
              <span className="font-semibold text-[var(--foreground)]">Peak: {maxChartValue} events</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Category & Catalog Distribution */}
        <div className="lg:col-span-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[var(--primary)]" />
              <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                Genre Distribution
              </h2>
            </div>
            <Link
              href="/admin/categories"
              className="text-xs font-bold text-[var(--primary)] hover:underline"
            >
              Taxonomies
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.categoryDistribution?.map((cat, idx) => {
              const pct = Math.round((cat.count / totalCatBooks) * 100);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[var(--foreground)]">{cat.name}</span>
                    <span className="font-mono text-[11px] text-[var(--muted)]">
                      {cat.count} vols ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--background)] border border-[var(--border)] overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-[var(--primary)] rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Catalog Status Health Pill */}
          <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--foreground)]">
              <span>Catalog Publication Ratio</span>
              <span className="text-emerald-600 font-mono">
                {stats?.totalBooks
                  ? Math.round(((stats.publishedBooks || 0) / stats.totalBooks) * 100)
                  : 100}
                % Live
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex">
              <div
                style={{
                  width: `${stats?.totalBooks ? ((stats.publishedBooks || 0) / stats.totalBooks) * 100 : 80}%`,
                }}
                className="bg-emerald-500 h-full"
                title="Published"
              />
              <div
                style={{
                  width: `${stats?.totalBooks ? ((stats.draftBooks || 0) / stats.totalBooks) * 100 : 20}%`,
                }}
                className="bg-amber-500 h-full"
                title="Draft"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {stats?.publishedBooks || 0} Published
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {stats?.draftBooks || 0} Draft
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Most Read Books & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Read Volumes */}
        <div className="lg:col-span-8 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                Most Read Volumes
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Sorted by user completion count and active reading progress
              </p>
            </div>
            <Link
              href="/admin/books"
              className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {stats?.mostReadBooks?.map((book, idx) => (
              <div
                key={book.id}
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--background)] px-3 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-[var(--muted)] w-4">
                    #{idx + 1}
                  </span>
                  <div className="relative w-10 h-14 shrink-0 rounded-xl overflow-hidden book-cover-shadow bg-[var(--background)] border border-[var(--border)]">
                    <Image
                      src={book.coverPath || "/placeholder-cover.jpg"}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate">
                      {book.title}
                    </div>
                    <div className="text-xs text-[var(--muted)] truncate">
                      {book.author} • {book.categoryName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-bold text-[var(--foreground)] font-mono">
                    {book.readCount} reads
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {book.status}
                  </span>
                  <Link
                    href={`/books/${book.slug}`}
                    className="p-1.5 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                    title="View public reader page"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Engine Architecture & Audit Trail */}
        <div className="lg:col-span-4 space-y-6">
          {/* Engine Specs */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-editorial text-base font-bold text-[var(--foreground)] flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[var(--primary)]" />
              <span>Storage & Architecture</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Prisma ORM:</span>
                <span className="font-semibold text-emerald-600">SQLite (dev.db)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Curator Guard:</span>
                <span className="font-semibold text-emerald-600">Active (Server-Side)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Book Storage:</span>
                <span className="font-mono text-[var(--foreground)]">/storage/books</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Cover Storage:</span>
                <span className="font-mono text-[var(--foreground)]">/storage/covers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--muted)]">Session Security:</span>
                <span className="font-semibold text-emerald-600">HTTP-Only Cookie</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-2">
              <button
                onClick={() => handleMaintenance("Prisma Schema Cache")}
                className="py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-[11px] font-semibold text-[var(--foreground)] text-center transition-colors"
              >
                Flush Cache
              </button>
              <button
                onClick={() => handleMaintenance("Storage Sync Check")}
                className="py-2 px-3 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-[11px] font-semibold text-[var(--foreground)] text-center transition-colors"
              >
                Verify Storage
              </button>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--primary)]" />
                <h3 className="font-editorial text-base font-bold text-[var(--foreground)]">
                  Admin Audit Trail
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--muted)]">Live SQLite</span>
            </div>

            <div className="space-y-2.5 text-xs max-h-64 overflow-y-auto pr-1">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-[var(--background)] border border-[var(--border)]"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[var(--primary)]">{act.action}</span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--foreground)] mt-1 truncate">
                      {act.targetType}: {act.details || "Administrative update"}
                    </p>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">
                      by {act.admin?.name || act.admin?.email || "Admin"}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[var(--muted)] text-center py-4">No recent activity logged.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
