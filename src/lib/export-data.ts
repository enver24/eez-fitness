/**
 * "Export my data": collects everything EEZ Fitness stores about the
 * signed-in user into one JSON file and opens the share sheet, so they can
 * save it to Files, email it to themselves, and so on.
 */

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { fetchCheckIns } from '@/lib/check-ins';
import { fetchPhotos } from '@/lib/progress-photos';
import { supabase } from '@/lib/supabase';
import { fetchExercises, fetchWorkouts } from '@/lib/workouts';

async function fetchAllFoodEntries() {
  const { data, error } = await supabase
    .from('food_entries')
    .select('eaten_on, meal, name, brand, source, amount_g, amount_label, calories, protein_g, carbs_g, fat_g, created_at')
    .order('eaten_on')
    .limit(10000);
  if (error) throw error;
  return data;
}

async function fetchProfileRow(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

/** Builds the export as a plain object (also used by tests). */
export async function buildExport(userId: string, email: string | undefined) {
  const [profile, foodDiary, checkIns, workouts, exercises, photos] = await Promise.all([
    fetchProfileRow(userId),
    fetchAllFoodEntries(),
    fetchCheckIns(),
    fetchWorkouts(),
    fetchExercises(),
    fetchPhotos(),
  ]);
  const exerciseNames = new Map(exercises.map((e) => [e.id, e.name]));
  return {
    exportedAt: new Date().toISOString(),
    app: 'EEZ Fitness',
    account: { email },
    profile,
    foodDiary,
    bodyCheckIns: checkIns,
    workouts: workouts.map((workout) => ({
      name: workout.name,
      performedOn: workout.performedOn,
      durationMin: workout.durationMin,
      sets: workout.sets.map((set) => ({
        exercise: exerciseNames.get(set.exerciseId) ?? set.exerciseId,
        setNumber: set.setNumber,
        reps: set.reps,
        weightKg: set.weightKg,
      })),
    })),
    customExercises: exercises.filter((e) => e.isCustom).map((e) => e.name),
    // Photo details only; the images aren't included, to keep the file small.
    progressPhotos: photos.map((photo) => ({ takenOn: photo.takenOn, pose: photo.pose, note: photo.note })),
  };
}

/** Writes the export to a temporary file and opens the share sheet. */
export async function exportMyData(userId: string, email: string | undefined) {
  const data = await buildExport(userId, email);
  const date = new Date().toISOString().slice(0, 10);
  const file = new File(Paths.cache, `eez-fitness-export-${date}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(data, null, 2));

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Export my EEZ Fitness data',
  });
}
