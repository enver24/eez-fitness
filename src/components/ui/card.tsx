import { StyleSheet, type ViewProps } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Spacing } from '@/constants/theme';

type CardProps = ViewProps & {
  /** Remove the inner padding, e.g. for cards that contain a list. */
  flush?: boolean;
};

/** A glass panel that groups related content. */
export function Card({ flush, style, ...rest }: CardProps) {
  return <Glass style={[flush ? styles.flush : styles.padded, style]} {...rest} />;
}

const styles = StyleSheet.create({
  padded: {
    padding: Spacing[4],
    gap: Spacing[3],
  },
  flush: {},
});
