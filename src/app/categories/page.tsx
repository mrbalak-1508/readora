import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { MobileNav } from "@/components/navigation/MobileNav";
import { CATEGORIES } from "@/lib/data/mockCategories";
import { CategoryIllustration } from "@/components/illustrations";
import { ArrowRight, BookOpen } from "lucide-react";

export const metadata = {
  title: "Categories & Genres — READORA Digital Library",
  description: "Browse literature across fiction, technology, business, philosophy, and history in the READORA library.",
};

export default function CategoriesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-20 md:pb-12 w-full">
        <div className="max-w-2xl mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-3">
            Library Catalog
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--foreground)] tracking-tight">
            Explore by Category
          </h1>
          <p className="text-sm sm:text-base text-[var(--muted)] mt-2">
            Every genre in Readora is carefully cataloged with curated masterworks and contemporary titles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore?category=${cat.id}`}
              className="group p-6 rounded-3xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-2xl bg-[var(--background)] group-hover:scale-105 transition-transform">
                  <CategoryIllustration slug={cat.slug} size={52} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--background)] text-[var(--muted)] group-hover:text-[var(--primary)] border border-[var(--border)]">
                  {cat.bookCount || 12} Books
                </span>
              </div>

              <div>
                <h3 className="font-editorial text-xl font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1.5 line-clamp-2">
                  {cat.description || "Essential volumes and foundational ideas curated for avid readers."}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--primary)]">
                <span>Browse Collection</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}
