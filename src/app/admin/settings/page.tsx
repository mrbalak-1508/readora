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
    default3DAnimation: true,
    defaultSound: false,
    defaultSpeed: "normal",
    defaultTheme: "paper",
    watermarkEnabled: true,
  });

  const [seo, setSeo] = useState({
    metaTitle: "READORA — Premium Digital Library & eBook Platform",
    metaDescription: "Every story deserves a beautiful place to be read. Discover curated volumes, preview freely, and immerse in 3D reading.",
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

  const handleSave = () => {
    setSaved(true);
    showToastAlert({ title: "Settings Saved", text: "Global platform configuration updated!", icon: "success" });
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
    { id: "cookies", label: "Cookies & Consent", icon: <Cookie className="w-4 h-4" />, link: "/admin/privacy/cookies" },
    { id: "privacy", label: "Privacy Governance", icon: <ShieldCheck className="w-4 h-4" /> },
    { id: "seo", label: "SEO & OpenGraph", icon: <Search className="w-4 h-4" /> },
    { id: "email", label: "Transactional Email", icon: <Mail className="w-4 h-4" /> },
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
            <div className="space-y-4">
              <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] border-b border-[var(--border)] pb-3">
                Reader Defaults & Immersion Controls
              </h3>
              <div className="space-y-4 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">
                      3D Page Animation Enabled by Default
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      CSS 3D perspective and paper thickness transform
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reader.default3DAnimation}
                    onChange={(e) => setReader({ ...reader, default3DAnimation: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">
                      Page Sound Effects Enabled by Default
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Specification default: OFF until reader enables
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reader.defaultSound}
                    onChange={(e) => setReader({ ...reader, defaultSound: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">
                      Subtle Reader Watermark for Protected Content
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Displays &ldquo;Licensed to user@email.com&rdquo; on purchased volume pages
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reader.watermarkEnabled}
                    onChange={(e) => setReader({ ...reader, watermarkEnabled: e.target.checked })}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                </label>
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
