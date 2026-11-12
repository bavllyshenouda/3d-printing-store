export const LOW_STOCK_THRESHOLD = 7;

/**
 * Helper to format exact remaining stock with proper Arabic grammar/pluralization and localization.
 */
export function formatUnitsLeft(
  count: number,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale?: string
): string {
  if (locale === "ar") {
    if (count === 1) {
      return t("common.unitsLeftSingle") || "متبقية قطعة واحدة";
    }
    if (count === 2) {
      return t("common.unitsLeftDual") || "متبقيتان قطعتان";
    }
    if (count >= 3 && count <= 10) {
      return t("common.unitsLeftFew", { count }) || `متبقي ${count} قطع`;
    }
    return t("common.unitsLeftMany", { count }) || `متبقي ${count} قطعة`;
  }

  if (count === 1) {
    return t("common.unitsLeftSingular", { count }) || "1 left";
  }
  return t("common.unitsLeft", { count }) || `${count} left`;
}

