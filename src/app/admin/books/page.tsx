"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle,
  Search,
  Star,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  Edit3,
  Filter,
  X,
  Check,
  BookOpen,
  MessageSquare,
  Upload,
  FileUp,
  Image as ImageIcon,
  Undo2,
  Link as LinkIcon,
} from "lucide-react";
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToastAlert } from "@/lib/alerts";

interface BookData {
  id: string;
  slug: string;
  title: string;
  author: string;
  description?: string;
  categoryName: string;
  rating?: number;
  ratingCount?: number;
  categoryId?: string;
  language: string;
  pages: number;
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | string;
  featured: boolean;
  coverUrl?: string;
  coverPath?: string;
  readCount: number;
  format?: string;
  price?: number;
  originalPrice?: number;
  accessType?: string;
  discount?: number;
  sampleContent?: string;
}

export default function AdminBooksPage() {
  const [books, setBooks] = useState<BookData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Edit modal state
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreviewUrl, setEditCoverPreviewUrl] = useState<string>("");
  const [editCoverUrlInput, setEditCoverUrlInput] = useState<string>("");
  const [coverImageError, setCoverImageError] = useState(false);
  const [isDragOverCover, setIsDragOverCover] = useState(false);
  const editCoverInputRef = React.useRef<HTMLInputElement>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    author: "",
    categoryName: "",
    language: "English",
    pages: 100,
    status: "PUBLISHED",
    featured: false,
    description: "",
    accessType: "FREE",
    price: 0,
    originalPrice: 0,
    discount: 0,
    sampleContent: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Replace file versioning state
  const [replacingBook, setReplacingBook] = useState<BookData | null>(null);
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceSummary, setReplaceSummary] = useState("");
  const [savingReplace, setSavingReplace] = useState(false);

  const handleReplaceFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingBook || !replaceFile) return;
    setSavingReplace(true);
    try {
      const formData = new FormData();
      formData.append("file", replaceFile);
      if (replaceSummary) formData.append("changeSummary", replaceSummary);

      const res = await fetch(`/api/admin/books/${replacingBook.id}/replace-file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showSuccessAlert("Asset Versioned & Replaced", data.message);
        setReplacingBook(null);
        setReplaceFile(null);
        setReplaceSummary("");
        fetchBooks();
      } else {
        showErrorAlert(data.error || "Failed to replace file");
      }
    } catch (err: any) {
      showErrorAlert("Error", err.message);
    } finally {
      setSavingReplace(false);
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([
        fetch("/api/books"),
        fetch("/api/categories"),
      ]);

      if (booksRes.ok) {
        const data = await booksRes.json();
        setBooks(Array.isArray(data) ? data : []);
      }

      if (catsRes.ok) {
        const catsData = await catsRes.json();
        setCategories(Array.isArray(catsData) ? catsData : []);
      }
    } catch (err) {
      console.error("Failed to fetch books or categories:", err);
      showErrorAlert("Catalog Error", "Could not fetch book records from SQLite database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleTogglePublish = async (book: BookData) => {
    const isCurrentlyPublished = book.status?.toUpperCase() === "PUBLISHED";
    const nextStatus = isCurrentlyPublished ? "DRAFT" : "PUBLISHED";

    // Optimistic UI update
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, status: nextStatus } : b))
    );

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update publication status");
      }

      showToastAlert(
        nextStatus === "PUBLISHED" ? `Volume published to library` : `Volume moved to Draft status`,
        "success"
      );
    } catch (err: any) {
      showErrorAlert("Update Failed", err.message);
      fetchBooks(); // Rollback
    }
  };

  const handleToggleFeatured = async (book: BookData) => {
    const nextFeatured = !book.featured;

    // Optimistic UI update
    setBooks((prev) =>
      prev.map((b) => (b.id === book.id ? { ...b, featured: nextFeatured } : b))
    );

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update featured flag");
      }

      showToastAlert(
        nextFeatured ? `Marked as Editorial Pick` : `Removed from Editorial Picks`,
        "success"
      );
    } catch (err: any) {
      showErrorAlert("Update Failed", err.message);
      fetchBooks(); // Rollback
    }
  };

  const handleDelete = async (book: BookData) => {
    const confirmed = await showConfirmAlert(
      "Remove Volume?",
      `Are you sure you want to permanently delete "${book.title}" from the SQLite catalog? This action will remove its bookmarks and progress records.`,
      "Delete Volume",
      "Keep Book",
      true
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete volume");
      }

      setBooks((prev) => prev.filter((b) => b.id !== book.id));
      showSuccessAlert("Volume Removed", `"${book.title}" has been deleted from catalog.`);
    } catch (err: any) {
      showErrorAlert("Deletion Error", err.message || "Failed to communicate with SQLite");
    }
  };

  const openEditModal = (book: BookData) => {
    setEditingBook(book);
    const initialCover = book.coverUrl || book.coverPath || "";
    setEditCoverFile(null);
    setEditCoverPreviewUrl(initialCover);
    setEditCoverUrlInput(initialCover);
    setCoverImageError(false);
    setIsDragOverCover(false);
    setEditForm({
      title: book.title,
      author: book.author,
      categoryName: book.categoryName || "",
      language: book.language || "English",
      pages: book.pages || 1,
      status: book.status?.toUpperCase() || "PUBLISHED",
      featured: Boolean(book.featured),
      description: book.description || "",
      accessType: book.accessType || "FREE",
      price: book.price ?? 0,
      originalPrice: book.originalPrice ?? 0,
      discount: book.discount ?? 0,
      sampleContent: book.sampleContent || "",
    });
  };

  const handleCoverSelect = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showErrorAlert("Invalid Artwork", "Please upload a valid JPG, PNG, or WebP cover image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showErrorAlert("Cover Too Large", "Cover artwork must be under 10MB.");
      return;
    }
    setEditCoverFile(file);
    setCoverImageError(false);
    const preview = URL.createObjectURL(file);
    setEditCoverPreviewUrl(preview);
  };

  const handleResetCover = () => {
    setEditCoverFile(null);
    setCoverImageError(false);
    const originalCover = editingBook?.coverUrl || editingBook?.coverPath || "";
    setEditCoverPreviewUrl(originalCover);
    setEditCoverUrlInput(originalCover);
    if (editCoverInputRef.current) {
      editCoverInputRef.current.value = "";
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;

    setSavingEdit(true);
    try {
      let finalCoverPath = editCoverUrlInput.trim() || undefined;

      // If user selected a new cover file, upload it first to obtain permanent storage path
      if (editCoverFile) {
        const coverData = new FormData();
        coverData.append("file", editCoverFile);
        const coverRes = await fetch("/api/admin/books/upload-cover", {
          method: "POST",
          body: coverData,
        });

        if (!coverRes.ok) {
          const errData = await coverRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to upload new cover image");
        }

        const coverJson = await coverRes.json();
        finalCoverPath = coverJson.filePath || coverJson.url;
      }

      const payload = {
        ...editForm,
        ...(finalCoverPath && { coverPath: finalCoverPath, coverUrl: finalCoverPath }),
      };

      const res = await fetch(`/api/books/${editingBook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update book metadata");
      }

      showSuccessAlert("Book Updated", `Saved metadata & cover artwork for "${editForm.title}"`);
      setEditingBook(null);
      setEditCoverFile(null);
      await fetchBooks();
    } catch (err: any) {
      showErrorAlert("Update Failed", err.message || "Could not save metadata");
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredBooks = books.filter((b) => {
    const matchesQuery =
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author.toLowerCase().includes(query.toLowerCase()) ||
      (b.categoryName && b.categoryName.toLowerCase().includes(query.toLowerCase()));

    const statusMatch =
      selectedStatus === "ALL" ||
      b.status?.toUpperCase() === selectedStatus.toUpperCase();

    const categoryMatch =
      selectedCategory === "ALL" || b.categoryName === selectedCategory;

    return matchesQuery && statusMatch && categoryMatch;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Curator Catalog
            </span>
            <span className="text-xs text-[var(--muted)]">Prisma SQLite Synchronized</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Book Catalog Management
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Manage volume metadata, toggle publishing status, mark featured picks, and audit storage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchBooks}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          <Link
            href="/admin/books/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Volume</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-x-auto no-scrollbar">
          {["ALL", "PUBLISHED", "DRAFT", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedStatus === st
                  ? "bg-[var(--primary)] text-white shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {st === "ALL" ? "All Volumes" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:border-[var(--primary)] cursor-pointer w-full sm:w-auto"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative w-full sm:min-w-[220px]">
            <Search className="w-4 h-4 text-[var(--muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or author..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
            />
          </div>
        </div>
      </div>

      {/* Books Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--background)] text-[var(--muted)] border-b border-[var(--border)] uppercase tracking-wider text-[10px] font-bold">
              <tr>
                <th className="py-4 px-5">Volume</th>
                <th className="py-4 px-4">Category</th>
                <th className="py-4 px-4">Pages</th>
                <th className="py-4 px-4">Format</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Featured</th>
                <th className="py-4 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--muted)]">
                    No books found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  const isPublished = book.status?.toUpperCase() === "PUBLISHED";
                  return (
                    <tr key={book.id} className="hover:bg-[var(--background)]/60 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-10 h-14 shrink-0 rounded-xl overflow-hidden book-cover-shadow bg-[var(--background)] border border-[var(--border)]">
                            <Image
                              src={book.coverUrl || book.coverPath || "/placeholder-cover.jpg"}
                              alt={book.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-[var(--foreground)] truncate max-w-xs">
                              {book.title}
                            </div>
                            <div className="text-[11px] text-[var(--muted)] truncate">
                              by {book.author}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] mt-0.5 flex items-center gap-2">
                              <span>{book.readCount || 0} reads</span>
                              <span>•</span>
                              <Link
                                href={`/admin/reviews?bookId=${book.id}`}
                                className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-0.5 font-bold"
                                title="Inspect reader reviews for this book"
                              >
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>{(book.rating || 5).toFixed(1)} ({book.ratingCount || 0})</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[11px] font-semibold text-[var(--foreground)]">
                          {book.categoryName || "Uncategorized"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--muted)] font-mono text-[11px]">
                        {book.pages} p.
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase font-bold text-[var(--muted)]">
                          {book.format || "EPUB/PDF"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleTogglePublish(book)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            isPublished
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          }`}
                          title="Click to toggle status"
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-amber-600" />
                              <span>Draft</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleFeatured(book)}
                          className={`p-1.5 rounded-xl transition-all ${
                            book.featured
                              ? "text-amber-500 bg-amber-50 hover:bg-amber-100"
                              : "text-[var(--muted)] hover:text-amber-500 hover:bg-[var(--background)]"
                          }`}
                          title={book.featured ? "Featured Spotlight (Active)" : "Mark as Featured Spotlight"}
                        >
                          <Sparkles className="w-4 h-4 fill-current" />
                        </button>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/read/${book.slug || book.id}?preview=true`}
                            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                            title="Admin Preview in Reader"
                          >
                            <Eye className="w-4 h-4 text-amber-500" />
                          </Link>

                          {book.format === "WRITTEN" ? (
                            <Link
                              href={`/admin/written-books/${book.id}`}
                              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                              title="Open Tiptap Chapter Desk"
                            >
                              <Edit3 className="w-4 h-4 text-emerald-600" />
                            </Link>
                          ) : (
                            <button
                              onClick={() => {
                                setReplacingBook(book);
                                setReplaceFile(null);
                                setReplaceSummary("");
                              }}
                              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                              title="Replace Manuscript File (Creates New Version)"
                            >
                              <FileUp className="w-4 h-4 text-blue-500" />
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(book)}
                            className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                            title="Edit Book Metadata"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(book)}
                            className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Volume from SQLite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Metadata Modal */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                    Edit Volume Metadata & Content
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Prisma SQLite record ID: <span className="font-mono">{editingBook.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingBook(null)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Cover Artwork Upload & Management Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] shadow-xs">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--foreground)]">
                        Cover Artwork & Presentation
                      </h4>
                      <p className="text-[11px] text-[var(--muted)]">
                        Upload or replace front cover artwork for this volume
                      </p>
                    </div>
                  </div>

                  {editCoverFile && (
                    <button
                      type="button"
                      onClick={handleResetCover}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 transition-colors"
                      title="Revert back to current saved book cover"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Revert Cover</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* Preview Thumbnail Column */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center gap-1.5">
                    <div className="relative w-28 h-40 rounded-xl overflow-hidden shadow-md border border-[var(--border)] bg-[var(--card)] group">
                      {editCoverPreviewUrl && !coverImageError ? (
                        <Image
                          src={editCoverPreviewUrl}
                          alt="Cover preview"
                          fill
                          className="object-cover transition-transform group-hover:scale-105 duration-300"
                          sizes="112px"
                          onError={() => setCoverImageError(true)}
                          unoptimized={
                            editCoverPreviewUrl.startsWith("blob:") ||
                            editCoverPreviewUrl.startsWith("data:")
                          }
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-2.5 text-center bg-linear-to-b from-amber-500/10 via-amber-500/5 to-transparent text-[var(--muted)]">
                          <BookOpen className="w-7 h-7 text-[var(--primary)] opacity-60 mb-1.5" />
                          <span className="text-[10px] font-bold text-[var(--foreground)] line-clamp-2 leading-tight">
                            {editForm.title || "No Cover"}
                          </span>
                          <span className="text-[9px] text-[var(--muted)] line-clamp-1 mt-0.5">
                            {editForm.author || "Curated"}
                          </span>
                        </div>
                      )}

                      {/* Status indicator pill overlay */}
                      <div className="absolute top-1.5 left-1.5 right-1.5">
                        {editCoverFile ? (
                          <span className="block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs text-center">
                            New Upload
                          </span>
                        ) : (
                          <span className="block px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-white/90 text-center">
                            Current Cover
                          </span>
                        )}
                      </div>
                    </div>

                    {editCoverFile ? (
                      <span
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[150px] text-center"
                        title={editCoverFile.name}
                      >
                        {editCoverFile.name} ({(editCoverFile.size / 1024).toFixed(0)} KB)
                      </span>
                    ) : (
                      <span className="text-[10px] text-[var(--muted)] font-mono text-center">
                        2:3 Portrait Ratio
                      </span>
                    )}
                  </div>

                  {/* Upload Controls Column */}
                  <div className="sm:col-span-8 space-y-3">
                    {/* Drag and Drop Zone */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOverCover(true);
                      }}
                      onDragLeave={() => setIsDragOverCover(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOverCover(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleCoverSelect(file);
                      }}
                      onClick={() => editCoverInputRef.current?.click()}
                      className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                        isDragOverCover
                          ? "border-[var(--primary)] bg-[var(--accent-light)]/40 scale-[1.01]"
                          : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--card)]/60"
                      }`}
                    >
                      <input
                        ref={editCoverInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCoverSelect(file);
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs font-semibold text-[var(--foreground)]">
                          {editCoverFile ? "Replace Selected Artwork" : "Click to Browse or Drag New Image Here"}
                        </div>
                        <p className="text-[10px] text-[var(--muted)]">
                          Supports PNG, JPG, or WebP up to 10MB
                        </p>
                      </div>
                    </div>

                    {/* Or Direct Image Link */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-[var(--muted)] flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          <span>Direct Cover Image URL</span>
                        </label>
                        {editCoverUrlInput &&
                          editCoverUrlInput !==
                            (editingBook?.coverUrl || editingBook?.coverPath || "") && (
                            <button
                              type="button"
                              onClick={() => {
                                const orig = editingBook?.coverUrl || editingBook?.coverPath || "";
                                setEditCoverUrlInput(orig);
                                if (!editCoverFile) setEditCoverPreviewUrl(orig);
                              }}
                              className="text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] underline"
                            >
                              Reset URL
                            </button>
                          )}
                      </div>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/... or /covers/..."
                        value={editCoverUrlInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditCoverUrlInput(val);
                          if (!editCoverFile && val.trim()) {
                            setEditCoverPreviewUrl(val.trim());
                          }
                        }}
                        className="w-full px-3 py-1.5 rounded-xl text-xs bg-[var(--card)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Book Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Author Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Category
                  </label>
                  <select
                    value={editForm.categoryName}
                    onChange={(e) => setEditForm({ ...editForm, categoryName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Language
                  </label>
                  <select
                    value={editForm.language}
                    onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] font-semibold focus:border-[var(--primary)]"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Other">Other / Bilingual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Total Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.pages}
                    onChange={(e) => setEditForm({ ...editForm, pages: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                  >
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                  Book Description / Synopsis
                </label>
                <textarea
                  rows={2}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] resize-none"
                />
              </div>

              {/* Pricing & Commercial Access Section */}
              <div className="p-4 rounded-2xl bg-[var(--bg-subtle)]/70 border border-[var(--border)] space-y-3">
                <span className="text-xs font-bold text-[var(--foreground)] block flex items-center justify-between">
                  <span>Pricing & Access Control</span>
                  <span className="text-[10px] text-[var(--muted)] font-normal">Domestic & International Rates</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1">
                      Access Model
                    </label>
                    <select
                      value={editForm.accessType}
                      onChange={(e) => setEditForm({ ...editForm, accessType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                    >
                      <option value="FREE">Free</option>
                      <option value="ONE_TIME_PURCHASE">One-Time Buy</option>
                      <option value="SUBSCRIPTION">Subscription Only</option>
                      <option value="FREE_WITH_SUBSCRIPTION">Free w/ Sub</option>
                      <option value="PREVIEW">Preview / Freemium</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1">
                      Selling Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] font-bold text-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1">
                      Original MSRP (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editForm.originalPrice}
                      onChange={(e) => setEditForm({ ...editForm, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-[var(--muted)] block mb-1">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.discount}
                      onChange={(e) => setEditForm({ ...editForm, discount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Book Content / Manuscript Text */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--foreground)] block">
                    Book Content & Manuscript Text
                  </label>
                  <span className="text-[10px] text-[var(--muted)]">
                    {editForm.sampleContent.length} characters (Used by reading engine)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={editForm.sampleContent}
                  onChange={(e) => setEditForm({ ...editForm, sampleContent: e.target.value })}
                  placeholder="Paste or edit the book text / chapter contents rendered inside the reader..."
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="edit-feat"
                  checked={editForm.featured}
                  onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)] cursor-pointer"
                />
                <label htmlFor="edit-feat" className="text-xs font-semibold text-[var(--foreground)] cursor-pointer">
                  Display as Featured Editorial Pick
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={() => setEditingBook(null)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs inline-flex items-center gap-2"
                >
                  {savingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Metadata</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Replace Manuscript File Version Modal */}
      {replacingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center font-bold">
                  <FileUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-bold text-[var(--foreground)]">
                    Replace Manuscript File
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    Creates a new asset version record for "{replacingBook.title}".
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplacingBook(null)}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReplaceFile} className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] space-y-2">
                <div className="text-[11px] text-[var(--muted)]">
                  Replacing the manuscript file will preserve all existing ratings, reviews, reader progress, and bookmarks. A <strong className="text-[var(--foreground)]">BookVersion</strong> entry will be archived automatically.
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1.5">
                  Select New PDF or EPUB File *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.epub,application/pdf,application/epub+zip"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-[var(--muted)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-[var(--border)] file:text-xs file:font-bold file:bg-[var(--card)] file:text-[var(--foreground)] hover:file:bg-[var(--background)] cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1.5">
                  Version Change Summary / Release Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Corrected typo in chapter 3, updated layout typography"
                  value={replaceSummary}
                  onChange={(e) => setReplaceSummary(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-xs text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReplacingBook(null)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--background)] font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReplace || !replaceFile}
                  className="px-5 py-2 rounded-xl bg-[var(--primary)] text-white font-bold text-xs hover:bg-[var(--primary-hover)] transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingReplace && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Upload & Version File</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
