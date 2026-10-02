"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  CreditCard,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to load admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#83B89F]/20 text-[#3D785D]">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>PAID</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>PENDING</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAILED</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-700">
            <span>REFUNDED</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Commerce Operations
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Orders & Transactions
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Real-time audit log of customer checkouts, book unlocks, and payment events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/sales"
            className="px-4 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
          >
            View Sales Dashboard →
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, User email, Book title..."
            className="w-full pl-10 pr-4 py-2 rounded-2xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["ALL", "PAID", "PENDING", "FAILED", "REFUNDED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-[var(--primary)] text-white shadow-2xs"
                  : "bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted)]">
            No matching orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--muted)] uppercase tracking-wider text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-3.5 px-6">Order ID</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Item / Book</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Payment Method</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {orders.map((o) => {
                  const firstItem = o.items?.[0];
                  return (
                    <tr key={o.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[var(--foreground)]">
                        #{o.orderNumber}
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-[var(--foreground)]">{o.user?.name}</div>
                        <div className="text-[11px] text-[var(--muted)]">{o.user?.email}</div>
                      </td>
                      <td className="py-4 px-6 max-w-[200px] truncate">
                        <div className="font-semibold text-[var(--foreground)] truncate">
                          {firstItem?.title || "Digital Book"}
                        </div>
                        {firstItem?.book && (
                          <div className="text-[10px] text-[var(--muted)]">
                            {firstItem.book.categoryName}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-extrabold text-[var(--foreground)]">
                        ₹{o.totalAmount}
                      </td>
                      <td className="py-4 px-6 uppercase font-mono text-[11px] text-[var(--muted)]">
                        {o.paymentProvider || o.paymentMethod || "Razorpay"}
                      </td>
                      <td className="py-4 px-6">{getStatusBadge(o.status)}</td>
                      <td className="py-4 px-6 text-[var(--muted)]">
                        {new Date(o.createdAt).toLocaleDateString()}
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
