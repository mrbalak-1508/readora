"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  BookOpen,
  DollarSign,
  Sparkles,
  ShoppingBag,
  ArrowUpRight,
} from "lucide-react";

export default function AdminSalesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      try {
        const res = await fetch("/api/admin/sales");
        if (res.ok) {
          const resData = await res.json();
          setData(resData);
        }
      } catch (err) {
        console.error("Sales fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSales();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
      </div>
    );
  }

  const revenue = data?.revenue || { today: 0, week: 0, month: 0, year: 0, total: 0 };
  const stats = data?.stats || {};
  const topSelling = data?.topSellingBooks || [];
  const mostRead = data?.mostReadBooks || [];
  const providerRev = data?.revenueByProvider || {};

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
          Executive Intelligence
        </span>
        <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
          Sales & Commercial Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Monitor revenue benchmarks, subscriber retention, and top-performing book acquisitions.
        </p>
      </div>

      {/* Revenue Timeframe Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">Revenue Today</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-2">
            ₹{revenue.today.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>Real-time settled</span>
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">This Week</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-2">
            ₹{revenue.week.toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">Past 7 rolling days</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">This Month</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--primary)] mt-2">
            ₹{revenue.month.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#3D785D] font-bold mt-1 block">Current billing period</span>
        </div>

        <div className="p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs">
          <span className="text-xs font-semibold text-[var(--muted)]">This Year</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] mt-2">
            ₹{revenue.year.toLocaleString()}
          </div>
          <span className="text-[11px] text-[var(--muted)] mt-1 block">YTD gross receipts</span>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] font-medium">Active Subscribers</span>
          <div className="text-xl font-bold text-[var(--foreground)] mt-1">
            {stats.activeSubscribers || 0} readers
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] font-medium">Conversion Rate</span>
          <div className="text-xl font-bold text-[#3D785D] mt-1">
            {stats.conversionRate || "4.8%"}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] font-medium">Average Order Value</span>
          <div className="text-xl font-bold text-[var(--foreground)] mt-1">
            ₹{stats.averageOrderValue || 0}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
          <span className="text-xs text-[var(--muted)] font-medium">Completed Purchases</span>
          <div className="text-xl font-bold text-[var(--foreground)] mt-1">
            {stats.totalOrders || 0} orders
          </div>
        </div>
      </div>

      {/* Two Column Layout: Top Selling Books & Gateway Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Top-Selling Volumes */}
        <div className="lg:col-span-7 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              Top-Selling Books by Revenue
            </h3>
            <Link href="/admin/orders" className="text-xs font-bold text-[var(--primary)] hover:underline">
              View all orders →
            </Link>
          </div>

          {topSelling.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--muted)]">
              No individual book sales logged yet.
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {topSelling.map((b: any, index: number) => (
                <div key={index} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--muted)] opacity-50 w-5">
                      0{index + 1}
                    </span>
                    <div>
                      <h4 className="font-editorial font-bold text-sm text-[var(--foreground)]">
                        {b.title}
                      </h4>
                      <span className="text-[11px] text-[var(--muted)]">
                        {b.count} orders unlocked
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold text-[var(--primary)]">
                    ₹{b.revenue.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Payment Gateway */}
        <div className="lg:col-span-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 shadow-xs space-y-4">
          <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
            Revenue by Payment Gateway
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/60 border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] block">Razorpay</span>
                <span className="text-[10px] text-[var(--muted)]">UPI, Cards, NetBanking (India)</span>
              </div>
              <span className="text-sm font-bold text-[var(--primary)]">
                ₹{(providerRev.razorpay || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/60 border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] block">Stripe</span>
                <span className="text-[10px] text-[var(--muted)]">International Credit & Debit</span>
              </div>
              <span className="text-sm font-bold text-[var(--primary)]">
                ₹{(providerRev.stripe || 0).toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/60 border border-[var(--border)] flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--foreground)] block">PayPal</span>
                <span className="text-[10px] text-[var(--muted)]">Global Wallets</span>
              </div>
              <span className="text-sm font-bold text-[var(--primary)]">
                ₹{(providerRev.paypal || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/admin/settings/payments"
              className="w-full py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors flex items-center justify-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Configure Gateways</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
