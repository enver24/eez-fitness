import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { SetupNeeded } from '@/components/setup-needed';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AppearanceProvider, useAppearance } from '@/providers/appearance';
import { AuthProvider, useAuth } from '@/providers/auth';

// Keep the splash screen up until we know whether someone is signed in.
SplashScreen.preventAutoHideAsync();

/** The root of the app: theme, sign-in state and the top-level screens. */
export default function RootLayout() {
  return (
    <AppearanceProvider>
      <AuthProvider>
        <ThemedApp />
      </AuthProvider>
    </AppearanceProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useAppearance();
  const { session, isLoading } = useAuth();
  const base = isDark ? DarkTheme : DefaultTheme;

  useEffect(() => {
    if (!isLoading) SplashScreen.hideAsync();
  }, [isLoading]);

  if (isLoading) return null;

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
      {isSupabaseConfigured ? (
        <Stack screenOptions={{ headerShown: false }}>
          {/* Signed in: the app. Signed out: welcome and login screens. */}
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      ) : (
        <SetupNeeded />
      )}
    </ThemeProvider>
  );
}
