import { Pressable, StyleSheet } from 'react-native';

import { Glass } from '@/components/ui/glass';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MEALS, type MealType } from '@/lib/diary';

/** Breakfast / Lunch / Dinner / Snacks segmented control. */
export function MealPicker({ value, onChange }: { value: MealType; onChange: (meal: MealType) => void }) {
  const theme = useTheme();
  return (
    <Glass radius={Radius.md} style={styles.segmented}>
      {MEALS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: theme.button }]}>
            <Text variant="caption" color={selected ? 'onButton' : 'textSecondary'} style={styles.label}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </Glass>
  );
}

/** A sensible default meal for the time of day. */
export function mealForNow(date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 15) return 'lunch';
  if (hour >= 17 && hour < 22) return 'dinner';
  return 'snack';
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    padding: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    borderCurve: 'continuous',
  },
  label: {
    fontWeight: '700',
  },
});
