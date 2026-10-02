"use client";

import React, { useState, useEffect } from "react";
import {
  Cookie,
  ShieldCheck,
  CheckCircle,
  XCircle,
  BarChart2,
  Users,
  Lock,
} from "lucide-react";

export default function AdminCookieAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/privacy/cookies");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to load cookie analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const rates = data?.analytics || {};
  const counts = data?.counts || {};
  const recents = data?.recentRecords || [];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
          Compliance & Data Governance
        </span>
        <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
          Cookie Consent & Privacy Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Privacy-safe telemetry on reader consent choices without capturing personally identifiable browsing data.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Total Consent Records</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-2">
            {data?.totalConsents || 0}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">Logged across sessions</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Accepted All</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#3D785D] mt-2">
            {rates.acceptedAllRate || "0%"}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">
            {counts.acceptedAll || 0} readers
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Rejected Non-Essential</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--secondary)] mt-2">
            {rates.rejectedNonEssentialRate || "0%"}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">
            {counts.rejectedNonEssential || 0} readers
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Analytics Opt-In</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mt-2">
            {rates.analyticsRate || "0%"}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">
            {counts.analyticsCount || 0} agreed
          </span>
        </div>
      </div>

      {/* Category Acceptance Breakdown */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
        <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
          Consent Distribution by Category
        </h3>

        <div className="space-y-4 pt-2">
          {/* Strictly Necessary */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Strictly Necessary (Authentication, CSRF, Security)</span>
              <span>100% (Mandatory)</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div className="h-full bg-[var(--primary)] rounded-full w-full" />
            </div>
          </div>

          {/* Functional */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Functional (Theme memory, reader typography, audio volume)</span>
              <span>{rates.functionalRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[#83B89F] rounded-full transition-all duration-500"
                style={{ width: rates.functionalRate || "0%" }}
              />
            </div>
          </div>

          {/* Analytics */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Analytics (Aggregated page turns & volume completions)</span>
              <span>{rates.analyticsRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[#8DB8D8] rounded-full transition-all duration-500"
                style={{ width: rates.analyticsRate || "0%" }}
              />
            </div>
          </div>

          {/* Marketing */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span>Marketing & Promotions (Curated book drop notifications)</span>
              <span>{rates.marketingRate || "0%"}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className="h-full bg-[var(--secondary)] rounded-full transition-all duration-500"
                style={{ width: rates.marketingRate || "0%" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="p-4 rounded-2xl bg-[var(--accent-light)]/60 border border-[var(--accent-border)] text-xs text-[var(--primary)] flex items-center gap-3">
        <Lock className="w-5 h-5 shrink-0" />
        <span>
          Compliance Note: Readora does not store personally identifiable browsing fingerprints. Only binary aggregate consent preferences are maintained.
        </span>
      </div>
    </div>
  );
}
