'use client';

/**
 * Theme Provider - Handles theme initialization and sync
 */

import { useEffect, type ReactNode } from 'react';
import { useThemeStore } from '@/stores/theme-store';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme } = useThemeStore();

  // Initialize theme on mount
  useEffect(() => {
    setTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default ThemeProvider;
