"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-main)] p-4 sm:p-6">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Sign In</span>
      </Link>

      <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--text-main)]">
              READORA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] ml-1" />
          </Link>
          <h1 className="font-editorial text-xl font-bold text-[var(--text-main)] mt-3">
            Reset Password
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Enter your email to receive recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto" />
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Recovery Link Dispatched
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              If an account is associated with {email}, you will receive a reset link shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="reader@readora.library"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
            >
              Send Recovery Instructions
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
