"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Sparkles, FolderTree, RefreshCw, X, Check } from "lucide-react";
import { generateSlug } from "@/lib/utils";
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showToastAlert } from "@/lib/alerts";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  featured?: boolean;
  bookCount?: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
    featured: false,
  });

  const loadCategories = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleNameChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      name: val,
      slug: editingId ? prev.slug : generateSlug(val),
    }));
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
      featured: false,
    });
    setIsCreating(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      imageUrl: cat.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600",
      featured: Boolean(cat.featured),
    });
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showErrorAlert("Invalid Input", "Please provide a valid category title.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        // PUT update
        const res = await fetch(`/api/categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to update category");
        }
        showSuccessAlert("Category Updated", `Saved changes to "${form.name}"`);
      } else {
        // POST create
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to create category");
        }
        showSuccessAlert("Category Created", `Added "${form.name}" to library taxonomy.`);
      }

      setIsCreating(false);
      setEditingId(null);
      await loadCategories();
    } catch (err: any) {
      showErrorAlert("Action Failed", err.message || "Could not process category request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const confirmed = await showConfirmAlert(
      `Remove Category?`,
      `Are you sure you want to delete "${cat.name}" from the taxonomy? Books in this category should be reassigned first.`,
      "Delete Taxonomy",
      "Keep Category",
      true
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/categories/${cat.id}`, {
        method: "DELETE",
      });
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--accent-light)] px-2.5 py-0.5 rounded-full">
              Taxonomy Architecture
            </span>
            <span className="text-xs text-[var(--muted)]">Prisma SQLite Sync</span>
          </div>
          <h1 className="font-editorial text-3xl font-bold tracking-tight text-[var(--foreground)]">
            Category Taxonomies
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Organize discovery classifications, literary genres, and curated spotlights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCategories}
            disabled={loading}
            className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] transition-colors shadow-xs"
            title="Refresh database categories"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[var(--primary)]" : ""}`} />
          </button>

          {!isCreating && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          )}
        </div>
      </div>

      {/* Creation / Edit Form Modal Card */}
      {isCreating && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent-light)] text-[var(--primary)] flex items-center justify-center font-bold">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-bold text-[var(--foreground)]">
                  {editingId ? "Edit Category Details" : "New Genre Taxonomy"}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Stored directly in SQLite `Category` table with book relations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
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
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
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
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
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
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl text-xs bg-[var(--background)] border border-[var(--border)] outline-none text-[var(--foreground)] focus:border-[var(--primary)] transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <input
              type="checkbox"
              id="cat-feat"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded accent-[var(--primary)] cursor-pointer"
            />
            <label htmlFor="cat-feat" className="text-xs font-semibold text-[var(--foreground)] cursor-pointer select-none">
              Display as Featured Spotlight on Homepage & Explore Feed
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setIsCreating(false)}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-all shadow-xs inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? "Save Taxonomy Changes" : "Create Category"}</span>
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
                  src={cat.imageUrl || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600"}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-sm text-[var(--foreground)] flex items-center gap-1.5 truncate">
                  <span>{cat.name}</span>
                  {cat.featured && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
                </div>
                <div className="text-[11px] text-[var(--primary)] font-mono truncate mt-0.5">
                  /explore?category={cat.slug}
                </div>
                <div className="text-xs text-[var(--muted)] line-clamp-2 mt-1">
                  {cat.description || "No description provided"}
                </div>
                <div className="text-[11px] font-bold text-[var(--muted)] mt-2">
                  {cat.bookCount !== undefined ? `${cat.bookCount} volume${cat.bookCount === 1 ? "" : "s"}` : "Catalog taxonomy"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--background)] transition-colors"
                title="Edit Category Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(cat)}
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
  );
}
