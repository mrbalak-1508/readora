"use client";

import React, { useState, useRef } from "react";
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
  Volume2,
  VolumeX,
  Play,
  Music,
  UploadCloud,
  FileAudio,
  Trash2,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { showToastAlert } from "@/lib/alerts";
import { soundManager, SOUND_PROFILES, SoundProfile } from "@/lib/sound";

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
    soundProfile: "parchment" as SoundProfile,
    soundVolume: 0.8,
    soundUrl: "",
  });

  const [testingSoundId, setTestingSoundId] = useState<string | null>(null);
  const [uploadingSfx, setUploadingSfx] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload local audio file to server storage
  const handleAudioUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      showToastAlert({
        title: "File Too Large",
        text: "Please select an audio file under 10MB.",
        icon: "error",
      });
      return;
    }

    setUploadingSfx(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/settings/upload-sfx", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload audio file");
      }

      setReader((prev) => ({
        ...prev,
        soundProfile: "custom",
        soundUrl: data.url,
      }));

      soundManager.setCustomAudioUrl(data.url);
      soundManager.setSoundProfile("custom", false);

      showToastAlert({
        title: "Audio Uploaded!",
        text: `Uploaded "${data.fileName}". Custom SFX is active.`,
        icon: "success",
      });
    } catch (err: any) {
      setUploadError(err?.message || "Failed to upload audio");
      showToastAlert({
        title: "Upload Failed",
        text: err?.message || "Could not upload audio file.",
        icon: "error",
      });
    } finally {
      setUploadingSfx(false);
    }
  };

  // Load saved settings from server on mount
  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings) {
          setReader((prev) => ({
            ...prev,
            default3DAnimation: data.settings.reader_default_3d ?? prev.default3DAnimation,
            defaultSound: data.settings.reader_default_sound ?? prev.defaultSound,
            watermarkEnabled: data.settings.reader_watermark_enabled ?? prev.watermarkEnabled,
            soundProfile: data.settings.reader_sound_profile ?? prev.soundProfile,
            soundVolume: data.settings.reader_sound_volume ?? prev.soundVolume,
            soundUrl: data.settings.reader_sound_url ?? prev.soundUrl,
          }));
        }
      })
      .catch(() => {});
  }, []);

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

  const handleSave = async () => {
    setSaved(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reader_default_3d: reader.default3DAnimation,
          reader_default_sound: reader.defaultSound,
          reader_watermark_enabled: reader.watermarkEnabled,
          reader_sound_profile: reader.soundProfile,
          reader_sound_volume: reader.soundVolume,
          reader_sound_url: reader.soundUrl,
        }),
      });

      // Update local client sound manager directly
      soundManager.setSoundProfile(reader.soundProfile, false);
      soundManager.setVolume(reader.soundVolume);
      if (reader.soundUrl) {
        soundManager.setCustomAudioUrl(reader.soundUrl);
      }

      showToastAlert({ title: "Settings Saved", text: "Global platform configuration and reader sound updated!", icon: "success" });
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
            <div className="space-y-6">
              <div className="border-b border-[var(--border)] pb-3">
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Reader Engine & SFX Audio Controls
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Configure default physical reading immersion parameters and page turn sound effects.
                </p>
              </div>

              {/* Core Feature Toggles */}
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
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

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
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

                <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:border-[var(--primary)]/40 transition-colors">
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

              {/* SFX SOUND PROFILE SELECTOR */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-[var(--primary)]" />
                      <h4 className="font-bold text-sm text-[var(--foreground)]">
                        Page Turn Sound Effect (SFX)
                      </h4>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-0.5">
                      Select the organic acoustic timbre produced when users turn pages across the platform.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      soundManager.setEnabled(true);
                      soundManager.setVolume(reader.soundVolume);
                      soundManager.playPageTurn(reader.soundProfile);
                      setTestingSoundId(reader.soundProfile);
                      setTimeout(() => setTestingSoundId(null), 600);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test Current Sound</span>
                  </button>
                </div>

                {/* Sound Profiles Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SOUND_PROFILES.map((p) => {
                    const isSelected = reader.soundProfile === p.id;
                    const isPlayingThis = testingSoundId === p.id;

                    return (
                      <div
                        key={p.id}
                        onClick={() => setReader({ ...reader, soundProfile: p.id })}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? "bg-[var(--accent-light)] border-[var(--primary)] shadow-xs"
                            : "bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary)]/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[var(--foreground)]">
                                {p.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 opacity-70">
                                {p.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--muted)] mt-1 line-clamp-2 leading-relaxed">
                              {p.id === "custom" && reader.soundUrl
                                ? `Active file: ${reader.soundUrl.split("/").pop()}`
                                : p.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.setEnabled(true);
                              soundManager.setVolume(reader.soundVolume);
                              soundManager.playPageTurn(p.id);
                              setTestingSoundId(p.id);
                              setTimeout(() => setTestingSoundId(null), 600);
                            }}
                            className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                              isPlayingThis
                                ? "bg-[var(--primary)] text-white scale-110"
                                : "bg-black/5 dark:bg-white/10 hover:bg-[var(--primary)] hover:text-white text-current"
                            }`}
                            title={`Preview ${p.name}`}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-[var(--muted)]">
                          <span>{isSelected ? "Active Default" : "Click to select"}</span>
                          <input
                            type="radio"
                            name="soundProfileRadio"
                            checked={isSelected}
                            onChange={() => setReader({ ...reader, soundProfile: p.id })}
                            className="accent-[var(--primary)] cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom SFX Audio Upload & Management */}
                {reader.soundProfile === "custom" && (
                  <div className="p-4 sm:p-5 rounded-3xl bg-[var(--background)] border border-[var(--border)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileAudio className="w-4 h-4 text-[var(--primary)]" />
                          <h5 className="font-bold text-xs sm:text-sm text-[var(--foreground)]">
                            Custom SFX Audio File
                          </h5>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">
                          Upload an audio sample directly from your computer (.mp3, .wav, .ogg, .m4a).
                        </p>
                      </div>

                      {reader.soundUrl && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              soundManager.setEnabled(true);
                              soundManager.setVolume(reader.soundVolume);
                              soundManager.setCustomAudioUrl(reader.soundUrl);
                              soundManager.playPageTurn("custom");
                              setTestingSoundId("custom-preview");
                              setTimeout(() => setTestingSoundId(null), 700);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                              testingSoundId === "custom-preview"
                                ? "bg-emerald-600 text-white scale-105"
                                : "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                            }`}
                            title="Play custom sound"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>{testingSoundId === "custom-preview" ? "Playing..." : "Test Audio"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setReader({ ...reader, soundUrl: "" });
                              soundManager.setCustomAudioUrl("");
                            }}
                            className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-red-500/10 hover:border-red-500/30 text-red-500 transition-colors cursor-pointer"
                            title="Clear custom audio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.weba"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAudioUpload(file);
                          e.target.value = "";
                        }
                      }}
                      className="hidden"
                    />

                    {/* Drag & Drop Local Upload Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleAudioUpload(file);
                      }}
                      onClick={() => !uploadingSfx && fileInputRef.current?.click()}
                      className={`relative p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-2.5 ${
                        isDragOver
                          ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.01]"
                          : "border-[var(--border)] hover:border-[var(--primary)]/60 bg-[var(--card)] hover:bg-[var(--background)]"
                      }`}
                    >
                      {uploadingSfx ? (
                        <div className="flex flex-col items-center gap-2 py-2">
                          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            Uploading and processing audio...
                          </span>
                          <span className="text-[11px] text-[var(--muted)]">
                            Saving directly to server storage
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shadow-inner">
                            <UploadCloud className="w-6 h-6" />
                          </div>

                          <div>
                            <span className="text-xs font-bold text-[var(--foreground)] block">
                              Click to choose local audio file or drag & drop here
                            </span>
                            <span className="text-[11px] text-[var(--muted)] mt-0.5 block">
                              Supports MP3, WAV, OGG, M4A, AAC (Max 10MB)
                            </span>
                          </div>

                          <button
                            type="button"
                            className="mt-1 px-4 py-1.5 rounded-xl bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold transition-colors cursor-pointer"
                          >
                            Browse from Computer
                          </button>
                        </>
                      )}
                    </div>

                    {uploadError && (
                      <p className="text-xs font-medium text-red-500 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
                        {uploadError}
                      </p>
                    )}

                    {/* Active Uploaded File Card */}
                    {reader.soundUrl && (
                      <div className="p-3 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[var(--foreground)] truncate">
                              {reader.soundUrl.split("/").pop()}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono truncate">
                              Path: {reader.soundUrl}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-[11px] font-bold text-[var(--foreground)] transition-colors shrink-0 cursor-pointer"
                        >
                          Change File
                        </button>
                      </div>
                    )}

                    {/* Secondary External URL Option */}
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setShowUrlFallback(!showUrlFallback)}
                        className="text-[11px] font-semibold text-[var(--muted)] hover:text-[var(--primary)] transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{showUrlFallback ? "▼ Hide URL input" : "► Or enter external audio URL"}</span>
                      </button>

                      {showUrlFallback && (
                        <div className="mt-2.5 space-y-1.5">
                          <label className="block text-[11px] font-bold text-[var(--foreground)]">
                            Direct Audio Link (CDN or External Web URL)
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/audio/page-turn.mp3"
                            value={reader.soundUrl}
                            onChange={(e) => setReader({ ...reader, soundUrl: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs outline-none font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Default Volume Slider */}
                <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[var(--foreground)] block">
                      Default SFX Volume ({Math.round(reader.soundVolume * 100)}%)
                    </span>
                    <span className="text-[11px] text-[var(--muted)]">
                      Initial volume level applied when users activate sound effects.
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <VolumeX className="w-3.5 h-3.5 text-[var(--muted)]" />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={reader.soundVolume}
                      onChange={(e) => setReader({ ...reader, soundVolume: parseFloat(e.target.value) })}
                      className="w-32 sm:w-40 accent-[var(--primary)] h-1.5 rounded-lg cursor-pointer"
                    />
                    <Volume2 className="w-4 h-4 text-[var(--primary)]" />
                  </div>
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
