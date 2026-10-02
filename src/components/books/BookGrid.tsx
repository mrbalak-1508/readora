import React from "react";
import { Book } from "@/lib/types";
import { BookCard } from "./BookCard";

interface BookGridProps {
  books: Book[];
  title?: string;
  subtitle?: string;
  columns?: 3 | 4 | 5 | 6;
}

export function BookGrid({
  books,
  title,
  subtitle,
  columns = 5,
}: BookGridProps) {
  const colClasses = {
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6",
  }[columns];

  return (
    <section className="mb-20">
      {title && (
        <div className="mb-6">
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-main)]">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {books.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border-main)] rounded-2xl p-8">
          <p className="font-editorial text-lg text-[var(--text-muted)]">
            No stories here yet.
          </p>
          <p className="text-xs text-[var(--text-subtle)] mt-1">
            Try adjusting your genre or search filters.
          </p>
        </div>
      ) : (
        <div className={`grid ${colClasses} gap-3.5 sm:gap-6`}>
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </section>
  );
}
