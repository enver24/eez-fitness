import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ExercisePicker } from '@/components/exercise-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/ui/choice';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDeleteWorkout, useExercises, useSaveWorkout, useWorkouts } from '@/hooks/use-workouts';
import { localDate } from '@/lib/diary';
import {
  clearSavedDraft,
  draftFromWorkout,
  draftToWorkout,
  loadSavedDraft,
  newDraft,
  newKey,
  saveDraftLocally,
  validateDraft,
  type DraftExercise,
  type WorkoutDraft,
} from '@/lib/workout-draft';
import type { Exercise, Workout } from '@/lib/workouts';

/**
 * Log a workout.
 * New:  /workouts/session      (resumes an unfinished workout if there is one)
 * Edit: /workouts/session?id=<workout id>
 */
export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const workouts = useWorkouts();
  const [draft, setDraft] = useState<WorkoutDraft | null>(null);

  // Load the workout being edited, or resume / start a new one.
  useEffect(() => {
    let cancelled = false;
    if (id) {
      const workout = workouts.data?.find((w) => w.id === id);
      if (workout) Promise.resolve(draftFromWorkout(workout)).then((d) => !cancelled && setDraft(d));
    } else {
      loadSavedDraft().then((saved) => !cancelled && setDraft(saved ?? newDraft()));
    }
    return () => {
      cancelled = true;
    };
  }, [id, workouts.data]);

  if (!draft) return null;
  return <SessionForm key={draft.id ?? 'new'} initialDraft={draft} history={workouts.data ?? []} />;
}

function SessionForm({ initialDraft, history }: { initialDraft: WorkoutDraft; history: Workout[] }) {
  const exercises = useExercises();
  const saveWorkout = useSaveWorkout();
  const deleteWorkout = useDeleteWorkout();
  const [draft, setDraftState] = useState(initialDraft);
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string>();
  const isEdit = !!draft.id;

  const exerciseById = new Map((exercises.data ?? []).map((e) => [e.id, e]));

  function setDraft(next: WorkoutDraft) {
    setDraftState(next);
    setError(undefined);
    // Keep an unfinished new workout on the phone in case the app closes.
    if (!next.id) saveDraftLocally(next);
  }

  function updateExercise(key: string, change: (exercise: DraftExercise) => DraftExercise | null) {
    setDraft({
      ...draft,
      exercises: draft.exercises.flatMap((e) => {
        if (e.key !== key) return [e];
        const changed = change(e);
        return changed ? [changed] : [];
      }),
    });
  }

  function addExercise(exercise: Exercise) {
    const last = lastPerformance(history, exercise.id);
    setDraft({
      ...draft,
      exercises: [
        ...draft.exercises,
        {
          key: newKey(),
          exerciseId: exercise.id,
          sets: [{ key: newKey(), reps: last ? String(last.reps) : '', weight: last ? String(last.weightKg) : '' }],
        },
      ],
    });
    setPicking(false);
  }

  function finish() {
    const problem = validateDraft(draft);
    if (problem) {
      setError(problem);
      return;
    }
    saveWorkout.mutate(draftToWorkout(draft), {
      onSuccess: () => {
        if (!draft.id) clearSavedDraft();
        router.back();
      },
      onError: () => setError('Couldn’t save the workout. Check your connection and try again.'),
    });
  }

  function confirm(title: string, message: string, action: string, onConfirm: () => void) {
    if (Platform.OS === 'web') return onConfirm();
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: action, style: 'destructive', onPress: onConfirm },
    ]);
  }

  function discard() {
    confirm('Discard this workout?', 'Everything you’ve logged in this workout will be lost.', 'Discard', () => {
      clearSavedDraft();
      router.back();
    });
  }

  function remove() {
    const workoutId = draft.id;
    if (!workoutId) return;
    confirm('Delete this workout?', 'It will be removed from your history.', 'Delete', () =>
      deleteWorkout.mutate(workoutId, { onSuccess: () => router.back() }),
    );
  }

  if (picking) {
    return <ExercisePicker exercises={exercises.data ?? []} onPick={addExercise} onCancel={() => setPicking(false)} />;
  }

  const busy = saveWorkout.isPending || deleteWorkout.isPending;
  const today = localDate();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDate(yesterdayDate);

  return (
    <Screen title={isEdit ? 'Edit workout' : 'Workout'} showBack>
      <TextField label="Name" value={draft.name} onChangeText={(name) => setDraft({ ...draft, name })} />
      {!isEdit && (
        <ChoiceChips
          options={[
            { value: today, label: 'Today' },
            { value: yesterday, label: 'Yesterday' },
          ]}
          selected={[draft.performedOn]}
          onChange={([performedOn]) => setDraft({ ...draft, performedOn })}
        />
      )}

      {draft.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.key}
          exercise={exercise}
          name={exerciseById.get(exercise.exerciseId)?.name ?? 'Exercise'}
          last={lastPerformance(history, exercise.exerciseId, draft.id)}
          onChange={(change) => updateExercise(exercise.key, change)}
        />
      ))}

      {draft.exercises.length === 0 && (
        <Text variant="callout" color="textSecondary">
          Add your first exercise to start logging sets.
        </Text>
      )}
      <Button title="Add exercise" icon="plus" variant="secondary" onPress={() => setPicking(true)} />

      {error && (
        <Text variant="callout" color="danger">
          {error}
        </Text>
      )}
      <Button title={busy ? 'Saving…' : isEdit ? 'Save changes' : 'Finish workout'} onPress={finish} disabled={busy} />
      {isEdit ? (
        <Button title="Delete workout" icon="trash" variant="destructive" size="md" onPress={remove} />
      ) : (
        draft.exercises.length > 0 && (
          <Button title="Discard workout" icon="trash" variant="destructive" size="md" onPress={discard} />
        )
      )}
    </Screen>
  );
}

/** The most recent set of an exercise from earlier workouts. */
function lastPerformance(history: Workout[], exerciseId: string, excludeWorkoutId?: string) {
  for (const workout of history) {
    if (workout.id === excludeWorkoutId) continue;
    const sets = workout.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length > 0) return sets[sets.length - 1];
  }
  return undefined;
}

function ExerciseCard({
  exercise,
  name,
  last,
  onChange,
}: {
  exercise: DraftExercise;
  name: string;
  last?: { reps: number; weightKg: number };
  onChange: (change: (exercise: DraftExercise) => DraftExercise | null) => void;
}) {
  const theme = useTheme();

  function updateSet(key: string, field: 'reps' | 'weight', value: string) {
    onChange((e) => ({ ...e, sets: e.sets.map((s) => (s.key === key ? { ...s, [field]: value } : s)) }));
  }

  function addSet() {
    onChange((e) => {
      const previous = e.sets[e.sets.length - 1];
      return { ...e, sets: [...e.sets, { key: newKey(), reps: previous?.reps ?? '', weight: previous?.weight ?? '' }] };
    });
  }

  return (
    <Card>
      <View style={styles.exerciseHeader}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">{name}</Text>
          {last && (
            <Text variant="caption" color="textSecondary">
              Last time: {last.weightKg} kg × {last.reps}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => onChange(() => null)}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name}`}
          hitSlop={8}>
          <Icon name="trash" size={16} color="textTertiary" />
        </Pressable>
      </View>

      <View style={styles.setRow}>
        <Text variant="label" color="textTertiary" style={styles.setNumber}>
          Set
        </Text>
        <Text variant="label" color="textTertiary" style={styles.flex}>
          kg
        </Text>
        <Text variant="label" color="textTertiary" style={styles.flex}>
          Reps
        </Text>
        <View style={styles.removeSpace} />
      </View>
      {exercise.sets.map((set, index) => (
        <View key={set.key} style={styles.setRow}>
          <Text variant="bodyStrong" rounded style={styles.setNumber}>
            {index + 1}
          </Text>
          <TextInput
            value={set.weight}
            onChangeText={(value) => updateSet(set.key, 'weight', value)}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={theme.textTertiary}
            selectTextOnFocus
            accessibilityLabel={`Set ${index + 1} weight in kg`}
            style={[styles.setInput, { backgroundColor: theme.fill, color: theme.text }]}
          />
          <TextInput
            value={set.reps}
            onChangeText={(value) => updateSet(set.key, 'reps', value)}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={theme.textTertiary}
            selectTextOnFocus
            accessibilityLabel={`Set ${index + 1} reps`}
            style={[styles.setInput, { backgroundColor: theme.fill, color: theme.text }]}
          />
          <Pressable
            onPress={() => onChange((e) => ({ ...e, sets: e.sets.filter((s) => s.key !== set.key) }))}
            accessibilityRole="button"
            accessibilityLabel={`Remove set ${index + 1}`}
            hitSlop={6}
            style={styles.removeSpace}>
            <Icon name="minus" size={14} color="textTertiary" />
          </Pressable>
        </View>
      ))}
      <Button title="Add set" icon="plus" variant="secondary" size="md" onPress={addSet} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  setNumber: {
    width: 32,
  },
  setInput: {
    flex: 1,
    ...Type.body,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: Spacing[2],
    borderRadius: Radius.sm,
    position: 'relative',
  },
  removeSpace: {
    width: 24,
    alignItems: 'center',
  },
});
