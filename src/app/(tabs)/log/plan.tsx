import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice';
import { ListRow } from '@/components/ui/list-row';
import { Notice } from '@/components/ui/notice';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { INGREDIENTS, MEALS } from '@/data/meal-library';
import { useFavourites, usePlannedMeals, useReplacePlan } from '@/hooks/use-meal-plan';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { useTheme } from '@/hooks/use-theme';
import { MEALS as MEAL_SLOTS, sumNutrition } from '@/lib/diary';
import {
  MEAL_ORDER,
  formatServings,
  generatePlan,
  mealNutrition,
  type Budget,
} from '@/lib/meal-planner';
import { upcomingDates } from '@/lib/meal-plan-store';
import { formatNumber } from '@/lib/nutrition';

const BUDGETS: { value: Budget; label: string }[] = [
  { value: 'low', label: 'Budget' },
  { value: 'medium', label: 'Mid-range' },
  { value: 'any', label: 'Any' },
];

const mealById = new Map(MEALS.map((meal) => [meal.id, meal]));

function dayLabel(date: string, index: number) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tmrw';
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'short' });
}

/** The meal plan for the next 7 days. */
export default function MealPlanScreen() {
  const theme = useTheme();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const dates = upcomingDates(7);
  const plan = usePlannedMeals(dates[0], dates[6]);
  const favourites = useFavourites().data ?? [];
  const replacePlan = useReplacePlan();
  const [selected, setSelected] = useState(dates[0]);
  const [error, setError] = useState<string>();

  if (!profile) return null;
  const calorieTarget = profile.calorie_target ?? 2000;
  const budget = profile.meal_budget ?? 'any';
  const slots = plan.data ?? [];
  const daySlots = MEAL_ORDER.map((meal) => slots.find((s) => s.date === selected && s.meal === meal));
  const dayTotal = sumNutrition(
    daySlots.flatMap((slot) => {
      const meal = slot && mealById.get(slot.mealId);
      return meal ? [mealNutrition(meal, slot.servings)] : [];
    }),
  );
  const hasPlan = slots.length > 0;

  function makePlan(days: string[]) {
    setError(undefined);
    const generated = generatePlan({
      dates: days,
      calorieTarget,
      library: MEALS,
      ingredients: INGREDIENTS,
      prefs: {
        dietaryPreferences: profile!.dietary_preferences,
        allergies: profile!.allergies,
        budget,
        favourites,
      },
    });
    if (generated.length === 0) {
      setError('No meals match all your diet, allergy and budget settings. Try a wider budget.');
      return;
    }
    replacePlan.mutate(
      { dates: days, slots: generated },
      { onError: () => setError('Couldn’t save the plan. Check your connection and try again.') },
    );
  }

  function confirmPlan(days: string[], label: string) {
    const existing = slots.some((s) => days.includes(s.date));
    if (!existing || Platform.OS === 'web') return makePlan(days);
    Alert.alert(`Replace ${label}?`, 'Your current plan for these days will be replaced.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Replace', onPress: () => makePlan(days) },
    ]);
  }

  const restrictions = [...profile.dietary_preferences, ...profile.allergies.map((a) => `no ${a.toLowerCase()}`)];

  return (
    <Screen title="Meal plan" showBack>
      <Card>
        <Text variant="callout" color="textSecondary">
          Planned around {formatNumber(calorieTarget)} kcal a day
          {restrictions.length ? ` · ${restrictions.join(', ')}` : ''}. Change these in Profile.
        </Text>
        <Text variant="label" color="textSecondary">
          Food budget
        </Text>
        <ChoiceChips
          options={BUDGETS}
          selected={[budget]}
          onChange={([value]) => updateProfile.mutate({ meal_budget: value })}
        />
        <View style={styles.row}>
          <View style={styles.flex}>
            <Button
              title={replacePlan.isPending ? 'Planning…' : hasPlan ? 'Re-plan week' : 'Plan my week'}
              icon="sparkles"
              size="md"
              onPress={() => confirmPlan(dates, 'this week’s plan')}
              disabled={replacePlan.isPending}
            />
          </View>
          <View style={styles.flex}>
            <Button
              title="Plan today"
              size="md"
              variant="secondary"
              onPress={() => confirmPlan([selected], 'this day’s plan')}
              disabled={replacePlan.isPending}
            />
          </View>
        </View>
      </Card>
      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}

      {/* Day picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {dates.map((date, index) => {
          const isSelected = date === selected;
          const planned = slots.some((s) => s.date === date);
          return (
            <Pressable
              key={date}
              onPress={() => setSelected(date)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              style={[styles.day, { backgroundColor: isSelected ? theme.button : theme.fill }]}>
              <Text variant="caption" color={isSelected ? 'onButton' : 'textSecondary'} style={styles.bold}>
                {dayLabel(date, index)}
              </Text>
              <Text variant="bodyStrong" color={isSelected ? 'onButton' : 'text'} rounded>
                {Number(date.slice(8))}
              </Text>
              <View style={[styles.dot, { backgroundColor: planned ? (isSelected ? theme.onButton : theme.accent) : 'transparent' }]} />
            </Pressable>
          );
        })}
      </ScrollView>

      {daySlots.some(Boolean) ? (
        <>
          <Card>
            <View style={styles.totalRow}>
              <Text variant="label" color="textSecondary">
                Day total
              </Text>
              <Text variant="callout" rounded style={styles.bold}>
                {formatNumber(Math.round(dayTotal.calories))} / {formatNumber(calorieTarget)} kcal
              </Text>
            </View>
            <ProgressBar progress={dayTotal.calories / calorieTarget} />
            <Text variant="caption" color="textSecondary">
              Protein {Math.round(dayTotal.protein)} g · Carbs {Math.round(dayTotal.carbs)} g · Fat {Math.round(dayTotal.fat)} g
            </Text>
          </Card>
          <Card flush>
            {MEAL_ORDER.map((mealType, index) => {
              const slot = daySlots[index];
              const meal = slot && mealById.get(slot.mealId);
              const label = MEAL_SLOTS.find((m) => m.value === mealType)!.label;
              return (
                <ListRow
                  key={mealType}
                  title={meal ? meal.name : `No ${label.toLowerCase()} planned`}
                  subtitle={
                    meal
                      ? `${label} · ${formatServings(slot.servings)} serving${slot.servings === 1 ? '' : 's'}${favourites.includes(meal.id) ? ' · ★' : ''}`
                      : label
                  }
                  value={meal ? `${formatNumber(Math.round(mealNutrition(meal, slot.servings).calories))} kcal` : undefined}
                  onPress={slot ? () => router.push({ pathname: '/log/plan-meal', params: { id: slot.id } }) : undefined}
                  divider={index < MEAL_ORDER.length - 1}
                />
              );
            })}
          </Card>
        </>
      ) : (
        <Text variant="callout" color="textSecondary">
          Nothing planned for this day yet. Tap “Plan my week” or “Plan today”.
        </Text>
      )}

      {hasPlan && (
        <>
          <SectionHeader title="Shopping" />
          <Button
            title="Shopping list for the week"
            icon="checkmark"
            variant="secondary"
            onPress={() => router.push('/log/shopping-list')}
          />
        </>
      )}

      <Notice>
        Meal nutrition is calculated from the Australian Food Composition Database, but real
        ingredients vary. Meals with your listed allergens are left out, yet always check labels
        yourself. Halal and kosher plans leave out pork (and shellfish for kosher), but check
        that meat is certified.
      </Notice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
  days: {
    gap: Spacing[2],
  },
  day: {
    width: 56,
    alignItems: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.md,
    gap: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  bold: {
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
});
