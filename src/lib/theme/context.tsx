"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  Theme,
  ResolvedTheme,
  THEMES,
  DEFAULT_THEME,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from "./index";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (nextTheme: Theme) => void;
  toggleTheme: () => void;
  isMounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  initialTheme?: Theme;
  children: ReactNode;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({
  initialTheme = DEFAULT_THEME,
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize and observe system color scheme
  useEffect(() => {
    setIsMounted(true);
    setSystemTheme(getSystemTheme());

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (stored && THEMES.includes(stored)) {
        setThemeState(stored);
      }
    } catch {
      // localStorage may fail in restricted contexts
    }

    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === "system") {
      return systemTheme;
    }
    return theme;
  }, [theme, systemTheme]);

  // Synchronize <html> classes and cookies whenever resolvedTheme or theme changes
  useEffect(() => {
    if (!isMounted) return;

    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme, isMounted]);

  const setTheme = useCallback((nextTheme: Theme) => {
    if (!THEMES.includes(nextTheme)) return;

    setThemeState(nextTheme);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      document.cookie = `${THEME_COOKIE_NAME}=${nextTheme};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }

    // Direct DOM sync
    const nextResolved: ResolvedTheme =
      nextTheme === "system" ? getSystemTheme() : nextTheme;

    if (typeof document !== "undefined") {
      if (nextResolved === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      isMounted,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme, isMounted]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

