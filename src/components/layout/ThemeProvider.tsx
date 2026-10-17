"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

export type ThemePreference = "system" | "light" | "dark";
type ThemeContextValue = { preference: ThemePreference; resolvedTheme: "light" | "dark"; setPreference: (preference: ThemePreference) => void; toggleTheme: () => void };

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "clearcheck-theme";

function systemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function storedPreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

function subscribePreference(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("clearcheck-theme-change", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("clearcheck-theme-change", listener);
  };
}

function subscribeSystem(listener: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function applyTheme(preference: ThemePreference): "light" | "dark" {
  const resolved = preference === "system" ? systemTheme() : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
  return resolved;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const preference = useSyncExternalStore<ThemePreference>(subscribePreference, storedPreference, () => "system");
  const systemPreference = useSyncExternalStore<"light" | "dark">(subscribeSystem, systemTheme, () => "light");
  const resolvedTheme = preference === "system" ? systemPreference : preference;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(() => ({
    preference,
    resolvedTheme,
    setPreference: (nextPreference) => {
      try {
        if (nextPreference === "system") window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, nextPreference);
      } catch {
        // Theme switching still applies for this session if storage is unavailable.
      }
      window.dispatchEvent(new Event("clearcheck-theme-change"));
    },
    toggleTheme: () => {
      const next = resolvedTheme === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Theme switching still applies for this session if storage is unavailable.
      }
      window.dispatchEvent(new Event("clearcheck-theme-change"));
    },
  }), [preference, resolvedTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
