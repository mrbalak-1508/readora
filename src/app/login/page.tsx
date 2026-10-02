"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Sparkles, BookOpen, AlertCircle, Shield, User } from "lucide-react";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@readora.library");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showErrorAlert("Email Required", "Please enter your library email or username to sign in.");
      return;
    }
    if (!password) {
      showErrorAlert("Password Required", "Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(email.trim(), password);
    setLoading(false);

    if (!res.success) {
      const errMsg = res.error || "Invalid email or password. Please verify your credentials.";
      setError(errMsg);
      showErrorAlert("Authentication Failed", errMsg);
      return;
    }

    await showSuccessAlert("Welcome to READORA", "You have successfully signed in!");
    router.push("/");
  };

  const handleSelectPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--background)] p-4 sm:p-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to READORA</span>
      </Link>

      <div className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
              READORA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--primary)] ml-1" />
          </Link>
          <h1 className="font-editorial text-2xl font-bold text-[var(--foreground)] mt-2">
            Welcome to Your Library
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Sign in to access your synchronized bookshelf, reading progress and bookmarks.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. reader@readora.library"
              className="w-full px-4 py-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label className="font-semibold text-[var(--foreground)]">Password</label>
              <Link href="/forgot-password" className="text-[var(--primary)] hover:underline text-[11px] font-medium">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--primary)] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? "Signing in to READORA..." : "Sign In to READORA"}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] text-xs space-y-2.5">
          <div className="font-bold text-[var(--foreground)] flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Pre-seeded Demo Accounts:</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleSelectPreset("admin@readora.library", "admin123")}
              className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] bg-[var(--card)] text-left transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-[var(--foreground)]">
                <Shield className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Curator Admin</span>
              </div>
              <span className="text-[10px] text-[var(--muted)] block mt-0.5 truncate">admin@readora.library</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset("reader@readora.library", "reader123")}
              className="p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] bg-[var(--card)] text-left transition-all"
            >
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-[var(--foreground)]">
                <User className="w-3.5 h-3.5 text-[var(--secondary)]" />
                <span>Reader Account</span>
              </div>
              <span className="text-[10px] text-[var(--muted)] block mt-0.5 truncate">reader@readora.library</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[var(--muted)]">
          Don&apos;t have an account yet?{" "}
          <Link href="/signup" className="text-[var(--primary)] font-bold hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
