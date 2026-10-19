import { StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardProps = ViewProps & {
  /** Remove the inner padding, e.g. for cards that contain a list. */
  flush?: boolean;
};

/** A rounded white (or dark grey) panel that groups related content. */
export function Card({ flush, style, ...rest }: CardProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        flush && styles.flush,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    padding: Spacing[5],
    gap: Spacing[4],
  },
  flush: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
});
