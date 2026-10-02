"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Check,
  ShieldCheck,
  CreditCard,
  Calendar,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Phone,
  RefreshCw,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { useAuth } from "@/context/AuthContext";
import { soundManager } from "@/lib/sound";

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

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  highlightedPlanId?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSuccess,
  highlightedPlanId,
}: SubscriptionModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mandateAuthorized, setMandateAuthorized] = useState(true);
  const [contactPhone, setContactPhone] = useState(user?.phone || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchPlans() {
      setLoadingPlans(true);
      try {
        const res = await fetch("/api/subscriptions/plans");
        if (res.ok) {
          const data = await res.json();
          const loaded: Plan[] = data.plans || [];
          setPlans(loaded);

          if (highlightedPlanId) {
            const match = loaded.find((p) => p.id === highlightedPlanId || p.slug === highlightedPlanId);
            if (match) setSelectedPlan(match);
            else setSelectedPlan(loaded[0] || null);
          } else {
            const featured = loaded.find((p) => p.featured) || loaded[0] || null;
            setSelectedPlan(featured);
          }
        }
      } catch (err) {
        console.error("Failed to load subscription plans:", err);
      } finally {
        setLoadingPlans(false);
      }
    }

    fetchPlans();
  }, [isOpen, highlightedPlanId]);

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async () => {
    if (!user) {
      router.push("/login?redirect=/settings/subscription");
      return;
    }

    if (!selectedPlan) return;

    if (!mandateAuthorized) {
      setErrorMessage("Please authorize the recurring subscription mandate to proceed.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Step 1: Create subscription order on the server
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          phone: contactPhone.trim() || user.phone || undefined,
          mandateAuthorized: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize recurring subscription");
      }

      // Step 2: Trigger celebration & success
      setIsProcessing(false);
      setIsCompleted(true);
      soundManager.playComplete();

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#5A3E85", "#E97868", "#E9B949", "#8DB8D8", "#83B89F"],
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        onClose();
        if (onSuccess) onSuccess();
        router.push("/settings/subscription");
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process recurring subscription");
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isProcessing && onClose()}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Readora Premium Membership
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Unlimited access to curated editorial literature & offline reading.
                </p>
              </div>
            </div>
            {!isProcessing && !isCompleted && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {isCompleted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#83B89F]/20 text-[#3D785D] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                Welcome to Premium!
              </h4>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                Your recurring membership is now active. All premium volumes and private editions are unlocked for you. Redirecting...
              </p>
            </div>
          ) : loadingPlans ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--primary)]" />
              <p className="text-xs text-[var(--muted)] mt-2">Loading curated plans...</p>
            </div>
          ) : (
            <div className="py-5 space-y-6">
              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {plans.map((p) => {
                  const isSelected = selectedPlan?.id === p.id;
                  const isYearly = p.interval === "YEARLY";
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-[var(--accent-light)]/40 border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-sm"
                          : "bg-[var(--bg-subtle)]/50 border-[var(--border)] hover:border-[var(--muted)]"
                      }`}
                    >
                      {p.featured && (
                        <span className="absolute -top-2.5 right-4 text-[10px] font-bold uppercase tracking-wider bg-[var(--primary)] text-white px-2.5 py-0.5 rounded-full shadow-xs">
                          Best Value
                        </span>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[var(--foreground)]">{p.name}</h4>
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                : "border-[var(--muted)]"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                            ₹{p.price}
                          </span>
                          <span className="text-xs text-[var(--muted)]">
                            /{isYearly ? "year" : "month"}
                          </span>
                        </div>

                        <p className="text-[11px] text-[var(--muted)] mt-1.5 leading-relaxed">
                          {p.description}
                        </p>

                        <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-3 text-[11px]">
                          {p.benefits.map((b, i) => (
                            <li key={i} className="flex items-center gap-2 text-[var(--foreground)]">
                              <Check className="w-3 h-3 text-[#3D785D] shrink-0" />
                              <span className="truncate">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-4 pt-2 text-[10px] text-[var(--muted)]">
                        {isYearly
                          ? "Renews annually. Cancel anytime."
                          : "Renews every month. Cancel anytime."}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Number for Mandate Notifications */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 flex items-center justify-between">
                  <span>Mobile Number (For Mandate SMS & Payment Verification)</span>
                  <span className="text-[10px] text-[var(--muted)]">
                    {user?.phone ? "From Profile" : "Required for E-Mandate"}
                  </span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* E-Mandate Recurring Authorization Card */}
              <div className="p-4 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-[var(--foreground)] block">
                      RBI-Compliant Recurring E-Mandate Terms
                    </span>
                    <p className="text-[11px] text-[var(--muted)] mt-1 leading-relaxed">
                      By authorizing this subscription, you permit a recurring auto-debit of{" "}
                      <strong className="text-[var(--foreground)]">₹{selectedPlan?.price || 0}</strong>{" "}
                      per {selectedPlan?.interval === "YEARLY" ? "year" : "month"} on your registered payment method.
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-[var(--muted)] bg-[var(--card)] p-2.5 rounded-xl border border-[var(--border)] font-mono">
                      <div>
                        <span>Max Debit Limit:</span>{" "}
                        <strong className="text-[var(--foreground)]">₹{selectedPlan?.price || 0}</strong>
                      </div>
                      <div>
                        <span>Pre-Debit Notice:</span>{" "}
                        <strong className="text-[var(--foreground)]">24h via SMS</strong>
                      </div>
                      <div>
                        <span>Cancellation:</span>{" "}
                        <strong className="text-[var(--foreground)]">Instant (1-click)</strong>
                      </div>
                      <div>
                        <span>Regulated By:</span>{" "}
                        <strong className="text-[var(--foreground)]">RBI Circular</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none text-xs">
                  <input
                    type="checkbox"
                    checked={mandateAuthorized}
                    onChange={(e) => setMandateAuthorized(e.target.checked)}
                    className="mt-0.5 accent-[var(--primary)] w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-[11px] text-[var(--foreground)]">
                    I authorize the recurring e-mandate and agree to the auto-debit terms. I understand I can cancel anytime from Settings.
                  </span>
                </label>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing || !selectedPlan || !mandateAuthorized}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing Recurring Mandate...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-200" />
                      <span>
                        Authorize E-Mandate & Pay ₹{selectedPlan?.price || 0}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[var(--muted)] text-center mt-2 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secured with 256-bit encryption. Cancel anytime with zero penalty.</span>
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
