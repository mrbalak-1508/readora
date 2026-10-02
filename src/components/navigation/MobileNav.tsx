"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bookmark, User } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  // Don't show mobile bottom nav inside full-screen reader views
  if (pathname.startsWith("/reader/") || pathname.startsWith("/read/")) return null;

  const items = [
    { label: "Home", href: "/", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Library", href: "/library", icon: Bookmark },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card)]/95 backdrop-blur-md border-t border-[var(--border)] pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] px-4 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[11px] font-semibold transition-colors min-h-[44px] justify-center ${
              isActive
                ? "text-[var(--primary)] font-bold"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

