import { Pressable, StyleSheet, View } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Option<T extends string> = { value: T; label: string; description?: string };

/** Small pill buttons. Use `multiple` to allow several choices. */
export function ChoiceChips<T extends string>({
  options,
  selected,
  onChange,
  multiple,
}: {
  options: Option<T>[] | readonly T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  multiple?: boolean;
}) {
  const theme = useTheme();
  const normalised: Option<T>[] = options.map((o) =>
    typeof o === 'string' ? { value: o as T, label: o as string } : (o as Option<T>),
  );

  function toggle(value: T) {
    if (!multiple) return onChange([value]);
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <View style={styles.chips}>
      {normalised.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole={multiple ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: isSelected }}
            style={({ pressed }) => [
              styles.chip,
              { backgroundColor: isSelected ? theme.button : theme.fill },
              pressed && styles.pressed,
            ]}>
            <Text variant="callout" color={isSelected ? 'onButton' : 'text'} style={styles.chipLabel}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Large glass cards with a title and description, for single choices. */
export function ChoiceCards<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: Option<T>[];
  selected: T | null;
  onChange: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.cards}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            style={({ pressed }) => pressed && styles.pressed}>
            <Glass
              radius={Radius.md}
              style={[styles.card, isSelected && { borderColor: theme.accent, borderWidth: 2 }]}>
              <View style={styles.cardText}>
                <Text variant="bodyStrong">{option.label}</Text>
                {option.description && (
                  <Text variant="caption" color="textSecondary">
                    {option.description}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.radio,
                  isSelected
                    ? { backgroundColor: theme.button, borderColor: theme.button }
                    : { borderColor: theme.textTertiary },
                ]}>
                {isSelected && <Icon name="checkmark" size={12} color="onButton" />}
              </View>
            </Glass>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  chip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.pill,
  },
  chipLabel: {
    fontWeight: '700',
  },
  cards: {
    gap: Spacing[2],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    padding: Spacing[4],
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
