"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  XCircle,
  Hash,
  Database,
  Eye,
  Trash2,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert, showToastAlert } from "@/lib/alerts";

interface UploadJobItem {
  id: string;
  bookId?: string | null;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: "PENDING" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
  progress: number;
  stage?: string | null;
  errorMessage?: string | null;
  retryCount: number;
  metadata?: string | null;
  createdAt: string;
  updatedAt: string;
  book?: {
    id: string;
    title: string;
    slug: string;
    format: string;
  } | null;
}

export default function UploadProcessingPage() {
  const [jobs, setJobs] = useState<UploadJobItem[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    PENDING: 0,
    UPLOADING: 0,
    PROCESSING: 0,
    READY: 0,
    FAILED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [uploadingTest, setUploadingTest] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/uploads?status=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
        if (data.counts) setStatusCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load upload jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filter]);

  const handleRetry = async (jobId: string) => {
    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry", jobId }),
      });
      if (res.ok) {
        showToastAlert("Retry initiated for upload job", "success");
        fetchJobs();
      } else {
        showErrorAlert("Failed to retry job");
      }
    } catch {
      showErrorAlert("Network error retrying job");
    }
  };

  const handleClearFailed = async () => {
    try {
      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-failed" }),
      });
      if (res.ok) {
        showToastAlert("Cleared failed jobs log", "success");
        fetchJobs();
      }
    } catch {
      showErrorAlert("Failed to clear failed jobs");
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTest(true);
    setTestProgress(10);
    setTestResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      setTestProgress(40);
      const res = await fetch("/api/admin/uploads/process", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setTestProgress(100);

      if (res.ok && data.success) {
        setTestResult(data);
        showSuccessAlert("Upload Validated", `File ${file.name} successfully verified and ingested.`);
        fetchJobs();
      } else {
        showErrorAlert("Upload Rejected", data.error || "File signature verification failed.");
      }
    } catch (err: any) {
      showErrorAlert("Upload Error", err.message || "Failed to process upload");
    } finally {
      setUploadingTest(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Asset Processing Engine
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1 font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>SQLite storage/books</span>
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Upload Processing & Asset Integrity
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Monitor manuscript ingestion pipelines, file signature verification, metadata parsing, and version tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh jobs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          {statusCounts.FAILED > 0 && (
            <button
              onClick={handleClearFailed}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Failed</span>
            </button>
          )}

          <Link
            href="/admin/books/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Book</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Total Ingestion Jobs</span>
            <FileText className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="font-editorial text-3xl font-bold text-[var(--foreground)] mt-2">
            {totalAll}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Lifetime uploads tracked</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Successfully Ingested</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-editorial text-3xl font-bold text-emerald-600 mt-2">
            {statusCounts.READY}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Ready in private storage</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>In Processing</span>
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          </div>
          <div className="font-editorial text-3xl font-bold text-blue-600 mt-2">
            {statusCounts.PROCESSING + statusCounts.UPLOADING}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Validating & extracting</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Processing Failures</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-editorial text-3xl font-bold text-red-600 mt-2">
            {statusCounts.FAILED}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Signature or size errors</div>
        </div>
      </div>

      {/* Pipeline Test Sandbox */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
              <span>Pipeline Ingestion Tester & Signature Verifier</span>
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Test server-side PDF (%PDF-) and EPUB (PK\x03\x04) magic byte inspection and page extraction.
            </p>
          </div>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-2xl p-8 text-center cursor-pointer transition-all bg-[var(--background)]/50 hover:bg-[var(--background)] group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleTestUpload}
            accept=".pdf,.epub"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] text-[var(--primary)] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="text-xs font-bold text-[var(--foreground)]">
            Click or drag a PDF or EPUB file to test server verification
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">
            Max 50MB • Checks PDF header bytes, page count extraction, SHA-256 hash, and secure storage
          </div>

          {uploadingTest && (
            <div className="max-w-xs mx-auto mt-4 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-[var(--primary)]">
                <span>Ingesting file...</span>
                <span>{testProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  style={{ width: `${testProgress}%` }}
                  className="h-full bg-[var(--primary)] transition-all duration-300"
                />
              </div>
            </div>
          )}
        </div>

        {testResult && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs space-y-2">
            <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Asset Verification Passed</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[var(--foreground)]">
              <div>
                <span className="text-[var(--muted)]">File: </span>
                <span className="font-mono font-semibold">{testResult.file?.fileName}</span>
              </div>
              <div>
                <span className="text-[var(--muted)]">Format: </span>
                <span className="font-bold text-[var(--primary)]">{testResult.file?.format}</span>
              </div>
              <div>
                <span className="text-[var(--muted)]">Pages: </span>
                <span className="font-mono font-bold">{testResult.file?.pages}</span>
              </div>
              <div>
                <span className="text-[var(--muted)]">Checksum: </span>
                <span className="font-mono text-[10px] truncate block" title={testResult.file?.checksum}>
                  {testResult.file?.checksum?.slice(0, 12)}...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Jobs Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              Ingestion Job Ledger
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Recent processing attempts, duration, and error diagnostics
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] self-start sm:self-center">
            {["ALL", "READY", "PROCESSING", "FAILED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === tab
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--muted)]">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[var(--primary)] mb-2" />
            Loading job ledger...
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[var(--background)] text-[var(--muted)] mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div className="font-editorial text-base font-bold text-[var(--foreground)]">
              No Upload Jobs Found
            </div>
            <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
              No ingestion activities match the selected filter. Upload a PDF or EPUB to see the pipeline in action.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--background)] text-[var(--muted)] uppercase text-[10px] font-bold tracking-wider border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-3.5">Manuscript / File</th>
                  <th className="px-6 py-3.5">Format & Size</th>
                  <th className="px-6 py-3.5">Status & Stage</th>
                  <th className="px-6 py-3.5">Retries</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {jobs.map((job) => {
                  let parsedMeta: any = {};
                  try {
                    if (job.metadata) parsedMeta = JSON.parse(job.metadata);
                  } catch {}

                  return (
                    <tr key={job.id} className="hover:bg-[var(--background)]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[var(--foreground)] flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[var(--muted)] shrink-0" />
                          <span className="truncate max-w-xs">{job.fileName}</span>
                        </div>
                        {job.book && (
                          <div className="text-[11px] text-[var(--primary)] font-medium mt-0.5">
                            Attached to: {job.book.title}
                          </div>
                        )}
                        {job.errorMessage && (
                          <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 max-w-md bg-red-50 dark:bg-red-950/30 p-1.5 rounded-lg border border-red-200 dark:border-red-900/40">
                            {job.errorMessage}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[var(--accent-light)] text-[var(--primary)] uppercase">
                          {job.fileType}
                        </span>
                        <div className="text-[11px] text-[var(--muted)] font-mono mt-1">
                          {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
                          {parsedMeta.pages && ` • ${parsedMeta.pages} pages`}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              job.status === "READY"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : job.status === "FAILED"
                                ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300"
                            }`}
                          >
                            {job.status === "READY" && <CheckCircle2 className="w-3 h-3" />}
                            {job.status === "FAILED" && <XCircle className="w-3 h-3" />}
                            {job.status !== "READY" && job.status !== "FAILED" && (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            )}
                            <span>{job.status}</span>
                          </span>
                        </div>
                        {job.stage && (
                          <div className="text-[10px] font-mono text-[var(--muted)] mt-1">
                            {job.stage}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 font-mono text-[11px] text-[var(--muted)]">
                        {job.retryCount}
                      </td>

                      <td className="px-6 py-4 text-[11px] text-[var(--muted)]">
                        {new Date(job.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {job.status === "FAILED" ? (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--primary)] hover:bg-[var(--accent-light)] font-bold text-[11px] transition-colors"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        ) : job.book ? (
                          <Link
                            href={`/read/${job.book.slug || job.book.id}?preview=true`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)] font-bold text-[11px] transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">Verified</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
