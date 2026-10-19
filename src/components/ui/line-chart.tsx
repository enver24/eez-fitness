import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LineChartProps = {
  values: number[];
  height?: number;
  color?: ThemeColor;
  /** Draws a dashed horizontal line, e.g. a goal weight. */
  goal?: number;
};

/** A simple, smooth line chart that fills the width of its container. */
export function LineChart({ values, height = 140, color = 'accent', goal }: LineChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const pad = 6;

  const all = goal === undefined ? values : [...values, goal];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = max - min || 1;

  const x = (i: number) => pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2);
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);

  const points = values.map((v, i) => ({ x: x(i), y: y(v) }));
  // Smooth the line with simple cubic curves between points.
  const line = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const midX = (prev.x + p.x) / 2;
      return `C ${midX} ${prev.y} ${midX} ${p.y} ${p.x} ${p.y}`;
    })
    .join(' ');
  const last = points[points.length - 1];
  const area = last ? `${line} L ${last.x} ${height} L ${points[0].x} ${height} Z` : '';

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && last && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme[color]} stopOpacity={0.25} />
              <Stop offset="1" stopColor={theme[color]} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {goal !== undefined && (
            <Line
              x1={pad}
              x2={width - pad}
              y1={y(goal)}
              y2={y(goal)}
              stroke={theme.textTertiary}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          <Path d={area} fill="url(#fill)" />
          <Path d={line} stroke={theme[color]} strokeWidth={2.5} fill="none" strokeLinecap="round" />
          <Circle cx={last.x} cy={last.y} r={5} fill={theme[color]} stroke={theme.surface} strokeWidth={2} />
        </Svg>
      )}
    </View>
  );
}
