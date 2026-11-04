import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { MealPicker, mealForNow } from '@/components/meal-picker';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useAddEntry, useDeleteEntry, useEntry, useUpdateEntry } from '@/hooks/use-diary';
import { localDate, type FoodEntry, type MealType } from '@/lib/diary';

/**
 * Type in a food's nutrition yourself, e.g. a home-cooked meal.
 * New:        /log/manual?meal=dinner
 * Edit:       /log/manual?entryId=<id>
 * Log again:  /log/manual?copyFrom=<id>&meal=lunch
 */
export default function ManualEntryScreen() {
  const params = useLocalSearchParams<{ meal?: MealType; entryId?: string; copyFrom?: string }>();
  const source = useEntry(params.entryId ?? params.copyFrom);
  if ((params.entryId || params.copyFrom) && !source.data) return null;
  return (
    <ManualForm
      entry={params.entryId ? source.data : undefined}
      template={source.data}
      initialMeal={params.meal ?? source.data?.meal ?? mealForNow()}
    />
  );
}

const text = (value: number | undefined) => (value === undefined ? '' : String(value));

function ManualForm({
  entry,
  template,
  initialMeal,
}: {
  entry?: FoodEntry;
  template?: FoodEntry;
  initialMeal: MealType;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [amount, setAmount] = useState(template?.amountLabel ?? '');
  const [calories, setCalories] = useState(text(template?.calories));
  const [protein, setProtein] = useState(text(template?.protein));
  const [carbs, setCarbs] = useState(text(template?.carbs));
  const [fat, setFat] = useState(text(template?.fat));
  const [meal, setMeal] = useState(initialMeal);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addEntry = useAddEntry();
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const busy = addEntry.isPending || updateEntry.isPending || deleteEntry.isPending;

  const parse = (value: string) => (value.trim() === '' ? 0 : Number(value.replace(',', '.')));

  function save() {
    const next: Record<string, string> = {};
    const values = { calories: parse(calories), protein: parse(protein), carbs: parse(carbs), fat: parse(fat) };
    if (!name.trim()) next.name = 'Give this food a name.';
    if (calories.trim() === '' || !Number.isFinite(values.calories) || values.calories < 0 || values.calories > 10000) {
      next.calories = 'Enter the calories (0–10,000).';
    }
    for (const key of ['protein', 'carbs', 'fat'] as const) {
      if (!Number.isFinite(values[key]) || values[key] < 0 || values[key] > 1000) {
        next[key] = 'Enter grams (0–1000), or leave blank.';
      }
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const round = (v: number) => Math.round(v * 10) / 10;
    const fields = {
      meal,
      name: name.trim().slice(0, 120),
      amountLabel: amount.trim().slice(0, 40) || null,
      calories: round(values.calories),
      protein: round(values.protein),
      carbs: round(values.carbs),
      fat: round(values.fat),
    };
    const done = { onSuccess: () => router.back(), onError: () => setErrors({ form: 'Couldn’t save. Check your connection.' }) };
    if (entry) {
      updateEntry.mutate({ id: entry.id, changes: fields }, done);
    } else {
      addEntry.mutate(
        { ...fields, eatenOn: localDate(), brand: null, source: 'manual', sourceId: null, amountG: null },
        done,
      );
    }
  }

  function remove() {
    const doDelete = () => deleteEntry.mutate(entry!.id, { onSuccess: () => router.back() });
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Remove this food?', `${entry!.name} will be removed from your diary.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: doDelete },
    ]);
  }

  return (
    <Screen title={entry ? 'Edit food' : 'Add manually'} showBack>
      <TextField label="Food name" value={name} onChangeText={setName} placeholder="Mum’s lasagne" error={errors.name} />
      <TextField label="Amount (optional)" value={amount} onChangeText={setAmount} placeholder="1 large slice" />
      <TextField
        label="Calories (kcal)"
        value={calories}
        onChangeText={setCalories}
        placeholder="450"
        keyboardType="decimal-pad"
        error={errors.calories}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField label="Protein (g)" value={protein} onChangeText={setProtein} placeholder="0" keyboardType="decimal-pad" error={errors.protein} />
        </View>
        <View style={styles.flex}>
          <TextField label="Carbs (g)" value={carbs} onChangeText={setCarbs} placeholder="0" keyboardType="decimal-pad" error={errors.carbs} />
        </View>
        <View style={styles.flex}>
          <TextField label="Fat (g)" value={fat} onChangeText={setFat} placeholder="0" keyboardType="decimal-pad" error={errors.fat} />
        </View>
      </View>
      <Text variant="caption" color="textSecondary">
        Tip: food labels in Australia show energy in kJ. Divide by 4.2 to get kcal.
      </Text>

      <Text variant="label" color="textSecondary">
        Meal
      </Text>
      <MealPicker value={meal} onChange={setMeal} />

      {errors.form && (
        <Text variant="callout" color="danger">
          {errors.form}
        </Text>
      )}
      <Button title={busy ? 'Saving…' : entry ? 'Save changes' : 'Add to diary'} onPress={save} disabled={busy} />
      {entry && <Button title="Remove from diary" variant="destructive" icon="trash" size="md" onPress={remove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  flex: {
    flex: 1,
  },
});
