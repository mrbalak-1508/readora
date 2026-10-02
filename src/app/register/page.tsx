"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Phone, User, Check, Camera } from "lucide-react";
import { showErrorAlert, showSuccessAlert } from "@/lib/alerts";

const AVATAR_PRESETS = [
  { id: "avatar-1", label: "Scholar", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" },
  { id: "avatar-2", label: "Curator", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" },
  { id: "avatar-3", label: "Poet", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" },
  { id: "avatar-4", label: "Philosopher", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200" },
  { id: "avatar-5", label: "Explorer", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200" },
  { id: "avatar-6", label: "Bibliophile", url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showErrorAlert("Name Required", "Please enter your name.");
      return;
    }
    if (!email.trim()) {
      showErrorAlert("Email Required", "Please enter a valid email address.");
      return;
    }
    if (phone.trim() && !/^[0-9+ -]{8,15}$/.test(phone.trim())) {
      showErrorAlert("Invalid Mobile Number", "Please enter a valid mobile number (e.g., 9876543210).");
      return;
    }
    if (password.length < 6) {
      showErrorAlert("Weak Password", "Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");
    const res = await signup(
      name.trim(),
      email.trim(),
      password,
      phone.trim() || undefined,
      selectedAvatar
    );
    setLoading(false);
    if (!res.success) {
      const errMsg = res.error || "Failed to create account. Please try again.";
      setError(errMsg);
      showErrorAlert("Registration Failed", errMsg);
      return;
    }

    await showSuccessAlert("Account Created", `Welcome to READORA, ${name.trim()}!`);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[var(--bg-main)] p-4 sm:p-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to READORA</span>
      </Link>

      <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-main)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--text-main)]">
              READORA
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--accent)] ml-1" />
          </Link>
          <h1 className="font-editorial text-xl font-bold text-[var(--text-main)] mt-2">
            Begin Your Reading Sanctuary
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Create an account to track reading progress, unlock books, and customize your reader.
          </p>
        </div>

        {/* Profile Picture Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[var(--text-subtle)] block flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[var(--accent)]" />
              Choose Reader Persona / Profile Picture
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">Select Avatar</span>
          </label>
          <div className="flex items-center justify-center gap-3 py-1">
            {AVATAR_PRESETS.map((av) => {
              const isSelected = selectedAvatar === av.url;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.url)}
                  className={`relative w-11 h-11 rounded-full overflow-hidden transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-[var(--accent)] ring-offset-2 scale-110 shadow-md"
                      : "opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                  title={av.label}
                >
                  <Image src={av.url} alt={av.label} fill className="object-cover" sizes="44px" />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maya Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="reader@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1 flex items-center justify-between">
              <span>Mobile Number (For Payment & OTP)</span>
              <span className="text-[10px] text-[var(--text-muted)] font-normal">Optional</span>
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
              Create Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] focus:border-[var(--accent)]"
            />
          </div>

          {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-sm disabled:opacity-50 cursor-pointer mt-2"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="text-center text-xs text-[var(--text-muted)] pt-1">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
