import { useCallback, useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'tournado-theme';

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return null;
}

function getResolvedTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// Module-level state for useSyncExternalStore
let currentTheme: Theme = getResolvedTheme();
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

function getSnapshot(): Theme {
  return currentTheme;
}

function setTheme(theme: Theme): void {
  currentTheme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  for (const listener of listeners) listener();
}

// Apply theme immediately on module load to prevent flash
applyTheme(currentTheme);

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export function useTheme(): UseThemeReturn {
  const theme = useSyncExternalStore(subscribe, getSnapshot);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (): void => {
      if (getStoredTheme()) return;
      const resolved = getSystemTheme();
      currentTheme = resolved;
      applyTheme(resolved);
      for (const listener of listeners) listener();
    };
    mediaQuery.addEventListener('change', handler);
    return (): void => { mediaQuery.removeEventListener('change', handler); };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme]);

  return { theme, toggleTheme, setTheme };
}
