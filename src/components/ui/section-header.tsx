import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text variant="heading">{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}>
          <Text variant="callout" color="accent" style={styles.action}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing[4],
  },
  action: {
    fontWeight: '700',
  },
});
