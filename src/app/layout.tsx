import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DEFAULT_LOCALE, LOCALES, Locale, getDirection } from "@/lib/i18n";
import { DEFAULT_THEME, THEMES, Theme } from "@/lib/theme";
import { LanguageProvider } from "@/lib/i18n/context";
import { ThemeProvider } from "@/lib/theme/context";
import { ThemeScript } from "@/lib/theme/theme-script";
import { AuthProvider } from "@/lib/auth/context";
import { CartProvider } from "@/lib/cart/context";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "PRINT STUDIO 3D | Precision 3D Printing & Prototyping",
  description:
    "Industrial-grade 3D printing studio. Functional prototyping, engineering filaments (PETG-CF, ABS, Nylon), 8K Resin, and rapid on-demand manufacturing.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  // Resolve initial locale from cookie
  const rawLocale = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const locale: Locale =
    rawLocale && LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const dir = getDirection(locale);

  // Resolve initial theme from cookie
  const rawTheme = cookieStore.get("theme")?.value as Theme | undefined;
  const theme: Theme =
    rawTheme && THEMES.includes(rawTheme) ? rawTheme : DEFAULT_THEME;
  const isDark = theme === "dark";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${isDark ? "dark" : ""} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-[#FF6B35]/20 selection:text-[#FF6B35]">
        <ThemeProvider initialTheme={theme}>
          <LanguageProvider initialLocale={locale}>
            <AuthProvider>
              <CartProvider>
                <ToastProvider>
                  <Navbar />
                  <CartDrawer />
                  <main className="flex-1 flex flex-col">{children}</main>
                  <Footer />
                </ToastProvider>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
