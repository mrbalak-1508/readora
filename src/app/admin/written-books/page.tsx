"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit3,
  BookOpen,
  PlusCircle,
  Search,
  CheckCircle2,
  FileText,
  Clock,
  Trash2,
  Eye,
  ArrowRight,
  RefreshCw,
  FolderTree,
  Sliders,
  Sparkles,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToastAlert } from "@/lib/alerts";
import { CATEGORIES } from "@/lib/data/mockCategories";

interface WrittenBookItem {
  id: string;
  slug: string;
  title: string;
  author: string;
  description: string;
  categoryName: string;
  coverUrl: string;
  coverPath?: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED" | string;
  accessType: string;
  price: number;
  totalWords: number;
  chaptersCount: number;
  publishedChaptersCount: number;
  updatedAt: string;
}

export default function WrittenBooksAdminPage() {
  const [books, setBooks] = useState<WrittenBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    author: "",
    categoryId: CATEGORIES[0].id,
    categoryName: CATEGORIES[0].name,
    description: "",
    accessType: "FREE",
    price: 0,
    language: "English",
  });
  const [creating, setCreating] = useState(false);

  const fetchWrittenBooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/written-books");
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
      }
    } catch (err) {
      console.error("Failed to load written books:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWrittenBooks();
  }, []);

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) {
      showErrorAlert("Title is required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/written-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showSuccessAlert("Manuscript Initialized", `Created "${data.book.title}". Opening editor...`);
        setShowCreateModal(false);
        window.location.href = `/admin/written-books/${data.book.id}`;
      } else {
        showErrorAlert(data.error || "Failed to create book");
      }
    } catch (err: any) {
      showErrorAlert(err.message || "Failed to create book");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBook = async (book: WrittenBookItem) => {
    const confirmed = await showConfirmAlert(
      "Delete Manuscript",
      `Are you sure you want to delete "${book.title}" and all its written chapters? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/written-books/${book.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToastAlert(`Deleted "${book.title}"`, "success");
        fetchWrittenBooks();
      } else {
        showErrorAlert("Failed to delete book");
      }
    } catch {
      showErrorAlert("Network error deleting book");
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchQuery =
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase()) ||
      b.categoryName.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === "ALL" || b.status === filterStatus;
    return matchQuery && matchStatus;
  });

  const totalWords = books.reduce((sum, b) => sum + (b.totalWords || 0), 0);
  const totalChapters = books.reduce((sum, b) => sum + (b.chaptersCount || 0), 0);
  const publishedBooks = books.filter((b) => b.status === "PUBLISHED").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Editorial Studio
            </span>
            <span className="text-xs text-[var(--muted)] flex items-center gap-1 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Native Rich-Text Publishing</span>
            </span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Written Books & Chapters
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Author, structure, and publish native digital books directly with the integrated Tiptap chapter editor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWrittenBooks}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh written books"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Manuscript</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Written Manuscripts</span>
            <BookOpen className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="font-editorial text-3xl font-bold text-[var(--foreground)] mt-2">
            {books.length}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">{publishedBooks} published to readers</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Authored Chapters</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-editorial text-3xl font-bold text-emerald-600 mt-2">
            {totalChapters}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">Sections and chapters</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Total Authored Words</span>
            <Edit3 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-editorial text-3xl font-bold text-purple-600 mt-2">
            {totalWords.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">~{Math.round(totalWords / 200)} mins reading time</div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[var(--muted)] font-bold">
            <span>Live Published</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-editorial text-3xl font-bold text-blue-600 mt-2">
            {publishedBooks}
          </div>
          <div className="text-[11px] text-[var(--muted)] mt-1">{books.length - publishedBooks} in draft state</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manuscripts by title, author, or category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] self-start sm:self-center">
          {["ALL", "PUBLISHED", "DRAFT"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === st
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Manuscripts Grid */}
      {loading ? (
        <div className="p-16 text-center text-xs text-[var(--muted)] bg-[var(--card)] border border-[var(--border)] rounded-3xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--primary)] mb-3" />
          Loading written manuscripts...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-[var(--card)] border border-[var(--border)] rounded-3xl">
          <div className="w-14 h-14 rounded-full bg-[var(--accent-light)] text-[var(--primary)] mx-auto flex items-center justify-center">
            <Edit3 className="w-7 h-7" />
          </div>
          <div className="font-editorial text-xl font-bold text-[var(--foreground)]">
            No Manuscripts Found
          </div>
          <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
            You haven't created any written books yet, or none match your search. Start a new manuscript to author rich-text chapters.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create First Manuscript</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5 group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-16 rounded-xl overflow-hidden bg-[var(--background)] border border-[var(--border)] shrink-0">
                      <Image
                        src={book.coverUrl}
                        alt={book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <h3 className="font-editorial text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      <div className="text-xs text-[var(--muted)] mt-0.5">by {book.author}</div>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[var(--accent-light)] text-[var(--primary)]">
                        {book.categoryName}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full shrink-0 ${
                      book.status === "PUBLISHED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                    }`}
                  >
                    {book.status}
                  </span>
                </div>

                <p className="text-xs text-[var(--muted)] mt-4 line-clamp-2 leading-relaxed">
                  {book.description}
                </p>

                <div className="grid grid-cols-3 gap-2 py-3 px-3.5 rounded-2xl bg-[var(--background)] border border-[var(--border)] mt-4 text-center">
                  <div>
                    <div className="font-mono text-xs font-bold text-[var(--foreground)]">
                      {book.chaptersCount}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">Chapters</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-[var(--foreground)]">
                      {book.totalWords.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">Words</div>
                  </div>
                  <div>
                    <div className="font-mono text-xs font-bold text-emerald-600">
                      {book.accessType === "FREE" ? "Free" : `₹${book.price}`}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">Access</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/read/${book.slug || book.id}?preview=true`}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                    title="Preview in Reader"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteBook(book)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                    title="Delete Manuscript"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <Link
                  href={`/admin/written-books/${book.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Open Editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Manuscript Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)]">
                  Start New Written Manuscript
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Initial setup for your chapter-based written book.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBook} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1.5">
                  Book Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chronicles of the Northern Star"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    placeholder="Author or Pen Name"
                    value={createForm.author}
                    onChange={(e) => setCreateForm({ ...createForm, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1.5">
                    Primary Category
                  </label>
                  <select
                    value={createForm.categoryId}
                    onChange={(e) => {
                      const selected = CATEGORIES.find((c) => c.id === e.target.value);
                      setCreateForm({
                        ...createForm,
                        categoryId: e.target.value,
                        categoryName: selected?.name || "Literature",
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1.5">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  placeholder="A synopsis or introduction to the book..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1.5">
                    Access Mode
                  </label>
                  <select
                    value={createForm.accessType}
                    onChange={(e) => setCreateForm({ ...createForm, accessType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="FREE">Free for all</option>
                    <option value="ONE_TIME_PURCHASE">One-Time Purchase</option>
                    <option value="SUBSCRIPTION">Subscription Only</option>
                    <option value="FREE_WITH_SUBSCRIPTION">Free preview + Upgrade</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--foreground)] mb-1.5">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={createForm.price}
                    onChange={(e) => setCreateForm({ ...createForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white font-bold text-xs hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5"
                >
                  {creating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Initialize & Open Editor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
