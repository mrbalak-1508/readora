"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { useAuth } from "@/context/AuthContext";
import { soundManager } from "@/lib/sound";
import {
  User,
  Sliders,
  Volume2,
  VolumeX,
  Bell,
  Shield,
  Check,
  Moon,
  Sun,
  Type,
  AlignLeft,
} from "lucide-react";

export default function SettingsPage() {
  const { user, updatePreferences, switchRole } = useAuth();

  const [activeTab, setActiveTab] = useState<"reading" | "profile" | "sound" | "security">("reading");
  const [savedToast, setSavedToast] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [readerTheme, setReaderTheme] = useState("paper");
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState("serif");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSoundEnabled(soundManager.isEnabled());
      setReaderTheme(localStorage.getItem("readora_reader_theme") || "paper");
      setFontSize(Number(localStorage.getItem("readora_reader_font_size")) || 18);
      setFontFamily(localStorage.getItem("readora_reader_font") || "serif");
    }
  }, []);

  const handleSoundToggle = (val: boolean) => {
    setSoundEnabled(val);
    soundManager.setEnabled(val);
    triggerSaved();
  };

  const handleThemeChange = (theme: string) => {
    setReaderTheme(theme);
    localStorage.setItem("readora_reader_theme", theme);
    triggerSaved();
  };

  const handleFontChange = (font: string) => {
    setFontFamily(font);
    localStorage.setItem("readora_reader_font", font);
    triggerSaved();
  };

  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    localStorage.setItem("readora_reader_font_size", size.toString());
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-14 pb-20 md:pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-main)]">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              Personalize your digital reading environment, auditory cues, and profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Sidebar Navigation */}
            <div className="md:col-span-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-3 shadow-xs space-y-1">
              {[
                { id: "reading", label: "Reading Preferences", icon: Sliders },
                { id: "sound", label: "Sound Effects", icon: Volume2 },
                { id: "profile", label: "Profile & Identity", icon: User },
                { id: "security", label: "Security & Role", icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left ${
                      activeTab === tab.id
                        ? "bg-[var(--accent-light)] text-[var(--accent)] font-semibold"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content Pane */}
            <div className="md:col-span-8 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-8 shadow-xs">
              {/* Reading Preferences */}
              {activeTab === "reading" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-editorial text-xl font-bold text-[var(--text-main)]">
                      Default Reader Appearance
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      These settings will be applied automatically whenever you open any book.
                    </p>
                  </div>

                  {/* Theme choice */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] block mb-2.5">
                      Reader Theme
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: "paper", label: "Paper", bg: "#F9F8F5", text: "#21201D" },
                        { id: "sepia", label: "Sepia", bg: "#F4EBD9", text: "#4A3B2C" },
                        { id: "dark", label: "Dark", bg: "#1B1A18", text: "#DCD7CE" },
                        { id: "black", label: "Night", bg: "#0A0A0A", text: "#A3A3A3" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          style={{ backgroundColor: t.bg, color: t.text }}
                          className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center transition-all ${
                            readerTheme === t.id
                              ? "ring-2 ring-[var(--accent)] shadow-md border-transparent"
                              : "border-[var(--border-main)] opacity-80 hover:opacity-100"
                          }`}
                        >
                          <span className="font-editorial text-base font-bold mb-1">Aa</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-subtle)] block mb-2.5">
                      Preferred Font Family
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "serif", label: "Serif (Editorial)", family: "font-serif" },
                        { id: "sans", label: "Sans (Modern)", family: "font-sans" },
                        { id: "mono", label: "Monospace", family: "font-mono" },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => handleFontChange(f.id)}
                          className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                            fontFamily === f.id
                              ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)] font-semibold"
                              : "border-[var(--border-main)] bg-[var(--bg-subtle)] text-[var(--text-main)]"
                          } ${f.family}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-semibold uppercase tracking-wider text-[var(--text-subtle)]">
                        Base Font Size
                      </span>
                      <span className="font-mono font-semibold text-[var(--text-main)]">
                        {fontSize}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="14"
                      max="28"
                      value={fontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="w-full accent-[var(--accent)] cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Sound Effects */}
              {activeTab === "sound" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-editorial text-xl font-bold text-[var(--text-main)]">
                      Sound Design & Auditory Cues
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Experience subtle paper page-turns, gentle bookmark chimes, and completion fanfare synthesized in real-time.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-subtle)]/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-[var(--accent)]" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-[var(--text-subtle)]" />
                      )}
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-[var(--text-main)]">
                          Enable UI Sound Effects
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Default is OFF. Sound is never required for navigation.
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSoundToggle(!soundEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        soundEnabled ? "bg-[var(--accent)]" : "bg-[var(--border-main)]"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          soundEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {soundEnabled && (
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-[var(--text-subtle)] uppercase tracking-wider block mb-2">
                        Test Synthesized Audio Cues:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => soundManager.playPageTurn()}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          Page Turn Flutter
                        </button>
                        <button
                          onClick={() => soundManager.playBookmark()}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          Bookmark Latch
                        </button>
                        <button
                          onClick={() => soundManager.playCompletion()}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-main)] text-xs text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          Completion Fanfare
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Profile */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-editorial text-xl font-bold text-[var(--text-main)]">
                      Reader Profile
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Your identity and reading statistics across the READORA library.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || "Marcus Vance"}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--text-subtle)] block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        disabled
                        value={user?.email || "curator@readora.library"}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--bg-subtle)]/50 border border-[var(--border-main)] outline-none text-[var(--text-muted)] cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Security & Role */}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-editorial text-xl font-bold text-[var(--text-main)]">
                      Security & Account Role
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Control permissions, platform authorization, and role elevation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-subtle)]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-muted)]">Current Account Role:</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--accent)] uppercase tracking-wider">
                        {user?.role || "user"}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--text-muted)]">
                      {user?.role === "admin"
                        ? "You have full administrator privileges: uploading volumes, editing catalog, managing taxonomies, and monitoring analytics."
                        : "You are currently signed in as a standard reader."}
                    </div>

                    <div className="pt-2 border-t border-[var(--border-main)]">
                      <button
                        onClick={() => {
                          const nextRole = user?.role === "admin" ? "user" : "admin";
                          switchRole(nextRole);
                          triggerSaved();
                        }}
                        className="px-4 py-2 rounded-full bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors shadow-xs"
                      >
                        Switch Role to {user?.role === "admin" ? "Reader" : "Admin (Full Control)"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast Feedback */}
      {savedToast && (
        <div className="fixed bottom-10 right-10 px-4 py-2 rounded-xl bg-[var(--text-main)] text-[var(--bg-main)] text-xs font-medium shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span>Preferences Saved</span>
        </div>
      )}

      <Footer />
      <MobileNav />
    </div>
  );
}
