"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  CreditCard,
  Tag,
  CheckCircle,
  Loader2,
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle,
  Phone,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Book } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { soundManager } from "@/lib/sound";

interface CheckoutModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CheckoutModal({ book, isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [contactPhone, setContactPhone] = useState(user?.phone || "");

  const [paymentProvider, setPaymentProvider] = useState<"razorpay" | "stripe" | "paypal">("razorpay");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const basePrice = book.price || 199;
  const originalPrice = book.originalPrice || basePrice + 100;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError("");

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: basePrice }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon code");
      } else {
        setAppliedCoupon({
          code: data.code,
          discountAmount: data.discountAmount,
          message: data.message,
        });
        soundManager.playBookmark();
      }
    } catch {
      setCouponError("Network error while verifying coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyAndComplete = async (
    orderId: string,
    providerPaymentId: string,
    providerOrderId?: string,
    providerSignature?: string,
    provider: string = "razorpay"
  ) => {
    const verifyRes = await fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        providerPaymentId,
        providerOrderId,
        providerSignature,
        provider,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) {
      throw new Error(verifyData.error || "Payment verification failed");
    }

    triggerSuccess();
  };

  const handleProceedPayment = async () => {
    if (!user) {
      router.push(`/login?redirect=/books/${book.slug}`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      // Step 1: Create Order Server-Side
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          couponCode: appliedCoupon?.code,
          provider: paymentProvider,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to initialize order");
      }

      // Step 2: Instant zero-amount fulfillment (100% coupon)
      if (orderData.isZeroAmount) {
        triggerSuccess();
        return;
      }

      const paymentData = orderData.paymentData;
      const keyId = paymentData?.keyId;

      // Check if real key is configured vs default placeholder
      const isPlaceholderKey =
        !keyId ||
        keyId.includes("live_sim") ||
        keyId.includes("test_readora") ||
        !keyId.startsWith("rzp_");

      if (paymentProvider === "razorpay") {
        if (isPlaceholderKey) {
          // If keys are placeholder demo keys, inform user and seamlessly fulfill via simulation
          setErrorMessage(
            "Note: Razorpay test key is not yet configured in Admin Settings. Unlocking via dev simulation mode..."
          );
          setTimeout(async () => {
            try {
              await verifyAndComplete(
                orderData.orderId,
                `pay_sim_${Date.now()}`,
                paymentData?.providerOrderId,
                "simulated_valid_signature",
                paymentProvider
              );
            } catch (err: any) {
              setErrorMessage(err.message || "Payment verification failed");
              setIsProcessing(false);
            }
          }, 1200);
          return;
        }

        // Step 3: Load Razorpay Checkout SDK and open popup
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded || !(window as any).Razorpay) {
          throw new Error("Unable to load Razorpay Checkout script. Please check your internet connection.");
        }

        const options: any = {
          key: keyId,
          amount: paymentData.amount, // in paise
          currency: paymentData.currency || "INR",
          name: "READORA",
          description: `Unlock: ${book.title}`,
          image: book.coverUrl || "/icons/icon-192.png",
          prefill: {
            name: user.name || "",
            email: user.email || "",
            contact: contactPhone.trim() || user?.phone || "",
          },
          theme: {
            color: "#5A3E85",
          },
          handler: async function (response: any) {
            try {
              setIsProcessing(true);
              await verifyAndComplete(
                orderData.orderId,
                response.razorpay_payment_id,
                response.razorpay_order_id || paymentData?.providerOrderId,
                response.razorpay_signature,
                "razorpay"
              );
            } catch (err: any) {
              setErrorMessage(err.message || "Payment verification failed");
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        // Attach order_id if registered via Razorpay API
        if (paymentData.isRealOrder && paymentData.providerOrderId) {
          options.order_id = paymentData.providerOrderId;
        }

        const razorpayInstance = new (window as any).Razorpay(options);
        razorpayInstance.on("payment.failed", function (resp: any) {
          setErrorMessage(resp.error?.description || "Payment failed at gateway. Please try again.");
          setIsProcessing(false);
        });

        razorpayInstance.open();
        return;
      }

      // Default fallback verification for non-Razorpay simulation
      await verifyAndComplete(
        orderData.orderId,
        `pay_sim_${Date.now()}`,
        paymentData?.providerOrderId,
        "simulated_valid_signature",
        paymentProvider
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong during payment processing");
      setIsProcessing(false);
    }
  };

  const triggerSuccess = () => {
    setIsProcessing(false);
    setIsCompleted(true);
    soundManager.playComplete();

    // Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#5A3E85", "#E97868", "#E9B949", "#8DB8D8", "#83B89F"],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onClose();
      if (onSuccess) onSuccess();
      router.push(`/read/${book.id}`);
    }, 2000);
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
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[var(--accent-light)] text-[var(--primary)]">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Unlock Book
                </h3>
                <span className="text-[11px] text-[var(--muted)]">
                  Secure 256-bit Encrypted Checkout
                </span>
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

          {/* Success State */}
          {isCompleted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#83B89F]/20 text-[#3D785D] mx-auto flex items-center justify-center">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                Purchase Confirmed!
              </h4>
              <p className="text-sm text-[var(--muted)] max-w-md mx-auto">
                &ldquo;{book.title}&rdquo; is now unlocked permanently in your library. Redirecting
                you into the 3D reader...
              </p>
            </div>
          ) : (
            <div className="py-5 space-y-6">
              {/* Book Summary Card */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
                <div className="relative w-16 aspect-[2/3] shrink-0 rounded-lg overflow-hidden book-cover-shadow book-spine">
                  <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--secondary)] block">
                    {book.categoryName}
                  </span>
                  <h4 className="font-editorial font-bold text-base text-[var(--foreground)] truncate">
                    {book.title}
                  </h4>
                  <p className="text-xs text-[var(--muted)] truncate">by {book.author}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="font-bold text-[var(--foreground)]">₹{basePrice}</span>
                    {originalPrice > basePrice && (
                      <span className="text-[var(--muted)] line-through text-[11px]">
                        ₹{originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Coupon Code Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5">
                  Have a Promotional Code?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#83B89F]/15 border border-[#83B89F]/40 text-xs">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#3D785D]" />
                      <span className="font-bold text-[#3D785D]">{appliedCoupon.code}</span>
                      <span className="text-[#3D785D]">({appliedCoupon.message})</span>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Try WELCOME50 or READORA20"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--border)] disabled:opacity-50 transition-colors"
                    >
                      {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                    </button>
                  </form>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Mobile Number for Razorpay UPI & Payment Receipts */}
              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1.5 flex items-center justify-between">
                  <span>Mobile Number (For Razorpay UPI & Receipts)</span>
                  <span className="text-[10px] text-[var(--muted)] font-normal">
                    {user?.phone ? "Saved in Profile" : "Recommended for UPI"}
                  </span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 9876543210 (Auto-prefilled in UPI)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Secure Checkout Trust Banner */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/15 text-xs text-[var(--foreground)]">
                <ShieldCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <span className="text-[11px] text-[var(--muted)]">
                  Secured with 256-bit encryption. Instant digital unlock after payment.
                </span>
              </div>

              {/* Order Total Breakdown */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/40 border border-[var(--border)] space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--muted)]">
                  <span>Book Subtotal</span>
                  <span>₹{basePrice}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[#3D785D] font-medium">
                    <span>Promotional Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-[var(--border)] flex justify-between font-bold text-sm text-[var(--foreground)]">
                  <span>Total Amount</span>
                  <span className="text-[var(--primary)]">₹{finalPrice}</span>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Payment CTA */}
              <div className="pt-2">
                <button
                  onClick={handleProceedPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] disabled:opacity-60 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-amber-200" />
                      <span>
                        {finalPrice === 0 ? "Unlock Book for Free" : `Pay ₹${finalPrice}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[var(--muted)] text-center mt-2">
                  Includes lifetime digital reading license, personal highlights, and device sync.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
