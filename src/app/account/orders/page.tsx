"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import {
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders/user");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#83B89F]/20 text-[#3D785D]">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Paid</span>
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[var(--bg-subtle)] text-[var(--muted)]">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-16 pb-20 md:pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                Billing & Purchases
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] mt-2">
                Order & Payment History
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                View your commercial receipts, unlocked volumes, and transaction invoices.
              </p>
            </div>
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline"
            >
              <span>Back to Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-[var(--card)] border border-[var(--border)] p-8">
              <ShieldCheck className="w-12 h-12 text-[var(--muted)] opacity-50 mx-auto mb-3" />
              <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                No Transactions Yet
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 max-w-sm mx-auto">
                Any book purchases or memberships you acquire will appear here with printable receipts.
              </p>
              <Link
                href="/explore"
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
              >
                <span>Browse Library Catalog</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const firstItem = order.items?.[0];
                const book = firstItem?.book;

                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs hover:border-[var(--primary)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                  >
                    <div className="flex items-start gap-4">
                      {book ? (
                        <div className="relative w-14 aspect-[2/3] shrink-0 rounded-lg overflow-hidden book-cover-shadow book-spine">
                          <Image
                            src={book.coverPath || "/placeholder-cover.jpg"}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[var(--accent-light)] flex items-center justify-center shrink-0 text-[var(--primary)]">
                          <CreditCard className="w-6 h-6" />
                        </div>
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                            #{order.orderNumber}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <h3 className="font-editorial text-base sm:text-lg font-bold text-[var(--foreground)]">
                          {firstItem?.title || "Readora Purchase"}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                          <span>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span>•</span>
                          <span className="uppercase">
                            {order.paymentProvider || order.paymentMethod || "UPI / Card"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-[var(--border)]">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-[var(--muted)] block">Amount</span>
                        <span className="text-lg font-extrabold text-[var(--foreground)]">
                          ₹{order.totalAmount}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {book && order.status === "PAID" && (
                          <Link
                            href={`/read/${book.id}`}
                            className="px-4 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </Link>
                        )}

                        <button
                          onClick={() => setSelectedInvoice(order)}
                          className="px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--foreground)] transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>Receipt</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Printable Invoice Modal */}
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="relative w-full max-w-lg bg-white text-black rounded-3xl p-8 shadow-2xl space-y-6">
                <div className="flex items-start justify-between border-b pb-4">
                  <div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight text-[#5A3E85]">
                      READORA
                    </h3>
                    <p className="text-xs text-gray-500">Official Purchase Invoice</p>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-1 rounded-full text-gray-400 hover:text-black"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block">Invoice Number</span>
                    <span className="font-mono font-bold text-gray-800">
                      {selectedInvoice.orderNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Date</span>
                    <span className="font-semibold text-gray-800">
                      {new Date(selectedInvoice.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Status</span>
                    <span className="font-bold text-green-700">{selectedInvoice.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block">Payment Method</span>
                    <span className="font-semibold text-gray-800 uppercase">
                      {selectedInvoice.paymentProvider || selectedInvoice.paymentMethod || "Online"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-b py-3 space-y-2 text-xs">
                  {selectedInvoice.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center py-1">
                      <span className="font-semibold text-gray-800">{item.title}</span>
                      <span className="font-bold text-gray-900">₹{item.price}</span>
                    </div>
                  ))}
                  {selectedInvoice.discountAmount > 0 && (
                    <div className="flex justify-between items-center py-1 text-green-600">
                      <span>Discount</span>
                      <span>-₹{selectedInvoice.discountAmount}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Total Paid</span>
                  <span className="text-lg text-[#5A3E85]">₹{selectedInvoice.totalAmount}</span>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="px-5 py-2 rounded-xl bg-[#5A3E85] text-white text-xs font-bold hover:bg-[#482F6D]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
