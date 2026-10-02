"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, Settings, X, Check } from "lucide-react";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Preference states
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("readora_cookie_consent");
    if (!saved) {
      // Delay showing banner slightly for smooth page entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = async (prefs: {
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
  }) => {
    localStorage.setItem("readora_cookie_consent", JSON.stringify(prefs));
    setIsVisible(false);
    setIsModalOpen(false);

    try {
      await fetch("/api/cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          necessary: true,
          ...prefs,
          anonymousId: typeof crypto !== "undefined" ? crypto.randomUUID() : undefined,
        }),
      });
    } catch (err) {
      console.error("Failed to sync cookie consent to backend:", err);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({ analytics: true, functional: true, marketing: false });
  };

  const handleRejectNonEssential = () => {
    saveConsent({ analytics: false, functional: false, marketing: false });
  };

  const handleSavePreferences = () => {
    saveConsent({ analytics, functional, marketing });
  };

  if (!isVisible && !isModalOpen) return null;

  return (
    <>
      {/* Banner */}
      <AnimatePresence>
        {isVisible && !isModalOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-xl z-50 p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xl backdrop-blur-md"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center shrink-0">
                <Cookie className="w-5 h-5" />
              </div>

              <div className="space-y-2 flex-1">
                <p className="text-xs text-[var(--foreground)] leading-relaxed">
                  We use cookies to keep Readora working, remember your preferences and, with your permission, understand how people use the platform.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleAcceptAll}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleRejectNonEssential}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--background)] hover:bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--foreground)] text-xs font-semibold transition-all"
                  >
                    Reject Non-Essential
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" />
                    Manage Preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-lg bg-[var(--card)] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--border)]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    Cookie Preferences
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Necessary */}
                <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--foreground)]">Necessary</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Always On
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Required for authentication, security, sessions and essential platform stability.
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                </div>

                {/* Analytics */}
                <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-[var(--foreground)]">Analytics</span>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Helps us understand reader engagement and platform performance anonymously.
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
                <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-[var(--foreground)]">Functional</span>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Stores reader settings, reading font choices, sepia/paper themes and bookmark memory.
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
                <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-between opacity-70">
                  <div className="pr-4">
                    <span className="text-xs font-bold text-[var(--foreground)]">Marketing</span>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Future promotional notifications and literary recommendations.
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

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
                <button
                  onClick={handleRejectNonEssential}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  Reject Non-Essential
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptAll}
                    className="px-4 py-2 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] text-xs font-bold text-[var(--foreground)] transition-colors"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-5 py-2 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
