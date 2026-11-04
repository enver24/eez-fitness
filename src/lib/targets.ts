/**
 * Works out daily calorie and macro targets from a user's details.
 *
 * Method (widely used, but still an estimate):
 * 1. BMR, the energy used at rest: Mifflin–St Jeor equation.
 * 2. Multiply by an activity factor to get total daily energy (TDEE).
 * 3. Adjust for the goal (deficit to lose fat, surplus to build muscle).
 * 4. Protein from body weight, fat as a share of calories, carbs fill the rest.
 *
 * Safety: calories never go below a minimum floor, and a fat-loss deficit
 * is capped. These are general estimates, not medical advice.
 */

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type FitnessGoal = 'lose_fat' | 'maintain' | 'build_muscle' | 'recomp';

export type TargetInput = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
};

export type Targets = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Change from maintenance calories for each goal. */
const GOAL_ADJUSTMENT: Record<FitnessGoal, number> = {
  lose_fat: -0.2, // 20% deficit
  maintain: 0,
  build_muscle: 0.1, // 10% surplus
  recomp: -0.1, // small deficit with high protein
};

/** Grams of protein per kg of body weight for each goal. */
const PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_fat: 2.0,
  maintain: 1.6,
  build_muscle: 1.8,
  recomp: 2.0,
};

/** The lowest daily calories the app will ever suggest. */
export const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

/** The largest fat-loss deficit the app will suggest (kcal per day). */
const MAX_DEFICIT = 750;

const FAT_SHARE = 0.25; // 25% of calories from fat
const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

export function calculateBmr({ sex, age, heightCm, weightKg }: TargetInput) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

export function calculateTargets(input: TargetInput): Targets {
  const maintenance = calculateBmr(input) * ACTIVITY_FACTORS[input.activityLevel];

  let calories = maintenance * (1 + GOAL_ADJUSTMENT[input.goal]);
  calories = Math.max(calories, maintenance - MAX_DEFICIT);
  calories = Math.max(calories, MIN_CALORIES[input.sex]);
  calories = Math.round(calories / 10) * 10;

  const proteinG = Math.round(input.weightKg * PROTEIN_PER_KG[input.goal]);
  const fatG = Math.round((calories * FAT_SHARE) / KCAL_PER_G.fat);
  const carbCalories = calories - proteinG * KCAL_PER_G.protein - fatG * KCAL_PER_G.fat;
  const carbsG = Math.max(Math.round(carbCalories / KCAL_PER_G.carbs), 0);

  return { calories, proteinG, carbsG, fatG };
}

export function ageFromBirthYear(birthYear: number, today = new Date()) {
  return today.getFullYear() - birthYear;
}
