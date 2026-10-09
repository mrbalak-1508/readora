"use client";

import React from "react";
import { useReader } from "@/context/ReaderContext";
import {
  X,
  Type,
  AlignLeft,
  AlignJustify,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Zap,
  Bookmark,
  Search,
  Smartphone,
} from "lucide-react";
import { SOUND_PROFILES, soundManager } from "@/lib/sound";

interface ReaderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBookmarks?: () => void;
  onOpenSearch?: () => void;
}

export function ReaderSettingsModal({
  isOpen,
  onClose,
  onOpenBookmarks,
  onOpenSearch,
}: ReaderSettingsModalProps) {
  const {
    theme,
    setTheme,
    font,
    setFont,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    textAlign,
    setTextAlign,
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    soundProfile,
    setSoundProfile,
    animation3d,
    setAnimation3d,
    animationSpeed,
    setAnimationSpeed,
    touchTurnEnabled,
    setTouchTurnEnabled,
  } = useReader();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-t-3xl sm:rounded-3xl border border-[var(--border)] p-6 shadow-2xl z-10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
              Reading Appearance & Tools
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tools Navigation Strip */}
        {(onOpenBookmarks || onOpenSearch) && (
          <div className="grid grid-cols-2 gap-2 pb-4 mb-4 border-b border-[var(--border)]">
            {onOpenBookmarks && (
              <button
                onClick={() => {
                  onClose();
                  onOpenBookmarks();
                }}
                className="py-2.5 px-3 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--primary)] hover:text-white text-[var(--foreground)] border border-[var(--border)] flex flex-col items-center gap-1 text-xs font-semibold transition-all group"
              >
                <Bookmark className="w-4 h-4 text-[var(--coral)] group-hover:text-white transition-colors" />
                <span className="text-[11px]">Bookmarks</span>
              </button>
            )}
            {onOpenSearch && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="py-2.5 px-3 rounded-2xl bg-[var(--bg-subtle)] hover:bg-[var(--primary)] hover:text-white text-[var(--foreground)] border border-[var(--border)] flex flex-col items-center gap-1 text-xs font-semibold transition-all group"
              >
                <Search className="w-4 h-4 text-[var(--secondary)] group-hover:text-white transition-colors" />
                <span className="text-[11px]">Search Inside</span>
              </button>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Reader Theme: 5 Themes (Paper, Warm, Sepia, Dark, Midnight) */}
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-2.5">
              Theme Palette
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "paper", label: "Paper", bg: "#FAF7F0", text: "#1F1C22", border: "#E8E0D5" },
                { id: "warm", label: "Warm", bg: "#F7F0E3", text: "#2C2621", border: "#E5DEC9" },
                { id: "sepia", label: "Sepia", bg: "#F2E8D5", text: "#3E3224", border: "#D8CBAD" },
                { id: "dark", label: "Dark", bg: "#1F1C22", text: "#EDE8DE", border: "#35303B" },
                { id: "midnight", label: "Midnight", bg: "#121118", text: "#C4BFCC", border: "#252230" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id as any)}
                  style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                    theme === t.id
                      ? "ring-2 ring-[var(--primary)] shadow-md scale-102"
                      : "opacity-85 hover:opacity-100"
                  }`}
                >
                  <span className="text-base font-editorial font-bold mb-0.5">Aa</span>
                  <span className="text-[10px] truncate max-w-full">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3D Page Animation & Speed */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--foreground)] block">
                    3D Realistic Page-Turning
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Realistic depth, lighting & paper curl
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnimation3d(!animation3d)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  animation3d ? "bg-[var(--primary)]" : "bg-[var(--muted)]/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    animation3d ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {animation3d && (
              <div>
                <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1.5">
                  Page Flip Speed
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["fast", "normal", "slow"] as const).map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setAnimationSpeed(spd)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold capitalize border transition-all ${
                        animationSpeed === spd
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-2xs"
                          : "bg-[var(--card)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      {spd}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Finger / Touch Swipe Turn */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pr-3">
                <Smartphone className="w-4 h-4 text-[var(--accent)]" />
                <div>
                  <span className="text-xs font-bold text-[var(--foreground)] block">
                    Finger Swipe Page Turn
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Swipe left/right with your finger to turn pages. Turn off to avoid double-flips and use bottom buttons only.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTouchTurnEnabled(!touchTurnEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  touchTurnEnabled ? "bg-[var(--accent)]" : "bg-[var(--muted)]/40"
                }`}
                aria-label="Toggle Finger Swipe Page Turn"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    touchTurnEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Sound Effects & Volume */}
          <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-[var(--secondary)]" />
                ) : (
                  <VolumeX className="w-4 h-4 text-[var(--muted)]" />
                )}
                <div>
                  <span className="text-xs font-bold text-[var(--foreground)] block">
                    Reading Sound Effects
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    Tactile page flips, book opens & bookmarks
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  soundEnabled ? "bg-[var(--secondary)]" : "bg-[var(--muted)]/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {soundEnabled && (
              <div className="pt-2 space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mb-1">
                    <span>Sound Volume</span>
                    <span className="font-mono">{Math.round(soundVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundVolume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-full accent-[var(--secondary)] cursor-pointer h-1.5 rounded-full"
                  />
                </div>

                {/* SFX Timbre / Sound Profile Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1.5">
                    Page Turn SFX Timbre
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SOUND_PROFILES.map((p) => {
                      const isCurrent = (soundProfile || "parchment") === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSoundProfile(p.id);
                            soundManager.playPageTurn(p.id);
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-medium border text-center transition-all cursor-pointer truncate ${
                            isCurrent
                              ? "bg-[var(--secondary)] text-white border-[var(--secondary)] font-bold shadow-2xs"
                              : "bg-[var(--card)] text-[var(--muted)] border-[var(--border)] hover:bg-[var(--bg-subtle)]"
                          }`}
                          title={p.description}
                        >
                          {p.name.replace(/^(Classic |Crisp |Vintage |Digital |Whisper |Custom )/, "")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Typography Font */}
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-2.5">
              Typeface
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "serif", label: "Serif", sub: "Editorial" },
                { id: "sans", label: "Sans", sub: "Modern" },
                { id: "readable", label: "Readable", sub: "Clean" },
                { id: "mono", label: "Mono", sub: "Technical" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFont(f.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs transition-all ${
                    font === f.id
                      ? "border-[var(--primary)] bg-[var(--accent-light)] text-[var(--primary)] font-bold shadow-2xs"
                      : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-[var(--muted)]"
                  }`}
                >
                  <span className="font-semibold text-xs">{f.label}</span>
                  <span className="text-[10px] opacity-70">{f.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size & Line Height */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-xs text-[var(--muted)] font-semibold mb-1.5">
                <span>Font Size</span>
                <span className="font-mono">{fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center font-bold text-sm text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                >
                  -
                </button>
                <input
                  type="range"
                  min="14"
                  max="28"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)] cursor-pointer"
                />
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 1))}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center font-bold text-sm text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-[var(--muted)] font-semibold mb-1.5">
                <span>Line Spacing</span>
                <span className="font-mono">{lineHeight.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLineHeight(Math.max(1.3, Number((lineHeight - 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center font-bold text-sm text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                >
                  -
                </button>
                <input
                  type="range"
                  min="1.3"
                  max="2.4"
                  step="0.05"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(Number(e.target.value))}
                  className="flex-1 accent-[var(--primary)] cursor-pointer"
                />
                <button
                  onClick={() => setLineHeight(Math.min(2.4, Number((lineHeight + 0.1).toFixed(2))))}
                  className="w-8 h-8 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-center font-bold text-sm text-[var(--foreground)] hover:bg-[var(--bg-subtle)]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Text Alignment */}
          <div>
            <label className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-2">
              Text Alignment
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTextAlign("left")}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  textAlign === "left"
                    ? "border-[var(--primary)] bg-[var(--accent-light)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-[var(--muted)]"
                }`}
              >
                <AlignLeft className="w-4 h-4" />
                <span>Left Aligned</span>
              </button>

              <button
                onClick={() => setTextAlign("justify")}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border text-xs font-semibold transition-all ${
                  textAlign === "justify"
                    ? "border-[var(--primary)] bg-[var(--accent-light)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--bg-subtle)] text-[var(--muted)]"
                }`}
              >
                <AlignJustify className="w-4 h-4" />
                <span>Justified Editorial</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
