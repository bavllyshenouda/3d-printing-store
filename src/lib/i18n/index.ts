import en from "./dictionaries/en.json";
import ar from "./dictionaries/ar.json";

export type Locale = "en" | "ar";
export type Direction = "ltr" | "rtl";

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

export const dictionaries = {
  en,
  ar,
} as const;

export type TranslationKey = string;

/**
 * Returns text direction ('ltr' or 'rtl') for a given locale.
 */
export function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Resolves a dot-notated translation key against a dictionary object.
 */
export function getNestedTranslation(
  dict: Record<string, unknown>,
  key: string
): string | undefined {
  const parts = key.split(".");
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Translates a key with optional variable interpolation.
 * Falls back to English dictionary, then to the key itself if not found.
 */
export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  const primaryDict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
  let text = getNestedTranslation(primaryDict as unknown as Record<string, unknown>, key);

  if (!text && locale !== DEFAULT_LOCALE) {
    text = getNestedTranslation(
      dictionaries[DEFAULT_LOCALE] as unknown as Record<string, unknown>,
      key
    );
  }

  if (!text) {
    return key;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return text;
}

/**
 * Extensible helper to extract localized content from database models.
 * For example, if a product has `name_ar` in the future, it seamlessly uses it;
 * otherwise it returns the standard `name`.
 */
export function getLocalizedField<T extends Record<string, unknown>>(
  item: T | null | undefined,
  field: string,
  locale: Locale,
  fallback: string = ""
): string {
  if (!item) return fallback;

  if (locale === "ar") {
    const arVal = item[`${field}_ar`];
    if (typeof arVal === "string" && arVal.trim() !== "") {
      return arVal;
    }
  }

  const defaultVal = item[field];
  if (typeof defaultVal === "string" && defaultVal.trim() !== "") {
    return defaultVal;
  }

  return fallback;
}

