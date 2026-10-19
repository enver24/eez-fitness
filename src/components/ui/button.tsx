import { Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
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

  const background = {
    primary: theme.text,
    secondary: theme.surfaceMuted,
    destructive: theme.surfaceMuted,
  }[variant];
  const foreground: ThemeColor = {
    primary: 'textInverse' as const,
    secondary: 'text' as const,
    destructive: 'danger' as const,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: background },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...rest}>
      <View style={styles.content}>
        {icon && <Icon name={icon} size={size === 'lg' ? 18 : 15} color={foreground} />}
        <Text variant={size === 'lg' ? 'bodyStrong' : 'callout'} color={foreground}>
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
    minHeight: 54,
    paddingHorizontal: Spacing[6],
  },
  md: {
    minHeight: 40,
    paddingHorizontal: Spacing[4],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});
