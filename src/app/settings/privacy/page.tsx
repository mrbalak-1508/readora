"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import {
  ShieldCheck,
  Lock,
  Cookie,
  CheckCircle,
  Save,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function UserPrivacySettingsPage() {
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("readora_cookie_consent");
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("readora_cookie_consent", JSON.stringify(preferences));
    setSavedMessage("Privacy & cookie preferences saved successfully.");
    showToastAlert({ title: "Preferences Saved", text: "Your privacy choices are active.", icon: "success" });
    setTimeout(() => setSavedMessage(""), 3000);
  };

  const handleWithdrawAll = () => {
    const minimal = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(minimal);
    localStorage.setItem("readora_cookie_consent", JSON.stringify(minimal));
    setSavedMessage("All optional consents withdrawn. Only necessary cookies remain active.");
    showToastAlert({ title: "Consents Withdrawn", text: "Only essential cookies enabled.", icon: "info" });
    setTimeout(() => setSavedMessage(""), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-16 pb-20 md:pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                Data Transparency
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--foreground)] mt-2">
                Privacy & Cookie Preferences
              </h1>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Take full control over how Readora remembers your settings and processes telemetry.
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Settings</span>
            </Link>
          </div>

          {savedMessage && (
            <div className="p-4 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent-border)] text-xs text-[var(--primary)] font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {/* Preferences Box */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-6">
            {/* Strictly Necessary */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                    Strictly Necessary
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Required for user authentication, cryptographic CSRF tokens, checkout security, and session persistence. Cannot be disabled.
                </p>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled
                className="mt-1 w-5 h-5 accent-[var(--primary)] cursor-not-allowed opacity-60"
              />
            </div>

            {/* Functional */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--border)]">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Functional & Experience Preferences
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Allows Readora to remember your preferred reader theme (Paper, Warm, Sepia, Dark), 3D page flip animation speeds, and audio volume.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                className="mt-1 w-5 h-5 accent-[var(--primary)] cursor-pointer"
              />
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--border)]">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Performance & Anonymous Analytics
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Helps our engineers identify reading errors and improve book formatting. Data is fully anonymized.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                className="mt-1 w-5 h-5 accent-[var(--primary)] cursor-pointer"
              />
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  Promotional Recommendations
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Tailors literary recommendations and alerts about author book drops based on your reading genres.
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences.marketing}
                onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                className="mt-1 w-5 h-5 accent-[var(--primary)] cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleWithdrawAll}
                className="px-4 py-2.5 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-subtle)] text-xs font-bold text-[var(--muted)] hover:text-red-600 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Withdraw Optional Consent</span>
              </button>

              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Privacy Preferences</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
