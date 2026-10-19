/**
 * PLACEHOLDER DATA — for designing the screens only.
 *
 * Nothing here is real. In Stage 4 onwards these values are replaced by
 * the signed-in user's own data loaded from the database.
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Macros = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type LoggedFood = Macros & {
  name: string;
  amount: string;
};

export const sampleUser = {
  firstName: 'Enver',
  email: 'you@example.com',
  goal: 'Lose fat, keep muscle',
};

export const sampleTargets: Macros = {
  calories: 2350,
  protein: 170,
  carbs: 250,
  fat: 70,
};

export const sampleMeals: Record<MealType, LoggedFood[]> = {
  breakfast: [
    { name: 'Greek yoghurt', amount: '200 g', calories: 194, protein: 20, carbs: 8, fat: 9 },
    { name: 'Blueberries', amount: '80 g', calories: 46, protein: 1, carbs: 11, fat: 0 },
    { name: 'Granola', amount: '40 g', calories: 186, protein: 4, carbs: 26, fat: 7 },
  ],
  lunch: [
    { name: 'Chicken breast', amount: '180 g', calories: 297, protein: 56, carbs: 0, fat: 6 },
    { name: 'Jasmine rice', amount: '200 g', calories: 260, protein: 5, carbs: 57, fat: 1 },
    { name: 'Mixed salad', amount: '1 bowl', calories: 65, protein: 2, carbs: 9, fat: 3 },
  ],
  dinner: [],
  snack: [
    { name: 'Protein shake', amount: '1 scoop', calories: 120, protein: 24, carbs: 3, fat: 2 },
  ],
};

export const sampleRecentFoods: LoggedFood[] = [
  { name: 'Weet-Bix', amount: '2 biscuits', calories: 134, protein: 4, carbs: 23, fat: 1 },
  { name: 'Banana', amount: '1 medium', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: 'Eggs', amount: '2 large', calories: 143, protein: 13, carbs: 1, fat: 10 },
  { name: 'Avocado toast', amount: '1 slice', calories: 240, protein: 6, carbs: 24, fat: 14 },
];

export const sampleWorkouts = [
  { name: 'Push day', date: 'Yesterday', exercises: 6, durationMin: 58, volumeKg: 8420 },
  { name: 'Legs', date: 'Fri 16 Oct', exercises: 5, durationMin: 64, volumeKg: 11250 },
  { name: 'Pull day', date: 'Wed 14 Oct', exercises: 6, durationMin: 52, volumeKg: 7980 },
];

export const samplePersonalRecords = [
  { exercise: 'Bench press', best: '90 kg × 5', date: 'Yesterday' },
  { exercise: 'Back squat', best: '125 kg × 3', date: 'Fri 16 Oct' },
  { exercise: 'Deadlift', best: '150 kg × 2', date: '2 Oct' },
];

/** Morning weigh-ins for the last 8 weeks, oldest first (kg). */
export const sampleWeights = [
  86.4, 86.1, 85.9, 85.6, 85.8, 85.2, 84.9, 84.7, 84.8, 84.3, 84.1, 83.9, 84.0, 83.6, 83.4, 83.2,
];

export const sampleGoalWeight = 78;

/** Which of the last 7 days had food logged (Mon → Sun). */
export const sampleLoggedDays = [true, true, true, false, true, true, false];
