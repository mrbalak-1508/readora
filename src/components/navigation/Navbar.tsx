"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Sun,
  Moon,
  Bookmark,
  Shield,
  User as UserIcon,
  LogOut,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommandSearch } from "./CommandSearch";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout, switchRole } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("readora_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("readora_theme", "light");
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Categories", href: "/categories" },
    { label: "My Library", href: "/library" },
    ...(isAdmin ? [{ label: "Admin Console", href: "/admin", isSpecial: true }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-main)] bg-[var(--bg-overlay)] backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                READORA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={link.href === "/library" ? "tour-library" : undefined}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "text-[var(--accent)] bg-[var(--accent-light)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Search Palette Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm text-[var(--text-muted)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-main)] transition-colors"
              aria-label="Search books"
            >
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="hidden sm:inline text-xs font-normal">Search library...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[var(--text-subtle)]">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  id="tour-profile"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--bg-subtle)] transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center font-medium text-xs">
                    {user.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-[var(--border-main)]">
                      <div className="font-medium text-sm text-[var(--text-main)] truncate">
                        {user.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] truncate">
                        {user.email}
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[var(--accent-light)] text-[var(--accent)]">
                        {user.role}
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      >
                        <UserIcon className="w-4 h-4 text-[var(--text-muted)]" />
                        My Profile
                      </Link>
                      <Link
                        href="/library"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      >
                        <Bookmark className="w-4 h-4 text-[var(--text-muted)]" />
                        My Library
                      </Link>
                      <Link
                        href="/account/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      >
                        <span className="text-[12px] font-bold text-[var(--text-muted)]">₹</span>
                        Order History & Invoices
                      </Link>
                      <Link
                        href="/settings/subscription"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      >
                        <span className="text-[12px] font-bold text-[var(--primary)]">★</span>
                        Manage Subscription
                      </Link>
                      <Link
                        href="/settings/privacy"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      >
                        <Sliders className="w-4 h-4 text-[var(--text-muted)]" />
                        Privacy & Cookies
                      </Link>
                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent-light)] font-medium"
                        >
                          <Shield className="w-4 h-4" />
                          Admin Console
                        </Link>
                      )}
                    </div>

                    <div className="pt-1 border-t border-[var(--border-main)]">
                      <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Search Palette */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
