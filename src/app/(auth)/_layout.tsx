import { Stack } from 'expo-router';

// Screens like Log in go back to the welcome screen.
export const unstable_settings = {
  anchor: 'welcome',
};

/** Screens for people who aren't signed in. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
