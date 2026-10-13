"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  FolderTree,
  RefreshCw,
  X,
  Check,
  UserCheck,
  BookOpen,
  Feather,
} from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/lib/alerts";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
  bookCount?: number;
}

interface AuthorItem {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  avatarUrl?: string | null;
  bookCount?: number;
  createdAt?: string;
}

export default function AdminCategoriesAndAuthorsPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "authors">("categories");

  // Category state
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [submittingCat, setSubmittingCat] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
    featured: false,
  });

  // Author state
  const [authors, setAuthors] = useState<AuthorItem[]>([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [isCreatingAuthor, setIsCreatingAuthor] = useState(false);
  const [editingAuthorId, setEditingAuthorId] = useState<string | null>(null);
  const [submittingAuthor, setSubmittingAuthor] = useState(false);
  const [authorForm, setAuthorForm] = useState({
    name: "",
    bio: "",
    avatarUrl: "",
  });

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      showErrorAlert("Connection Error", "Could not fetch categories from SQLite database.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadAuthors = async () => {
    setLoadingAuthors(true);
    try {
      const res = await fetch("/api/admin/authors");
      if (res.ok) {
        const data = await res.json();
        setAuthors(Array.isArray(data.authors) ? data.authors : []);
      }
    } catch (err) {
      console.error("Failed to load authors:", err);
      showErrorAlert("Connection Error", "Could not fetch authors from SQLite database.");
    } finally {
      setLoadingAuthors(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadAuthors();
  }, []);

  // Category handlers
  const handleCatNameChange = (val: string) => {
    setCatForm((prev) => ({
      ...prev,
      name: val,
      slug: editingCatId ? prev.slug : generateSlug(val),
    }));
  };

  const handleOpenCreateCat = () => {
    setEditingCatId(null);
    setCatForm({
      name: "",
      slug: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
      featured: false,
    });
    setIsCreatingCat(true);
  };

  const handleOpenEditCat = (cat: CategoryItem) => {
    setEditingCatId(cat.id);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
      featured: Boolean(cat.featured),
    });
    setIsCreatingCat(true);
  };

  const handleSubmitCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      showErrorAlert("Invalid Input", "Please provide a valid category title.");
      return;
    }

    setSubmittingCat(true);
    try {
      if (editingCatId) {
        const res = await fetch(`/api/categories/${editingCatId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update category");
        showSuccessAlert("Category Updated", `Saved changes to "${catForm.name}"`);
      } else {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(catForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create category");
        showSuccessAlert("Category Created", `Added "${catForm.name}" to library taxonomy.`);
      }

      setIsCreatingCat(false);
      setEditingCatId(null);
      await loadCategories();
    } catch (err: any) {
      showErrorAlert("Action Failed", err.message || "Could not process category request");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCat = async (cat: CategoryItem) => {
    const confirmed = await showConfirmAlert(
      `Remove Category?`,
      `Are you sure you want to delete "${cat.name}"? Books in this category should be reassigned first.`,
      "Delete Taxonomy",
      "Keep Category",
      true
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showErrorAlert("Delete Blocked", data.error || "Could not delete category.");
        return;
      }
      showSuccessAlert("Category Deleted", `Removed "${cat.name}" from library taxonomy.`);
      await loadCategories();
    } catch (err: any) {
      showErrorAlert("Deletion Error", err.message || "Failed to communicate with SQLite server");
    }
  };

  // Author handlers
  const handleOpenCreateAuthor = () => {
    setEditingAuthorId(null);
    setAuthorForm({ name: "", bio: "", avatarUrl: "" });
    setIsCreatingAuthor(true);
  };

  const handleOpenEditAuthor = (author: AuthorItem) => {
    setEditingAuthorId(author.id);
    setAuthorForm({
      name: author.name,
      bio: author.bio || "",
      avatarUrl: author.avatarUrl || "",
    });
    setIsCreatingAuthor(true);
  };

  const handleSubmitAuthor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorForm.name.trim()) {
      showErrorAlert("Invalid Input", "Please provide a valid author name.");
      return;
    }

    setSubmittingAuthor(true);
    try {
      if (editingAuthorId) {
        const res = await fetch("/api/admin/authors", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingAuthorId, ...authorForm }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update author");
        showSuccessAlert("Author Updated", `Saved changes for "${authorForm.name}"`);
      } else {
        const res = await fetch("/api/admin/authors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authorForm),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create author");
        showSuccessAlert("Author Created", `Registered author "${authorForm.name}"`);
      }

      setIsCreatingAuthor(false);
      setEditingAuthorId(null);
      await loadAuthors();
    } catch (err: any) {
      showErrorAlert("Action Failed", err.message || "Could not process author request");
    } finally {
      setSubmittingAuthor(false);
    }
  };

  const handleDeleteAuthor = async (author: AuthorItem) => {
    const confirmed = await showConfirmAlert(
      `Remove Author?`,
      `Are you sure you want to remove "${author.name}"? Books linked to this author will remain in the catalog.`,
      "Delete Author",
      "Keep Author",
      true
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/authors?id=${author.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        showErrorAlert("Delete Blocked", data.error || "Could not delete author.");
        return;
      }
      showSuccessAlert("Author Deleted", `Removed "${author.name}" from catalog.`);
      await loadAuthors();
    } catch (err: any) {
      showErrorAlert("Deletion Error", err.message || "Failed to delete author");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Taxonomy & Biographies
            </span>
            <span className="text-xs text-[var(--muted)]">Prisma SQLite Sync</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Categories & Authors
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Manage literary classifications, curated collections, and author credentials.
          </p>
        </div>

        {/* Tab Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-[var(--background)] border border-[var(--border)] rounded-2xl">
            <button
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "categories"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <FolderTree className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Categories ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("authors")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "authors"
                  ? "bg-[var(--card)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Feather className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Authors ({authors.length})</span>
            </button>
          </div>

          <button
            onClick={activeTab === "categories" ? loadCategories : loadAuthors}
            disabled={activeTab === "categories" ? loadingCategories : loadingAuthors}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                (activeTab === "categories" ? loadingCategories : loadingAuthors)
                  ? "animate-spin text-[var(--primary)]"
                  : ""
              }`}
            />
          </button>

          {activeTab === "categories" && !isCreatingCat && (
            <button
              onClick={handleOpenCreateCat}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}

          {activeTab === "authors" && !isCreatingAuthor && (
            <button
              onClick={handleOpenCreateAuthor}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Author</span>
            </button>
          )}
        </div>
      </div>

      {/* CATEGORIES VIEW */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Create/Edit Form */}
          {isCreatingCat && (
            <form
              onSubmit={handleSubmitCat}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center font-bold">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                      {editingCatId ? "Edit Category Details" : "New Genre Taxonomy"}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Stored directly in SQLite `Category` table with book relations.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(false)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) => handleCatNameChange(e.target.value)}
                    placeholder="e.g. Science & Society"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    URL Identifier Slug <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catForm.slug}
                    onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                    placeholder="science-society"
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-mono bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                  Editorial Description
                </label>
                <textarea
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Brief summary of literature curated within this classification..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                  Header Image / Cover Illustration URL
                </label>
                <input
                  type="text"
                  value={catForm.imageUrl}
                  onChange={(e) => setCatForm({ ...catForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="cat-feat"
                  checked={catForm.featured}
                  onChange={(e) => setCatForm({ ...catForm, featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)] cursor-pointer"
                />
                <label
                  htmlFor="cat-feat"
                  className="text-xs font-semibold text-[var(--foreground)] cursor-pointer select-none"
                >
                  Display as Featured Spotlight on Homepage & Explore Feed
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  disabled={submittingCat}
                  onClick={() => setIsCreatingCat(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCat}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs inline-flex items-center gap-2"
                >
                  {submittingCat ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingCatId ? "Save Taxonomy Changes" : "Create Category"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Categories Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-xs flex items-start justify-between gap-4 group hover:border-[var(--primary)]/50 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-[var(--background)] border border-[var(--border)]">
                    <Image
                      src={
                        cat.imageUrl ||
                        "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600"
                      }
                      alt={cat.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--foreground)] flex items-center gap-1.5 truncate">
                      <span>{cat.name}</span>
                      {cat.featured && (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--primary)] font-mono truncate mt-0.5">
                      /explore?category={cat.slug}
                    </div>
                    <div className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      {cat.description || "No description provided"}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--muted)] mt-2">
                      {cat.bookCount !== undefined
                        ? `${cat.bookCount} volume${cat.bookCount === 1 ? "" : "s"}`
                        : "Catalog taxonomy"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditCat(cat)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                    title="Edit Category Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCat(cat)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AUTHORS VIEW */}
      {activeTab === "authors" && (
        <div className="space-y-6">
          {/* Create/Edit Author Form */}
          {isCreatingAuthor && (
            <form
              onSubmit={handleSubmitAuthor}
              className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center font-bold">
                    <Feather className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                      {editingAuthorId ? "Edit Author Details" : "Register Author Biography"}
                    </h3>
                    <p className="text-xs text-[var(--muted)]">
                      Synchronized with SQLite `Author` table and relations.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingAuthor(false)}
                  className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Author Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authorForm.name}
                    onChange={(e) => setAuthorForm({ ...authorForm, name: e.target.value })}
                    placeholder="e.g. Maya Angelou, Frank Herbert"
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                    Avatar / Portrait Image URL
                  </label>
                  <input
                    type="text"
                    value={authorForm.avatarUrl}
                    onChange={(e) => setAuthorForm({ ...authorForm, avatarUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-1.5">
                  Author Biography
                </label>
                <textarea
                  rows={3}
                  value={authorForm.bio}
                  onChange={(e) => setAuthorForm({ ...authorForm, bio: e.target.value })}
                  placeholder="Notable literary achievements, background, and summary of work..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  disabled={submittingAuthor}
                  onClick={() => setIsCreatingAuthor(false)}
                  className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAuthor}
                  className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs inline-flex items-center gap-2"
                >
                  {submittingAuthor ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingAuthorId ? "Save Author Profile" : "Register Author"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Authors Grid List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {authors.map((author) => (
              <div
                key={author.id}
                className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--card)] shadow-xs flex items-start justify-between gap-4 group hover:border-[var(--primary)]/50 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 bg-[var(--background)] border border-[var(--border)] flex items-center justify-center font-bold text-[var(--primary)]">
                    {author.avatarUrl ? (
                      <Image
                        src={author.avatarUrl}
                        alt={author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-base font-editorial">
                        {author.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--foreground)] truncate">
                      {author.name}
                    </div>
                    <div className="text-[11px] text-[var(--primary)] font-mono truncate mt-0.5">
                      /{author.slug}
                    </div>
                    <div className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                      {author.bio || "No biography provided"}
                    </div>
                    <div className="text-[11px] font-bold text-[var(--muted)] mt-2 flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-[var(--primary)]" />
                      <span>
                        {author.bookCount !== undefined
                          ? `${author.bookCount} manuscript${author.bookCount === 1 ? "" : "s"}`
                          : "Author"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditAuthor(author)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                    title="Edit Author Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAuthor(author)}
                    className="p-2 rounded-xl text-[var(--muted)] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Author"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
