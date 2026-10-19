import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Every icon the app uses, with its Apple SF Symbol (iOS) and
 * Google Material Symbol (Android and web) name.
 */
const ICONS = {
  flame: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  palette: { ios: 'paintpalette.fill', android: 'palette', web: 'palette' },
  contrast: { ios: 'circle.lefthalf.filled', android: 'contrast', web: 'contrast' },
  sunrise: { ios: 'sunrise.fill', android: 'wb_twilight', web: 'wb_twilight' },
  sun: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  moon: { ios: 'moon.stars.fill', android: 'dark_mode', web: 'dark_mode' },
  snack: { ios: 'carrot.fill', android: 'nutrition', web: 'nutrition' },
  dumbbell: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' },
  trophy: { ios: 'trophy.fill', android: 'emoji_events', web: 'emoji_events' },
  scale: { ios: 'scalemass.fill', android: 'monitor_weight', web: 'monitor_weight' },
  chart: { ios: 'chart.line.uptrend.xyaxis', android: 'show_chart', web: 'show_chart' },
  target: { ios: 'target', android: 'track_changes', web: 'track_changes' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  leaf: { ios: 'leaf.fill', android: 'eco', web: 'eco' },
  ruler: { ios: 'ruler.fill', android: 'straighten', web: 'straighten' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
  download: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  trash: { ios: 'trash.fill', android: 'delete', web: 'delete' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  logout: {
    ios: 'rectangle.portrait.and.arrow.right',
    android: 'logout',
    web: 'logout',
  },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  checkmark: { ios: 'checkmark', android: 'check', web: 'check' },
} as const satisfies Record<string, SymbolViewProps['name']>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: ThemeColor;
  /** A specific colour, for the rare case it isn't one of the theme's colours. */
  tint?: string;
};

export function Icon({ name, size = 20, color = 'text', tint }: IconProps) {
  const theme = useTheme();
  return <SymbolView name={ICONS[name]} size={size} tintColor={tint ?? theme[color]} />;
}
