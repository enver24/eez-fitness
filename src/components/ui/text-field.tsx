import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown in red under the field. */
  error?: string;
};

/** A labelled text box on glass. */
export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <Text variant="label" color="textSecondary">
        {label}
      </Text>
      <Glass
        radius={Radius.md}
        style={[styles.box, error ? { borderColor: theme.danger, borderWidth: 1 } : null]}>
        <TextInput
          placeholderTextColor={theme.textTertiary}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
      </Glass>
      {error && (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing[2],
  },
  box: {
    minHeight: 52,
    justifyContent: 'center',
  },
  input: {
    ...Type.body,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    // Keeps the text above the glass blur layer in web browsers.
    position: 'relative',
  },
});
