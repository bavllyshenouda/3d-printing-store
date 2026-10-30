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
  Locale,
  Direction,
  DEFAULT_LOCALE,
  LOCALES,
  getDirection,
  translate,
} from "./index";

interface LanguageContextValue {
  locale: Locale;
  dir: Direction;
  isRTL: boolean;
  setLocale: (nextLocale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export interface LanguageProviderProps {
  initialLocale?: Locale;
  children: ReactNode;
}

export function LanguageProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: LanguageProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  // Initialize from document or localStorage on mount if client has stored preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem("NEXT_LOCALE") as Locale | null;
      if (stored && LOCALES.includes(stored) && stored !== locale) {
        setLocaleState(stored);
        document.documentElement.lang = stored;
        document.documentElement.dir = getDirection(stored);
      }
    } catch {
      // localStorage may be inaccessible in private modes
    }
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!LOCALES.includes(nextLocale)) return;

    setLocaleState(nextLocale);

    try {
      localStorage.setItem("NEXT_LOCALE", nextLocale);
      // Set 1-year cookie for SSR persistence
      document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // Ignore storage errors
    }

    // Immediately update DOM attributes
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = getDirection(nextLocale);
    }
  }, []);

  const dir = useMemo(() => getDirection(locale), [locale]);
  const isRTL = dir === "rtl";

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(locale, key, params);
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      dir,
      isRTL,
      setLocale,
      t,
    }),
    [locale, dir, isRTL, setLocale, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

