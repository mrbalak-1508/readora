"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  Sparkles,
  Home,
  BookOpen,
  Layers,
  CreditCard,
  Ticket,
  Cookie,
  ShieldCheck,
  Search,
  Mail,
  Bell,
  Save,
  CheckCircle,
  CheckCircle2,
  Lock,
  Type,
  Square,
  AlignJustify,
  Printer,
  Copy,
  Download,
  Shield,
  FileText,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";

type SettingsTab =
  | "general"
  | "brand"
  | "homepage"
  | "books"
  | "reader"
  | "payments"
  | "subscriptions"
  | "cookies"
  | "privacy"
  | "seo"
  | "email"
  | "notifications";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [saved, setSaved] = useState(false);

  // Settings State
  const [general, setGeneral] = useState({
    siteName: "READORA",
    siteUrl: "https://readora.library",
    supportEmail: "curator@readora.library",
    currency: "INR (₹)",
  });

  const [brand, setBrand] = useState({
    brandName: "READORA",
    tagline: "Read. Discover. Belong.",
    supportingMessage: "A beautiful home for the books you love.",
    primaryColor: "#5A3E85",
    accentColor: "#E9B949",
    coralColor: "#E97868",
    warmIvory: "#FAF7F0",
  });

  const [reader, setReader] = useState({
    defaultPageMode: "scroll",
    defaultTheme: "paper",
    defaultFont: "serif",
    defaultFontSize: 18,
    defaultLineHeight: 1.7,
    watermarkEnabled: true,
    allowCopy: false,
    allowPrint: false,
    allowDownload: false,
  });

  // Load saved settings from server on mount
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setReader((prev) => ({
            ...prev,
            defaultPageMode: data.settings.reader_default_page_mode ?? prev.defaultPageMode,
            defaultTheme: data.settings.reader_default_theme ?? prev.defaultTheme,
            defaultFont: data.settings.reader_default_font ?? prev.defaultFont,
            defaultFontSize: data.settings.reader_default_font_size ?? prev.defaultFontSize,
            defaultLineHeight: data.settings.reader_default_line_height ?? prev.defaultLineHeight,
            watermarkEnabled: data.settings.reader_watermark_enabled ?? prev.watermarkEnabled,
            allowCopy: data.settings.reader_allow_copy ?? prev.allowCopy,
            allowPrint: data.settings.reader_allow_print ?? prev.allowPrint,
            allowDownload: data.settings.reader_allow_download ?? prev.allowDownload,
          }));
        }
      })
      .catch(() => {});
  }, []);

  const [seo, setSeo] = useState({
    metaTitle: "READORA — Premium Digital Library & eBook Platform",
    metaDescription: "Every story deserves a beautiful place to be read. Discover curated volumes, preview freely, and immerse in modern distraction-free reading.",
    sitemapEnabled: true,
    robotsIndex: true,
  });

  const [email, setEmail] = useState({
    provider: "resend",
    fromAddress: "Readora Library <library@readora.app>",
    purchaseReceipts: true,
    subscriptionConfirmations: true,
    welcomeEmails: true,
  });

  const handleSave = async () => {
    setSaved(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reader_default_page_mode: reader.defaultPageMode,
          reader_default_theme: reader.defaultTheme,
          reader_default_font: reader.defaultFont,
          reader_default_font_size: reader.defaultFontSize,
          reader_default_line_height: reader.defaultLineHeight,
          reader_watermark_enabled: reader.watermarkEnabled,
          reader_allow_copy: reader.allowCopy,
          reader_allow_print: reader.allowPrint,
          reader_allow_download: reader.allowDownload,
        }),
      });

      showToastAlert({ title: "Settings Saved", text: "Global platform configuration and reader options updated!", icon: "success" });
    } catch {
      showToastAlert({ title: "Save Error", text: "Could not persist settings to server.", icon: "error" });
    }
    setTimeout(() => setSaved(false), 2500);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; link?: string }[] = [
    { id: "general", label: "General", icon: <Sliders className="w-4 h-4" /> },
    { id: "brand", label: "Brand & Identity", icon: <Sparkles className="w-4 h-4" /> },
    { id: "homepage", label: "Homepage CMS", icon: <Home className="w-4 h-4" />, link: "/admin/homepage" },
    { id: "books", label: "Book Rules", icon: <BookOpen className="w-4 h-4" /> },
    { id: "reader", label: "Reader Engine", icon: <Layers className="w-4 h-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="w-4 h-4" />, link: "/admin/settings/payments" },
    { id: "subscriptions", label: "Subscriptions", icon: <Ticket className="w-4 h-4" />, link: "/admin/subscriptions" },
    { id: "privacy", label: "Privacy & Cookie Consent", icon: <ShieldCheck className="w-4 h-4" />, link: "/admin/privacy" },
    { id: "seo", label: "SEO & OpenGraph", icon: <Search className="w-4 h-4" /> },
    { id: "email", label: "Transactional Email & SMTP", icon: <Mail className="w-4 h-4" />, link: "/admin/settings/email" },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-3 py-1 rounded-full">
            Platform Configuration
          </span>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            Site Settings & Governance
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            Global controls for brand identity, reader defaults, payments, SEO, and transactional services.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-[var(--accent-light)] border border-[var(--accent-border)] text-xs text-[var(--primary)] font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Platform settings updated successfully.</span>
        </div>
      )}

      {/* Main Settings Tabs & Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <div className="md:col-span-4 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-3 shadow-xs space-y-1">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return tab.link ? (
              <Link
                key={tab.id}
                href={tab.link}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <span className="text-[10px] text-[var(--primary)] font-semibold">Open →</span>
              </Link>
            ) : (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all text-left ${
                  isSelected
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Pane */}
        <div className="md:col-span-8 rounded-3xl bg-[var(--card)] border border-[var(--border)] p-6 sm:p-8 shadow-xs">
          {/* GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">
                General Platform Settings
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Platform Brand Name</label>
                  <input
                    type="text"
                    value={general.siteName}
                    onChange={(e) => setGeneral({ ...general, siteName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Primary Production Domain</label>
                  <input
                    type="text"
                    value={general.siteUrl}
                    onChange={(e) => setGeneral({ ...general, siteUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Support Contact Email</label>
                  <input
                    type="email"
                    value={general.supportEmail}
                    onChange={(e) => setGeneral({ ...general, supportEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BRAND */}
          {activeTab === "brand" && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">
                Brand & Palette Governance
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Brand Tagline</label>
                  <input
                    type="text"
                    value={brand.tagline}
                    onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Supporting Mission</label>
                  <input
                    type="text"
                    value={brand.supportingMessage}
                    onChange={(e) => setBrand({ ...brand, supportingMessage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                  />
                </div>
                <div className="pt-2 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#5A3E85]" />
                    <span>Plum (#5A3E85)</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#FAF7F0] border" />
                    <span>Warm Ivory (#FAF7F0)</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E97868]" />
                    <span>Coral (#E97868)</span>
                  </div>
                  <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#E9B949]" />
                    <span>Golden (#E9B949)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* READER ENGINE */}
          {activeTab === "reader" && (
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--primary)]" />
                  <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                    Reader Engine & Typography Defaults
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Configure default reading flow, typography, color themes, and content security (DRM) for all volumes.
                </p>
              </div>

              {/* Reading Layout & Flow */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                    Default Reading Flow & Page Mode
                  </h4>
                </div>
                <p className="text-[11px] text-[var(--muted)]">
                  Choose how readers first experience books across desktop, tablet, and mobile browsers.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setReader({ ...reader, defaultPageMode: "scroll" })}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      reader.defaultPageMode === "scroll"
                        ? "bg-[var(--accent-light)] border-[var(--primary)] shadow-xs"
                        : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <AlignJustify className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--foreground)] flex items-center gap-2">
                        <span>Continuous Scroll</span>
                        {reader.defaultPageMode === "scroll" && (
                          <span className="text-[10px] text-[var(--primary)] font-semibold">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                        Fluid vertical reading flow. Recommended for mobile screens, responsive layouts, and modern eBooks.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReader({ ...reader, defaultPageMode: "paged" })}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                      reader.defaultPageMode === "paged"
                        ? "bg-[var(--accent-light)] border-[var(--primary)] shadow-xs"
                        : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0 mt-0.5">
                      <Square className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-[var(--foreground)] flex items-center gap-2">
                        <span>Paginated (Page-by-Page)</span>
                        {reader.defaultPageMode === "paged" && (
                          <span className="text-[10px] text-[var(--primary)] font-semibold">Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                        Step-through pagination with discrete screen turns. Perfect for PDFs, comics, and fixed-layout titles.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Default Theme Palette */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                      Default Canvas Theme
                    </h4>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      The color palette applied when a reader opens any book before personal customization.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--primary)] uppercase bg-[var(--card)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                    {reader.defaultTheme}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-1">
                  {[
                    { id: "paper", label: "Pure Paper", bg: "#FFFFFF", text: "#1A1A1A", border: "#E2E8F0" },
                    { id: "warm", label: "Warm Ivory", bg: "#FAF7F0", text: "#2A2521", border: "#E8E2D5" },
                    { id: "sepia", label: "Vintage Sepia", bg: "#F4ECD8", text: "#433422", border: "#E0D3B8" },
                    { id: "dark", label: "Slate Dark", bg: "#1E232A", text: "#E2E8F0", border: "#333D4B" },
                    { id: "midnight", label: "Midnight OLED", bg: "#0D1117", text: "#C9D1D9", border: "#21262D" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setReader({ ...reader, defaultTheme: t.id })}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-2 ${
                        reader.defaultTheme === t.id
                          ? "ring-2 ring-[var(--primary)] shadow-xs"
                          : "hover:scale-[1.02]"
                      }`}
                      style={{ backgroundColor: t.bg, borderColor: t.border }}
                    >
                      <div className="w-full h-8 rounded-lg flex items-center justify-center font-bold text-xs" style={{ color: t.text }}>
                        Aa
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-full" style={{ color: t.text }}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Default Typography Font */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                    Default Reading Typography
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "serif", label: "Editorial Serif", sample: "Literary classic", style: "font-serif" },
                    { id: "sans", label: "Modern Sans", sample: "Crisp legibility", style: "font-sans" },
                    { id: "mono", label: "Monospace", sample: "Code & analytical", style: "font-mono" },
                    { id: "dyslexic", label: "OpenDyslexic", sample: "Accessible focus", style: "tracking-wide" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReader({ ...reader, defaultFont: f.id })}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        reader.defaultFont === f.id
                          ? "bg-[var(--accent-light)] border-[var(--primary)] shadow-xs"
                          : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--primary)]/40"
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--foreground)]">{f.label}</div>
                      <div className={`text-sm text-[var(--muted)] mt-1.5 truncate ${f.style}`}>
                        {f.sample}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Typography Scale Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[var(--border)]">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[var(--foreground)]">Default Font Size</span>
                      <span className="font-mono text-[var(--primary)] font-bold">{reader.defaultFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={14}
                      max={26}
                      step={1}
                      value={reader.defaultFontSize}
                      onChange={(e) => setReader({ ...reader, defaultFontSize: parseInt(e.target.value) || 18 })}
                      className="w-full accent-[var(--primary)] h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                      <span>14px (Compact)</span>
                      <span>18px (Standard)</span>
                      <span>26px (Large)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-[var(--foreground)]">Default Line Spacing</span>
                      <span className="font-mono text-[var(--primary)] font-bold">{reader.defaultLineHeight}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.3}
                      max={2.2}
                      step={0.1}
                      value={reader.defaultLineHeight}
                      onChange={(e) => setReader({ ...reader, defaultLineHeight: parseFloat(e.target.value) || 1.7 })}
                      className="w-full accent-[var(--primary)] h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
                      <span>1.3 (Tight)</span>
                      <span>1.7 (Optimal)</span>
                      <span>2.2 (Spacious)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DRM & Content Security Governance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
                  <Shield className="w-4 h-4 text-[var(--primary)]" />
                  <h4 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                    Copyright Protection & DRM Security
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs">
                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--foreground)] block">
                          Dynamic Reader Identity Watermark
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          Overlays subtle purchaser identity and license ID across volume canvases to prevent piracy leaks
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reader.watermarkEnabled}
                      onChange={(e) => setReader({ ...reader, watermarkEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--foreground)] block">
                          Allow Direct Text Clipboard Copying
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          Disabled by default. When off, prevents bulk scrapers and users from copying protected manuscript text
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reader.allowCopy}
                      onChange={(e) => setReader({ ...reader, allowCopy: e.target.checked })}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--foreground)] block">
                          Allow Browser Printing (Ctrl+P / Command+P)
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          Disabled by default. Intercepts print style sheets to protect publisher intellectual property
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reader.allowPrint}
                      onChange={(e) => setReader({ ...reader, allowPrint: e.target.checked })}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Download className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-[var(--foreground)] block">
                          Allow Direct Raw File Download
                        </span>
                        <span className="text-[11px] text-[var(--muted)]">
                          Keep disabled to enforce reading within the Readora secure reader interface only
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={reader.allowDownload}
                      onChange={(e) => setReader({ ...reader, allowDownload: e.target.checked })}
                      className="w-4 h-4 accent-[var(--primary)]"
                    />
                  </label>
                </div>
              </div>

              {/* Active Format Engines Status Card */}
              <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="font-bold text-[var(--foreground)]">Reader Engine Pipeline Active</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5">
                    Supporting Written Chapters (Instant DOM), PDF Documents (PDF.js Vector Canvas), and EPUB eBooks (EPUB.js Flow).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">Written DOM</span>
                  <span className="px-2 py-1 rounded-md bg-sky-500/10 text-sky-600 font-bold text-[10px]">PDF.js</span>
                  <span className="px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 font-bold text-[10px]">EPUB.js</span>
                </div>
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">
                Search Engine Optimization & OpenGraph
              </h3>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Global Meta Title</label>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Global Meta Description</label>
                  <textarea
                    rows={2}
                    value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none"
                  />
                </div>
                <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-[#3D785D]">✓ /sitemap.xml Active</span>
                  <span className="text-[#3D785D]">✓ /robots.txt Active</span>
                </div>
              </div>
            </div>
          )}

          {/* EMAIL */}
          {activeTab === "email" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Transactional Email Service &amp; SMTP
                </h3>
                <Link
                  href="/admin/settings/email"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Configure Full SMTP &amp; Alerts &rarr;</span>
                </Link>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">From Email Address</label>
                  <input
                    type="text"
                    value={email.fromAddress}
                    onChange={(e) => setEmail({ ...email, fromAddress: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] outline-none font-mono"
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={email.purchaseReceipts}
                      onChange={(e) => setEmail({ ...email, purchaseReceipts: e.target.checked })}
                      className="accent-[var(--primary)]"
                    />
                    <span>Send Purchase Receipts & Book Unlock Confirmations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={email.subscriptionConfirmations}
                      onChange={(e) => setEmail({ ...email, subscriptionConfirmations: e.target.checked })}
                      className="accent-[var(--primary)]"
                    />
                    <span>Send Subscription Renewal & Cancellation Notices</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={email.welcomeEmails}
                      onChange={(e) => setEmail({ ...email, welcomeEmails: e.target.checked })}
                      className="accent-[var(--primary)]"
                    />
                    <span>Send Reader Onboarding Welcome Digest</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* FALLBACK TABS */}
          {["books", "privacy", "notifications"].includes(activeTab) && (
            <div className="space-y-4">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3 capitalize">
                {activeTab} Management
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Active policies are enforced server-side via Prisma database records.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
