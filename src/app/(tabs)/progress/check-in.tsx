import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ChoiceChips } from '@/components/ui/choice';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useCheckIns, useDeleteCheckIn, useSaveCheckIn } from '@/hooks/use-check-ins';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';
import { MEASUREMENTS, type CheckIn, type Measurement } from '@/lib/check-ins';
import { localDate } from '@/lib/diary';
import { targetsFor } from '@/lib/profile';

/**
 * Log weight and (optionally) measurements for a day.
 * New:  /progress/check-in
 * Edit: /progress/check-in?date=2026-11-04
 */
export default function CheckInScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const checkIns = useCheckIns();
  if (!checkIns.data) return null;
  const date = params.date ?? localDate();
  const existing = checkIns.data.find((c) => c.measuredOn === date);
  const latestDate = checkIns.data.at(-1)?.measuredOn;
  return <CheckInForm key={date} date={date} existing={existing} isEdit={!!params.date} latestDate={latestDate} />;
}

const text = (value: number | null | undefined) => (value == null ? '' : String(value));

function dayOptions() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return [
    { value: localDate(today), label: 'Today' },
    { value: localDate(yesterday), label: 'Yesterday' },
  ];
}

function CheckInForm({
  date: initialDate,
  existing,
  isEdit,
  latestDate,
}: {
  date: string;
  existing?: CheckIn;
  isEdit: boolean;
  latestDate?: string;
}) {
  const { data: profile } = useProfile();
  const save = useSaveCheckIn();
  const remove = useDeleteCheckIn();
  const updateProfile = useUpdateProfile();
  const [date, setDate] = useState(initialDate);
  const [weight, setWeight] = useState(text(existing?.weightKg ?? (isEdit ? null : profile?.weight_kg)));
  const [measurements, setMeasurements] = useState<Record<Measurement, string>>(() =>
    Object.fromEntries(MEASUREMENTS.map(({ key }) => [key, text(existing?.[key])])) as Record<Measurement, string>,
  );
  const [showMeasurements, setShowMeasurements] = useState(
    MEASUREMENTS.some(({ key }) => existing?.[key] != null),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parse = (value: string) => (value.trim() === '' ? null : Number(value.replace(',', '.')));

  function handleSave() {
    const next: Record<string, string> = {};
    const weightKg = parse(weight);
    if (weightKg !== null && (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300)) {
      next.weight = 'Enter your weight in kg (30–300).';
    }
    const values = {} as Record<Measurement, number | null>;
    for (const { key } of MEASUREMENTS) {
      const value = parse(measurements[key]);
      if (value !== null && (!Number.isFinite(value) || value < 10 || value > 250)) next[key] = 'Enter cm (10–250).';
      values[key] = value === null ? null : Math.round(value * 10) / 10;
    }
    if (weightKg === null && Object.values(values).every((v) => v === null)) {
      next.weight = 'Enter your weight or at least one measurement.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const roundedWeight = weightKg === null ? null : Math.round(weightKg * 10) / 10;
    save.mutate(
      { measuredOn: date, weightKg: roundedWeight, note: null, ...values },
      {
        onSuccess: () => {
          // A new latest weight changes calorie needs, so refresh targets.
          const isLatest = !latestDate || date >= latestDate;
          if (profile && roundedWeight !== null && isLatest) {
            const targets = targetsFor({ ...profile, weight_kg: roundedWeight });
            if (targets) updateProfile.mutate(targets);
          }
          router.back();
        },
        onError: () => setErrors({ form: 'Couldn’t save. Check your connection.' }),
      },
    );
  }

  function handleDelete() {
    if (!existing) return;
    const id = existing.id;
    const doDelete = () => remove.mutate(id, { onSuccess: () => router.back() });
    if (Platform.OS === 'web') return doDelete();
    Alert.alert('Delete this check-in?', 'Its weight and measurements will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }

  const busy = save.isPending || remove.isPending;

  return (
    <Screen title={isEdit ? 'Edit check-in' : 'Weigh in'} showBack>
      {!isEdit && (
        <ChoiceChips options={dayOptions()} selected={[date]} onChange={([value]) => setDate(value)} />
      )}
      {isEdit && (
        <Text variant="callout" color="textSecondary">
          {new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      )}

      <TextField
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        placeholder="80.5"
        keyboardType="decimal-pad"
        selectTextOnFocus
        error={errors.weight}
      />
      <Text variant="caption" color="textSecondary">
        Tip: weigh yourself at the same time each day, ideally in the morning, for the most reliable trend.
      </Text>

      {showMeasurements ? (
        <>
          <Text variant="label" color="textSecondary">
            Measurements in cm (optional)
          </Text>
          <View style={styles.grid}>
            {MEASUREMENTS.map(({ key, label }) => (
              <View key={key} style={styles.cell}>
                <TextField
                  label={label}
                  value={measurements[key]}
                  onChangeText={(value) => setMeasurements({ ...measurements, [key]: value })}
                  keyboardType="decimal-pad"
                  error={errors[key]}
                />
              </View>
            ))}
          </View>
        </>
      ) : (
        <Button title="Add measurements" icon="ruler" variant="secondary" size="md" onPress={() => setShowMeasurements(true)} />
      )}

      {errors.form && (
        <Text variant="callout" color="danger">
          {errors.form}
        </Text>
      )}
      <Button title={busy ? 'Saving…' : 'Save'} onPress={handleSave} disabled={busy} />
      {existing && (
        <Button title="Delete check-in" variant="destructive" icon="trash" size="md" onPress={handleDelete} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
});
