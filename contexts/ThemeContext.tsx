import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = '@app_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  text: string;
  primary: string;
  border: string;
  muted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
}

const lightColors: ThemeColors = {
  background: '#F3F4F6',
  card: '#FFFFFF',
  text: '#1F2937',
  primary: '#3B82F6',
  border: '#E5E7EB',
  muted: '#6B7280',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

const darkColors: ThemeColors = {
  background: '#111827',
  card: '#1F2937',
  text: '#F9FAFB',
  primary: '#60A5FA',
  border: '#374151',
  muted: '#9CA3AF',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        setThemeMode(stored as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      setThemeMode(newMode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [themeMode]);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const colors = useMemo(() => 
    themeMode === 'light' ? lightColors : darkColors,
    [themeMode]
  );

  return useMemo(() => ({
    themeMode,
    colors,
    toggleTheme,
    setTheme,
    isLoading,
    isDark: themeMode === 'dark',
  }), [themeMode, colors, toggleTheme, setTheme, isLoading]);
});
