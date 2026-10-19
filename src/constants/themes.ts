/**
 * The colour themes users can pick in Profile → Appearance.
 *
 * Each theme has a dark and a light version. Light versions use deeper
 * shades so coloured text stays readable on a pale background.
 * To add a theme, add an entry to THEMES — nothing else needs to change.
 */

import type { ThemeColors } from '@/constants/theme';

type ThemePalette = Pick<
  ThemeColors,
  'accent' | 'protein' | 'carbs' | 'fat' | 'glow1' | 'glow2' | 'button' | 'onButton'
>;

export type AppTheme = {
  id: string;
  name: string;
  dark: ThemePalette;
  light: ThemePalette;
};

export const THEMES = [
  {
    id: 'electric-blue',
    name: 'Electric blue',
    dark: { accent: '#3D7BFF', protein: '#9B5CFF', carbs: '#22D3EE', fat: '#FFD60A', glow1: '#3D7BFF', glow2: '#9B5CFF', button: '#3D7BFF', onButton: '#FFFFFF' },
    light: { accent: '#2563EB', protein: '#7C3AED', carbs: '#0891B2', fat: '#CA8A04', glow1: '#3D7BFF', glow2: '#9B5CFF', button: '#2563EB', onButton: '#FFFFFF' },
  },
  {
    id: 'volt',
    name: 'Volt',
    dark: { accent: '#D4FF3A', protein: '#5EF38C', carbs: '#22D3EE', fat: '#FF8A3D', glow1: '#D4FF3A', glow2: '#5EF38C', button: '#D4FF3A', onButton: '#000000' },
    light: { accent: '#4D7C0F', protein: '#15803D', carbs: '#0E7490', fat: '#EA580C', glow1: '#D4FF3A', glow2: '#5EF38C', button: '#D4FF3A', onButton: '#000000' },
  },
  {
    id: 'ultraviolet',
    name: 'Ultraviolet',
    dark: { accent: '#8B5CF6', protein: '#EC4899', carbs: '#22D3EE', fat: '#FFD60A', glow1: '#8B5CF6', glow2: '#EC4899', button: '#8B5CF6', onButton: '#FFFFFF' },
    light: { accent: '#7C3AED', protein: '#DB2777', carbs: '#0891B2', fat: '#CA8A04', glow1: '#8B5CF6', glow2: '#EC4899', button: '#7C3AED', onButton: '#FFFFFF' },
  },
  {
    id: 'ice',
    name: 'Ice',
    dark: { accent: '#22D3EE', protein: '#A5F3FC', carbs: '#34F5C5', fat: '#C4B5FD', glow1: '#22D3EE', glow2: '#A5F3FC', button: '#22D3EE', onButton: '#000000' },
    light: { accent: '#0E7490', protein: '#0284C7', carbs: '#059669', fat: '#7C3AED', glow1: '#22D3EE', glow2: '#A5F3FC', button: '#0E7490', onButton: '#FFFFFF' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    dark: { accent: '#FF3D7F', protein: '#FF8A3D', carbs: '#FFD23F', fat: '#A78BFA', glow1: '#FF3D7F', glow2: '#FF8A3D', button: '#FF3D7F', onButton: '#FFFFFF' },
    light: { accent: '#E11D63', protein: '#EA580C', carbs: '#CA8A04', fat: '#7C3AED', glow1: '#FF3D7F', glow2: '#FF8A3D', button: '#E11D63', onButton: '#FFFFFF' },
  },
  {
    id: 'emerald',
    name: 'Emerald',
    dark: { accent: '#10E39A', protein: '#14B8A6', carbs: '#C6F432', fat: '#FFB547', glow1: '#10E39A', glow2: '#14B8A6', button: '#10E39A', onButton: '#000000' },
    light: { accent: '#047857', protein: '#0F766E', carbs: '#4D7C0F', fat: '#B45309', glow1: '#10E39A', glow2: '#14B8A6', button: '#047857', onButton: '#FFFFFF' },
  },
  {
    id: 'toxic',
    name: 'Toxic',
    dark: { accent: '#A3FF12', protein: '#8B5CF6', carbs: '#22D3EE', fat: '#FF5FA2', glow1: '#A3FF12', glow2: '#8B5CF6', button: '#A3FF12', onButton: '#000000' },
    light: { accent: '#4D7C0F', protein: '#7C3AED', carbs: '#0E7490', fat: '#DB2777', glow1: '#A3FF12', glow2: '#8B5CF6', button: '#A3FF12', onButton: '#000000' },
  },
  {
    id: 'aqua-coral',
    name: 'Aqua and coral',
    dark: { accent: '#00B2FF', protein: '#FF6B6B', carbs: '#FFD23F', fat: '#A78BFA', glow1: '#00B2FF', glow2: '#FF6B6B', button: '#00B2FF', onButton: '#000000' },
    light: { accent: '#0284C7', protein: '#E5484D', carbs: '#CA8A04', fat: '#7C3AED', glow1: '#00B2FF', glow2: '#FF6B6B', button: '#0284C7', onButton: '#FFFFFF' },
  },
  {
    id: 'black-gold',
    name: 'Black gold',
    dark: { accent: '#F5C451', protein: '#E8913A', carbs: '#FFF1C7', fat: '#A8A29E', glow1: '#F5C451', glow2: '#E8913A', button: '#F5C451', onButton: '#000000' },
    light: { accent: '#A16207', protein: '#C2410C', carbs: '#57534E', fat: '#78716C', glow1: '#F5C451', glow2: '#E8913A', button: '#1C1917', onButton: '#F5C451' },
  },
  {
    id: 'chrome-red',
    name: 'Chrome red',
    dark: { accent: '#FF2D3B', protein: '#D4D4D8', carbs: '#71717A', fat: '#E4E4E7', glow1: '#FF2D3B', glow2: '#D4D4D8', button: '#FF2D3B', onButton: '#FFFFFF' },
    light: { accent: '#DC2626', protein: '#71717A', carbs: '#3F3F46', fat: '#A1A1AA', glow1: '#FF2D3B', glow2: '#D4D4D8', button: '#DC2626', onButton: '#FFFFFF' },
  },
] as const satisfies readonly AppTheme[];

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME_ID: ThemeId = 'electric-blue';

/** Colours shared by every theme. */
const NEUTRALS = {
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    glass: 'rgba(255,255,255,0.08)',
    glassBorder: 'rgba(255,255,255,0.16)',
    fill: 'rgba(255,255,255,0.10)',
    separator: 'rgba(255,255,255,0.12)',
    danger: '#FF5A5F',
  },
  light: {
    background: '#F2F2F7',
    text: '#0A0A0A',
    textSecondary: '#5B5B63',
    textTertiary: '#8E8E93',
    glass: 'rgba(255,255,255,0.62)',
    glassBorder: 'rgba(255,255,255,0.95)',
    fill: 'rgba(10,10,10,0.05)',
    separator: 'rgba(10,10,10,0.08)',
    danger: '#D93036',
  },
} as const;

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function getTheme(id: ThemeId): AppTheme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

/** Combines a theme with the shared neutrals for light or dark mode. */
export function buildColors(id: ThemeId, isDark: boolean): ThemeColors {
  const theme = getTheme(id);
  return isDark
    ? { ...NEUTRALS.dark, ...theme.dark }
    : { ...NEUTRALS.light, ...theme.light };
}

/** Turns "#RRGGBB" into an rgba() colour with the given opacity (0–1). */
export function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
