"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Star,
  HelpCircle,
} from "lucide-react";
import { Book } from "@/lib/types";
import { HowItWorksModal } from "./HowItWorksModal";

interface BookHeroProps {
  books: Book[];
}

export function BookHero({ books }: BookHeroProps) {
  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  // Take top books for carousel (fallback to at least 4 items)
  const carouselBooks = books.slice(0, 5);
  const currentBook = carouselBooks[activeBookIndex] || carouselBooks[0];

  const handleNext = () => {
    setActiveBookIndex((prev) => (prev + 1) % carouselBooks.length);
  };

  const handlePrev = () => {
    setActiveBookIndex((prev) => (prev - 1 + carouselBooks.length) % carouselBooks.length);
  };

  // Determine CTA text for active book based on access model
  const getBookCta = (book: Book) => {
    if (!book) return { text: "Start Reading", href: "/explore" };
    if (book.accessType === "FREE") {
      return { text: "Read Free Now", href: `/read/${book.id}` };
    }
    if (book.accessType === "PREVIEW" || book.accessType === "FREE_WITH_SUBSCRIPTION") {
      return { text: "Read Free Preview", href: `/read/${book.id}` };
    }
    if (book.price && book.price > 0) {
      return { text: `Buy for ₹${book.price}`, href: `/books/${book.slug}` };
    }
    return { text: "Read Book", href: `/read/${book.id}` };
  };

  const bookCta = getBookCta(currentBook);

  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pt-10 sm:pb-24">
      {/* Background Soft Library Glow */}
      <div className="absolute top-12 left-1/4 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent)]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute top-20 right-10 w-[450px] h-[350px] bg-[var(--secondary)]/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 left-1/3 w-[350px] h-[250px] bg-[var(--soft-blue)]/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Cinematic Editorial Typography & Value Proposition */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left z-10">
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--primary)] text-xs font-bold tracking-wider uppercase"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] animate-spin-slow" />
              <span>READORA DIGITAL LIBRARY</span>
            </motion.div>

            {/* Headline: Sans-Serif + Serif Emphasis */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[var(--foreground)] leading-[1.12]"
            >
              <span className="block font-sans font-extrabold">Every story deserves</span>
              <span className="block font-editorial font-normal italic text-[var(--primary)] mt-1">
                a beautiful place to be read.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-base sm:text-lg text-[var(--muted)] max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              Discover thoughtfully curated books, read beautifully, and keep every story within
              reach.
            </motion.p>

            {/* Primary & Secondary Action CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2"
            >
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[var(--primary)] text-white text-sm font-bold hover:bg-[var(--primary-hover)] transition-all shadow-sm hover:shadow-md active:scale-98"
              >
                <Compass className="w-4 h-4" />
                <span>Explore Library</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-sm font-bold text-[var(--foreground)] hover:bg-[var(--bg-subtle)] hover:border-[var(--primary)] transition-all shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-[var(--secondary)]" />
                <span>How Readora Works</span>
              </button>
            </motion.div>

            {/* Micro Highlights Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-4 flex items-center justify-center lg:justify-start gap-6 text-xs text-[var(--muted)]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--soft-green)]" />
                <span>3D Page Turning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--secondary)]" />
                <span>Free Preview Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                <span>Auditory Immersion</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Layered 2.5D Composition & Real Book Carousel */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
            {/* Layered Cartoon Atmosphere: Floating Stars & Lamp Glow */}
            <div className="relative w-full max-w-[480px] aspect-[4/3] flex items-center justify-center">
              {/* Floating Illustrated Background Objects */}
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [0, 2, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                className="absolute -top-4 right-12 z-0 opacity-80"
              >
                <div className="p-2.5 rounded-2xl bg-white/70 shadow-sm border border-[var(--border)] backdrop-blur-xs flex items-center gap-1.5 text-[11px] font-bold text-[var(--primary)]">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Curated Volumes</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 6, 0], rotate: [0, -3, 0] }}
                transition={{ repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 0.8 }}
                className="absolute top-1/2 -left-6 z-0 opacity-70 hidden sm:block"
              >
                {/* Floating Page Card */}
                <div className="w-14 h-18 rounded-lg bg-white shadow-md border border-[var(--border)] p-2 space-y-1 transform -rotate-12">
                  <div className="w-full h-1 bg-[var(--soft-blue)] rounded-full" />
                  <div className="w-3/4 h-1 bg-[var(--border)] rounded-full" />
                  <div className="w-5/6 h-1 bg-[var(--border)] rounded-full" />
                </div>
              </motion.div>

              {/* The 3D Book Carousel Stack */}
              <div className="relative w-full flex items-center justify-center h-full">
                {/* Layer 3: Back-most Book (partially visible) */}
                {carouselBooks.length > 2 && (
                  <motion.div
                    key={`back2-${(activeBookIndex + 2) % carouselBooks.length}`}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{
                      opacity: 0.45,
                      scale: 0.78,
                      x: 80,
                      y: -25,
                      rotate: 14,
                    }}
                    transition={{ duration: 0.45 }}
                    className="absolute w-44 aspect-[2/3] rounded-xl overflow-hidden book-cover-shadow book-spine bg-[var(--card)] border border-black/10 z-0 pointer-events-none select-none blur-[0.5px]"
                  >
                    <Image
                      src={carouselBooks[(activeBookIndex + 2) % carouselBooks.length]?.coverUrl}
                      alt="Layered book"
                      fill
                      className="object-cover"
                      sizes="180px"
                    />
                  </motion.div>
                )}

                {/* Layer 2: Mid-ground Book */}
                {carouselBooks.length > 1 && (
                  <motion.div
                    key={`back1-${(activeBookIndex + 1) % carouselBooks.length}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: 0.75,
                      scale: 0.88,
                      x: 45,
                      y: -12,
                      rotate: 7,
                    }}
                    transition={{ duration: 0.45 }}
                    onClick={handleNext}
                    className="absolute w-48 sm:w-52 aspect-[2/3] rounded-xl overflow-hidden book-cover-shadow book-spine bg-[var(--card)] border border-black/10 z-10 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={carouselBooks[(activeBookIndex + 1) % carouselBooks.length]?.coverUrl}
                      alt="Layered book"
                      fill
                      className="object-cover"
                      sizes="210px"
                    />
                  </motion.div>
                )}

                {/* Layer 1: Foreground Active Featured Book */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentBook?.id}
                    initial={{ opacity: 0, x: -30, scale: 0.94 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 30, scale: 0.94 }}
                    transition={{ duration: 0.35 }}
                    className="relative w-52 sm:w-60 aspect-[2/3] rounded-2xl overflow-hidden book-cover-shadow book-spine bg-[var(--card)] border-2 border-white/60 z-20 group"
                  >
                    <Link href={`/books/${currentBook?.slug}`}>
                      <Image
                        src={currentBook?.coverUrl || "/placeholder-cover.jpg"}
                        alt={currentBook?.title || "Book"}
                        fill
                        priority
                        className="object-cover group-hover:scale-102 transition-transform duration-500"
                        sizes="260px"
                      />
                    </Link>

                    {/* Access Tag Overlay */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-black/60 text-white shadow-xs">
                      {currentBook?.accessType === "FREE"
                        ? "FREE READ"
                        : currentBook?.accessType === "PREVIEW"
                        ? "FREE PREVIEW"
                        : `₹${currentBook?.price || 199}`}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Dynamic Book Metadata Card below the carousel */}
            <div className="w-full max-w-[420px] -mt-2 z-30">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentBook?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-lg flex items-center justify-between gap-4 backdrop-blur-md"
                >
                  <div className="pr-2 min-w-0">
                    <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                      <Star className="w-3.5 h-3.5 fill-amber-500" />
                      <span>{currentBook?.rating?.toFixed(1) || "4.9"}</span>
                      <span className="text-[var(--muted)] font-normal text-[11px]">
                        • {currentBook?.categoryName}
                      </span>
                    </div>
                    <Link
                      href={`/books/${currentBook?.slug}`}
                      className="font-bold text-sm text-[var(--foreground)] truncate block hover:text-[var(--primary)] transition-colors mt-0.5"
                    >
                      {currentBook?.title}
                    </Link>
                    <span className="text-xs text-[var(--muted)] truncate block">
                      by {currentBook?.author}
                    </span>
                  </div>

                  {/* Actions & Carousel Switchers */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={bookCta.href}
                      className="px-3.5 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{bookCta.text}</span>
                    </Link>

                    <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
                      <button
                        onClick={handlePrev}
                        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Previous featured book"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-subtle)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                        aria-label="Next featured book"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* How Readora Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </section>
  );
}
