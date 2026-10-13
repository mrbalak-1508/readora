"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cookie,
  ShieldCheck,
  CheckCircle,
  XCircle,
  BarChart2,
  Users,
  Lock,
  ArrowLeft,
  FileText,
  Database,
  RefreshCw,
} from "lucide-react";

export default function AdminPrivacyGovernancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/privacy/cookies");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load privacy analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const rates = data?.analytics || {};
  const counts = data?.counts || {};
  const recents = data?.recentRecords || [];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Compliance &amp; Data Governance
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Privacy Governance &amp; Cookie Consent
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Privacy-safe telemetry on reader consent choices, regulatory data hygiene, and telemetry policies.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs cursor-pointer"
          title="Refresh privacy telemetry"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--muted)]">Total Consent Records</span>
          <div className="text-xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-1 sm:mt-2">
            {data?.totalConsents || 0}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-1 block">Logged sessions</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--muted)]">Accepted All</span>
          <div className="text-xl sm:text-3xl font-extrabold text-[#3D785D] mt-1 sm:mt-2">
            {rates.acceptedAllRate || "0%"}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-1 block truncate">
            {counts.acceptedAll || 0} readers
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--muted)]">Strictly Essential</span>
          <div className="text-xl sm:text-3xl font-extrabold text-[var(--secondary)] mt-1 sm:mt-2">
            {rates.rejectedNonEssentialRate || "0%"}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-1 block truncate">
            {counts.rejectedNonEssential || 0} readers
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-[11px] sm:text-xs font-semibold text-[var(--muted)]">Analytics Opt-In</span>
          <div className="text-xl sm:text-3xl font-extrabold text-[var(--primary)] mt-1 sm:mt-2">
            {rates.analyticsRate || "0%"}
          </div>
          <span className="text-[10px] sm:text-[11px] text-[var(--muted)] mt-1 block truncate">
            {counts.analyticsCount || 0} agreed
          </span>
        </div>
      </div>

      {/* Category Acceptance Breakdown */}
      <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
        <h3 className="font-editorial text-lg sm:text-xl font-bold text-[var(--foreground)]">
          Consent Distribution by Category
        </h3>

        <div className="space-y-4 pt-1 sm:pt-2">
          {/* Strictly Necessary */}
          <div>
            <div className="flex flex-wrap justify-between text-xs font-bold mb-1 gap-1">
              <span>Strictly Necessary (Authentication, CSRF, Security)</span>
              <span className="text-[var(--primary)]">100% (Mandatory)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
              <div className="h-full bg-[var(--primary)] rounded-full w-full" />
            </div>
          </div>

          {/* Functional */}
          <div>
            <div className="flex flex-wrap justify-between text-xs font-bold mb-1 gap-1">
              <span>Functional (Theme memory, reader typography, audio volume)</span>
              <span>{rates.functionalRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[#83B89F] rounded-full transition-all duration-500"
                style={{ width: rates.functionalRate || "0%" }}
              />
            </div>
          </div>

          {/* Analytics */}
          <div>
            <div className="flex flex-wrap justify-between text-xs font-bold mb-1 gap-1">
              <span>Analytics (Aggregated page turns &amp; reading progress)</span>
              <span>{rates.analyticsRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[#8DB8D8] rounded-full transition-all duration-500"
                style={{ width: rates.analyticsRate || "0%" }}
              />
            </div>
          </div>

          {/* Marketing */}
          <div>
            <div className="flex flex-wrap justify-between text-xs font-bold mb-1 gap-1">
              <span>Marketing &amp; Promotions (Curated book drop notifications)</span>
              <span>{rates.marketingRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--background)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full bg-[var(--secondary)] rounded-full transition-all duration-500"
                style={{ width: rates.marketingRate || "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Policies & Governance Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <h4 className="font-editorial text-base font-bold text-[var(--foreground)]">
              Data Minimization Architecture
            </h4>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Readora does not store personally identifiable browsing fingerprints or cross-site tracking tags. Reader progress is strictly localized or tied to authenticated user profiles.
          </p>
          <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            ✓ GDPR &amp; DPDP compliance mode active
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[var(--card)] border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[var(--primary)] shrink-0" />
            <h4 className="font-editorial text-base font-bold text-[var(--foreground)]">
              User Consent Controls
            </h4>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Users can revisit or revoke cookie consents at any time via the public footer link at <code className="px-1.5 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[10px]">/privacy/cookies</code>.
          </p>
          <Link
            href="/privacy/cookies"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            <span>View Public Consent Page →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
