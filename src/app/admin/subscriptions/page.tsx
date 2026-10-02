"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Users,
  TrendingUp,
  DollarSign,
  AlertCircle,
  PlusCircle,
  CheckCircle,
  Save,
  Clock,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load admin subscription dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      if (res.ok) {
        showToastAlert({ title: "Saved", text: "Subscription plan updated!", icon: "success" });
        setEditingPlan(null);
        loadData();
      }
    } catch {
      showToastAlert({ title: "Error", text: "Failed to save plan", icon: "error" });
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const plans = data?.plans || [];
  const recents = data?.recentSubscriptions || [];
  const distribution = data?.planDistribution || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Recurring Revenue & Memberships
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Subscription Intelligence & Plans
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Track Monthly Recurring Revenue (MRR), subscriber growth, retention churn, and manage pricing tiers.
          </p>
        </div>
      </div>

      {/* KPI Cards: Active Subscribers, MRR, ARR, Churn */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Active Subscribers</span>
          <div className="text-3xl font-extrabold text-[var(--foreground)] mt-2">
            {metrics.activeSubscribers || 0}
          </div>
          <span className="text-[11px] text-[#3D785D] font-bold mt-1 block">
            {metrics.totalSubscribers || 0} all-time signups
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">MRR (Monthly Run Rate)</span>
          <div className="text-3xl font-extrabold text-[var(--primary)] mt-2">
            ₹{(metrics.mrr || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">Normalized monthly revenue</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">ARR (Annual Run Rate)</span>
          <div className="text-3xl font-extrabold text-[var(--foreground)] mt-2">
            ₹{(metrics.arr || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">12-month projection</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Churn Rate</span>
          <div className="text-3xl font-extrabold text-[var(--secondary)] mt-2">
            {metrics.churnRate || "0.0%"}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">
            {metrics.cancelledCount || 0} cancellations
          </span>
        </div>
      </div>

      {/* Plans Management Grid */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              Subscription Plans & Pricing Tiers
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Admin control over pricing, billing intervals, free trials, and member benefits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((p: any) => (
            <div
              key={p.id}
              className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                p.featured ? "border-[var(--primary)] bg-[var(--accent-light)]/40" : "border-[var(--border)] bg-[var(--background)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
                    {p.interval}
                  </span>
                  {p.featured && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold">
                      FEATURED
                    </span>
                  )}
                </div>

                <h4 className="font-editorial text-xl font-bold text-[var(--foreground)] mt-1">
                  {p.name}
                </h4>
                <div className="my-3">
                  <span className="text-3xl font-extrabold text-[var(--foreground)]">₹{p.price}</span>
                  <span className="text-xs text-[var(--muted)] ml-1">/ {p.interval.toLowerCase()}</span>
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">{p.description}</p>

                <div className="space-y-1.5 text-xs text-[var(--muted)]">
                  {p.benefits?.map((b: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--border)] flex items-center justify-between mt-6">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Active Subscribers:{" "}
                  <strong className="text-[var(--foreground)]">{distribution[p.name] || 0}</strong>
                </span>
                <button
                  onClick={() => setEditingPlan({ ...p })}
                  className="px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs font-bold hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Edit Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <form
            onSubmit={handleSavePlan}
            className="relative w-full max-w-lg bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                Edit {editingPlan.name}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2">
                <label className="block font-bold mb-1">Plan Name</label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Price (₹ INR)</label>
                <input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Trial Days</label>
                <input
                  type="number"
                  value={editingPlan.trialDays}
                  onChange={(e) => setEditingPlan({ ...editingPlan, trialDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ""}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)]"
              >
                Save Plan Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
