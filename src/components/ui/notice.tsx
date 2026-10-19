import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A small grey information box, used for disclaimers and tips. */
export function Notice({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.surfaceMuted }]}>
      <Icon name="info" size={15} color="textSecondary" />
      <Text variant="caption" color="textSecondary" style={styles.text}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
    padding: Spacing[3],
    borderRadius: Radius.md,
    borderCurve: 'continuous',
  },
  text: {
    flex: 1,
  },
});
