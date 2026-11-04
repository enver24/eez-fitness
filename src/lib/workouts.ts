/**
 * Workouts: the exercise library, saving sessions and working out records.
 * Row Level Security keeps each user's workouts private.
 */

import { supabase } from '@/lib/supabase';

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  isCustom: boolean;
};

export type WorkoutSet = {
  exerciseId: string;
  exercisePosition: number;
  setNumber: number;
  reps: number;
  weightKg: number;
};

export type Workout = {
  id: string;
  name: string;
  performedOn: string;
  durationMin: number | null;
  notes: string | null;
  sets: WorkoutSet[];
};

export type WorkoutInput = Omit<Workout, 'id'> & { id?: string };

export async function fetchExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, user_id')
    .order('name');
  if (error) throw error;
  return (data as { id: string; name: string; muscle_group: string; user_id: string | null }[]).map((row) => ({
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    isCustom: row.user_id !== null,
  }));
}

/** Adds a custom exercise to the user's own library. */
export async function createExercise(name: string, userId: string): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name: name.trim().slice(0, 60), muscle_group: 'Other', user_id: userId })
    .select('id, name, muscle_group')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, muscleGroup: data.muscle_group, isCustom: true };
}

type WorkoutRow = {
  id: string;
  name: string;
  performed_on: string;
  duration_min: number | null;
  notes: string | null;
  workout_sets: {
    exercise_id: string;
    exercise_position: number;
    set_number: number;
    reps: number;
    weight_kg: number | string;
  }[];
};

function fromRow(row: WorkoutRow): Workout {
  return {
    id: row.id,
    name: row.name,
    performedOn: row.performed_on,
    durationMin: row.duration_min,
    notes: row.notes,
    sets: row.workout_sets
      .map((s) => ({
        exerciseId: s.exercise_id,
        exercisePosition: s.exercise_position,
        setNumber: s.set_number,
        reps: s.reps,
        weightKg: Number(s.weight_kg),
      }))
      .sort((a, b) => a.exercisePosition - b.exercisePosition || a.setNumber - b.setNumber),
  };
}

const WORKOUT_COLUMNS =
  'id, name, performed_on, duration_min, notes, workout_sets (exercise_id, exercise_position, set_number, reps, weight_kg)';

/** All workouts with their sets, newest first. */
export async function fetchWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(WORKOUT_COLUMNS)
    .order('performed_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as WorkoutRow[]).map(fromRow);
}

/** Creates or updates a workout and its sets in one step. */
export async function saveWorkout(workout: WorkoutInput): Promise<string> {
  const { data, error } = await supabase.rpc('save_workout', {
    p_workout_id: workout.id ?? null,
    p_name: workout.name,
    p_performed_on: workout.performedOn,
    p_duration_min: workout.durationMin,
    p_notes: workout.notes,
    p_sets: workout.sets.map((s) => ({
      exercise_id: s.exerciseId,
      exercise_position: s.exercisePosition,
      set_number: s.setNumber,
      reps: s.reps,
      weight_kg: s.weightKg,
    })),
  });
  if (error) throw error;
  return data as string;
}

export async function deleteWorkout(id: string) {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw error;
}

/** Total weight lifted: the sum of weight × reps over all sets. */
export function workoutVolume(sets: Pick<WorkoutSet, 'reps' | 'weightKg'>[]) {
  return sets.reduce((total, set) => total + set.reps * set.weightKg, 0);
}

/** Number of different exercises in a workout. */
export function exerciseCount(sets: Pick<WorkoutSet, 'exercisePosition'>[]) {
  return new Set(sets.map((s) => s.exercisePosition)).size;
}

/**
 * Estimated one-rep max (Epley formula): the heaviest weight you could
 * probably lift once, based on a set of several reps.
 */
export function estimatedOneRepMax(weightKg: number, reps: number) {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export type PersonalRecord = {
  exerciseId: string;
  weightKg: number;
  reps: number;
  estimatedMax: number;
  performedOn: string;
};

/**
 * Each exercise's best set: the heaviest weight lifted (most reps breaks
 * ties), plus the best estimated one-rep max.
 */
export function personalRecords(workouts: Workout[]): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const workout of workouts) {
    for (const set of workout.sets) {
      if (set.reps <= 0 || set.weightKg <= 0) continue;
      const current = best.get(set.exerciseId);
      const better =
        !current ||
        set.weightKg > current.weightKg ||
        (set.weightKg === current.weightKg && set.reps > current.reps);
      if (better) {
        best.set(set.exerciseId, {
          exerciseId: set.exerciseId,
          weightKg: set.weightKg,
          reps: set.reps,
          estimatedMax: Math.max(
            estimatedOneRepMax(set.weightKg, set.reps),
            current?.estimatedMax ?? 0,
          ),
          performedOn: workout.performedOn,
        });
      } else {
        current.estimatedMax = Math.max(current.estimatedMax, estimatedOneRepMax(set.weightKg, set.reps));
      }
    }
  }
  return [...best.values()].sort((a, b) => (a.performedOn < b.performedOn ? 1 : -1));
}

/** Monday of the week containing `date`, as YYYY-MM-DD. */
export function startOfWeek(date = new Date()) {
  const monday = new Date(date);
  const day = (monday.getDay() + 6) % 7; // Monday = 0
  monday.setDate(monday.getDate() - day);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** e.g. "Tue 4 Nov" */
export function formatWorkoutDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}
