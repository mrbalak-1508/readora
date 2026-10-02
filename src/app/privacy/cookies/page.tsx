"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { ShieldCheck, Check, ArrowLeft, Cookie } from "lucide-react";

export default function CookieSettingsPage() {
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("readora_cookie_consent");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnalytics(!!parsed.analytics);
        setFunctional(!!parsed.functional);
        setMarketing(!!parsed.marketing);
      } catch {
        // use default
      }
    }
  }, []);

  const saveConsent = async (prefs: {
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
  }) => {
    localStorage.setItem("readora_cookie_consent", JSON.stringify(prefs));
    setAnalytics(prefs.analytics);
    setFunctional(prefs.functional);
    setMarketing(prefs.marketing);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    try {
      await fetch("/api/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          necessary: true,
          ...prefs,
        }),
      });
    } catch (err) {
      console.error("Failed to sync cookie consent:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Library
        </Link>

        <div className="bg-[var(--card)] rounded-3xl p-6 sm:p-10 border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center">
              <Cookie className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-editorial text-3xl font-bold text-[var(--foreground)]">
                Cookie Settings & Privacy
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Manage your data and consent preferences for READORA.
              </p>
            </div>
          </div>

          <p className="text-sm text-[var(--muted)] leading-relaxed mb-8 border-b border-[var(--border)] pb-6">
            We value your reading tranquility. Below you can fine-tune what cookies READORA uses on your device. Essential cookies are necessary for reading sessions and authentication and cannot be switched off.
          </p>

          {savedSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Your cookie preferences have been updated and saved.
            </div>
          )}

          <div className="space-y-4">
            {/* Necessary */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--foreground)]">Necessary</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Always On
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Required for user authentication, session security, CSRF protection, and vital platform services.
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Analytics */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
              <div className="pr-4">
                <span className="text-sm font-bold text-[var(--foreground)]">Analytics</span>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Enables anonymous telemetry so we can measure catalog engagement, page turn speed, and popular literary discoveries.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>

            {/* Functional */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
              <div className="pr-4">
                <span className="text-sm font-bold text-[var(--foreground)]">Functional</span>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Saves reading typography preferences, sepia/paper modes, font sizes, and reading sound preferences.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>

            {/* Marketing */}
            <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between opacity-70">
              <div className="pr-4">
                <span className="text-sm font-bold text-[var(--foreground)]">Marketing</span>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Used for personalized literary release notifications and updates. (Disabled by default).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
              </label>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => saveConsent({ analytics: false, functional: false, marketing: false })}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Reject Non-Essential
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => saveConsent({ analytics: true, functional: true, marketing: false })}
                className="px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={() => saveConsent({ analytics, functional, marketing })}
                className="px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
