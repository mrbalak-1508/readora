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
  Menu,
  X,
  Compass,
  Home,
  FolderTree,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommandSearch } from "./CommandSearch";

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

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
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Categories", href: "/categories", icon: FolderTree },
    { label: "My Library", href: "/library", icon: Bookmark },
    ...(isAdmin ? [{ label: "Admin Console", href: "/admin", isSpecial: true, icon: Shield }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-main)] bg-[var(--bg-overlay)] backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group shrink-0">
              <span className="font-editorial text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors">
                READORA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
            </Link>

            {/* Desktop Navigation (>= 1024px) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    id={link.href === "/library" ? "tour-library" : undefined}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isActive
                        ? "text-[var(--accent)] bg-[var(--accent-light)] font-semibold"
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
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Search Palette Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full text-sm text-[var(--text-muted)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-card)] border border-[var(--border-main)] transition-colors cursor-pointer"
              aria-label="Search books"
              title="Search library (⌘K)"
            >
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="hidden sm:inline text-xs font-normal">Search library...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-[var(--bg-card)] border border-[var(--border-main)] rounded text-[var(--text-subtle)]">
                ⌘K
              </kbd>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              aria-label="Toggle theme"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div className="relative">
                <button
                  id="tour-profile"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-[var(--bg-subtle)] transition-colors focus:outline-none cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
                </button>

                {isProfileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-main)] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-[var(--border-main)]">
                        <div className="font-bold text-sm text-[var(--text-main)] truncate">
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
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          My Profile
                        </Link>
                        <Link
                          href="/library"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          My Library
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          <span className="text-[12px] font-bold text-[var(--text-muted)]">₹</span>
                          Order History & Invoices
                        </Link>
                        <Link
                          href="/settings/subscription"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Manage Subscription
                        </Link>
                        <Link
                          href="/settings/privacy"
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          Privacy & Cookies
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[var(--accent)] hover:bg-[var(--accent-light)] font-bold"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Admin Console
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 border-t border-[var(--border-main)]">
                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/login"
                  className="px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="hidden xs:inline-flex px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile & Tablet Drawer Trigger Button (visible on screens < 1024px) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors border border-[var(--border-main)] cursor-pointer"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile & Tablet Navigation Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm h-full bg-[var(--bg-card)] border-l border-[var(--border-main)] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-250 z-10">
            {/* Drawer Header */}
            <div>
              <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 group"
                >
                  <span className="font-editorial text-xl font-bold tracking-tight text-[var(--text-main)]">
                    READORA
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                </Link>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Inside Drawer */}
              <div className="p-4 border-b border-[var(--border-main)]">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSearchOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-main)] text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] text-left transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>Search library by title, author...</span>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-3 sm:p-4 space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                  Main Navigation
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href));
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-colors ${
                        isActive
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[var(--accent)]"}`} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* User Account / Shortcuts in Drawer */}
              {user ? (
                <div className="p-3 sm:p-4 border-t border-[var(--border-main)] space-y-1">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">
                    My Account
                  </div>
                  <div className="px-3.5 py-2 mb-2 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-main)] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--accent-light)] border border-[var(--accent-border)] text-[var(--accent)] font-bold text-xs flex items-center justify-center shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-[var(--text-main)] truncate">
                        {user.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/account/orders"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                  >
                    <span className="text-[12px] font-bold text-[var(--text-muted)] w-3.5 text-center">₹</span>
                    <span>Order History & Invoices</span>
                  </Link>
                  <Link
                    href="/settings/subscription"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Subscription Plan</span>
                  </Link>
                  <Link
                    href="/settings/privacy"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)]"
                  >
                    <Sliders className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Privacy & Cookies</span>
                  </Link>
                </div>
              ) : (
                <div className="p-4 border-t border-[var(--border-main)] space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-2xl border border-[var(--border-main)] bg-[var(--bg-subtle)] text-xs font-bold text-[var(--text-main)] flex items-center justify-center hover:bg-[var(--bg-card)] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-2.5 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-subtle)]/50 space-y-3">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-main)] text-xs text-[var(--text-main)] font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                  <span>{isDark ? "Light Appearance" : "Dark Appearance"}</span>
                </span>
                <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
                  {isDark ? "Dark" : "Light"}
                </span>
              </button>

              {user && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Command Search Palette */}
      <CommandSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

