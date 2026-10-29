/**
 * Centralized Design Tokens for 3D Printing Studio Platform
 * Visual identity: Charcoal (#111318), Electric Orange (#FF6B35), Off-white (#F8F9FA)
 */

export const tokens = {
  colors: {
    charcoal: {
      DEFAULT: "#111318",
      elevated: "#1A1D24",
      muted: "#242832",
      border: "#2A2E39",
    },
    electric: {
      DEFAULT: "#FF6B35",
      hover: "#E85A26",
      active: "#D44C19",
      subtle: "rgba(255, 107, 53, 0.12)",
      glow: "rgba(255, 107, 53, 0.28)",
    },
    offWhite: {
      DEFAULT: "#F8F9FA",
      elevated: "#FFFFFF",
      subtle: "#F1F3F5",
      border: "#E5E7EB",
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      400: "#9CA3AF",
      500: "#6B7280",
      600: "#4B5563",
      700: "#374151",
      800: "#1F2937",
      900: "#111827",
    },
    semantic: {
      success: "#10B981",
      successSubtle: "rgba(16, 185, 129, 0.12)",
      warning: "#F59E0B",
      warningSubtle: "rgba(245, 158, 11, 0.12)",
      error: "#EF4444",
      errorSubtle: "rgba(239, 68, 68, 0.12)",
      info: "#3B82F6",
      infoSubtle: "rgba(59, 130, 246, 0.12)",
    },
  },
  typography: {
    fontFamilies: {
      heading: "var(--font-heading), 'Space Grotesk', system-ui, sans-serif",
      sans: "var(--font-sans), 'Inter', system-ui, sans-serif",
      mono: "var(--font-mono), 'JetBrains Mono', monospace",
    },
  },
  radii: {
    sm: "0.375rem", // 6px
    md: "0.625rem", // 10px
    lg: "0.875rem", // 14px
    xl: "1.125rem", // 18px
    "2xl": "1.5rem", // 24px
    full: "9999px",
  },
  shadows: {
    soft: "0 2px 8px -1px rgba(17, 19, 24, 0.05), 0 1px 3px -1px rgba(17, 19, 24, 0.03)",
    elevated: "0 10px 25px -3px rgba(17, 19, 24, 0.08), 0 4px 6px -2px rgba(17, 19, 24, 0.04)",
    glow: "0 0 20px -3px rgba(255, 107, 53, 0.28)",
    glowLg: "0 0 35px -5px rgba(255, 107, 53, 0.38)",
  },
  transitions: {
    fast: "150ms cubic-bezier(0.16, 1, 0.3, 1)",
    normal: "250ms cubic-bezier(0.16, 1, 0.3, 1)",
    slow: "400ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type ThemeTokens = typeof tokens;

