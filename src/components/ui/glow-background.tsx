import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useAppearance } from '@/providers/appearance';

/**
 * Two soft blobs of colour behind the screen content. They give the glass
 * cards something colourful to blur, which is what makes glass look like glass.
 */
export function GlowBackground() {
  const { colors, isDark } = useAppearance();
  const { width, height } = useWindowDimensions();
  const strength = isDark ? 0.5 : 0.4;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="glow1" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.glow1} stopOpacity={strength} />
            <Stop offset="1" stopColor={colors.glow1} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glow2" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.glow2} stopOpacity={strength * 0.8} />
            <Stop offset="1" stopColor={colors.glow2} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.1} cy={height * 0.16} r={width * 0.75} fill="url(#glow1)" />
        <Circle cx={width * 0.95} cy={height * 0.62} r={width * 0.65} fill="url(#glow2)" />
      </Svg>
    </View>
  );
}
