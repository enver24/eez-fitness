import { Stack } from 'expo-router';

/** The Profile tab can open further screens, such as Appearance. */
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
