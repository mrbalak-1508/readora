"use client";

import { Book, Bookmark, Highlight, LibraryItem, ReadingProgress, Category } from "../types";
import { MOCK_BOOKS } from "./mockBooks";
import { CATEGORIES } from "./mockCategories";

const BOOKS_KEY = "readora_books_v1";
const LIBRARY_KEY = "readora_user_library_v1";
const PROGRESS_KEY = "readora_reading_progress_v1";
const BOOKMARKS_KEY = "readora_bookmarks_v1";
const HIGHLIGHTS_KEY = "readora_highlights_v1";
const CATEGORIES_KEY = "readora_categories_v1";

class DataStore {
  constructor() {
    // Attempt initial sync from Prisma SQLite on client start
    if (typeof window !== "undefined") {
      this.syncFromBackend();
    }
  }

  private async syncFromBackend() {
    try {
      const res = await fetch("/api/books");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(BOOKS_KEY, JSON.stringify(data));
        }
      }
    } catch {
      // Offline or initial compile safe fallback
    }
  }

  // Books
  public getBooks(): Book[] {
    if (typeof window === "undefined") return MOCK_BOOKS;
    const stored = localStorage.getItem(BOOKS_KEY);
    if (!stored) {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(MOCK_BOOKS));
      return MOCK_BOOKS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return MOCK_BOOKS;
    }
  }

  public getBookBySlug(slug: string): Book | undefined {
    const books = this.getBooks();
    return books.find((b) => b.slug === slug || b.id === slug);
  }

  public async saveBook(book: Book): Promise<void> {
    const books = this.getBooks();
    const index = books.findIndex((b) => b.id === book.id);
    if (index >= 0) {
      books[index] = book;
    } else {
      books.unshift(book);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }

    // Persist to Prisma SQLite
    try {
      await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      });
    } catch {
      // Local copy saved
    }
  }

  public async deleteBook(id: string): Promise<void> {
    const books = this.getBooks().filter((b) => b.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    }

    try {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
    } catch {
      // safe
    }
  }

  // Categories
  public getCategories(): Category[] {
    if (typeof window === "undefined") return CATEGORIES;
    const stored = localStorage.getItem(CATEGORIES_KEY);
    if (!stored) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(CATEGORIES));
      return CATEGORIES;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return CATEGORIES;
    }
  }

  public async saveCategory(category: Category): Promise<void> {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === category.id);
    if (index >= 0) {
      categories[index] = category;
    } else {
      categories.push(category);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }

    try {
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(category),
      });
    } catch {
      // safe
    }
  }

  public deleteCategory(id: string): void {
    const categories = this.getCategories().filter((c) => c.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    }
  }

  // Library Items
  public getLibrary(): LibraryItem[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(LIBRARY_KEY);
    if (!stored) {
      const books = this.getBooks();
      const initial: LibraryItem[] = [
        {
          id: "lib-1",
          userId: "usr-admin-readora",
          bookId: "book-1",
          book: books[0],
          status: "reading",
          addedAt: new Date().toISOString(),
          progress: {
            id: "prog-1",
            userId: "usr-admin-readora",
            bookId: "book-1",
            bookTitle: books[0].title,
            currentPage: 48,
            totalPages: books[0].pages,
            currentChapter: "The 1st Law: Make It Obvious",
            percentage: 68,
            lastOpened: new Date().toISOString(),
            timeSpentSeconds: 4320,
            completed: false,
          },
        },
        {
          id: "lib-2",
          userId: "usr-admin-readora",
          bookId: "book-2",
          book: books[1],
          status: "saved",
          addedAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(initial));
      return initial;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  public async addToLibrary(book: Book, status: "reading" | "saved" | "completed" = "saved"): Promise<void> {
    const library = this.getLibrary();
    const existing = library.find((item) => item.bookId === book.id);
    if (existing) {
      existing.status = status;
    } else {
      library.unshift({
        id: `lib-${Date.now()}`,
        userId: "usr-admin-readora",
        bookId: book.id,
        book,
        status,
        addedAt: new Date().toISOString(),
      });
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    }

    try {
      await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id, status }),
      });
    } catch {
      // safe
    }
  }

  public async removeFromLibrary(bookId: string): Promise<void> {
    const library = this.getLibrary().filter((item) => item.bookId !== bookId);
    if (typeof window !== "undefined") {
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    }

    try {
      await fetch(`/api/library?bookId=${bookId}`, { method: "DELETE" });
    } catch {
      // safe
    }
  }

  public isInLibrary(bookId: string): boolean {
    return this.getLibrary().some((item) => item.bookId === bookId);
  }

  // Reading Progress
  public getProgress(bookId: string): ReadingProgress | undefined {
    if (typeof window === "undefined") return undefined;
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) return undefined;
    try {
      const all: Record<string, ReadingProgress> = JSON.parse(stored);
      return all[bookId];
    } catch {
      return undefined;
    }
  }

  public getAllProgress(): ReadingProgress[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PROGRESS_KEY);
    if (!stored) return [];
    try {
      const all: Record<string, ReadingProgress> = JSON.parse(stored);
      return Object.values(all);
    } catch {
      return [];
    }
  }

  public async saveProgress(progress: ReadingProgress): Promise<void> {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PROGRESS_KEY);
    const all: Record<string, ReadingProgress> = stored ? JSON.parse(stored) : {};
    all[progress.bookId] = progress;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));

    const library = this.getLibrary();
    const item = library.find((i) => i.bookId === progress.bookId);
    if (item) {
      item.progress = progress;
      item.status = progress.completed ? "completed" : "reading";
      localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
    }

    // Sync to SQLite
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      });
    } catch {
      // safe
    }
  }

  // Bookmarks
  public getBookmarks(bookId?: string): Bookmark[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(BOOKMARKS_KEY);
    if (!stored) return [];
    try {
      const all: Bookmark[] = JSON.parse(stored);
      return bookId ? all.filter((b) => b.bookId === bookId) : all;
    } catch {
      return [];
    }
  }

  public addBookmark(bookmark: Omit<Bookmark, "id" | "createdAt">): Bookmark {
    const bookmarks = this.getBookmarks();
    const newBookmark: Bookmark = {
      ...bookmark,
      id: `bm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    bookmarks.unshift(newBookmark);
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }

    // Background sync to SQLite
    fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBookmark),
    }).catch(() => {});

    return newBookmark;
  }

  public async removeBookmark(idOrBookId: string, page?: number): Promise<void> {
    let bookmarks = this.getBookmarks();
    if (typeof page === "number") {
      bookmarks = bookmarks.filter((b) => !(b.bookId === idOrBookId && b.page === page));
    } else {
      bookmarks = bookmarks.filter((b) => b.id !== idOrBookId);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    }

    try {
      const url = typeof page === "number" ? `/api/bookmarks?bookId=${idOrBookId}&page=${page}` : `/api/bookmarks?id=${idOrBookId}`;
      await fetch(url, { method: "DELETE" });
    } catch {
      // safe
    }
  }

  public isBookmarked(bookId: string, page: number): boolean {
    return this.getBookmarks(bookId).some((b) => b.page === page);
  }

  // Highlights & Notes
  public getHighlights(bookId?: string): Highlight[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(HIGHLIGHTS_KEY);
    if (!stored) return [];
    try {
      const all: Highlight[] = JSON.parse(stored);
      return bookId ? all.filter((h) => h.bookId === bookId) : all;
    } catch {
      return [];
    }
  }

  public addHighlight(highlight: Omit<Highlight, "id" | "createdAt">): Highlight {
    const list = this.getHighlights();
    const newItem: Highlight = {
      ...highlight,
      id: `hl-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    if (typeof window !== "undefined") {
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(list));
    }

    // Background sync to SQLite
    fetch("/api/highlights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    }).catch(() => {});

    return newItem;
  }

  public async removeHighlight(id: string): Promise<void> {
    const list = this.getHighlights().filter((h) => h.id !== id);
    if (typeof window !== "undefined") {
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(list));
    }

    try {
      await fetch(`/api/highlights?id=${id}`, { method: "DELETE" });
    } catch {
      // safe
    }
  }
}

export const store = new DataStore();
