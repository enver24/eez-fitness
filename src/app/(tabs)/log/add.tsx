import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { MealPicker, mealForNow } from '@/components/meal-picker';
import { NutritionPreview } from '@/components/nutrition-preview';
import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAddEntry, useDeleteEntry, useEntry, useUpdateEntry } from '@/hooks/use-diary';
import { entryToFoodItem, localDate, type FoodEntry, type MealType } from '@/lib/diary';
import { SOURCE_LABELS, nutritionFor, type FoodItem } from '@/lib/food';

/**
 * Choose how much of a food was eaten and which meal, then save it.
 * New food:   /log/add?item=<json>&meal=lunch
 * Edit entry: /log/add?entryId=<id>
 */
export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ item?: string; meal?: MealType; entryId?: string }>();
  const existing = useEntry(params.entryId);

  if (params.entryId) {
    if (!existing.data) return null;
    const item = entryToFoodItem(existing.data);
    if (!item) return null;
    return <AmountForm item={item} entry={existing.data} initialMeal={existing.data.meal} />;
  }
  if (!params.item) return null;
  return <AmountForm item={JSON.parse(params.item) as FoodItem} initialMeal={params.meal ?? mealForNow()} />;
}

function AmountForm({
  item,
  entry,
  initialMeal,
}: {
  item: FoodItem;
  entry?: FoodEntry;
  initialMeal: MealType;
}) {
  const [grams, setGrams] = useState(String(entry?.amountG ?? item.serving?.grams ?? 100));
  const [meal, setMeal] = useState<MealType>(initialMeal);
  const [error, setError] = useState<string>();
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();

  const amount = Number(grams.replace(',', '.'));
  const valid = Number.isFinite(amount) && amount > 0 && amount <= 5000;
  const nutrition = nutritionFor(item, valid ? amount : 0);
  const busy = addEntry.isPending || updateEntry.isPending || deleteEntry.isPending;

  const servingChip =
    item.serving && !entry ? [{ value: String(item.serving.grams), label: item.serving.label }] : [];
  // Skip standard amounts that match the serving size, so no button appears twice.
  const quickAmounts = [
    ...servingChip,
    ...['50', '100', '150', '200']
      .filter((g) => !servingChip.some((chip) => chip.value === g))
      .map((g) => ({ value: g, label: `${g} g` })),
  ];

  function save() {
    if (!valid) {
      setError('Enter an amount in grams (1–5000).');
      return;
    }
    const amountG = Math.round(amount * 10) / 10;
    const done = { onSuccess: () => router.back(), onError: () => setError('Couldn’t save. Check your connection.') };
    if (entry) {
      updateEntry.mutate({ id: entry.id, changes: { meal, amountG, ...nutrition } }, done);
    } else {
      addEntry.mutate(
        {
          eatenOn: localDate(),
          meal,
          name: item.name.slice(0, 120),
          brand: item.brand?.slice(0, 80) ?? null,
          source: item.source,
          sourceId: item.sourceId.slice(0, 64),
          amountG,
          amountLabel: null,
          ...nutrition,
        },
        done,
      );
    }
  }

  function remove() {
    // Only shown when editing; the guard keeps React Compiler from reading
    // entry.id while adding a new food (when there is no entry).
    if (!entry) return;
    const entryId = entry.id;
    const doDelete = () => deleteEntry.mutate(entryId, { onSuccess: () => router.back() });
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Remove this food?', `${item.name} will be removed from your diary.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <Screen title={entry ? 'Edit food' : 'Add food'} showBack>
      <View style={styles.heading}>
        <Text variant="title">{item.name}</Text>
        <Text variant="caption" color="textSecondary">
          {[item.brand, SOURCE_LABELS[item.source]].filter(Boolean).join(' · ')}
        </Text>
      </View>

      <TextField
        label="Amount (grams)"
        value={grams}
        onChangeText={(value) => {
          setGrams(value);
          setError(undefined);
        }}
        keyboardType="decimal-pad"
        selectTextOnFocus
        error={error}
      />
      <ChoiceChips options={quickAmounts} selected={[grams]} onChange={([value]) => setGrams(value)} />

      <NutritionPreview nutrition={nutrition} />

      <Text variant="label" color="textSecondary">
        Meal
      </Text>
      <MealPicker value={meal} onChange={setMeal} />

      {item.source === 'off' && (
        <Notice>
          This product’s nutrition comes from Open Food Facts, a community database, and may contain
          errors. Check it against the label.
        </Notice>
      )}

      <Button title={busy ? 'Saving…' : entry ? 'Save changes' : 'Add to diary'} onPress={save} disabled={busy} />
      {entry && <Button title="Remove from diary" variant="destructive" icon="trash" size="md" onPress={remove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing[1],
  },
});
