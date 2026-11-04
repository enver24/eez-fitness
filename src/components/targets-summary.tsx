import { StyleSheet, View } from 'react-native';

import { ActivityRings } from '@/components/ui/activity-rings';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatNumber, kcalToKj } from '@/lib/nutrition';

type TargetsSummaryProps = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

/** Shows daily targets as full rings with the numbers beside them. */
export function TargetsSummary({ calories, proteinG, carbsG, fatG }: TargetsSummaryProps) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <ActivityRings
        size={120}
        strokeWidth={12}
        rings={[
          { progress: 1, color: theme.accent },
          { progress: 1, color: theme.protein },
          { progress: 1, color: theme.carbs },
        ]}
      />
      <View style={styles.numbers}>
        <View>
          <Text variant="label" color="accent">
            Calories
          </Text>
          <Text variant="number">{formatNumber(calories)}</Text>
          <Text variant="caption" color="textSecondary">
            kcal · {formatNumber(kcalToKj(calories))} kJ
          </Text>
        </View>
        <Macro label="Protein" grams={proteinG} color="protein" />
        <Macro label="Carbs" grams={carbsG} color="carbs" />
        <Macro label="Fat" grams={fatG} color="fat" />
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
        {grams} g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  numbers: {
    flex: 1,
    gap: Spacing[2],
  },
  macro: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  bold: {
    fontWeight: '700',
  },
});
