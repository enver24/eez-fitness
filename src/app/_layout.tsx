import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { AppearanceProvider, useAppearance } from '@/providers/appearance';

/** The root of the app: loads the user's theme and shows the tab bar. */
export default function RootLayout() {
  return (
    <AppearanceProvider>
      <ThemedApp />
    </AppearanceProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useAppearance();
  const base = isDark ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.accent,
          background: colors.background,
          card: colors.background,
          text: colors.text,
          border: colors.separator,
        },
      }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppTabs />
    </ThemeProvider>
  );
}
