/**
 * EEZ Fitness design tokens: fonts, text styles, spacing and corner radius.
 *
 * Colours live in `themes.ts`, because they change with the user's chosen
 * theme and light/dark mode. Screens never hard-code colours — they read
 * them from `useTheme()`.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Every colour a screen can use. Each theme provides all of these. */
export type ThemeColors = {
  background: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** Frosted glass fill, used when real Liquid Glass isn't available. */
  glass: string;
  glassBorder: string;
  /** Subtle fill for pressed rows, inputs and secondary buttons. */
  fill: string;
  separator: string;
  danger: string;
  /** The theme's main colour: links, selected tabs and the calories ring. */
  accent: string;
  protein: string;
  carbs: string;
  fat: string;
  /** Two soft colour glows behind the glass. */
  glow1: string;
  glow2: string;
  /** Main action button and the text on top of it. */
  button: string;
  onButton: string;
};

export type ThemeColor = keyof ThemeColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    /** SF Pro Rounded — used for numbers (calories, weights, reps). */
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

/**
 * Text styles. `hero` and `heading` are the heavy, slanted, uppercase
 * "gym" headings; the rest follow Apple's iOS type scale.
 */
export const Type = {
  hero: {
    fontSize: 36,
    lineHeight: 38,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.8,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  number: { fontSize: 34, lineHeight: 38, fontWeight: '800' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  body: { fontSize: 17, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
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
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
} as const;

/** Extra space at the bottom of scroll views so content clears the tab bar. */
export const BottomTabInset = Platform.select({ ios: 0, android: 80, web: 100 }) ?? 0;
export const MaxContentWidth = 640;
