/**
 * useTheme — Dark / Light mode hook with localStorage persistence.
 */
import { createContext, useContext, useEffect, useState } from 'react';

export const ThemeContext = createContext({ dark: false, toggle: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeProvider() {
  const [dark, setDark] = useState(() => {
    try {
      const saved = localStorage.getItem('foryou_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch { return false; }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try { localStorage.setItem('foryou_theme', dark ? 'dark' : 'light'); } catch (err) { void err; }
  }, [dark]);

  const toggle = () => setDark(d => !d);
  return { dark, toggle };
}
