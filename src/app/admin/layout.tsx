"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  FolderTree,
  BarChart3,
  ArrowLeft,
  ShieldAlert,
  Menu,
  X,
  ShoppingBag,
  CreditCard,
  Sparkles,
  Ticket,
  Sliders,
  Home,
  MessageSquare,
  Edit3,
  HardDrive,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

interface NavGroup {
  group: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }>;
}

export function AdminNav({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  const navSections: NavGroup[] = [
    {
      group: "Overview",
      items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
      group: "Catalog & Editorial",
      items: [
        { label: "Books Library", href: "/admin/books", icon: BookOpen },
        { label: "Add New Volume", href: "/admin/books/new", icon: PlusCircle },
        { label: "Written Books", href: "/admin/written-books", icon: Edit3 },
        { label: "Categories & Authors", href: "/admin/categories", icon: FolderTree },
        { label: "Upload Processing", href: "/admin/uploads", icon: Sparkles },
      ],
    },
    {
      group: "Commerce & Monetization",
      items: [
        { label: "Orders & Payments", href: "/admin/orders", icon: ShoppingBag },
        { label: "Sales Intelligence", href: "/admin/sales", icon: TrendingUp },
        { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
        { label: "Coupons & Discounts", href: "/admin/coupons", icon: Ticket },
      ],
    },
    {
      group: "Readers & Community",
      items: [
        { label: "Reader Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Users & Roles", href: "/admin/users", icon: Users },
        { label: "Reader Reviews", href: "/admin/reviews", icon: MessageSquare },
      ],
    },
    {
      group: "Platform Governance",
      items: [
        { label: "Homepage CMS", href: "/admin/homepage", icon: Home },
        { label: "Privacy & Consent", href: "/admin/privacy", icon: ShieldCheck },
        { label: "Site Settings", href: "/admin/settings", icon: Sliders },
        { label: "Storage & Health", href: "/admin/health", icon: HardDrive },
      ],
    },
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
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:static lg:w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] p-4 sm:p-5 flex flex-col justify-between transition-transform ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        } duration-200 ease-in-out lg:h-screen lg:sticky lg:top-0`}
      >
        <div className="space-y-4 overflow-y-auto pr-1">
          {/* Brand & Admin Badge */}
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-editorial text-2xl font-bold tracking-tight text-[var(--foreground)]">
                  READORA
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--primary)] border border-[var(--primary)]/20">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] mt-0.5 font-medium">
                Operations &amp; Studio Console
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

          {/* Categorized Navigation Groups */}
          <nav className="space-y-4 pt-1">
            {navSections.map((section) => (
              <div key={section.group} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] px-3 block">
                  {section.group}
                </span>

                <div className="space-y-0.5">
                  {section.items.map((link) => {
                    const Icon = link.icon;
                    const isActive =
                      link.href === "/admin"
                        ? pathname === "/admin"
                        : pathname === link.href || pathname.startsWith(link.href + "/");

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-[var(--primary)] text-white font-bold shadow-xs"
                            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </div>
                        {link.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--accent-light)] text-[var(--primary)]">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Exit Bar */}
        <div className="pt-3 border-t border-[var(--border)] mt-2 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Exit to Digital Library</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-3.5 border-b border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-xl font-bold text-[var(--foreground)]">READORA</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-light)] text-[var(--primary)] border border-[var(--primary)]/20">
            Admin
          </span>
        </div>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] cursor-pointer"
          aria-label="Toggle admin navigation"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar navigation */}
      <AdminNav mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      {/* Main Admin Content Canvas with lag-free fluid scrolling and responsive padding */}
      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
