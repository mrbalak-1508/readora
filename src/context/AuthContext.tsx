"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { UserProfile, UserRole } from "@/lib/types";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password?: string,
    phone?: string,
    avatarPath?: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  updatePreferences: (prefs: Partial<UserProfile["preferences"]>) => void;
  completeOnboarding: () => Promise<void>;
  replayTour: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PREFERENCES: UserProfile["preferences"] = {
  theme: "light",
  readerTheme: "paper",
  fontSize: 18,
  fontFamily: "serif",
  lineHeight: 1.75,
  textAlign: "left",
  pageMode: "paged",
  soundEffects: false,
  language: "en",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync user from backend session cookie
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          const dbUser = data.user;
          const mapped: UserProfile = {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            phone: dbUser.phone || undefined,
            role: dbUser.role?.toLowerCase() === "admin" ? "admin" : "user",
            avatar_url: dbUser.avatarPath || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
            joined_at: new Date().toISOString(),
            onboardingCompleted: dbUser.onboardingCompleted ?? false,
            preferences: {
              ...DEFAULT_PREFERENCES,
              ...(dbUser.preferences || {}),
            },
          };
          setUser(mapped);
          setIsLoading(false);
          return mapped;
        }
      }
      setUser(null);
    } catch (err) {
      console.error("Failed to load user session:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string = "admin123"): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "Login failed" };
      }

      if (data?.user) {
        const dbUser = data.user;
        const mapped: UserProfile = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone || undefined,
          role: dbUser.role?.toLowerCase() === "admin" ? "admin" : "user",
          avatar_url: dbUser.avatarPath || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          joined_at: new Date().toISOString(),
          onboardingCompleted: dbUser.onboardingCompleted ?? false,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(dbUser.preferences || {}),
          },
        };
        setUser(mapped);
      }

      await refreshUser();
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Network error" };
    }
  };

  const signup = async (
    name: string,
    email: string,
    password: string = "reader123",
    phone?: string,
    avatarPath?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, avatarPath }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "Signup failed" };
      }

      if (data?.user) {
        const dbUser = data.user;
        const mapped: UserProfile = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          phone: dbUser.phone || undefined,
          role: dbUser.role?.toLowerCase() === "admin" ? "admin" : "user",
          avatar_url: dbUser.avatarPath || avatarPath || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          joined_at: new Date().toISOString(),
          onboardingCompleted: dbUser.onboardingCompleted ?? false,
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(dbUser.preferences || {}),
          },
        };
        setUser(mapped);
      }

      await refreshUser();
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || "Network error" };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setUser((prev) => prev ? { ...prev, onboardingCompleted: true } : null);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
    } catch (err) {
      console.error("Failed to persist onboarding completion:", err);
    }
  };

  const replayTour = async () => {
    if (!user) return;
    setUser((prev) => prev ? { ...prev, onboardingCompleted: false } : null);
    try {
      await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
    } catch (err) {
      console.error("Failed to reset onboarding status:", err);
    }
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  const updatePreferences = (prefs: Partial<UserProfile["preferences"]>) => {
    if (!user) return;
    const updated = {
      ...user,
      preferences: {
        ...user.preferences,
        ...prefs,
      },
    };
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || "user",
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        signup,
        logout,
        switchRole,
        updatePreferences,
        completeOnboarding,
        replayTour,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
