"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Compass, Eye, ShieldCheck, BookOpen, BookmarkCheck } from "lucide-react";
import Link from "next/link";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  if (!isOpen) return null;

  const steps = [
    {
      step: "01",
      icon: <Compass className="w-5 h-5 text-[var(--primary)]" />,
      title: "Discover Thoughtful Curation",
      description: "Explore books organized by genre, reading mood, trending activity, and editorial collections.",
    },
    {
      step: "02",
      icon: <Eye className="w-5 h-5 text-[var(--secondary)]" />,
      title: "Sample with Free Previews",
      description: "Read the first 10 pages or initial chapters without commitment. Feel the writing and rhythm.",
    },
    {
      step: "03",
      icon: <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />,
      title: "Own or Subscribe Securely",
      description: "Buy once for lifetime ownership or join Readora Premium for unlimited access to eligible catalog volumes.",
    },
    {
      step: "04",
      icon: <BookOpen className="w-5 h-5 text-[var(--soft-blue)]" />,
      title: "Immerse in 3D Realistic Reading",
      description: "Turn pages with tactile 3D physics, gentle ambient paper audio, customizable typography, and warm themes.",
    },
    {
      step: "05",
      icon: <BookmarkCheck className="w-5 h-5 text-[var(--soft-green)]" />,
      title: "Keep Every Story Within Reach",
      description: "Marginalia highlights, notes, and reading progress synchronize automatically across all your devices.",
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[var(--border)]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                The Readora Journey
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--foreground)] mt-2">
                How Readora Works
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
                Built from the ground up for lovers of beautiful books and focused reading.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Steps */}
          <div className="py-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {steps.map((s, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-3.5 rounded-2xl bg-[var(--bg-subtle)]/60 border border-[var(--border)]/60 hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--card)] shadow-xs shrink-0">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--foreground)]">{s.title}</h3>
                    <span className="text-[11px] font-mono font-bold text-[var(--muted)] opacity-60">
                      {s.step}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3">
            <span className="text-xs text-[var(--muted)] hidden sm:inline">
              Ready to begin reading?
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Close
              </button>
              <Link
                href="/explore"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
              >
                Explore Digital Shelves
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
