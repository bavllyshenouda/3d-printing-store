import React from "react";

/**
 * Script injected synchronously into <head> to determine dark mode before paint.
 * Completely eliminates any Flash of Unstyled Content (FOUC).
 */
export function ThemeScript() {
  const scriptContent = `
    (function() {
      try {
        var matchCookie = document.cookie.match(/(?:^|; )theme=([^;]*)/);
        var theme = matchCookie ? decodeURIComponent(matchCookie[1]) : null;
        if (!theme) {
          theme = localStorage.getItem('theme');
        }
        var isDark = false;
        if (theme === 'dark') {
          isDark = true;
        } else if (theme === 'light') {
          isDark = false;
        } else {
          isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        if (isDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: scriptContent,
      }}
    />
  );
}

