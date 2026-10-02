"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  ShieldCheck,
  Key,
  Lock,
  CheckCircle,
  AlertCircle,
  Save,
  ArrowLeft,
  Zap,
  Play,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function AdminPaymentSettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);

  const [formData, setFormData] = useState<Record<string, any>>({
    razorpay: { enabled: true, testMode: true, publicKey: "", secretKey: "", webhookSecret: "" },
    stripe: { enabled: true, testMode: true, publicKey: "", secretKey: "", webhookSecret: "" },
    paypal: { enabled: false, testMode: true, publicKey: "", secretKey: "", webhookSecret: "" },
  });

  const [testResults, setTestResults] = useState<
    Record<
      string,
      {
        status: "success" | "error" | "warning";
        message: string;
        details?: any;
        timestamp: string;
      }
    >
  >({});

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);

        const newFormState: any = { ...formData };
        for (const c of data) {
          newFormState[c.provider] = {
            enabled: c.enabled,
            testMode: c.testMode,
            publicKey: c.publicKey || "",
            secretKey: c.secretKeyMasked || "",
            webhookSecret: c.webhookSecretMasked || "",
          };
        }
        setFormData(newFormState);
      }
    } catch (err) {
      console.error("Failed to load gateway configs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleSave = async (provider: string) => {
    setSavingProvider(provider);
    try {
      const payload = {
        provider,
        ...formData[provider],
      };

      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToastAlert({ title: "Saved", text: `${provider} configuration updated!`, icon: "success" });
        loadConfigs();
      } else {
        const err = await res.json();
        showToastAlert({ title: "Error", text: err.error || "Failed to update", icon: "error" });
      }
    } catch {
      showToastAlert({ title: "Error", text: "Network error", icon: "error" });
    } finally {
      setSavingProvider(null);
    }
  };

  const updateField = (provider: string, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }));
  };

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

  // Test backend API connection
  const handleTestConnection = async (provider: string) => {
    setTestingProvider(provider);
    try {
      const res = await fetch("/api/admin/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          publicKey: formData[provider]?.publicKey,
          secretKey: formData[provider]?.secretKey,
        }),
      });

      const data = await res.json();
      const timeStr = new Date().toLocaleTimeString();

      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            status: "success",
            message: data.message || "Connected successfully!",
            details: data.testOrder || data.details,
            timestamp: timeStr,
          },
        }));
        showToastAlert({
          title: "Connection Verified!",
          text: data.message,
          icon: "success",
        });
      } else if (data.isPlaceholder) {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            status: "warning",
            message: data.message,
            timestamp: timeStr,
          },
        }));
        showToastAlert({
          title: "Placeholder Credentials",
          text: data.message,
          icon: "warning",
        });
      } else {
        setTestResults((prev) => ({
          ...prev,
          [provider]: {
            status: "error",
            message: data.error || data.message || "Connection failed",
            details: data.details,
            timestamp: timeStr,
          },
        }));
        showToastAlert({
          title: "Connection Failed",
          text: data.error || data.message || "Could not authenticate with gateway API",
          icon: "error",
        });
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          status: "error",
          message: err.message || "Network test failed",
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      showToastAlert({
        title: "Test Error",
        text: err.message || "Failed to reach diagnostic endpoint",
        icon: "error",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  // Launch interactive Razorpay popup test modal
  const handleLaunchTestPopup = async () => {
    setTestingProvider("razorpay-popup");
    try {
      const keyId = formData.razorpay?.publicKey;
      const isPlaceholder =
        !keyId ||
        keyId.includes("live_sim") ||
        keyId.includes("test_readora") ||
        !keyId.startsWith("rzp_");

      if (isPlaceholder) {
        showToastAlert({
          title: "Razorpay Test Key Required",
          text: "To test the real Razorpay popup modal, please enter your valid Key ID (starts with 'rzp_test_') in the Key ID field above and save or test.",
          icon: "warning",
        });
        setTestResults((prev) => ({
          ...prev,
          razorpay: {
            status: "warning",
            message:
              "Cannot open live Razorpay popup with placeholder key (rzp_test_readora_live_sim). Please get your test keys from https://dashboard.razorpay.com",
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        setTestingProvider(null);
        return;
      }

      // 1. Create a ₹1.00 test order on the server
      const testRes = await fetch("/api/admin/payments/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "razorpay",
          publicKey: keyId,
          secretKey: formData.razorpay?.secretKey,
        }),
      });

      const testData = await testRes.json();
      if (!testRes.ok || !testData.success) {
        throw new Error(testData.error || testData.message || "Failed to initialize test order");
      }

      // 2. Load Razorpay Checkout SDK
      const loaded = await loadRazorpayScript();
      if (!loaded || !(window as any).Razorpay) {
        throw new Error("Unable to load Razorpay Checkout script from checkout.razorpay.com");
      }

      // 3. Open Razorpay Checkout modal
      const options: any = {
        key: testData.testOrder.keyId,
        amount: testData.testOrder.amount, // 100 paise = ₹1.00
        currency: testData.testOrder.currency || "INR",
        name: "READORA Gateway Diagnostics",
        description: "Test Transaction (₹1.00 Sandbox)",
        image: "/icons/icon-192.png",
        order_id: testData.testOrder.orderId,
        prefill: {
          name: "Admin Tester",
          email: "admin@readora.library",
          contact: "9999999999",
        },
        theme: {
          color: "#5A3E85",
        },
        handler: function (response: any) {
          showToastAlert({
            title: "Popup Test Passed! 🎉",
            text: `Payment successfully captured! Payment ID: ${response.razorpay_payment_id}`,
            icon: "success",
          });
          setTestResults((prev) => ({
            ...prev,
            razorpay: {
              status: "success",
              message: `✓ Test Payment Succeeded! Razorpay Payment ID: ${response.razorpay_payment_id} | Order: ${response.razorpay_order_id}`,
              timestamp: new Date().toLocaleTimeString(),
            },
          }));
          setTestingProvider(null);
        },
        modal: {
          ondismiss: function () {
            setTestingProvider(null);
          },
        },
      };

      const rzpInstance = new (window as any).Razorpay(options);
      rzpInstance.on("payment.failed", function (resp: any) {
        showToastAlert({
          title: "Payment Cancelled / Failed",
          text: resp.error?.description || "Payment was rejected or cancelled.",
          icon: "error",
        });
        setTestResults((prev) => ({
          ...prev,
          razorpay: {
            status: "error",
            message: `Gateway returned error: ${resp.error?.description || "Payment failed"}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        }));
        setTestingProvider(null);
      });

      rzpInstance.open();
    } catch (err: any) {
      showToastAlert({
        title: "Test Popup Error",
        text: err.message || "Failed to initialize Razorpay checkout",
        icon: "error",
      });
      setTestResults((prev) => ({
        ...prev,
        razorpay: {
          status: "error",
          message: err.message || "Failed to launch Razorpay modal",
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      setTestingProvider(null);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Payment Infrastructure
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Payment Gateway Settings
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Configure merchant credentials for Razorpay, Stripe, and PayPal. Test connections and launch live popup checks directly from this screen.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Razorpay Gateway */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    Razorpay
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                    India Core: UPI, NetBanking, Cards
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Primary payment gateway for domestic INR transactions.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.razorpay?.testMode}
                    onChange={(e) => updateField("razorpay", "testMode", e.target.checked)}
                    className="accent-[var(--primary)] w-4 h-4 rounded"
                  />
                  <span>Test Sandbox Mode</span>
                </label>

                <button
                  type="button"
                  onClick={() => updateField("razorpay", "enabled", !formData.razorpay?.enabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    formData.razorpay?.enabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.razorpay?.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Key ID (Public)
                </label>
                <input
                  type="text"
                  value={formData.razorpay?.publicKey}
                  onChange={(e) => updateField("razorpay", "publicKey", e.target.value)}
                  placeholder="rzp_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Key Secret (Private)
                </label>
                <input
                  type="password"
                  value={formData.razorpay?.secretKey}
                  onChange={(e) => updateField("razorpay", "secretKey", e.target.value)}
                  placeholder="Enter secret key..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Webhook Secret (For signature verification)
                </label>
                <input
                  type="password"
                  value={formData.razorpay?.webhookSecret}
                  onChange={(e) => updateField("razorpay", "webhookSecret", e.target.value)}
                  placeholder="Enter webhook secret..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
                <span className="text-[10px] text-[var(--muted)] mt-1 block font-mono">
                  Webhook URL: https://yourdomain.com/api/payments/razorpay/webhook
                </span>
              </div>
            </div>

            {/* Test Feedback Result Banner for Razorpay */}
            {testResults.razorpay && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResults.razorpay.status === "success"
                    ? "bg-[#83B89F]/15 border-[#83B89F]/40 text-[#2D5A43]"
                    : testResults.razorpay.status === "warning"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {testResults.razorpay.status === "success" && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3D785D] mt-0.5" />
                )}
                {testResults.razorpay.status === "warning" && (
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                )}
                {testResults.razorpay.status === "error" && (
                  <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {testResults.razorpay.status === "success"
                        ? "Razorpay Gateway Online & Verified"
                        : testResults.razorpay.status === "warning"
                        ? "Configuration Notice"
                        : "Diagnostics Failed"}
                    </span>
                    <span className="text-[10px] opacity-75">{testResults.razorpay.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed break-words">
                    {testResults.razorpay.message}
                  </p>
                  {testResults.razorpay.details && (
                    <div className="mt-1.5 p-2 rounded-lg bg-black/5 dark:bg-white/5 font-mono text-[10px] break-all">
                      {typeof testResults.razorpay.details === "object"
                        ? JSON.stringify(testResults.razorpay.details, null, 2)
                        : testResults.razorpay.details}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)]">
              <div className="flex flex-wrap items-center gap-2">
                {/* Verify API Connection Button */}
                <button
                  type="button"
                  onClick={() => handleTestConnection("razorpay")}
                  disabled={testingProvider === "razorpay"}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--foreground)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Test authentication with Razorpay REST API"
                >
                  {testingProvider === "razorpay" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span>
                    {testingProvider === "razorpay" ? "Verifying..." : "Verify Connection"}
                  </span>
                </button>

                {/* Launch Test Popup Modal Button */}
                <button
                  type="button"
                  onClick={handleLaunchTestPopup}
                  disabled={testingProvider === "razorpay-popup"}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Opens the real Razorpay Checkout Popup Dialog with a ₹1.00 test"
                >
                  {testingProvider === "razorpay-popup" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>
                    {testingProvider === "razorpay-popup"
                      ? "Launching Popup..."
                      : "Test Checkout Popup (₹1.00)"}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleSave("razorpay")}
                disabled={savingProvider === "razorpay"}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProvider === "razorpay" ? "Saving..." : "Save Razorpay"}</span>
              </button>
            </div>
          </div>

          {/* Stripe Gateway */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    Stripe
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                    International: Global Cards
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  International credit card processor for overseas customers.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.stripe?.testMode}
                    onChange={(e) => updateField("stripe", "testMode", e.target.checked)}
                    className="accent-[var(--primary)] w-4 h-4 rounded"
                  />
                  <span>Test Sandbox Mode</span>
                </label>

                <button
                  type="button"
                  onClick={() => updateField("stripe", "enabled", !formData.stripe?.enabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    formData.stripe?.enabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/40"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.stripe?.enabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Publishable Key
                </label>
                <input
                  type="text"
                  value={formData.stripe?.publicKey}
                  onChange={(e) => updateField("stripe", "publicKey", e.target.value)}
                  placeholder="pk_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={formData.stripe?.secretKey}
                  onChange={(e) => updateField("stripe", "secretKey", e.target.value)}
                  placeholder="sk_test_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>
            </div>

            {testResults.stripe && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  testResults.stripe.status === "success"
                    ? "bg-[#83B89F]/15 border-[#83B89F]/40 text-[#2D5A43]"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {testResults.stripe.status === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3D785D] mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Stripe Verification Result</span>
                    <span className="text-[10px] opacity-75">{testResults.stripe.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-[11px]">{testResults.stripe.message}</p>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleTestConnection("stripe")}
                disabled={testingProvider === "stripe"}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--foreground)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {testingProvider === "stripe" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>{testingProvider === "stripe" ? "Testing..." : "Test Stripe API"}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSave("stripe")}
                disabled={savingProvider === "stripe"}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProvider === "stripe" ? "Saving..." : "Save Stripe"}</span>
              </button>
            </div>
          </div>

          {/* PayPal Gateway */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    PayPal
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                    Optional Future / Global
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Global digital wallet gateway for international checkout.
                </p>
              </div>

              <button
                type="button"
                onClick={() => updateField("paypal", "enabled", !formData.paypal?.enabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  formData.paypal?.enabled ? "bg-[var(--primary)]" : "bg-[var(--muted)]/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.paypal?.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={formData.paypal?.publicKey}
                  onChange={(e) => updateField("paypal", "publicKey", e.target.value)}
                  placeholder="client_id_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  value={formData.paypal?.secretKey}
                  onChange={(e) => updateField("paypal", "secretKey", e.target.value)}
                  placeholder="secret_..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-mono"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => handleSave("paypal")}
                disabled={savingProvider === "paypal"}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProvider === "paypal" ? "Saving..." : "Save PayPal"}</span>
              </button>
            </div>
          </div>

          {/* Interactive Gateway Diagnostics & Testing Sandbox Section */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--accent-light)] text-[var(--primary)]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Gateway Testing Guide & Sandbox Information
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Tips for testing Razorpay UPI, Netbanking, and Cards in test mode.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-1.5">
                <span className="font-bold text-[var(--foreground)] block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Razorpay UPI Testing
                </span>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  In Razorpay Test Mode, enter UPI ID <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">success@razorpay</code> to simulate an instant successful UPI approval.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-1.5">
                <span className="font-bold text-[var(--foreground)] block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  Test Cards
                </span>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Use test card numbers (e.g. any valid test card starting with <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">4111 1111...</code>) with any future expiry date and any 3-digit CVV.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-1.5">
                <span className="font-bold text-[var(--foreground)] block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Where to find Keys
                </span>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Log in to your Razorpay Dashboard, toggle to <strong className="text-[var(--foreground)]">Test Mode</strong> in the top header, then go to <em>Settings &rarr; API Keys</em> to generate your Key ID and Secret.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
