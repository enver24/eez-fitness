import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MealPicker } from '@/components/meal-picker';
import { NutritionPreview } from '@/components/nutrition-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useAddEntries } from '@/hooks/use-diary';
import { useTheme } from '@/hooks/use-theme';
import { localDate, sumNutrition, type MealType } from '@/lib/diary';
import { reviewItemFromScan, scaleReviewItem, type ReviewItem } from '@/lib/scan-review';
import type { ScanResult } from '@/lib/meal-scan';

/**
 * Step 2 of scanning: check and correct what the AI found, then save.
 * /log/scan-review?result=<json>&meal=lunch
 */
export default function ScanReviewScreen() {
  const params = useLocalSearchParams<{ result: string; meal: MealType; sample?: string }>();
  const result = JSON.parse(params.result) as ScanResult;
  const [items, setItems] = useState<ReviewItem[]>(() => result.items.map(reviewItemFromScan));
  const [meal, setMeal] = useState<MealType>(params.meal);
  const [error, setError] = useState<string>();
  const addEntries = useAddEntries();
  const isSample = params.sample === '1';

  const kept = items.map(scaleReviewItem).filter((item) => item !== null);
  const total = sumNutrition(kept);

  function update(key: string, changes: Partial<ReviewItem>) {
    setItems(items.map((item) => (item.key === key ? { ...item, ...changes } : item)));
    setError(undefined);
  }

  function save() {
    if (items.length === 0) return setError('There’s nothing to save. Go back to scan again.');
    if (kept.length !== items.length) return setError('Each food needs a name and an amount in grams.');
    if (isSample) return setError('This is a sample result, so it can’t be saved.');
    addEntries.mutate(
      kept.map((item) => ({
        eatenOn: localDate(),
        meal,
        name: item.name,
        brand: null,
        source: 'ai',
        sourceId: null,
        amountG: item.grams,
        amountLabel: null,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      })),
      {
        onSuccess: () => router.back(),
        onError: () => setError('Couldn’t save. Check your connection and try again.'),
      },
    );
  }

  return (
    <Screen eyebrow={isSample ? 'Sample result' : 'Check before saving'} title="Your meal" showBack>
      <Notice>
        These are AI estimates from a photo, so they’re approximate and can be wrong. Fix any food
        names or amounts before saving.
      </Notice>

      <NutritionPreview nutrition={total} />

      {items.map((item) => (
        <ReviewCard
          key={item.key}
          item={item}
          onChange={(changes) => update(item.key, changes)}
          onRemove={() => setItems(items.filter((i) => i.key !== item.key))}
        />
      ))}

      {result.note ? (
        <Text variant="caption" color="textSecondary">
          AI note: {result.note}
        </Text>
      ) : null}

      <Text variant="label" color="textSecondary">
        Meal
      </Text>
      <MealPicker value={meal} onChange={setMeal} />

      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      <Button
        title={addEntries.isPending ? 'Saving…' : `Add ${items.length} food${items.length === 1 ? '' : 's'} to diary`}
        onPress={save}
        disabled={addEntries.isPending}
      />
    </Screen>
  );
}

function ReviewCard({
  item,
  onChange,
  onRemove,
}: {
  item: ReviewItem;
  onChange: (changes: Partial<ReviewItem>) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const scaled = scaleReviewItem(item);
  const inputStyle = [styles.input, { backgroundColor: theme.fill, color: theme.text }];

  return (
    <Card>
      <View style={styles.row}>
        <TextInput
          value={item.name}
          onChangeText={(name) => onChange({ name })}
          placeholder="Food name"
          placeholderTextColor={theme.textTertiary}
          accessibilityLabel="Food name"
          style={[inputStyle, styles.flex]}
        />
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel={`Remove ${item.name}`} hitSlop={8}>
          <Icon name="trash" size={16} color="textTertiary" />
        </Pressable>
      </View>
      <View style={styles.row}>
        <TextInput
          value={item.grams}
          onChangeText={(grams) => onChange({ grams })}
          keyboardType="decimal-pad"
          selectTextOnFocus
          accessibilityLabel={`Grams of ${item.name}`}
          style={[inputStyle, styles.grams]}
        />
        <Text variant="callout" color="textSecondary">
          g
        </Text>
        <Text variant="callout" rounded style={[styles.flex, styles.right]}>
          {scaled ? `${Math.round(scaled.calories)} kcal` : '–'}
        </Text>
      </View>
      {scaled && (
        <Text variant="caption" color="textSecondary">
          P {scaled.protein} g · C {scaled.carbs} g · F {scaled.fat} g
          {item.confidence === 'low' ? ' · Low confidence: please check' : ''}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  flex: {
    flex: 1,
  },
  right: {
    textAlign: 'right',
    fontWeight: '700',
  },
  input: {
    ...Type.body,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    position: 'relative',
  },
  grams: {
    width: 90,
    textAlign: 'center',
    fontWeight: '700',
  },
});
