import type { LoggedFood, Macros } from '@/data/sample';

export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Adds up calories and macros for a list of foods. */
export function sumMacros(foods: LoggedFood[]): Macros {
  return foods.reduce(
    (total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein,
      carbs: total.carbs + food.carbs,
      fat: total.fat + food.fat,
    }),
    EMPTY_MACROS,
  );
}

/** Australia labels food energy in kilojoules: 1 kcal = 4.184 kJ. */
export function kcalToKj(kcal: number) {
  return Math.round(kcal * 4.184);
}

export function formatNumber(value: number) {
  return value.toLocaleString('en-AU');
}
