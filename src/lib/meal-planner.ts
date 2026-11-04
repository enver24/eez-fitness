/**
 * The meal planner: picks meals from the built-in library to fit a user's
 * calorie and protein targets, diet, allergies and budget.
 *
 * Safety rules are strict filters checked in code: a meal containing one of
 * the user's allergens, or breaking a strict diet (vegetarian, vegan,
 * pescatarian, halal, kosher), is never suggested. Softer preferences
 * (high protein, low carb) only influence which meals are preferred.
 */

import type { MealType } from '@/lib/diary';
import type { Nutrition } from '@/lib/food';

export type Allergen =
  | 'peanuts'
  | 'tree_nuts'
  | 'milk'
  | 'eggs'
  | 'gluten'
  | 'soy'
  | 'fish'
  | 'shellfish'
  | 'sesame'
  | 'lupin';

export type Ingredient = {
  foodId: string;
  label: string;
  aisle: string;
  kind: string;
  allergens: string[];
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
};

export type LibraryMeal = {
  id: string;
  name: string;
  mealType: MealType;
  /** 1 = budget, 2 = mid, 3 = premium. */
  cost: number;
  minutes: number;
  ingredients: { key: string; grams: number }[];
  method: string;
  perServing: { kcal: number; protein: number; carbs: number; fat: number };
  allergens: string[];
  diets: string[];
};

export type Budget = 'low' | 'medium' | 'any';

export type PlanPreferences = {
  dietaryPreferences: string[];
  /** Allergy names as stored on the profile, including ones typed in. */
  allergies: string[];
  budget: Budget;
  favourites: string[];
};

export type PlannedSlot = { date: string; meal: MealType; mealId: string; servings: number };

/** Profile allergy names → library allergen keys. */
const ALLERGY_KEYS: Record<string, Allergen> = {
  Peanuts: 'peanuts',
  'Tree nuts': 'tree_nuts',
  'Milk / dairy': 'milk',
  Eggs: 'eggs',
  'Gluten / wheat': 'gluten',
  Soy: 'soy',
  Fish: 'fish',
  Shellfish: 'shellfish',
  Sesame: 'sesame',
  Lupin: 'lupin',
};

/** Diets that must be strictly followed. */
const STRICT_DIETS: Record<string, string> = {
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
  Pescatarian: 'pescatarian',
  Halal: 'halal',
  Kosher: 'kosher',
};

/** Preferences that only make some meals more likely. */
const SOFT_DIETS: Record<string, string> = {
  'Keto / low carb': 'low_carb',
  'High protein': 'high_protein',
};

/** Share of the day's calories for each meal. */
export const MEAL_SHARES: Record<MealType, number> = {
  breakfast: 0.25,
  lunch: 0.3,
  dinner: 0.35,
  snack: 0.1,
};

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/**
 * Whether a meal is safe and allowed for this user. Typed-in allergies
 * (e.g. "kiwi") are matched against the meal and ingredient names.
 */
export function isMealAllowed(
  meal: LibraryMeal,
  prefs: Pick<PlanPreferences, 'dietaryPreferences' | 'allergies' | 'budget'>,
  ingredients: Record<string, Ingredient>,
) {
  for (const allergy of prefs.allergies) {
    const key = ALLERGY_KEYS[allergy];
    if (key) {
      if (meal.allergens.includes(key)) return false;
    } else {
      const word = allergy.trim().toLowerCase();
      if (!word) continue;
      const names = [meal.name, ...meal.ingredients.map((i) => ingredients[i.key]?.label ?? '')];
      if (names.some((name) => name.toLowerCase().includes(word))) return false;
    }
  }
  for (const preference of prefs.dietaryPreferences) {
    const diet = STRICT_DIETS[preference];
    if (diet && !meal.diets.includes(diet)) return false;
  }
  if (prefs.budget === 'low' && meal.cost > 1) return false;
  if (prefs.budget === 'medium' && meal.cost > 2) return false;
  return true;
}

/** Servings needed to hit a calorie target, in quarters, between ½ and 2½. */
export function servingsFor(meal: LibraryMeal, targetKcal: number) {
  if (meal.perServing.kcal <= 0 || targetKcal <= 0) return 1;
  const exact = targetKcal / meal.perServing.kcal;
  return Math.min(Math.max(Math.round(exact * 4) / 4, 0.5), 2.5);
}

export function mealNutrition(meal: LibraryMeal, servings: number): Nutrition {
  const round = (value: number) => Math.round(value * servings * 10) / 10;
  return {
    calories: round(meal.perServing.kcal),
    protein: round(meal.perServing.protein),
    carbs: round(meal.perServing.carbs),
    fat: round(meal.perServing.fat),
  };
}

/** Small, repeatable random number generator, so tests can fix the result. */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function scoreMeal(
  meal: LibraryMeal,
  targetKcal: number,
  prefs: PlanPreferences,
  recentIds: Set<string>,
  random: () => number,
) {
  const servings = servingsFor(meal, targetKcal);
  const proteinDensity = (meal.perServing.protein * 4) / Math.max(meal.perServing.kcal, 1);
  let score = proteinDensity * 2 + random() * 0.6;
  // Prefer meals that fit without huge or tiny portions.
  score -= Math.abs(servings - 1) * 0.4;
  if (prefs.favourites.includes(meal.id)) score += 0.35;
  for (const preference of prefs.dietaryPreferences) {
    const soft = SOFT_DIETS[preference];
    if (soft && meal.diets.includes(soft)) score += 0.5;
  }
  if (recentIds.has(meal.id)) score -= 2;
  return score;
}

/** The best allowed meal for one slot, or null if nothing fits the user's restrictions. */
export function pickMeal(
  mealType: MealType,
  targetKcal: number,
  library: LibraryMeal[],
  ingredients: Record<string, Ingredient>,
  prefs: PlanPreferences,
  recentIds: Set<string>,
  random: () => number,
  excludeId?: string,
) {
  const candidates = library.filter(
    (meal) => meal.mealType === mealType && meal.id !== excludeId && isMealAllowed(meal, prefs, ingredients),
  );
  let best: LibraryMeal | null = null;
  let bestScore = -Infinity;
  for (const meal of candidates) {
    const score = scoreMeal(meal, targetKcal, prefs, recentIds, random);
    if (score > bestScore) {
      best = meal;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Plans every meal slot for the given dates. The same meal isn't repeated
 * within two days unless there's no other option.
 */
export function generatePlan(input: {
  dates: string[];
  calorieTarget: number;
  library: LibraryMeal[];
  ingredients: Record<string, Ingredient>;
  prefs: PlanPreferences;
  random?: () => number;
}): PlannedSlot[] {
  const random = input.random ?? Math.random;
  const slots: PlannedSlot[] = [];
  const history: string[][] = [];
  for (const date of input.dates) {
    const recent = new Set(history.slice(-2).flat());
    const today: string[] = [];
    for (const mealType of MEAL_ORDER) {
      const target = input.calorieTarget * MEAL_SHARES[mealType];
      const meal = pickMeal(mealType, target, input.library, input.ingredients, input.prefs, recent, random);
      if (!meal) continue;
      today.push(meal.id);
      slots.push({ date, meal: mealType, mealId: meal.id, servings: servingsFor(meal, target) });
    }
    history.push(today);
  }
  return slots;
}

export type ShoppingItem = { key: string; label: string; aisle: string; grams: number };

/** Adds up every ingredient needed for a set of planned meals, grouped by aisle. */
export function shoppingList(
  slots: Pick<PlannedSlot, 'mealId' | 'servings'>[],
  library: LibraryMeal[],
  ingredients: Record<string, Ingredient>,
) {
  const meals = new Map(library.map((meal) => [meal.id, meal]));
  const totals = new Map<string, ShoppingItem>();
  for (const slot of slots) {
    const meal = meals.get(slot.mealId);
    if (!meal) continue;
    for (const item of meal.ingredients) {
      const ingredient = ingredients[item.key];
      if (!ingredient) continue;
      // Merge the same shopping item (e.g. raw and boiled eggs are both "Eggs").
      const id = `${ingredient.label}|${ingredient.aisle}`;
      const existing = totals.get(id);
      const grams = item.grams * slot.servings;
      if (existing) existing.grams += grams;
      else totals.set(id, { key: id, label: ingredient.label, aisle: ingredient.aisle, grams });
    }
  }
  const byAisle = new Map<string, ShoppingItem[]>();
  for (const item of [...totals.values()].sort((a, b) => a.label.localeCompare(b.label))) {
    item.grams = Math.ceil(item.grams / 5) * 5;
    byAisle.set(item.aisle, [...(byAisle.get(item.aisle) ?? []), item]);
  }
  return [...byAisle.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([aisle, items]) => ({ aisle, items }));
}

/** e.g. 1250 → "1.25 kg", 300 → "300 g". */
export function formatGrams(grams: number) {
  return grams >= 1000 ? `${Math.round(grams / 10) / 100} kg` : `${Math.round(grams)} g`;
}

/** e.g. 1.5 → "1½", 0.75 → "¾". */
export function formatServings(servings: number) {
  const whole = Math.floor(servings);
  const fraction = { 0: '', 0.25: '¼', 0.5: '½', 0.75: '¾' }[servings - whole] ?? '';
  return `${whole > 0 ? whole : ''}${fraction}` || '0';
}
