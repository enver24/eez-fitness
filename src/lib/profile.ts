/**
 * Loading and saving the signed-in user's profile.
 * Row Level Security in the database guarantees these only ever touch
 * the current user's own row.
 */

import { supabase } from '@/lib/supabase';
import {
  ageFromBirthYear,
  calculateTargets,
  type ActivityLevel,
  type FitnessGoal,
  type Sex,
} from '@/lib/targets';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type Profile = {
  id: string;
  first_name: string;
  birth_year: number | null;
  sex: Sex | null;
  height_cm: number | null;
  weight_kg: number | null;
  body_fat_percent: number | null;
  goal: FitnessGoal | null;
  goal_weight_kg: number | null;
  activity_level: ActivityLevel | null;
  experience: ExperienceLevel | null;
  dietary_preferences: string[];
  allergies: string[];
  calorie_target: number | null;
  protein_target_g: number | null;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  onboarding_completed_at: string | null;
  progress_photos_consent_at: string | null;
  progress_photo_reminder: PhotoReminder;
  meal_budget: 'low' | 'medium' | 'any';
};

export type PhotoReminder = 'off' | 'week_start' | 'week_end';

/** The fields a user can edit. */
export type ProfileUpdate = Partial<Omit<Profile, 'id'>>;

const COLUMNS =
  'id, first_name, birth_year, sex, height_cm, weight_kg, body_fat_percent, goal, goal_weight_kg, activity_level, experience, dietary_preferences, allergies, calorie_target, protein_target_g, carbs_target_g, fat_target_g, onboarding_completed_at, progress_photos_consent_at, progress_photo_reminder, meal_budget';

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select(COLUMNS)
    .eq('id', userId)
    .single<Profile>();
  if (error) throw error;
  // Postgres "numeric" columns arrive as strings; turn them back into numbers.
  return {
    ...data,
    height_cm: toNumber(data.height_cm),
    weight_kg: toNumber(data.weight_kg),
    body_fat_percent: toNumber(data.body_fat_percent),
    goal_weight_kg: toNumber(data.goal_weight_kg),
  };
}

export async function updateProfile(userId: string, changes: ProfileUpdate) {
  const { error } = await supabase.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
}

/**
 * Recalculates daily targets from a profile's details. Returns null if
 * any detail needed for the calculation is missing.
 */
export function targetsFor(profile: ProfileUpdate): ProfileUpdate | null {
  const { sex, birth_year, height_cm, weight_kg, activity_level, goal } = profile;
  if (!sex || !birth_year || !height_cm || !weight_kg || !activity_level || !goal) return null;
  const targets = calculateTargets({
    sex,
    age: ageFromBirthYear(birth_year),
    heightCm: height_cm,
    weightKg: weight_kg,
    activityLevel: activity_level,
    goal,
  });
  return {
    calorie_target: targets.calories,
    protein_target_g: targets.proteinG,
    carbs_target_g: targets.carbsG,
    fat_target_g: targets.fatG,
  };
}

function toNumber(value: number | string | null) {
  return value === null ? null : Number(value);
}

/** Choices shown in onboarding and the profile editors. */
export const GOAL_OPTIONS: { value: FitnessGoal; label: string; description: string }[] = [
  { value: 'lose_fat', label: 'Lose fat', description: 'Steady fat loss while keeping muscle' },
  { value: 'build_muscle', label: 'Build muscle', description: 'Small calorie surplus to grow' },
  { value: 'recomp', label: 'Recomp', description: 'Lose fat and build muscle slowly' },
  { value: 'maintain', label: 'Maintain', description: 'Stay where you are' },
];

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary', label: 'Mostly sitting', description: 'Desk job, little exercise' },
  { value: 'light', label: 'Lightly active', description: 'Exercise 1–3 days a week' },
  { value: 'moderate', label: 'Moderately active', description: 'Exercise 3–5 days a week' },
  { value: 'active', label: 'Very active', description: 'Hard exercise 6–7 days a week' },
  { value: 'very_active', label: 'Athlete', description: 'Training twice a day or physical job' },
];

export const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export const DIET_OPTIONS = [
  'No preference',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Halal',
  'Kosher',
  'Keto / low carb',
  'High protein',
  'Mediterranean',
];

export const ALLERGY_OPTIONS = [
  'Peanuts',
  'Tree nuts',
  'Milk / dairy',
  'Eggs',
  'Gluten / wheat',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame',
  'Lupin',
];

export function labelFor<T extends string>(options: { value: T; label: string }[], value: T | null) {
  return options.find((option) => option.value === value)?.label ?? 'Not set';
}
