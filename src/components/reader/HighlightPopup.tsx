"use client";

import React, { useState } from "react";
import { useReader } from "@/context/ReaderContext";
import { Highlight } from "@/lib/types";
import { Highlighter, FileText, Copy, Check } from "lucide-react";

interface HighlightPopupProps {
  position: { top: number; left: number };
  selectedText: string;
  onClose: () => void;
}

export function HighlightPopup({ position, selectedText, onClose }: HighlightPopupProps) {
  const { addHighlight, theme } = useReader();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [copied, setCopied] = useState(false);

  const colors: { name: Highlight["color"]; bg: string }[] = [
    { name: "yellow", bg: "bg-amber-400 hover:bg-amber-300" },
    { name: "green", bg: "bg-emerald-400 hover:bg-emerald-300" },
    { name: "pink", bg: "bg-pink-400 hover:bg-pink-300" },
    { name: "blue", bg: "bg-sky-400 hover:bg-sky-300" },
    { name: "purple", bg: "bg-purple-400 hover:bg-purple-300" },
  ];

  const handleHighlight = (color: Highlight["color"]) => {
    addHighlight(selectedText, color);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
    onClose();
  };

  const handleSaveWithNote = (color: Highlight["color"] = "yellow") => {
    if (noteText.trim()) {
      addHighlight(selectedText, color, noteText.trim());
      if (typeof window !== "undefined") {
        window.getSelection()?.removeAllRanges();
      }
      onClose();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 800);
  };

  const themePopupBg = {
    paper: "bg-white/95 border-[#E5E0D4] text-[#1E1C24]",
    warm: "bg-[#FDF9F2]/95 border-[#E6DCC6] text-[#2C261E]",
    sepia: "bg-[#F4ECD8]/95 border-[#D8CCA8] text-[#3A2E1D]",
    dark: "bg-[#232028]/95 border-[#383340] text-[#E4DFEA]",
    midnight: "bg-[#141720]/95 border-[#222938] text-[#DCE4F2]",
  }[theme] || "bg-white/95 border-black/10 text-neutral-900";

  return (
    <div
      style={{
        top: `${Math.max(10, position.top - 60)}px`,
        left: `${Math.max(10, position.left)}px`,
      }}
      className={`fixed z-50 transform -translate-x-1/2 ${themePopupBg} border rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md`}
    >
      {!isAddingNote ? (
        <div className="flex items-center gap-1">
          {/* Colors */}
          <div className="flex items-center gap-1.5 px-2 py-1 border-r border-[var(--border-main)]">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => handleHighlight(c.name)}
                className={`w-4 h-4 rounded-full ${c.bg} hover:scale-125 transition-transform shadow-xs`}
                title={`Highlight ${c.name}`}
              />
            ))}
          </div>

          {/* Add Note Button */}
          <button
            onClick={() => setIsAddingNote(true)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] text-xs flex items-center gap-1 transition-colors"
            title="Add Note"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px]">Note</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] text-xs flex items-center gap-1 transition-colors"
            title="Copy Text"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      ) : (
        <div className="p-2 w-64 space-y-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write marginal note..."
            className="w-full h-16 p-2 rounded-lg text-xs bg-[var(--bg-subtle)] border border-[var(--border-main)] outline-none text-[var(--text-main)] resize-none"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsAddingNote(false)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-main)]"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveWithNote("yellow")}
              className="px-3 py-1 rounded-md bg-[var(--accent)] text-white text-[11px] font-medium hover:bg-[var(--accent-hover)]"
            >
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
