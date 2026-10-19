import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label, usually a <Text>. */
  children: ReactNode;
};

export function Checkbox({ checked, onChange, children }: CheckboxProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.row}>
      <View
        style={[
          styles.box,
          checked
            ? { backgroundColor: theme.button, borderColor: theme.button }
            : { borderColor: theme.textTertiary },
        ]}>
        {checked && <Icon name="checkmark" size={13} color="onButton" />}
      </View>
      <View style={styles.label}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  label: {
    flex: 1,
  },
});
