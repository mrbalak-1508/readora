"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  Check,
  ShieldCheck,
  Calendar,
  CreditCard,
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import confetti from "canvas-confetti";
import { soundManager } from "@/lib/sound";
import { SubscriptionModal } from "@/components/subscription/SubscriptionModal";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: "MONTHLY" | "YEARLY";
  trialDays: number;
  featured: boolean;
  description: string;
  benefits: string[];
}

export default function SubscriptionSettingsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPlanId, setModalPlanId] = useState<string | undefined>();

  useEffect(() => {
    async function loadSubscriptionData() {
      try {
        const res = await fetch("/api/subscriptions/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
          setCurrentSub(data.userSubscription || null);
        }
      } catch (err) {
        console.error("Failed to load subscription plans:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubscriptionData();
  }, [user]);

  const handleSubscribe = async (plan: Plan) => {
    setProcessingPlanId(plan.id);
    setStatusMessage("");

    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Subscription activation failed");
      }

      setCurrentSub(data.subscription);
      soundManager.playComplete();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#5A3E85", "#E97868", "#E9B949", "#8DB8D8"],
        });
      } catch {}
      setStatusMessage("You are now subscribed to Readora Premium! Enjoy unlimited reading.");
    } catch (err: any) {
      setStatusMessage(err.message || "Could not process subscription");
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will still retain access until the end of your billing cycle.")) return;

    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCurrentSub(data.subscription);
        setStatusMessage("Your subscription cancellation is confirmed. Access remains active through the billing period.");
      }
    } catch {
      setStatusMessage("Error cancelling subscription");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
              Readora Pass
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] mt-3">
              Subscription & Membership
            </h1>
            <p className="text-sm text-[var(--muted)] mt-2">
              Unlock unlimited reading access to thousands of curated digital books, 3D page immersion, and cloud synchronization.
            </p>
          </div>

          {statusMessage && (
            <div className="mb-8 p-4 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent-border)] text-xs text-[var(--primary)] font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Active Subscription Status Banner if subscribed */}
          {currentSub && (
            <div className="mb-12 p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#83B89F] animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3D785D]">
                      Active Membership
                    </span>
                  </div>
                  <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                    {currentSub.plan?.name || "Readora Annual"}
                  </h3>
                  <span className="text-xs text-[var(--muted)]">
                    Renews on {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {currentSub.cancelAtPeriodEnd ? (
                    <span className="text-xs text-amber-600 font-semibold px-3 py-1.5 rounded-xl bg-amber-500/10">
                      Cancels on period end
                    </span>
                  ) : (
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/60">
                  <span className="text-[var(--muted)] block">Membership Status</span>
                  <span className="font-bold text-[var(--foreground)] text-sm uppercase mt-0.5">
                    {currentSub.status}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/60">
                  <span className="text-[var(--muted)] block">Billing Cycle</span>
                  <span className="font-bold text-[var(--foreground)] text-sm mt-0.5">
                    ₹{currentSub.plan?.price || 1499} / {currentSub.plan?.interval?.toLowerCase() || "year"}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[var(--bg-subtle)]/60">
                  <span className="text-[var(--muted)] block">Catalog Access</span>
                  <span className="font-bold text-[#3D785D] text-sm mt-0.5">
                    Unlimited Reading
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* Monthly Plan */}
            <div className="p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-sm flex flex-col justify-between relative hover:border-[var(--primary)] transition-all">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1">
                  Flexible Option
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                  Readora Monthly
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Read month-to-month. Cancel anytime without penalty.
                </p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-[var(--foreground)]">₹199</span>
                  <span className="text-xs text-[var(--muted)] ml-1">/ month</span>
                  <span className="block text-[11px] text-[var(--secondary)] font-semibold mt-1">
                    7-day free trial included
                  </span>
                </div>

                <div className="space-y-3 py-4 border-t border-[var(--border)] text-xs text-[var(--foreground)]">
                  {[
                    "Unlimited eligible digital books",
                    "3D tactile realistic page-turning reader",
                    "Reading history and device synchronization",
                    "Bookmarks, notes and marginalia highlights",
                    "Offline reading cache",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#83B89F]/20 text-[#3D785D] flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    const monthly = plans.find((p) => p.slug === "readora-monthly") || plans[0];
                    setModalPlanId(monthly?.id || "plan-monthly");
                    setIsModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-sm font-bold text-[var(--foreground)] hover:border-[var(--primary)] transition-all shadow-2xs cursor-pointer"
                >
                  Select Monthly Mandate
                </button>
              </div>
            </div>

            {/* Annual Plan (Featured & Recommended) */}
            <div className="p-8 rounded-3xl bg-[var(--card)] border-2 border-[var(--primary)] shadow-md flex flex-col justify-between relative relative overflow-hidden">
              {/* Featured Ribbon */}
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[var(--accent)] text-black text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>SAVE 37% ANNUALLY</span>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] block mb-1">
                  Best Value Membership
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                  Readora Annual
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  A full year of unlimited curated literature and VIP author drops.
                </p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-[var(--foreground)]">₹1,499</span>
                  <span className="text-xs text-[var(--muted)] ml-1">/ year</span>
                  <span className="block text-[11px] text-[#3D785D] font-bold mt-1">
                    Equal to just ₹124 / month (Save ₹889/yr)
                  </span>
                </div>

                <div className="space-y-3 py-4 border-t border-[var(--border)] text-xs text-[var(--foreground)]">
                  {[
                    "Everything in Readora Monthly",
                    "Early access to newly acquired titles",
                    "Curated monthly editorial book drop",
                    "Exclusive author study notes and interviews",
                    "Priority reader support concierge",
                    "14-day risk-free trial period",
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={() => {
                    const annual = plans.find((p) => p.slug === "readora-annual") || plans[1] || plans[0];
                    setModalPlanId(annual?.id || "plan-annual");
                    setIsModalOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-sm font-bold text-white transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  Join Readora Annual — ₹1,499
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* E-Mandate Recurring Subscription Modal */}
        <SubscriptionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          highlightedPlanId={modalPlanId}
          onSuccess={() => {
            setIsModalOpen(false);
            window.location.reload();
          }}
        />
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
