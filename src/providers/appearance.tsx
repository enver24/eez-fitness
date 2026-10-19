/**
 * Remembers the user's colour theme and light/dark choice, and shares the
 * resulting colours with every screen.
 *
 * The choice is saved on the phone with AsyncStorage (a simple on-device
 * key–value store). From Stage 4 it will also be saved to the user's account.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { ThemeColors } from '@/constants/theme';
import { DEFAULT_THEME_ID, buildColors, isThemeId, type ThemeId } from '@/constants/themes';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type AppearanceMode = 'system' | 'light' | 'dark';

type Appearance = {
  themeId: ThemeId;
  mode: AppearanceMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeId: (id: ThemeId) => void;
  setMode: (mode: AppearanceMode) => void;
};

const STORAGE_KEY = 'eez.appearance';

const AppearanceContext = createContext<Appearance | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [mode, setModeState] = useState<AppearanceMode>('system');

  // Load the saved choice once when the app starts.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (!saved) return;
        const parsed = JSON.parse(saved) as { themeId?: unknown; mode?: unknown };
        if (isThemeId(parsed.themeId)) setThemeIdState(parsed.themeId);
        if (parsed.mode === 'system' || parsed.mode === 'light' || parsed.mode === 'dark') {
          setModeState(parsed.mode);
        }
      })
      .catch(() => {
        // Storage can fail (e.g. private browsing on web). Defaults are fine.
      });
  }, []);

  const value = useMemo<Appearance>(() => {
    const save = (next: { themeId: ThemeId; mode: AppearanceMode }) => {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
    };
    const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
    return {
      themeId,
      mode,
      isDark,
      colors: buildColors(themeId, isDark),
      setThemeId: (id) => {
        setThemeIdState(id);
        save({ themeId: id, mode });
      },
      setMode: (next) => {
        setModeState(next);
        save({ themeId, mode: next });
      },
    };
  }, [themeId, mode, systemScheme]);

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance(): Appearance {
  const appearance = useContext(AppearanceContext);
  if (!appearance) {
    throw new Error('useAppearance must be used inside <AppearanceProvider>.');
  }
  return appearance;
}
