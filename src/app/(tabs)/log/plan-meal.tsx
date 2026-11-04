import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NutritionPreview } from '@/components/nutrition-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Glass } from '@/components/ui/glass';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Text } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { INGREDIENTS, MEALS } from '@/data/meal-library';
import { useAddEntry } from '@/hooks/use-diary';
import {
  useDeletePlannedMeal,
  useFavourites,
  usePlannedMeals,
  useSetFavourite,
  useUpdatePlannedMeal,
} from '@/hooks/use-meal-plan';
import { useProfile } from '@/hooks/use-profile';
import { MEALS as MEAL_SLOTS, localDate } from '@/lib/diary';
import { MEAL_SHARES, formatGrams, formatServings, mealNutrition, pickMeal, servingsFor } from '@/lib/meal-planner';
import { upcomingDates, type PlannedMeal } from '@/lib/meal-plan-store';

const ALLERGEN_LABELS: Record<string, string> = {
  peanuts: 'peanuts',
  tree_nuts: 'tree nuts',
  milk: 'milk',
  eggs: 'eggs',
  gluten: 'gluten',
  soy: 'soy',
  fish: 'fish',
  shellfish: 'shellfish',
  sesame: 'sesame',
};

const COST_LABELS = ['', 'Budget', 'Mid-range', 'Premium'];

/** One planned meal: recipe, servings, swap, favourite and log. /log/plan-meal?id=<planned id> */
export default function PlanMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dates = upcomingDates(7);
  const slot = (usePlannedMeals(dates[0], dates[6]).data ?? []).find((s) => s.id === id);
  if (!slot) return null;
  return <PlanMealDetail key={`${slot.id}-${slot.mealId}`} slot={slot} />;
}

function PlanMealDetail({ slot }: { slot: PlannedMeal }) {
  const { data: profile } = useProfile();
  const favourites = useFavourites().data ?? [];
  const setFavourite = useSetFavourite();
  const updateSlot = useUpdatePlannedMeal();
  const deleteSlot = useDeletePlannedMeal();
  const addEntry = useAddEntry();
  const [servings, setServings] = useState(slot.servings);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const meal = MEALS.find((m) => m.id === slot.mealId);
  if (!meal || !profile) return null;
  const isFavourite = favourites.includes(meal.id);
  const nutrition = mealNutrition(meal, servings);
  const slotLabel = MEAL_SLOTS.find((m) => m.value === slot.meal)!.label;

  function changeServings(next: number) {
    const value = Math.min(Math.max(next, 0.25), 4);
    setServings(value);
    updateSlot.mutate({ id: slot.id, servings: value });
  }

  function swap() {
    setError(undefined);
    const target = (profile!.calorie_target ?? 2000) * MEAL_SHARES[slot.meal];
    const replacement = pickMeal(
      slot.meal,
      target,
      MEALS,
      INGREDIENTS,
      {
        dietaryPreferences: profile!.dietary_preferences,
        allergies: profile!.allergies,
        budget: profile!.meal_budget ?? 'any',
        favourites,
      },
      new Set([meal!.id]),
      Math.random,
      meal!.id,
    );
    if (!replacement) {
      setError('No other meals match your settings for this slot.');
      return;
    }
    updateSlot.mutate({ id: slot.id, mealId: replacement.id, servings: servingsFor(replacement, target) });
  }

  function logToDiary() {
    setError(undefined);
    const grams = meal!.ingredients.reduce((sum, item) => sum + item.grams, 0) * servings;
    addEntry.mutate(
      {
        eatenOn: localDate(),
        meal: slot.meal,
        name: meal!.name,
        brand: null,
        source: 'plan',
        sourceId: meal!.id,
        amountG: Math.round(grams),
        amountLabel: `${formatServings(servings)} serving${servings === 1 ? '' : 's'}`,
        ...nutrition,
      },
      {
        onSuccess: () => setMessage(`Added to today’s ${slotLabel.toLowerCase()}.`),
        onError: () => setError('Couldn’t add it to your diary. Check your connection.'),
      },
    );
  }

  return (
    <Screen eyebrow={`${slotLabel} · ${new Date(`${slot.date}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}`} title={meal.name} showBack>
      <View style={styles.tags}>
        <Text variant="caption" color="textSecondary">
          {meal.minutes} min · {COST_LABELS[meal.cost]}
        </Text>
        <Pressable
          onPress={() => setFavourite.mutate({ mealId: meal.id, favourite: !isFavourite })}
          accessibilityRole="button"
          accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
          hitSlop={8}
          style={styles.favourite}>
          <Icon name={isFavourite ? 'starFilled' : 'star'} size={18} color={isFavourite ? 'fat' : 'textTertiary'} />
          <Text variant="caption" color="textSecondary">
            {isFavourite ? 'Favourite' : 'Add to favourites'}
          </Text>
        </Pressable>
      </View>

      <NutritionPreview nutrition={nutrition} />

      <Glass radius={Radius.md} style={styles.stepper}>
        <Text variant="label" color="textSecondary" style={styles.flex}>
          Servings
        </Text>
        <Pressable onPress={() => changeServings(servings - 0.25)} accessibilityRole="button" accessibilityLabel="Fewer servings" hitSlop={8}>
          <Icon name="minus" size={22} color="accent" />
        </Pressable>
        <Text variant="title" rounded style={styles.servings}>
          {formatServings(servings)}
        </Text>
        <Pressable onPress={() => changeServings(servings + 0.25)} accessibilityRole="button" accessibilityLabel="More servings" hitSlop={8}>
          <Icon name="plusCircle" size={22} color="accent" />
        </Pressable>
      </Glass>

      {meal.allergens.length > 0 && (
        <Text variant="caption" color="textSecondary">
          Contains: {meal.allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(', ')}.
        </Text>
      )}

      <SectionHeader title="Ingredients" />
      <Card>
        {meal.ingredients.map((item) => (
          <View key={item.key} style={styles.ingredient}>
            <Text variant="callout" style={styles.flex}>
              {INGREDIENTS[item.key].label}
            </Text>
            <Text variant="callout" color="textSecondary" rounded>
              {formatGrams(item.grams * servings)}
            </Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Method" />
      <Card>
        <Text variant="callout">{meal.method}</Text>
      </Card>

      {message && (
        <Text variant="callout" color="accent">
          {message}
        </Text>
      )}
      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      <Button title={addEntry.isPending ? 'Adding…' : 'I ate this: add to diary'} icon="checkmark" onPress={logToDiary} disabled={addEntry.isPending} />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button title="Swap meal" size="md" variant="secondary" onPress={swap} disabled={updateSlot.isPending} />
        </View>
        <View style={styles.flex}>
          <Button
            title="Remove"
            size="md"
            variant="destructive"
            onPress={() => deleteSlot.mutate(slot.id, { onSuccess: () => router.back() })}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tags: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favourite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  servings: {
    minWidth: 44,
    textAlign: 'center',
  },
  ingredient: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  flex: {
    flex: 1,
  },
});
