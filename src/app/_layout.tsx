import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { LoadError } from '@/components/load-error';
import { SetupNeeded } from '@/components/setup-needed';
import { useProfile } from '@/hooks/use-profile';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AppearanceProvider, useAppearance } from '@/providers/appearance';
import { AuthProvider, useAuth } from '@/providers/auth';

// Keep the splash screen up until we know who is signed in.
SplashScreen.preventAutoHideAsync();

/** The root of the app: theme, sign-in state, data loading and top-level screens. */
export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AppearanceProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </AppearanceProvider>
    </QueryClientProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useAppearance();
  const { session, isLoading: authLoading } = useAuth();
  const profile = useProfile();
  const base = isDark ? DarkTheme : DefaultTheme;

  const signedIn = !!session;
  const loading = authLoading || (signedIn && profile.isPending);
  const onboarded = !!profile.data?.onboarding_completed_at;

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  let content;
  if (!isSupabaseConfigured) {
    content = <SetupNeeded />;
  } else if (signedIn && profile.isError) {
    content = <LoadError onRetry={() => profile.refetch()} />;
  } else {
    // Where to send someone who opens a screen they're not allowed to see yet.
    const home = !signedIn ? '/welcome' : onboarded ? '/' : '/setup';
    content = (
      <Stack screenOptions={{ headerShown: false }}>
        {/* Signed in and set up: the app. */}
        <Stack.Protected guard={signedIn && onboarded} redirectTo={home}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>
        {/* Signed in but profile not set up yet. */}
        <Stack.Protected guard={signedIn && !onboarded} redirectTo={home}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        {/* Signed out: welcome and login screens. */}
        <Stack.Protected guard={!signedIn} redirectTo={home}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    );
  }

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
      {content}
    </ThemeProvider>
  );
}
