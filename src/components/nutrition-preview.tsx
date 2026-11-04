import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import type { Nutrition } from '@/lib/food';
import { formatNumber, kcalToKj } from '@/lib/nutrition';

/** Calories and macros for the amount being logged. */
export function NutritionPreview({ nutrition }: { nutrition: Nutrition }) {
  return (
    <Card style={styles.card}>
      <View style={styles.calories}>
        <Text variant="label" color="accent">
          Calories
        </Text>
        <Text variant="number">{formatNumber(Math.round(nutrition.calories))}</Text>
        <Text variant="caption" color="textSecondary">
          kcal · {formatNumber(kcalToKj(nutrition.calories))} kJ
        </Text>
      </View>
      <View style={styles.macros}>
        <Macro label="Protein" grams={nutrition.protein} color="protein" />
        <Macro label="Carbs" grams={nutrition.carbs} color="carbs" />
        <Macro label="Fat" grams={nutrition.fat} color="fat" />
      </View>
    </Card>
  );
}

function Macro({ label, grams, color }: { label: string; grams: number; color: ThemeColor }) {
  return (
    <View style={styles.macro}>
      <Text variant="label" color={color}>
        {label}
      </Text>
      <Text variant="callout" rounded style={styles.bold}>
        {Math.round(grams * 10) / 10} g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[5],
  },
  calories: {
    flex: 1,
  },
  macros: {
    flex: 1,
    gap: Spacing[2],
  },
  macro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bold: {
    fontWeight: '700',
  },
});
