import { StyleSheet, View } from 'react-native';

import { Radius, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressBarProps = {
  /** 0 to 1. */
  progress: number;
  color?: ThemeColor;
  height?: number;
};

export function ProgressBar({ progress, color = 'accent', height = 8 }: ProgressBarProps) {
  const theme = useTheme();
  const percent = `${Math.min(Math.max(progress, 0), 1) * 100}%` as const;
  return (
    <View style={[styles.track, { backgroundColor: theme.track, height }]}>
      <View style={[styles.fill, { backgroundColor: theme[color], width: percent }]} />
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
