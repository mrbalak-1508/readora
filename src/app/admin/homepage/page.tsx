"use client";

import React, { useState, useEffect } from "react";
import {
  Home,
  Save,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  CheckCircle,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

export default function AdminHomepageCMSPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [heroConfig, setHeroConfig] = useState({
    badge: "READORA DIGITAL LIBRARY",
    headlineLine1: "Every story deserves",
    headlineLine2: "a beautiful place to be read.",
    subheading: "Discover thoughtfully curated books, read beautifully, and keep every story within reach.",
    primaryCta: "Explore Library",
    secondaryCta: "How Readora Works",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await fetch("/api/admin/homepage");
      if (res.ok) {
        const data = await res.json();
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections);
        }
        if (data.heroConfig) {
          setHeroConfig(data.heroConfig);
        }
      }
    } catch (err) {
      console.error("Failed to load homepage CMS:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    // reassign sort orders
    const updated = newSections.map((sec, idx) => ({
      ...sec,
      sortOrder: idx + 1,
    }));

    setSections(updated);
  };

  const toggleSection = (index: number) => {
    const updated = [...sections];
    updated[index].enabled = !updated[index].enabled;
    setSections(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections,
          heroConfig,
        }),
      });

      if (res.ok) {
        showToastAlert({ title: "Saved", text: "Homepage layout and configuration updated!", icon: "success" });
      }
    } catch {
      showToastAlert({ title: "Error", text: "Failed to save CMS configuration", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Content Management System
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Homepage CMS & Layout Studio
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Configure the hero headlines, enable/disable discovery shelves, and reorder catalog sections.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Publishing..." : "Publish Changes"}</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Hero Section Config */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
              <Sparkles className="w-5 h-5 text-[var(--primary)]" />
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                Cinematic Hero Configuration
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Top Pill Badge
                </label>
                <input
                  type="text"
                  value={heroConfig.badge}
                  onChange={(e) => setHeroConfig({ ...heroConfig, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Headline: Line 1 (Modern Sans)
                </label>
                <input
                  type="text"
                  value={heroConfig.headlineLine1}
                  onChange={(e) => setHeroConfig({ ...heroConfig, headlineLine1: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Headline: Line 2 (Editorial Serif Emphasis)
                </label>
                <input
                  type="text"
                  value={heroConfig.headlineLine2}
                  onChange={(e) => setHeroConfig({ ...heroConfig, headlineLine2: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)] font-serif italic"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Subheading Narrative
                </label>
                <textarea
                  rows={2}
                  value={heroConfig.subheading}
                  onChange={(e) => setHeroConfig({ ...heroConfig, subheading: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={heroConfig.primaryCta}
                  onChange={(e) => setHeroConfig({ ...heroConfig, primaryCta: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Secondary Button Text
                </label>
                <input
                  type="text"
                  value={heroConfig.secondaryCta}
                  onChange={(e) => setHeroConfig({ ...heroConfig, secondaryCta: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          {/* Homepage Sections Manager & Reordering */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
              <Layers className="w-5 h-5 text-[var(--primary)]" />
              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Homepage Section Ordering & Visibility
                </h3>
                <span className="text-xs text-[var(--muted)]">
                  Drag or use arrows to adjust the vertical reading flow on the landing page.
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {sections.map((sec, idx) => (
                <div
                  key={sec.sectionKey || idx}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    sec.enabled
                      ? "bg-[var(--card)] border-[var(--border)]"
                      : "bg-[var(--bg-subtle)]/50 border-dashed border-[var(--border)] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[var(--muted)] w-6 text-center">
                      0{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-editorial font-bold text-sm text-[var(--foreground)]">
                        {sec.title}
                      </h4>
                      <span className="text-xs text-[var(--muted)] line-clamp-1">{sec.subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleSection(idx)}
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        sec.enabled
                          ? "bg-[#83B89F]/15 text-[#3D785D]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                      title={sec.enabled ? "Section Enabled" : "Section Hidden"}
                    >
                      {sec.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="hidden sm:inline">{sec.enabled ? "Visible" : "Hidden"}</span>
                    </button>

                    <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden">
                      <button
                        onClick={() => moveSection(idx, "up")}
                        disabled={idx === 0}
                        className="p-2 hover:bg-[var(--bg-subtle)] disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSection(idx, "down")}
                        disabled={idx === sections.length - 1}
                        className="p-2 hover:bg-[var(--bg-subtle)] disabled:opacity-30 border-l border-[var(--border)] transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
