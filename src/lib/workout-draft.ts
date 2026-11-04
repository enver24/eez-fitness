/**
 * A workout while it's being logged. It's saved on the phone as you go, so
 * closing the app mid-workout doesn't lose anything.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { localDate } from '@/lib/diary';
import type { Workout, WorkoutInput } from '@/lib/workouts';

export type DraftSet = { key: string; reps: string; weight: string };
export type DraftExercise = { key: string; exerciseId: string; sets: DraftSet[] };

export type WorkoutDraft = {
  id?: string;
  name: string;
  performedOn: string;
  /** When logging started (ms), used to work out the duration. */
  startedAt: number;
  durationMin: number | null;
  exercises: DraftExercise[];
};

const STORAGE_KEY = 'eez.workout-draft';

let counter = 0;
export const newKey = () => `${Date.now()}-${counter++}`;

function defaultName(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Morning workout';
  if (hour < 17) return 'Afternoon workout';
  return 'Evening workout';
}

export function newDraft(): WorkoutDraft {
  return {
    name: defaultName(),
    performedOn: localDate(),
    startedAt: Date.now(),
    durationMin: null,
    exercises: [],
  };
}

export function draftFromWorkout(workout: Workout): WorkoutDraft {
  const exercises: DraftExercise[] = [];
  for (const set of workout.sets) {
    let exercise = exercises[set.exercisePosition];
    if (!exercise || exercise.exerciseId !== set.exerciseId) {
      exercise = { key: newKey(), exerciseId: set.exerciseId, sets: [] };
      exercises.push(exercise);
    }
    exercise.sets.push({ key: newKey(), reps: String(set.reps), weight: String(set.weightKg) });
  }
  return {
    id: workout.id,
    name: workout.name,
    performedOn: workout.performedOn,
    startedAt: Date.now(),
    durationMin: workout.durationMin,
    exercises,
  };
}

const parse = (value: string) => Number(value.trim().replace(',', '.'));

/** Problems that stop the workout being saved, or null if it's fine. */
export function validateDraft(draft: WorkoutDraft): string | null {
  if (!draft.name.trim()) return 'Give the workout a name.';
  const sets = draft.exercises.flatMap((e) => e.sets);
  if (!sets.some((s) => s.reps.trim() !== '' && parse(s.reps) > 0)) {
    return 'Add at least one set with reps.';
  }
  for (const set of sets) {
    if (set.reps.trim() === '' && set.weight.trim() === '') continue; // empty rows are skipped
    const reps = parse(set.reps || '0');
    const weight = parse(set.weight || '0');
    if (!Number.isInteger(reps) || reps < 0 || reps > 1000) return 'Reps must be a whole number (0–1000).';
    if (!Number.isFinite(weight) || weight < 0 || weight > 1000) return 'Weight must be between 0 and 1000 kg.';
  }
  return null;
}

/** Converts a valid draft into what the database expects. Empty set rows are dropped. */
export function draftToWorkout(draft: WorkoutDraft): WorkoutInput {
  const durationMin =
    draft.durationMin ?? Math.min(Math.max(Math.round((Date.now() - draft.startedAt) / 60000), 1), 600);
  const sets = draft.exercises
    .map((exercise) => ({
      exercise,
      sets: exercise.sets.filter((s) => s.reps.trim() !== '' && parse(s.reps) > 0),
    }))
    .filter(({ sets: kept }) => kept.length > 0)
    .flatMap(({ exercise, sets: kept }, position) =>
      kept.map((set, index) => ({
        exerciseId: exercise.exerciseId,
        exercisePosition: position,
        setNumber: index + 1,
        reps: parse(set.reps),
        weightKg: Math.round(parse(set.weight || '0') * 10) / 10,
      })),
    );
  return {
    id: draft.id,
    name: draft.name.trim().slice(0, 60),
    performedOn: draft.performedOn,
    durationMin,
    notes: null,
    sets,
  };
}

export async function loadSavedDraft(): Promise<WorkoutDraft | null> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as WorkoutDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraftLocally(draft: WorkoutDraft) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(() => {});
}

export function clearSavedDraft() {
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
