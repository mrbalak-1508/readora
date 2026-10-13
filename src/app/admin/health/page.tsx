"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HardDrive,
  Database,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  FileText,
  Layers,
  Cpu,
  Clock,
  ArrowRight,
  FolderCheck,
  Server,
  Zap,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

interface HealthData {
  status: "HEALTHY" | "WARNING" | "ERROR";
  database: {
    provider: string;
    file: string;
    sizeBytes: number;
    sizeMb: string;
    latencyMs: number;
    tables: Record<string, number>;
  };
  storage: {
    provider: string;
    totalSizeBytes: number;
    totalSizeMb: string;
    books: { path: string; filesCount: number; sizeMb: string };
    covers: { path: string; filesCount: number; sizeMb: string };
    avatars: { path: string; filesCount: number; sizeMb: string };
  };
  integrity: {
    totalBooks: number;
    missingFilesCount: number;
    audit: Array<{
      bookId: string;
      title: string;
      filePath: string | null;
      status: "EXISTS" | "MISSING" | "NO_FILE";
    }>;
  };
  system: {
    nodeVersion: string;
    platform: string;
    uptimeSeconds: number;
    rssMb: string;
    heapUsedMb: string;
  };
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (err) {
      console.error("Failed to query health data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              System Diagnostics
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1 font-mono">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span>Real-Time Health Probe</span>
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Storage & System Health
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Prisma SQLite database telemetry, private storage space, file existence audits, and server resources.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh health diagnostics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[var(--muted)] bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)] mb-3" />
          Running system health audit and verifying storage blocks...
        </div>
      ) : !health ? (
        <div className="p-12 text-center text-xs text-red-500 bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xs">
          Failed to fetch health diagnostic report.
        </div>
      ) : (
        <>
          {/* Top Status Banner */}
          <div
            className={`p-6 rounded-3xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              health.status === "HEALTHY"
                ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200"
                : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`p-3 rounded-2xl ${
                  health.status === "HEALTHY"
                    ? "bg-emerald-500 text-white"
                    : "bg-amber-500 text-white"
                }`}
              >
                {health.status === "HEALTHY" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="font-editorial text-lg font-bold">
                  {health.status === "HEALTHY"
                    ? "All Systems Operational & Synced"
                    : "Storage Integrity Warning"}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {health.status === "HEALTHY"
                    ? "SQLite database responding in " + health.database.latencyMs + "ms, all book manuscripts verified on disk."
                    : `${health.integrity.missingFilesCount} manuscript files missing from private storage.`}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-white/70 dark:bg-black/30 border border-current">
                Latency: {health.database.latencyMs}ms
              </span>
            </div>
          </div>

          {/* 3 Overview Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Database Telemetry */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--primary)]" />
                <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Prisma SQLite Engine
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Database Engine:</span>
                  <span className="font-semibold text-emerald-600">SQLite (dev.db)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">DB File Size:</span>
                  <span className="font-mono font-bold text-[var(--foreground)]">{health.database.sizeMb} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Books Stored:</span>
                  <span className="font-mono font-bold">{health.database.tables.books}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Written Chapters:</span>
                  <span className="font-mono font-bold">{health.database.tables.chapters}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Asset Records:</span>
                  <span className="font-mono font-bold">{health.database.tables.assets}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--muted)]">Version Snapshots:</span>
                  <span className="font-mono font-bold">{health.database.tables.versions}</span>
                </div>
              </div>
            </div>

            {/* Storage System */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-indigo-600" />
                <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Private Object Storage
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Storage Tier:</span>
                  <span className="font-semibold text-emerald-600">Isolated Local Disk</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Total Storage Used:</span>
                  <span className="font-mono font-bold text-indigo-600">{health.storage.totalSizeMb} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Books Directory:</span>
                  <span className="font-mono font-bold">{health.storage.books.filesCount} files ({health.storage.books.sizeMb} MB)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Covers Directory:</span>
                  <span className="font-mono font-bold">{health.storage.covers.filesCount} files ({health.storage.covers.sizeMb} MB)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--muted)]">Avatars Directory:</span>
                  <span className="font-mono font-bold">{health.storage.avatars.filesCount} files ({health.storage.avatars.sizeMb} MB)</span>
                </div>
              </div>
            </div>

            {/* Process & System */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Runtime Environment
                </h2>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Node.js Version:</span>
                  <span className="font-mono font-bold">{health.system.nodeVersion}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Platform OS:</span>
                  <span className="font-mono font-bold">{health.system.platform}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Process RSS:</span>
                  <span className="font-mono font-bold text-purple-600">{health.system.rssMb} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[var(--border)]">
                  <span className="text-[var(--muted)]">Heap Memory:</span>
                  <span className="font-mono font-bold">{health.system.heapUsedMb} MB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[var(--muted)]">Process Uptime:</span>
                  <span className="font-mono font-bold">{Math.round(health.system.uptimeSeconds / 60)} minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* File Integrity Ledger */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-editorial text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                  <FolderCheck className="w-5 h-5 text-[var(--primary)]" />
                  <span>Manuscript Storage File Audit</span>
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Cross-checks database filePath records against active files in storage/books
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-[var(--muted)]">
                {health.integrity.audit.filter((a) => a.status === "EXISTS").length} / {health.integrity.totalBooks} verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--border)]">
                  <tr>
                    <th className="px-5 py-3">Book Title</th>
                    <th className="px-5 py-3">Storage Relative Path</th>
                    <th className="px-5 py-3">Physical File Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {health.integrity.audit.map((item) => (
                    <tr key={item.bookId} className="hover:bg-[var(--background)]/50">
                      <td className="px-5 py-3 font-semibold text-[var(--foreground)]">
                        {item.title}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--muted)]">
                        {item.filePath || "No file path (Written book or draft)"}
                      </td>
                      <td className="px-5 py-3">
                        {item.status === "EXISTS" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Verified on disk</span>
                          </span>
                        )}
                        {item.status === "MISSING" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-red-700 bg-red-100 dark:bg-red-950/40 dark:text-red-300 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>File Missing</span>
                          </span>
                        )}
                        {item.status === "NO_FILE" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[var(--muted)] bg-[var(--background)] px-2 py-0.5 rounded-full border border-[var(--border)]">
                            <span>Interactive / Written</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
