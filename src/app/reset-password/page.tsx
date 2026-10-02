"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--background)] p-4 sm:p-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Sign In</span>
      </Link>

      <div className="w-full max-w-sm bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
              READORA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)] ml-1" />
          </Link>
          <h1 className="font-editorial text-xl font-bold text-[var(--foreground)] mt-3">
            Set New Password
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Choose a secure passphrase to safeguard your library access.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs"
            >
              Update Password
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-[var(--muted)]">
              Your password has been reset successfully. You can now sign in with your new credentials.
            </p>
            <Link
              href="/login"
              className="inline-block w-full py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
            >
              Sign In to READORA
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
