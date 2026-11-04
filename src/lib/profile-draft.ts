/**
 * A "draft" is the profile while it's being edited on screen. Numbers are
 * kept as text (what the user typed) until saved, then checked and converted.
 */

import { ALLERGY_OPTIONS, type ExperienceLevel, type Profile, type ProfileUpdate } from '@/lib/profile';
import type { ActivityLevel, FitnessGoal, Sex } from '@/lib/targets';

export type ProfileDraft = {
  firstName: string;
  birthYear: string;
  sex: Sex | null;
  heightCm: string;
  weightKg: string;
  bodyFatPercent: string;
  goal: FitnessGoal | null;
  goalWeightKg: string;
  activityLevel: ActivityLevel | null;
  experience: ExperienceLevel | null;
  dietaryPreferences: string[];
  allergies: string[];
  /** Comma-separated allergies not in the standard list. */
  otherAllergies: string;
};

export type DraftErrors = Partial<Record<keyof ProfileDraft, string>>;

const text = (value: number | null) => (value === null ? '' : String(value));

export function draftFromProfile(profile: Profile): ProfileDraft {
  const known = new Set(ALLERGY_OPTIONS);
  return {
    firstName: profile.first_name,
    birthYear: text(profile.birth_year),
    sex: profile.sex,
    heightCm: text(profile.height_cm),
    weightKg: text(profile.weight_kg),
    bodyFatPercent: text(profile.body_fat_percent),
    goal: profile.goal,
    goalWeightKg: text(profile.goal_weight_kg),
    activityLevel: profile.activity_level,
    experience: profile.experience,
    dietaryPreferences: profile.dietary_preferences,
    allergies: profile.allergies.filter((a) => known.has(a)),
    otherAllergies: profile.allergies.filter((a) => !known.has(a)).join(', '),
  };
}

/** Parses "72.5" or "72,5" into a number, or null if empty/invalid. */
function parseNumber(value: string) {
  const cleaned = value.trim().replace(',', '.');
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : NaN;
}

export function validateAboutYou(draft: ProfileDraft): DraftErrors {
  const errors: DraftErrors = {};
  const thisYear = new Date().getFullYear();
  const birthYear = parseNumber(draft.birthYear);
  const height = parseNumber(draft.heightCm);
  const weight = parseNumber(draft.weightKg);
  const bodyFat = parseNumber(draft.bodyFatPercent);

  if (!draft.firstName.trim()) errors.firstName = 'Enter your first name.';
  if (birthYear === null || Number.isNaN(birthYear) || !Number.isInteger(birthYear)) {
    errors.birthYear = 'Enter the year you were born, e.g. 1998.';
  } else if (thisYear - birthYear < 18) {
    errors.birthYear = 'EEZ Fitness is for adults 18 and over.';
  } else if (thisYear - birthYear > 100) {
    errors.birthYear = 'Check the year you were born.';
  }
  if (!draft.sex) errors.sex = 'Choose one. It’s only used for the calorie formula.';
  if (height === null || Number.isNaN(height) || height < 100 || height > 250) {
    errors.heightCm = 'Enter your height in cm (100–250).';
  }
  if (weight === null || Number.isNaN(weight) || weight < 30 || weight > 300) {
    errors.weightKg = 'Enter your weight in kg (30–300).';
  }
  if (bodyFat !== null && (Number.isNaN(bodyFat) || bodyFat < 3 || bodyFat > 60)) {
    errors.bodyFatPercent = 'Enter a percentage between 3 and 60, or leave it blank.';
  }
  return errors;
}

export function validateGoal(draft: ProfileDraft): DraftErrors {
  const errors: DraftErrors = {};
  const goalWeight = parseNumber(draft.goalWeightKg);
  if (!draft.goal) errors.goal = 'Choose a goal.';
  if (goalWeight !== null && (Number.isNaN(goalWeight) || goalWeight < 30 || goalWeight > 300)) {
    errors.goalWeightKg = 'Enter a weight in kg (30–300), or leave it blank.';
  }
  return errors;
}

export function validateActivity(draft: ProfileDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.activityLevel) errors.activityLevel = 'Choose how active you are.';
  if (!draft.experience) errors.experience = 'Choose your training experience.';
  return errors;
}

/** Diet and allergies are optional, so this step never has errors. */
export function validateDiet(): DraftErrors {
  return {};
}

const round1 = (value: number | null) => (value === null ? null : Math.round(value * 10) / 10);

/** Converts a (validated) draft into database columns. */
export function draftToUpdate(draft: ProfileDraft): ProfileUpdate {
  const otherAllergies = draft.otherAllergies
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => a.slice(0, 40));
  return {
    first_name: draft.firstName.trim().slice(0, 50),
    birth_year: parseNumber(draft.birthYear),
    sex: draft.sex,
    height_cm: round1(parseNumber(draft.heightCm)),
    weight_kg: round1(parseNumber(draft.weightKg)),
    body_fat_percent: round1(parseNumber(draft.bodyFatPercent)),
    goal: draft.goal,
    goal_weight_kg: round1(parseNumber(draft.goalWeightKg)),
    activity_level: draft.activityLevel,
    experience: draft.experience,
    dietary_preferences: draft.dietaryPreferences.filter((d) => d !== 'No preference'),
    allergies: [...new Set([...draft.allergies, ...otherAllergies])].slice(0, 30),
  };
}
