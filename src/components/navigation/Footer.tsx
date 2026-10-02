import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border-main)] bg-[var(--bg-card)] mt-16 sm:mt-24 pt-10 sm:pt-12 pb-24 sm:pb-16 md:pb-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="sm:col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--text-main)]">
                READORA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm">
              Your Digital Library. Discover, read and organize curated literature, timeless classics, and contemporary masterpieces.
            </p>
            <div className="pt-1 text-[11px] text-[var(--text-subtle)] italic">
              &ldquo;A reader lives a thousand lives before he dies.&rdquo; — George R.R. Martin
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li>
                <Link href="/explore" className="hover:text-[var(--accent)] transition-colors">
                  All Books
                </Link>
              </li>
              <li>
                <Link href="/explore?sort=popular" className="hover:text-[var(--accent)] transition-colors">
                  Popular This Week
                </Link>
              </li>
              <li>
                <Link href="/explore?sort=recent" className="hover:text-[var(--accent)] transition-colors">
                  Recently Added
                </Link>
              </li>
              <li>
                <Link href="/explore?language=hindi" className="hover:text-[var(--accent)] transition-colors">
                  Hindi Masterpieces
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] mb-3">
              Curated Genres
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li>
                <Link href="/explore?category=self-development" className="hover:text-[var(--accent)] transition-colors">
                  Self Development
                </Link>
              </li>
              <li>
                <Link href="/explore?category=business" className="hover:text-[var(--accent)] transition-colors">
                  Business & Wealth
                </Link>
              </li>
              <li>
                <Link href="/explore?category=technology" className="hover:text-[var(--accent)] transition-colors">
                  Technology & Systems
                </Link>
              </li>
              <li>
                <Link href="/explore?category=philosophy" className="hover:text-[var(--accent)] transition-colors">
                  Philosophy & Stoicism
                </Link>
              </li>
            </ul>
          </div>

          {/* Reader & Admin */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-main)] mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-[var(--text-muted)]">
              <li>
                <Link href="/library" className="hover:text-[var(--accent)] transition-colors">
                  My Bookshelf
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[var(--accent)] transition-colors">
                  Reading Preferences
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[var(--accent)] transition-colors">
                  Admin Console
                </Link>
              </li>
              <li>
                <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)] font-medium">
                  V1 Production
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t border-[var(--border-main)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-subtle)] gap-3 text-center sm:text-left">
          <p>© {new Date().getFullYear()} READORA Digital Library. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
            <span>Admin-Controlled Publishing</span>
            <span>•</span>
            <span>Distraction-Free Reader</span>
            <span>•</span>
            <span>Built for Modern Readers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

