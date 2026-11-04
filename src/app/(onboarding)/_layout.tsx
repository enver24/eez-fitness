import { Stack } from 'expo-router';

// The first onboarding screen.
export const unstable_settings = {
  anchor: 'setup',
};

/** Shown once, after sign-up, until the user finishes setting up their profile. */
export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="setup" />
    </Stack>
  );
}
