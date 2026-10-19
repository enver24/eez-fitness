import type { ThemeColors } from '@/constants/theme';
import { useAppearance } from '@/providers/appearance';

/** Returns the colours for the user's chosen theme and light/dark mode. */
export function useTheme(): ThemeColors {
  return useAppearance().colors;
}
