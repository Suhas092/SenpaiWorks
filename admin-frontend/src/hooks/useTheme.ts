import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "senpai-admin-theme";

/** Light/dark theme state, persisted in localStorage and applied as the `dark` class on `<html>`. */
export function useTheme() {
  // Starts as light so server and client markup match; the real value is read after mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be blocked; the theme still applies for this session.
    }
    setTheme(next);
  }, [theme]);

  return { theme, toggleTheme };
}
