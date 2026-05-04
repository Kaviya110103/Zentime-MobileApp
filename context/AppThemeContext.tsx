import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export type AppThemeMode = 'light' | 'dark';

type AppThemeColors = {
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
};

type AppThemeContextValue = {
  mode: AppThemeMode;
  isDark: boolean;
  colors: AppThemeColors;
  themeReady: boolean;
};

const LIGHT_COLORS: AppThemeColors = {
  background: '#f5f6fa',
  surface: '#ffffff',
  text: '#111827',
  mutedText: '#6b7280',
  border: '#e5e7eb',
  primary: '#7726B9',
};

const DARK_COLORS: AppThemeColors = {
  background: '#0f172a',
  surface: '#111827',
  text: '#f9fafb',
  mutedText: '#cbd5e1',
  border: '#334155',
  primary: '#8b5cf6',
};

const AppThemeContext = createContext<AppThemeContextValue>({
  mode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  themeReady: true,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemTheme = useColorScheme();
  const mode: AppThemeMode = systemTheme === 'dark' ? 'dark' : 'light';
  const isDark = mode === 'dark';
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  const value = useMemo(
    () => ({
      mode,
      isDark,
      colors,
      themeReady: true,
    }),
    [mode, isDark, colors]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(AppThemeContext);
}
