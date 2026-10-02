"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  Search,
  Bookmark,
  BookOpen,
  User,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
} from "lucide-react";

interface Step {
  id: string;
  title: string;
  headline: string;
  description: string;
  targetId: string;
  icon: React.ReactNode;
}

const TOUR_STEPS: Step[] = [
  {
    id: "explore",
    title: "1. Explore",
    headline: "Discover New Horizons",
    description: "Discover books, categories and new releases here.",
    targetId: "tour-explore",
    icon: <Compass className="w-5 h-5 text-[var(--primary)]" />,
  },
  {
    id: "search",
    title: "2. Search",
    headline: "Instant Global Discovery",
    description: "Looking for something specific? Search books and authors instantly.",
    targetId: "tour-search",
    icon: <Search className="w-5 h-5 text-[var(--secondary)]" />,
  },
  {
    id: "library",
    title: "3. My Library",
    headline: "Your Personal Bookshelf",
    description: "Save books and return to them anytime.",
    targetId: "tour-library",
    icon: <Bookmark className="w-5 h-5 text-[var(--accent)]" />,
  },
  {
    id: "book-card",
    title: "4. Book Card",
    headline: "Rich Literary Details",
    description: "Open any book to see details and start reading.",
    targetId: "tour-book-card",
    icon: <BookOpen className="w-5 h-5 text-[var(--soft-green)]" />,
  },
  {
    id: "reader",
    title: "5. Reader",
    headline: "Distraction-Free Sanctuary",
    description: "Your reading progress is automatically saved.",
    targetId: "tour-reader",
    icon: <Sparkles className="w-5 h-5 text-[var(--soft-blue)]" />,
  },
  {
    id: "profile",
    title: "6. Profile",
    headline: "Tailored to Your Comfort",
    description: "Customize your reading experience, theme and preferences.",
    targetId: "tour-profile",
    icon: <User className="w-5 h-5 text-[var(--primary)]" />,
  },
];

export function OnboardingTour() {
  const { user, completeOnboarding } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isCompletedState, setIsCompletedState] = useState(false);

  useEffect(() => {
    // Only show if user is logged in AND onboarding is not completed
    if (user && user.onboardingCompleted === false) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setIsCompletedState(true);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    setIsOpen(false);
    await completeOnboarding();
  };

  const handleSkip = async () => {
    setIsOpen(false);
    await completeOnboarding();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop Dims Background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal / Tooltip Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-md bg-[var(--card)] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[var(--border)] overflow-hidden"
        >
          {/* Subtle top decorative ribbon */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--accent)]" />

          {/* Skip / Close Icon */}
          <button
            onClick={handleSkip}
            className="absolute top-5 right-5 p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>

          {!isCompletedState ? (
            <div>
              {/* Header / Step Indicator */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
                  Step {currentStepIndex + 1} / {TOUR_STEPS.length}
                </span>
                <button
                  onClick={handleSkip}
                  className="text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] mr-6"
                >
                  Skip Tour
                </button>
              </div>

              {/* Icon & Title */}
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-[var(--background)] border border-[var(--border)] flex items-center justify-center shrink-0 shadow-xs">
                  {currentStep.icon}
                </div>
                <div>
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    {currentStep.headline}
                  </h3>
                  <span className="text-xs text-[var(--muted)] font-medium">
                    {currentStep.title}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--muted)] leading-relaxed mb-8 bg-[var(--background)] p-4 rounded-2xl border border-[var(--border)]">
                {currentStep.description}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentStepIndex
                        ? "w-6 bg-[var(--primary)]"
                        : i < currentStepIndex
                        ? "w-2 bg-[var(--secondary)]"
                        : "w-2 bg-[var(--border)]"
                    }`}
                  />
                ))}
              </div>

              {/* Buttons: Back & Next */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[var(--border)] text-xs font-bold transition-colors ${
                    currentStepIndex === 0
                      ? "opacity-40 cursor-not-allowed text-[var(--muted)]"
                      : "text-[var(--foreground)] hover:bg-[var(--background)]"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isLast ? "Complete Tour" : "Next"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Tour Complete View */
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
                  You&apos;re ready to read!
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1.5 max-w-xs mx-auto">
                  Your personal digital sanctuary is set up. Pick any title or continue whenever inspiration strikes.
                </p>
              </div>

              <button
                onClick={handleFinish}
                className="w-full py-3.5 rounded-2xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold transition-all shadow-md active:scale-98"
              >
                Start Exploring
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
