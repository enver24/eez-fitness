import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: ThemeColor;
  /** Text on the right, e.g. "420 kcal". */
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  /** Draw a divider line under the row. */
  divider?: boolean;
};

/** One row in a list, used inside a flush <Card>. */
export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = 'text',
  value,
  onPress,
  destructive,
  divider,
}: ListRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [pressed && { backgroundColor: theme.surfaceMuted }]}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconBadge, { backgroundColor: theme.surfaceMuted }]}>
            <Icon name={icon} size={17} color={destructive ? 'danger' : iconColor} />
          </View>
        )}
        <View style={styles.text}>
          <Text variant="bodyStrong" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {value && (
          <Text variant="callout" color="textSecondary" rounded>
            {value}
          </Text>
        )}
        {onPress && !destructive && <Icon name="chevronRight" size={13} color="textTertiary" />}
      </View>
      {divider && (
        <View
          style={[
            styles.divider,
            { backgroundColor: theme.border, marginLeft: icon ? 68 : Spacing[5] },
          ]}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    minHeight: 60,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
