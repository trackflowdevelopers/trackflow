import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { ThemeName, ThemeTokens } from '@trackflow/shared-types';
import { THEMES } from './tokens';

const THEME_KEY = 'trackflow.theme';

interface ThemeContextValue {
  theme: ThemeTokens;
  themeName: ThemeName;
  setThemeName: (name: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeName, setThemeNameState] = useState<ThemeName>('dark');

  useEffect(() => {
    SecureStore.getItemAsync(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeNameState(stored);
      }
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const setThemeName = (name: ThemeName) => {
      setThemeNameState(name);
      SecureStore.setItemAsync(THEME_KEY, name);
    };
    return {
      theme: THEMES[themeName],
      themeName,
      setThemeName,
      toggleTheme: () => setThemeName(themeName === 'dark' ? 'light' : 'dark'),
    };
  }, [themeName]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
