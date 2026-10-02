"use client";

import React, { useState, useEffect } from "react";
import {
  Ticket,
  PlusCircle,
  CheckCircle,
  Clock,
  Tag,
  Percent,
  DollarSign,
  AlertCircle,
  Save,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderAmount: 0,
    maxDiscountAmount: 100,
    usageLimit: 500,
    perUserLimit: 1,
    active: true,
  });

  const loadCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToastAlert({ title: "Created", text: `Coupon ${formData.code} is active!`, icon: "success" });
        setIsCreating(false);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: 20,
          minOrderAmount: 0,
          maxDiscountAmount: 100,
          usageLimit: 500,
          perUserLimit: 1,
          active: true,
        });
        loadCoupons();
      }
    } catch {
      showToastAlert({ title: "Error", text: "Failed to create coupon", icon: "error" });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Promotional Engine
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Coupons & Discount Codes
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Create percentage or flat rate discounts for book purchases and subscription memberships.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(!isCreating)}
          className="px-5 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isCreating ? "Close Form" : "Create New Coupon"}</span>
        </button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form
          onSubmit={handleCreateCoupon}
          className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border-2 border-[var(--primary)] shadow-md space-y-4 animate-in fade-in slide-in-from-top-3 duration-200"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Ticket className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
              New Promotional Code
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Coupon Code</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUMMER50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] font-mono font-bold text-xs uppercase outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Discount Type</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs outline-none"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Flat Rupee (₹)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">
                Value {formData.discountType === "PERCENTAGE" ? "(%)" : "(₹)"}
              </label>
              <input
                type="number"
                required
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs font-bold outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">
                Min. Order Amount (₹)
              </label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">
                Max. Discount Limit (₹)
              </label>
              <input
                type="number"
                value={formData.maxDiscountAmount}
                onChange={(e) =>
                  setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Total Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Create Coupon</span>
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--muted)]">
            No promotional coupons created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-subtle)] text-[var(--muted)] uppercase tracking-wider text-[10px] font-bold border-b border-[var(--border)]">
                <tr>
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Discount</th>
                  <th className="py-3.5 px-6">Min Order</th>
                  <th className="py-3.5 px-6">Usage</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-sm text-[var(--primary)]">
                      {c.code}
                    </td>
                    <td className="py-4 px-6 font-bold text-[var(--foreground)]">
                      {c.discountType === "PERCENTAGE"
                        ? `${c.discountValue}% OFF`
                        : `₹${c.discountValue} OFF`}
                    </td>
                    <td className="py-4 px-6 text-[var(--muted)]">
                      {c.minOrderAmount > 0 ? `₹${c.minOrderAmount}` : "None"}
                    </td>
                    <td className="py-4 px-6 font-mono text-[var(--muted)]">
                      {c.usageCount} / {c.usageLimit || "∞"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.active
                            ? "bg-[#83B89F]/20 text-[#3D785D]"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {c.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--muted)]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
