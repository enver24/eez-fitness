import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Type, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  /**
   * primary: the one big action on a screen, in the theme colour.
   * secondary: a quieter action.
   * destructive: deletes something.
   */
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: IconName;
  size?: 'md' | 'lg';
};

export function Button({
  title,
  variant = 'primary',
  icon,
  size = 'lg',
  disabled,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isPrimary = variant === 'primary';
  const foreground: ThemeColor = isPrimary
    ? 'onButton'
    : variant === 'destructive'
      ? 'danger'
      : 'text';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: isPrimary ? theme.button : theme.fill },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}>
      <View style={styles.content}>
        {icon && <Icon name={icon} size={size === 'lg' ? 18 : 15} color={foreground} />}
        <Text
          variant={size === 'lg' ? 'bodyStrong' : 'callout'}
          color={foreground}
          style={isPrimary ? styles.primaryLabel : styles.label}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lg: {
    minHeight: 56,
    paddingHorizontal: Spacing[6],
  },
  md: {
    minHeight: 42,
    paddingHorizontal: Spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  primaryLabel: {
    fontWeight: Type.heading.fontWeight,
    fontStyle: Type.heading.fontStyle,
    textTransform: Type.heading.textTransform,
    letterSpacing: 0.2,
  },
  label: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
