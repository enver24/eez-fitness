import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { withAlpha } from '@/constants/themes';
import { useAppearance } from '@/providers/appearance';

export type Ring = {
  /** 0 to 1. Values above 1 show a full ring. */
  progress: number;
  color: string;
};

type ActivityRingsProps = {
  /** Outermost ring first. */
  rings: Ring[];
  size?: number;
  strokeWidth?: number;
  gap?: number;
  /** Content shown in the middle (only fits when there's one ring). */
  children?: ReactNode;
};

/** Apple Fitness–style concentric progress rings. */
export function ActivityRings({
  rings,
  size = 140,
  strokeWidth = 14,
  gap = 3,
  children,
}: ActivityRingsProps) {
  const { isDark } = useAppearance();
  const center = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        {rings.map((ring, index) => {
          const radius = center - strokeWidth / 2 - index * (strokeWidth + gap);
          const circumference = 2 * Math.PI * radius;
          const progress = Math.min(Math.max(ring.progress, 0), 1);
          return (
            <G key={index}>
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={withAlpha(ring.color, isDark ? 0.22 : 0.16)}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - progress)}
                // Start at 12 o'clock instead of 3 o'clock.
                transform={`rotate(-90 ${center} ${center})`}
              />
            </G>
          );
        })}
      </Svg>
      {children && <View style={styles.center}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
