import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Category } from "@/lib/types";
import { ArrowRight } from "lucide-react";

interface CategoryPillsProps {
  categories: Category[];
}

export function CategoryPills({ categories }: CategoryPillsProps) {
  const featured = categories.slice(0, 6);

  return (
    <section className="mb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
            Browse by Genre
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
            Explore curated digital collections spanning human inquiry, craft, and literature.
          </p>
        </div>
        <Link
          href="/explore"
          className="text-xs font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
        >
          <span>All genres</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {featured.map((cat) => (
          <Link
            key={cat.id}
            href={`/explore?category=${cat.slug}`}
            className="group relative flex flex-col justify-end p-4 rounded-xl overflow-hidden aspect-[4/5] border border-[var(--border-main)] hover:border-[var(--accent)] transition-all shadow-sm"
          >
            {/* Background image with dark editorial overlay */}
            {cat.imageUrl && (
              <Image
                src={cat.imageUrl}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 50vw, 20vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent group-hover:from-black/90 transition-colors" />

            <div className="relative z-10 text-white">
              <h3 className="font-editorial text-base sm:text-lg font-bold leading-tight group-hover:text-amber-200 transition-colors">
                {cat.name}
              </h3>
              <p className="text-[11px] text-white/70 mt-1 line-clamp-1">
                {cat.bookCount || 20}+ Books
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
