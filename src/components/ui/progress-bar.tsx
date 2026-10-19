import { StyleSheet, View } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { withAlpha } from '@/constants/themes';
import { useAppearance } from '@/providers/appearance';

type ProgressBarProps = {
  /** 0 to 1. */
  progress: number;
  color?: ThemeColor;
  height?: number;
};

export function ProgressBar({ progress, color = 'accent', height = 8 }: ProgressBarProps) {
  const { colors, isDark } = useAppearance();
  const percent = `${Math.min(Math.max(progress, 0), 1) * 100}%` as const;
  return (
    <View
      style={[
        styles.track,
        { backgroundColor: withAlpha(colors[color], isDark ? 0.22 : 0.16), height },
      ]}>
      <View style={[styles.fill, { backgroundColor: colors[color], width: percent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
});
