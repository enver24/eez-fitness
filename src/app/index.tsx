import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import {
  sampleMeals,
  sampleTargets,
  sampleUser,
  sampleWorkouts,
  type MealType,
} from '@/data/sample';
import { useTheme } from '@/hooks/use-theme';
import { comingSoon } from '@/lib/coming-soon';
import { formatNumber, kcalToKj, sumMacros } from '@/lib/nutrition';

const MEALS: { type: MealType; label: string; icon: IconName }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: 'sunrise' },
  { type: 'lunch', label: 'Lunch', icon: 'sun' },
  { type: 'dinner', label: 'Dinner', icon: 'moon' },
  { type: 'snack', label: 'Snacks', icon: 'snack' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const eaten = sumMacros(Object.values(sampleMeals).flat());
  const remaining = Math.max(sampleTargets.calories - eaten.calories, 0);
  const today = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen eyebrow={today} title={`${greeting()}, ${sampleUser.firstName}`}>
      {/* Calories and macros */}
      <Card>
        <View style={styles.calorieRow}>
          <ProgressRing progress={eaten.calories / sampleTargets.calories} size={150}>
            <Text variant="title" rounded>
              {formatNumber(remaining)}
            </Text>
            <Text variant="caption" color="textSecondary">
              kcal left
            </Text>
          </ProgressRing>
          <View style={styles.calorieStats}>
            <Stat label="Eaten" value={formatNumber(eaten.calories)} unit="kcal" />
            <Stat label="Target" value={formatNumber(sampleTargets.calories)} unit="kcal" />
            <Text variant="caption" color="textTertiary">
              {formatNumber(kcalToKj(eaten.calories))} kJ eaten
            </Text>
          </View>
        </View>
        <View style={styles.macros}>
          <Macro label="Protein" color="protein" eaten={eaten.protein} target={sampleTargets.protein} />
          <Macro label="Carbs" color="carbs" eaten={eaten.carbs} target={sampleTargets.carbs} />
          <Macro label="Fat" color="fat" eaten={eaten.fat} target={sampleTargets.fat} />
        </View>
      </Card>

      {/* Quick actions */}
      <View style={styles.actions}>
        <QuickAction icon="camera" label="Scan meal" highlight onPress={() => comingSoon('AI food scanner', 6)} />
        <QuickAction icon="search" label="Add food" onPress={() => comingSoon('Food search', 5)} />
        <QuickAction icon="scale" label="Weigh in" onPress={() => comingSoon('Weight tracking', 7)} />
      </View>

      {/* Meals */}
      <SectionHeader title="Meals" />
      <Card flush>
        {MEALS.map((meal, index) => {
          const foods = sampleMeals[meal.type];
          const total = sumMacros(foods).calories;
          return (
            <ListRow
              key={meal.type}
              icon={meal.icon}
              title={meal.label}
              subtitle={foods.length ? foods.map((f) => f.name).join(', ') : 'Nothing logged yet'}
              value={total ? `${formatNumber(total)} kcal` : undefined}
              onPress={() => comingSoon(`Log ${meal.label.toLowerCase()}`, 5)}
              divider={index < MEALS.length - 1}
            />
          );
        })}
      </Card>

      {/* Training */}
      <SectionHeader title="Training" />
      <Card flush>
        <ListRow
          icon="dumbbell"
          iconColor="accent"
          title={`Last: ${sampleWorkouts[0].name}`}
          subtitle={`${sampleWorkouts[0].date} · ${sampleWorkouts[0].durationMin} min · ${sampleWorkouts[0].exercises} exercises`}
          onPress={() => comingSoon('Workout logging', 8)}
        />
      </Card>
    </Screen>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <View>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <Text variant="headline" rounded>
        {value}{' '}
        <Text variant="caption" color="textSecondary">
          {unit}
        </Text>
      </Text>
    </View>
  );
}

function Macro({
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
    <View style={styles.macro}>
      <Text variant="caption" color="textSecondary">
        {label}
      </Text>
      <ProgressBar progress={eaten / target} color={color} height={6} />
      <Text variant="callout" rounded>
        {eaten}
        <Text variant="caption" color="textTertiary">
          {' '}/ {target} g
        </Text>
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  highlight,
  onPress,
}: {
  icon: IconName;
  label: string;
  highlight?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.action,
        {
          backgroundColor: highlight ? theme.text : theme.surface,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size={20} color={highlight ? 'textInverse' : 'text'} />
      <Text variant="callout" color={highlight ? 'textInverse' : 'text'} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[5],
  },
  calorieStats: {
    flex: 1,
    gap: Spacing[3],
  },
  macros: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  macro: {
    flex: 1,
    gap: Spacing[2],
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionLabel: {
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
