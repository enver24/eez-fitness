/**
 * Returns the colour palette for the phone's current light/dark mode.
 * Learn more: https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ThemeColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? Colors.dark : Colors.light;
}
