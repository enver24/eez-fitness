import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** The root of the app: applies light/dark mode and shows the tab bar. */
export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <StatusBar style="auto" />
      <AppTabs />
    </ThemeProvider>
  );
}
