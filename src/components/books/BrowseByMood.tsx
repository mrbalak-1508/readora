"use client";

import React from "react";
import Link from "next/link";
import {
  Brain,
  Lightbulb,
  Sparkles,
  Target,
  Hourglass,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

interface MoodCard {
  title: string;
  tagline: string;
  moodKey: string;
  icon: React.ReactNode;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export function BrowseByMood() {
  const moods: MoodCard[] = [
    {
      title: "Want to learn",
      tagline: "Sharpen your intellect with deep knowledge",
      moodKey: "learn",
      icon: <Brain className="w-6 h-6 text-[#5A3E85]" />,
      bgClass: "bg-[#F2ECF9]/80 hover:bg-[#F2ECF9]",
      borderClass: "border-[#D8CAEB]",
      textClass: "text-[#5A3E85]",
    },
    {
      title: "Need inspiration",
      tagline: "Spark fresh creative perspectives and drive",
      moodKey: "inspiration",
      icon: <Lightbulb className="w-6 h-6 text-[#E9B949]" />,
      bgClass: "bg-[#FEF8E8]/90 hover:bg-[#FEF8E8]",
      borderClass: "border-[#F4DC9E]",
      textClass: "text-[#977114]",
    },
    {
      title: "Escape into a story",
      tagline: "Venture into mesmerizing fictional worlds",
      moodKey: "escape",
      icon: <Sparkles className="w-6 h-6 text-[#E97868]" />,
      bgClass: "bg-[#FDEDE9]/80 hover:bg-[#FDEDE9]",
      borderClass: "border-[#F8C1B9]",
      textClass: "text-[#C74B39]",
    },
    {
      title: "Build a habit",
      tagline: "Daily micro-routines for lasting personal mastery",
      moodKey: "habits",
      icon: <Target className="w-6 h-6 text-[#83B89F]" />,
      bgClass: "bg-[#EEF6F2]/90 hover:bg-[#EEF6F2]",
      borderClass: "border-[#BFDFD0]",
      textClass: "text-[#3D785D]",
    },
    {
      title: "Explore history",
      tagline: "Uncover pivotal epochs, triumphs and revolutions",
      moodKey: "history",
      icon: <Hourglass className="w-6 h-6 text-[#8DB8D8]" />,
      bgClass: "bg-[#EEF5FA]/90 hover:bg-[#EEF5FA]",
      borderClass: "border-[#C2DCF0]",
      textClass: "text-[#396F96]",
    },
    {
      title: "Improve your career",
      tagline: "Executive strategies, business acumen & leadership",
      moodKey: "career",
      icon: <TrendingUp className="w-6 h-6 text-[#5A3E85]" />,
      bgClass: "bg-[#F2ECF9]/80 hover:bg-[#F2ECF9]",
      borderClass: "border-[#D8CAEB]",
      textClass: "text-[#5A3E85]",
    },
  ];

  return (
    <section className="py-12 border-t border-[var(--border)]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--secondary)] block mb-1">
            Intuitive Discovery
          </span>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Browse by Reading Mood
          </h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Don&apos;t know what title you want? Read according to how you want to feel.
          </p>
        </div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
        >
          <span>All Discovery Modes</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {moods.map((mood) => (
          <Link
            key={mood.moodKey}
            href={`/explore?mood=${mood.moodKey}`}
            className={`p-5 rounded-3xl border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex items-start gap-4 ${mood.bgClass} ${mood.borderClass}`}
          >
            <div className="p-3 rounded-2xl bg-white/90 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              {mood.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-editorial font-bold text-base ${mood.textClass}`}>
                  {mood.title}
                </h3>
                <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-black/70 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed line-clamp-2">
                {mood.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
