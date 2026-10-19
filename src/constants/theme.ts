/**
 * EEZ Fitness design tokens.
 *
 * Every colour, font size, spacing value and corner radius used in the app
 * lives here, so the whole look can be changed from one place.
 * Screens should never hard-code colours — always read them from `useTheme()`.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Surfaces
    background: '#F4F5F7',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEEF1',
    border: '#E2E5EA',
    // Text
    text: '#0B0D10',
    textSecondary: '#5B6270',
    textTertiary: '#8A919E',
    textInverse: '#FFFFFF',
    // Brand accent: progress rings, highlights and links
    accent: '#077A54',
    accentSoft: '#DCF3E9',
    // Macronutrients
    protein: '#E5484D',
    carbs: '#3E8BF7',
    fat: '#F5A524',
    // Status
    danger: '#D93036',
    warning: '#B26B00',
    track: '#E7E9EE',
  },
  dark: {
    background: '#0B0D10',
    surface: '#16191E',
    surfaceMuted: '#1F232A',
    border: '#272C34',
    text: '#F4F6F8',
    textSecondary: '#A3AAB6',
    textTertiary: '#6E7684',
    textInverse: '#0B0D10',
    accent: '#34D399',
    accentSoft: '#12352A',
    protein: '#FF6B70',
    carbs: '#5EA2FF',
    fat: '#FFB547',
    danger: '#FF5A5F',
    warning: '#FFB547',
    track: '#262A31',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };
export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    /** SF Pro Rounded — used for big numbers (calories, weights). */
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

/** Text styles, loosely following Apple's iOS type scale. */
export const Type = {
  display: { fontSize: 34, lineHeight: 41, fontWeight: '700' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  headline: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  overline: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.6 },
} as const;

export type TypeVariant = keyof typeof Type;

/** Spacing on a 4-point grid: Spacing[4] = 16px. */
export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

/** Extra space at the bottom of scroll views so content clears the tab bar. */
export const BottomTabInset = Platform.select({ ios: 0, android: 80, web: 96 }) ?? 0;
export const MaxContentWidth = 640;
