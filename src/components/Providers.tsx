"use client";

import React, { useEffect, useState } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { CookieConsentBanner } from "@/components/cookies/CookieConsentBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Dark mode check
    const savedTheme = localStorage.getItem("readora_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <div className={mounted ? "opacity-100 transition-opacity duration-300" : "opacity-95"}>
        {children}
        <OnboardingTour />
        <CookieConsentBanner />
      </div>
    </AuthProvider>
  );
}
