import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius } from '@/constants/theme';
import { useAppearance } from '@/providers/appearance';

// Apple's Liquid Glass needs iOS 26 or later. Check once when the app starts.
const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

type GlassProps = ViewProps & {
  radius?: number;
};

/**
 * A see-through glass panel.
 * - iPhone on iOS 26+: Apple's real Liquid Glass.
 * - Older iPhones and web: a frosted blur.
 * - Android: a soft translucent fill (blur is slow on many Android phones).
 */
export function Glass({ radius = Radius.lg, style, children, ...rest }: GlassProps) {
  const { colors, isDark } = useAppearance();
  const shape = { borderRadius: radius, borderCurve: 'continuous' as const };

  if (liquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={[shape, styles.clip, style]}
        {...rest}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[shape, styles.clip, styles.border, { borderColor: colors.glassBorder }, style]}
      {...rest}>
      {Platform.OS !== 'android' && (
        <BlurView
          intensity={40}
          tint={isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  border: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
