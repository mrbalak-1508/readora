"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  FolderTree,
  BarChart3,
  ArrowLeft,
  Shield,
  ShieldAlert,
  Menu,
  X,
  LogOut,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Ticket,
  Sliders,
  Cookie,
  Home,
} from "lucide-react";
import { showToastAlert, showConfirmAlert } from "@/lib/alerts";

export function AdminNav({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Book Catalog", href: "/admin/books", icon: BookOpen },
    { label: "Orders & Sales", href: "/admin/orders", icon: ShoppingBag },
    { label: "Sales Dashboard", href: "/admin/sales", icon: BarChart3 },
    { label: "Subscriptions", href: "/admin/subscriptions", icon: Sparkles },
    { label: "Coupons", href: "/admin/coupons", icon: Ticket },
    { label: "Homepage CMS", href: "/admin/homepage", icon: Home },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Users & Roles", href: "/admin/users", icon: Users },
    { label: "Payment Settings", href: "/admin/settings/payments", icon: CreditCard },
    { label: "Cookie Analytics", href: "/admin/privacy/cookies", icon: Cookie },
    { label: "Site Settings", href: "/admin/settings", icon: Sliders },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:static lg:w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-5 flex flex-col justify-between transition-all overflow-y-auto ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } duration-250 ease-in-out`}
      >
        <div className="space-y-5">
          {/* Brand & Admin Badge */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  READORA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--primary)] border border-[var(--primary)]/20">
                  Admin
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5 font-medium">
                Operations & Platform Studio
              </p>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer"
                aria-label="Close admin menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === link.href ||
                    (pathname.startsWith(link.href + "/") &&
                      !links.some(
                        (other) =>
                          other.href !== link.href &&
                          other.href.startsWith(link.href) &&
                          (pathname === other.href || pathname.startsWith(other.href + "/"))
                      ));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-[var(--border)] space-y-2 mt-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit to Digital Library</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Enforce server & client admin gate
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="font-editorial text-2xl font-bold text-[var(--foreground)]">
          Curator Access Restricted
        </h2>
        <p className="text-xs text-[var(--muted)] mt-2 max-w-sm">
          You need an Administrator account to manage Readora. Please sign in with curator credentials.
        </p>
        <Link
          href="/login?redirect=/admin"
          className="mt-6 px-6 py-3 rounded-2xl bg-[var(--primary)] text-white text-xs font-bold hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
        >
          Sign In as Curator
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--background)] text-[var(--foreground)]">
      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-xl font-bold text-[var(--foreground)]">READORA</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--accent-light)] text-[var(--primary)]">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-lg border border-[var(--border)]"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar navigation */}
      <AdminNav mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Admin Content Canvas */}
      <main className="flex-1 overflow-y-auto max-h-screen p-6 sm:p-10">{children}</main>
    </div>
  );
}
