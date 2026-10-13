"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  History,
  RotateCcw,
  BookOpen,
  Send,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToastAlert } from "@/lib/alerts";

interface ChapterData {
  id: string;
  bookId: string;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  order: number;
  status: "DRAFT" | "PUBLISHED" | string;
  isSection: boolean;
  content?: string | null;
  contentJson?: string | null;
  wordCount: number;
  readingTimeMinutes: number;
  previewAllowed: boolean;
  updatedAt: string;
  _count?: { revisions: number };
}

interface RevisionData {
  id: string;
  chapterId: string;
  title: string;
  wordCount: number;
  editorName?: string | null;
  revisionNote?: string | null;
  createdAt: string;
}

interface BookDetails {
  id: string;
  slug: string;
  title: string;
  author: string;
  status: string;
  accessType: string;
  price: number;
  categoryName: string;
  chapters: ChapterData[];
}

export default function WrittenBookEditorPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [book, setBook] = useState<BookDetails | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);

  // Focus & distraction-free mode
  const [distractionFree, setDistractionFree] = useState(false);

  // Save states
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Chapter editing metadata form
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterSubtitle, setChapterSubtitle] = useState("");
  const [chapterStatus, setChapterStatus] = useState<"DRAFT" | "PUBLISHED">("DRAFT");
  const [previewAllowed, setPreviewAllowed] = useState(true);

  // Revisions
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [showRevisionsPanel, setShowRevisionsPanel] = useState(false);

  // Publishing validation warnings
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Markdown Import Modal
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");

  // Tiptap Editor Instance
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[var(--primary)] underline" },
      }),
      ImageExtension.configure({
        allowBase64: true,
        HTMLAttributes: { class: "rounded-xl my-4 max-h-[500px] object-contain shadow-md mx-auto" },
      }),
      CharacterCount,
    ],
    content: "<p>Loading manuscript content...</p>",
    editorProps: {
      attributes: {
        class:
          "prose prose-stone dark:prose-invert max-w-none focus:outline-none min-h-[550px] text-base leading-relaxed font-serif",
      },
    },
    onUpdate: () => {
      setSaveStatus("idle");
    },
  });

  // Load Book and Chapters
  const loadBook = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/written-books/${bookId}`);
      if (!res.ok) throw new Error("Book not found");
      const data = await res.json();
      setBook(data.book);
      setChapters(data.book.chapters || []);
      setValidationWarnings(data.validation?.warnings || []);

      if (data.book.chapters && data.book.chapters.length > 0) {
        // Keep current selected chapter or default to first
        setSelectedChapterId((prev) => prev || data.book.chapters[0].id);
      }
    } catch (err: any) {
      console.error(err);
      showErrorAlert("Failed to load book", err.message);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  // When selected chapter changes, load its content into editor
  useEffect(() => {
    if (!selectedChapterId || chapters.length === 0) return;
    const ch = chapters.find((c) => c.id === selectedChapterId);
    if (!ch) return;

    setActiveChapter(ch);
    setChapterTitle(ch.title);
    setChapterSubtitle(ch.subtitle || "");
    setChapterStatus(ch.status as any);
    setPreviewAllowed(ch.previewAllowed);

    if (editor) {
      if (ch.contentJson) {
        try {
          const json = typeof ch.contentJson === "string" ? JSON.parse(ch.contentJson) : ch.contentJson;
          editor.commands.setContent(json);
        } catch {
          editor.commands.setContent(ch.content || "");
        }
      } else {
        editor.commands.setContent(ch.content || "<p></p>");
      }
    }

    // Load revisions for this chapter
    fetchRevisions(ch.id);
  }, [selectedChapterId, editor]);

  const fetchRevisions = async (chId: string) => {
    setLoadingRevisions(true);
    try {
      const res = await fetch(`/api/admin/written-books/${bookId}/chapters/${chId}/revisions`);
      if (res.ok) {
        const data = await res.json();
        setRevisions(data.revisions || []);
      }
    } catch (err) {
      console.error("Revisions load error:", err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  // Explicit Save / Autosave
  const saveChapter = async (manual = false) => {
    if (!selectedChapterId || !editor) return;

    setSaveStatus("saving");
    try {
      const htmlContent = editor.getHTML();
      const jsonContent = editor.getJSON();

      const res = await fetch(`/api/admin/written-books/${bookId}/chapters/${selectedChapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: chapterTitle,
          subtitle: chapterSubtitle,
          status: chapterStatus,
          previewAllowed,
          content: htmlContent,
          contentJson: jsonContent,
          createRevision: manual,
          revisionNote: manual ? "Manual save snapshot" : undefined,
        }),
      });

      if (!res.ok) throw new Error("Save request failed");
      const data = await res.json();

      setSaveStatus("saved");
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastSavedTime(timeStr);

      // Update local chapters list
      setChapters((prev) =>
        prev.map((c) => (c.id === selectedChapterId ? { ...c, ...data.chapter } : c))
      );

      if (manual) {
        showToastAlert("Chapter saved and revision recorded", "success");
        fetchRevisions(selectedChapterId);
      }
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
      showErrorAlert("Save failed", err.message || "Failed to save chapter");
    }
  };

  // Debounced Autosave (every 3 seconds of inactivity after change)
  useEffect(() => {
    if (!editor || !selectedChapterId) return;

    const timer = setTimeout(() => {
      if (saveStatus === "idle") {
        saveChapter(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [saveStatus, chapterTitle, chapterSubtitle, chapterStatus, previewAllowed]);

  // Create new chapter or section
  const handleAddChapter = async (isSection = false) => {
    try {
      const res = await fetch(`/api/admin/written-books/${bookId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isSection,
          title: isSection ? `Part ${chapters.length + 1}: New Section` : `Chapter ${chapters.length + 1}: Untitled`,
        }),
      });

      if (!res.ok) throw new Error("Failed to add chapter");
      const data = await res.json();

      setChapters((prev) => [...prev, data.chapter]);
      setSelectedChapterId(data.chapter.id);
      showToastAlert(isSection ? "Section created" : "Chapter created", "success");
    } catch (err: any) {
      showErrorAlert("Error adding chapter", err.message);
    }
  };

  // Duplicate chapter
  const handleDuplicateChapter = async (chId: string) => {
    try {
      const res = await fetch(`/api/admin/written-books/${bookId}/chapters/${chId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });
      if (!res.ok) throw new Error("Failed to duplicate chapter");
      const data = await res.json();
      setChapters((prev) => [...prev, data.chapter]);
      setSelectedChapterId(data.chapter.id);
      showToastAlert("Chapter duplicated", "success");
    } catch (err: any) {
      showErrorAlert("Failed to duplicate", err.message);
    }
  };

  // Delete chapter
  const handleDeleteChapter = async (ch: ChapterData) => {
    if (chapters.length <= 1) {
      showErrorAlert("Cannot Delete", "The book must keep at least one chapter.");
      return;
    }

    const confirmed = await showConfirmAlert(
      "Delete Chapter",
      `Are you sure you want to delete "${ch.title}"? Unsaved text will be removed.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/written-books/${bookId}/chapters/${ch.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete chapter");

      const remaining = chapters.filter((c) => c.id !== ch.id);
      setChapters(remaining);
      if (selectedChapterId === ch.id) {
        setSelectedChapterId(remaining[0]?.id || null);
      }
      showToastAlert("Chapter deleted", "success");
    } catch (err: any) {
      showErrorAlert("Delete failed", err.message);
    }
  };

  // Reorder chapter Up or Down
  const handleMoveChapter = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const copy = [...chapters];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    setChapters(copy);

    try {
      await fetch(`/api/admin/written-books/${bookId}/chapters`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedChapterIds: copy.map((c) => c.id) }),
      });
    } catch (err) {
      console.error("Reorder failed:", err);
    }
  };

  // Restore Revision
  const handleRestoreRevision = async (revId: string) => {
    const confirmed = await showConfirmAlert(
      "Restore Revision",
      "Restore this previous version? Your current chapter state will be archived as a new revision."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/written-books/${bookId}/chapters/${selectedChapterId}/revisions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revisionId: revId }),
        }
      );
      if (!res.ok) throw new Error("Restore failed");
      const data = await res.json();

      setChapterTitle(data.chapter.title);
      if (editor) {
        if (data.chapter.contentJson) {
          const json = typeof data.chapter.contentJson === "string" ? JSON.parse(data.chapter.contentJson) : data.chapter.contentJson;
          editor.commands.setContent(json);
        } else {
          editor.commands.setContent(data.chapter.content || "");
        }
      }
      showSuccessAlert("Revision Restored", "Chapter reverted to selected snapshot.");
      if (selectedChapterId) fetchRevisions(selectedChapterId);
    } catch (err: any) {
      showErrorAlert("Failed to restore revision", err.message);
    }
  };

  // Publish / Unpublish Book
  const handleTogglePublishBook = async () => {
    if (!book) return;
    const newStatus = book.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

    if (newStatus === "PUBLISHED" && validationWarnings.length > 0) {
      showErrorAlert("Cannot Publish Yet", validationWarnings.join(". "));
      return;
    }

    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/written-books/${bookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Publish failed");
      }
      const data = await res.json();
      setBook(data.book);
      showSuccessAlert(
        newStatus === "PUBLISHED" ? "Book Published!" : "Manuscript Saved as Draft",
        newStatus === "PUBLISHED"
          ? `"${data.book.title}" is now readable in the public reader.`
          : "Book is unlisted from the public catalog."
      );
    } catch (err: any) {
      showErrorAlert("Publication Error", err.message);
    } finally {
      setPublishing(false);
    }
  };

  // Convert simple markdown into editor HTML
  const handleImportMarkdown = () => {
    if (!editor || !markdownInput.trim()) return;

    let html = markdownInput
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" />')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n\n/gim, "</p><p>")
      .replace(/\n/gim, "<br />");

    html = `<p>${html}</p>`;
    editor.commands.setContent(html);
    setShowMarkdownModal(false);
    setMarkdownInput("");
    setSaveStatus("idle");
    showToastAlert("Markdown imported into chapter", "success");
  };

  const wordCount = editor?.storage.characterCount?.words() || 0;
  const charCount = editor?.storage.characterCount?.characters() || 0;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-xs text-[var(--muted)]">
        <RefreshCw className="w-6 h-6 animate-spin text-[var(--primary)] mr-3" />
        <span>Opening manuscript writing desk...</span>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-12 text-center text-xs space-y-3">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
        <div className="font-editorial text-lg font-bold text-[var(--foreground)]">Book Not Found</div>
        <Link href="/admin/written-books" className="text-[var(--primary)] font-bold hover:underline">
          Return to written books
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-3">
      {/* Top Studio Bar */}
      <header className="bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-3 flex items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin/written-books"
            className="p-1.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
            title="Back to Manuscripts"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-editorial text-base font-bold text-[var(--foreground)] truncate">
                {book.title}
              </h1>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                  book.status === "PUBLISHED"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {book.status}
              </span>
            </div>
            <div className="text-[11px] text-[var(--muted)] truncate">
              {book.author} • {chapters.length} chapters • {book.categoryName}
            </div>
          </div>
        </div>

        {/* Center Autosave Indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1.5 text-blue-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving draft...</span>
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved {lastSavedTime ? `at ${lastSavedTime}` : ""}</span>
            </span>
          )}
          {saveStatus === "error" && (
            <span className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save failed</span>
            </span>
          )}
          {saveStatus === "idle" && lastSavedTime && (
            <span className="opacity-70">Saved at {lastSavedTime}</span>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => saveChapter(true)}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card)] text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer"
            title="Save manual snapshot revision"
          >
            <Save className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Save</span>
          </button>

          <button
            onClick={() => setDistractionFree(!distractionFree)}
            className={`p-2 rounded-xl border border-[var(--border)] transition-colors cursor-pointer ${
              distractionFree ? "bg-[var(--primary)] text-white" : "hover:bg-[var(--background)] text-[var(--muted)]"
            }`}
            title={distractionFree ? "Exit focus mode" : "Distraction-free focus mode"}
          >
            {distractionFree ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <Link
            href={`/read/${book.slug || book.id}?preview=true`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-bold text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
            title="Open in reader preview"
          >
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Reader Preview</span>
          </Link>

          <button
            onClick={handleTogglePublishBook}
            disabled={publishing}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
              book.status === "PUBLISHED"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
            }`}
          >
            {publishing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{book.status === "PUBLISHED" ? "Unpublish Book" : "Publish Book"}</span>
          </button>
        </div>
      </header>

      {/* Main 3-Part Workspace */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
        {/* LEFT SIDEBAR: Table of Contents & Chapter Organizer */}
        {!distractionFree && (
          <aside className="w-72 shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col justify-between overflow-hidden shadow-xs">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                <span className="font-editorial text-sm font-bold text-[var(--foreground)]">
                  Table of Contents
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleAddChapter(false)}
                  className="p-1 rounded-lg hover:bg-[var(--background)] text-[var(--primary)]"
                  title="Add Chapter"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chapters Reorderable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {chapters.map((ch, idx) => {
                const isSelected = ch.id === selectedChapterId;
                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChapterId(ch.id)}
                    className={`group p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-[var(--accent-light)] border-[var(--primary)]/30 text-[var(--foreground)] font-bold shadow-xs"
                        : "bg-[var(--background)]/60 border-transparent hover:border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-[var(--muted)] shrink-0">
                          {idx + 1}.
                        </span>
                        <span className="truncate">{ch.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--muted)] mt-1 font-mono">
                        <span>{ch.wordCount || 0} w</span>
                        <span>•</span>
                        <span
                          className={`uppercase text-[9px] font-bold ${
                            ch.status === "PUBLISHED" ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {ch.status}
                        </span>
                      </div>
                    </div>

                    {/* Quick Move / Action Buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveChapter(idx, "up");
                        }}
                        disabled={idx === 0}
                        className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveChapter(idx, "down");
                        }}
                        disabled={idx === chapters.length - 1}
                        className="p-1 text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-30"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateChapter(ch.id);
                        }}
                        className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChapter(ch);
                        }}
                        className="p-1 text-[var(--muted)] hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Actions */}
            <div className="p-3 border-t border-[var(--border)] grid grid-cols-2 gap-2 bg-[var(--background)]/40">
              <button
                onClick={() => handleAddChapter(false)}
                className="py-2 px-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] text-[11px] font-bold text-[var(--primary)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chapter</span>
              </button>
              <button
                onClick={() => handleAddChapter(true)}
                className="py-2 px-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--card)] text-[11px] font-bold text-[var(--foreground)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Add Part</span>
              </button>
            </div>
          </aside>
        )}

        {/* CENTER: Rich-Text Writing Workspace */}
        <main className="flex-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col min-w-0 overflow-hidden shadow-xs">
          {/* Chapter Title & Subtitle Fields */}
          <div className="p-5 pb-3 border-b border-[var(--border)] space-y-2 shrink-0 bg-[var(--background)]/30">
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => {
                setChapterTitle(e.target.value);
                setSaveStatus("idle");
              }}
              placeholder="Chapter Title..."
              className="w-full font-editorial text-2xl font-bold text-[var(--foreground)] bg-transparent placeholder:text-[var(--muted)]/50 focus:outline-none"
            />
            <input
              type="text"
              value={chapterSubtitle}
              onChange={(e) => {
                setChapterSubtitle(e.target.value);
                setSaveStatus("idle");
              }}
              placeholder="Optional Subtitle or Opening Epigraph..."
              className="w-full text-xs font-serif italic text-[var(--muted)] bg-transparent placeholder:text-[var(--muted)]/50 focus:outline-none"
            />
          </div>

          {/* Editorial Rich-Text Toolbar */}
          <div className="p-2 border-b border-[var(--border)] bg-[var(--card)] flex flex-wrap items-center gap-1 shrink-0 text-xs text-[var(--foreground)]">
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("heading", { level: 1 }) ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("heading", { level: 2 }) ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("heading", { level: 3 }) ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("heading", { level: 4 }) ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Heading 4"
            >
              <Heading4 className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("bold") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("italic") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("underline") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Underline (Ctrl+U)"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("strike") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("bulletList") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Bulleted List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("orderedList") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("blockquote") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Blockquote"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("codeBlock") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().setHorizontalRule().run()}
              className="p-1.5 rounded-lg hover:bg-[var(--background)]"
              title="Horizontal Divider"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => {
                const url = window.prompt("Enter link URL:");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
              }}
              className={`p-1.5 rounded-lg hover:bg-[var(--background)] ${
                editor?.isActive("link") ? "bg-[var(--accent-light)] text-[var(--primary)] font-bold" : ""
              }`}
              title="Insert Link"
            >
              <Link2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const url = window.prompt("Enter image URL:");
                if (url) editor?.chain().focus().setImage({ src: url }).run();
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--background)]"
              title="Insert Image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowMarkdownModal(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--background)] text-[var(--primary)] font-bold"
              title="Import Markdown"
            >
              <FileDown className="w-4 h-4" />
            </button>

            <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

            <button
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can().undo()}
              className="p-1.5 rounded-lg hover:bg-[var(--background)] disabled:opacity-30"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can().redo()}
              className="p-1.5 rounded-lg hover:bg-[var(--background)] disabled:opacity-30"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Main Writing Canvas */}
          <div className="flex-1 overflow-y-auto p-8 sm:p-12 bg-[var(--background)]/20">
            <div className="max-w-2xl mx-auto">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Bottom Word Count & Reading Time Bar */}
          <footer className="px-5 py-2.5 border-t border-[var(--border)] bg-[var(--card)] flex items-center justify-between text-[11px] text-[var(--muted)] font-mono shrink-0">
            <div className="flex items-center gap-4">
              <span>{wordCount.toLocaleString()} words</span>
              <span>•</span>
              <span>{charCount.toLocaleString()} characters</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[var(--foreground)]">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>~{readingTime} min read</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>Tiptap Engine v3</span>
              <button
                onClick={() => setShowRevisionsPanel(!showRevisionsPanel)}
                className="hover:text-[var(--primary)] font-sans font-bold flex items-center gap-1 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>{revisions.length} Revisions</span>
              </button>
            </div>
          </footer>
        </main>

        {/* RIGHT SIDEBAR: Chapter Settings, Preview Limits & Revisions */}
        {!distractionFree && (
          <aside className="w-80 shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col overflow-y-auto p-5 space-y-6 shadow-xs">
            {/* Chapter Status & Access */}
            <div className="space-y-4">
              <h3 className="font-editorial text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Chapter Settings</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1">
                    Publication Status
                  </label>
                  <select
                    value={chapterStatus}
                    onChange={(e) => {
                      setChapterStatus(e.target.value as any);
                      setSaveStatus("idle");
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none"
                  >
                    <option value="DRAFT">Draft (Curator only)</option>
                    <option value="PUBLISHED">Published (Reader visible)</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--foreground)]">Free Reader Preview</span>
                    <input
                      type="checkbox"
                      checked={previewAllowed}
                      onChange={(e) => {
                        setPreviewAllowed(e.target.checked);
                        setSaveStatus("idle");
                      }}
                      className="w-4 h-4 rounded text-[var(--primary)] accent-[var(--primary)]"
                    />
                  </div>
                  <p className="text-[10px] text-[var(--muted)]">
                    If checked, unauthenticated readers can read this chapter within the sample preview limit.
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-xs space-y-2">
                <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Publishing Validation</span>
                </div>
                <ul className="text-[11px] text-amber-700 dark:text-amber-300/80 list-disc list-inside space-y-1">
                  {validationWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Revision History */}
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="font-editorial text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--primary)]" />
                  <span>Revision History</span>
                </h3>
                <span className="text-[10px] font-mono text-[var(--muted)]">{revisions.length} total</span>
              </div>

              {loadingRevisions ? (
                <div className="text-[11px] text-[var(--muted)] text-center py-3">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto mb-1 text-[var(--primary)]" />
                  Loading revisions...
                </div>
              ) : revisions.length === 0 ? (
                <p className="text-[11px] text-[var(--muted)] text-center py-2">
                  No revisions recorded yet. Click "Save" to record explicit snapshots.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {revisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-[var(--foreground)] truncate max-w-[140px]">
                          {rev.title}
                        </span>
                        <button
                          onClick={() => handleRestoreRevision(rev.id)}
                          className="text-[10px] text-[var(--primary)] hover:underline flex items-center gap-0.5"
                          title="Restore this revision"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[var(--muted)] font-mono">
                        <span>{rev.wordCount} words</span>
                        <span>{new Date(rev.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {rev.revisionNote && (
                        <div className="text-[10px] text-[var(--muted)] italic truncate">
                          {rev.revisionNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Markdown Import Modal */}
      {showMarkdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <FileDown className="w-5 h-5 text-[var(--primary)]" />
                <span>Import Markdown to Chapter</span>
              </h3>
              <button onClick={() => setShowMarkdownModal(false)} className="text-[var(--muted)]">
                ✕
              </button>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Paste standard Markdown text below to convert headings, quotes, links, and bold text into the chapter editor.
            </p>
            <textarea
              rows={8}
              value={markdownInput}
              onChange={(e) => setMarkdownInput(e.target.value)}
              placeholder="# Chapter 1&#10;&#10;In a distant valley..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] resize-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowMarkdownModal(false)}
                className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleImportMarkdown}
                className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white font-bold hover:bg-[var(--primary-hover)]"
              >
                Convert & Insert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
