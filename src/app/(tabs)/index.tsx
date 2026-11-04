import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActivityRings } from '@/components/ui/activity-rings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Glass } from '@/components/ui/glass';
import { Icon, type IconName } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useWorkouts } from '@/hooks/use-workouts';
import { formatWorkoutDate, workoutVolume } from '@/lib/workouts';
import { useCheckIns } from '@/hooks/use-check-ins';
import { weightSeries } from '@/lib/check-ins';
import { useDayEntries } from '@/hooks/use-diary';
import { useTargets } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { localDate, sumNutrition, type MealType } from '@/lib/diary';
import { formatNumber, kcalToKj } from '@/lib/nutrition';

const MEALS: { type: MealType; label: string; icon: IconName }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { type: 'lunch', label: 'Lunch', icon: 'sun' },
  { type: 'dinner', label: 'Dinner', icon: 'moon' },
  { type: 'snack', label: 'Snacks', icon: 'snack' },
];

export default function TodayScreen() {
  const theme = useTheme();
  const targets = useTargets();
  const entries = useDayEntries(localDate()).data ?? [];
  const eaten = sumNutrition(entries);
  const remaining = Math.max(targets.calories - eaten.calories, 0);
  const lastWorkout = useWorkouts().data?.[0];
  const weights = weightSeries(useCheckIns().data ?? []);
  const currentWeight = weights.at(-1)?.weightKg;
  const weightChange = currentWeight !== undefined ? currentWeight - weights[0].weightKg : 0;
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <Screen eyebrow={today} title="Today">
      {/* Fuel: calories and macros as rings */}
      <Card style={styles.fuelCard}>
        <ActivityRings
          size={148}
          strokeWidth={15}
          rings={[
            { progress: eaten.calories / targets.calories, color: theme.accent },
            { progress: eaten.protein / targets.protein, color: theme.protein },
            { progress: eaten.carbs / targets.carbs, color: theme.carbs },
          ]}
        />
        <View style={styles.legend}>
          <View>
            <Text variant="label" color="accent">
              Fuel left
            </Text>
            <Text variant="number">{formatNumber(Math.round(remaining))}</Text>
            <Text variant="caption" color="textSecondary">
              kcal · {formatNumber(kcalToKj(remaining))} kJ
            </Text>
          </View>
          <MacroLine label="Protein" color="protein" eaten={eaten.protein} target={targets.protein} />
          <MacroLine label="Carbs" color="carbs" eaten={eaten.carbs} target={targets.carbs} />
          <MacroLine label="Fat" color="fat" eaten={eaten.fat} target={targets.fat} />
        </View>
      </Card>

      <Button title="Scan meal" icon="camera" onPress={() => router.push('/log/scan')} />

      <View style={styles.row}>
        <QuickAction icon="search" label="Add food" onPress={() => router.push('/log')} />
        <QuickAction icon="scale" label="Weigh in" onPress={() => router.push('/progress/check-in')} />
      </View>

      {/* Training and body stats */}
      <View style={styles.row}>
        <StatTile
          label="Last session"
          title={lastWorkout ? lastWorkout.name : 'None yet'}
          detail={
            lastWorkout
              ? `${formatWorkoutDate(lastWorkout.performedOn)} · ${(workoutVolume(lastWorkout.sets) / 1000).toFixed(1)} t`
              : 'Tap to start one'
          }
          detailColor="carbs"
          onPress={() => router.push(lastWorkout ? '/workouts' : '/workouts/session')}
        />
        <StatTile
          label="Weight"
          title={currentWeight !== undefined ? `${currentWeight.toFixed(1)} kg` : '–'}
          detail={
            weights.length > 1
              ? `${weightChange > 0 ? '+' : weightChange < 0 ? '−' : ''}${Math.abs(weightChange).toFixed(1)} kg total`
              : 'Tap to weigh in'
          }
          detailColor="protein"
          numeric
          onPress={() => router.push('/progress')}
        />
      </View>

      {/* Meals */}
      <SectionHeader title="Meals" />
      <Card flush>
        {MEALS.map((meal, index) => {
          const foods = entries.filter((entry) => entry.meal === meal.type);
          const total = Math.round(sumNutrition(foods).calories);
          return (
            <ListRow
              key={meal.type}
              icon={meal.icon}
              title={meal.label}
              subtitle={foods.length ? foods.map((f) => f.name).join(', ') : 'Nothing logged yet'}
              value={total ? `${formatNumber(total)} kcal` : undefined}
              onPress={() => router.push({ pathname: '/log', params: { meal: meal.type } })}
              divider={index < MEALS.length - 1}
            />
          );
        })}
      </Card>
    </Screen>
  );
}

function MacroLine({
  label,
  color,
  eaten,
  target,
}: {
  label: string;
  color: ThemeColor;
  eaten: number;
  target: number;
}) {
  return (
    <View style={styles.macroLine}>
      <Text variant="label" color={color}>
        {label}
      </Text>
      <Text variant="caption" rounded style={styles.macroValue}>
        {Math.round(eaten)}/{target} g
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
      <Glass radius={Radius.pill} style={styles.quickAction}>
        <Icon name={icon} size={16} color="accent" />
        <Text variant="callout" style={styles.quickLabel}>
          {label}
        </Text>
      </Glass>
    </Pressable>
  );
}

function StatTile({
  label,
  title,
  detail,
  detailColor,
  numeric,
  onPress,
}: {
  label: string;
  title: string;
  detail: string;
  detailColor: ThemeColor;
  numeric?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.flex, pressed && styles.pressed]}>
      <Card style={styles.statTile}>
        <Text variant="label" color="textSecondary">
          {label}
        </Text>
        <Text variant={numeric ? 'title' : 'heading'} rounded={numeric}>
          {title}
        </Text>
        <Text variant="caption" color={detailColor} rounded style={styles.macroValue}>
          {detail}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fuelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    padding: Spacing[5],
  },
  legend: {
    flex: 1,
    gap: Spacing[2],
  },
  macroLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  macroValue: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    minHeight: 46,
  },
  quickLabel: {
    fontWeight: '700',
  },
  statTile: {
    gap: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
