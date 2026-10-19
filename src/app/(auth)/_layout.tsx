import { Stack } from 'expo-router';

// Signed-out users always start on the welcome screen.
export const unstable_settings = {
  initialRouteName: 'welcome',
};

/** Screens for people who aren't signed in. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
