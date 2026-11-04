/// <reference types="jest" />

import { entryToFoodItem, sumNutrition, type FoodEntry } from '@/lib/diary';
import { nutritionFor, type FoodItem } from '@/lib/food';

// The Supabase client isn't needed for these calculations.
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const banana: FoodItem = {
  source: 'afcd',
  sourceId: 'F000262',
  name: 'Banana, cavendish, peeled, raw',
  per100g: { calories: 95.4, protein: 1.4, carbs: 19.9, fat: 0.2 },
};

describe('nutritionFor', () => {
  it('scales per-100 g values to the amount eaten', () => {
    expect(nutritionFor(banana, 120)).toEqual({ calories: 114.5, protein: 1.7, carbs: 23.9, fat: 0.2 });
  });

  it('returns zero for zero grams', () => {
    expect(nutritionFor(banana, 0)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('entryToFoodItem', () => {
  const entry: FoodEntry = {
    id: 'e1',
    eatenOn: '2026-11-04',
    meal: 'snack',
    name: banana.name,
    brand: null,
    source: 'afcd',
    sourceId: 'F000262',
    amountG: 120,
    amountLabel: null,
    calories: 114.5,
    protein: 1.7,
    carbs: 23.9,
    fat: 0.2,
    createdAt: '2026-11-04T01:00:00Z',
  };

  it('works out per-100 g values from a logged entry', () => {
    const item = entryToFoodItem(entry)!;
    expect(item.per100g.calories).toBeCloseTo(95.4, 0);
    expect(item.serving?.grams).toBe(120);
  });

  it('returns null for manual entries without grams', () => {
    expect(entryToFoodItem({ ...entry, amountG: null })).toBeNull();
  });
});

describe('sumNutrition', () => {
  it('adds up a day of food', () => {
    const total = sumNutrition([
      { calories: 100, protein: 10, carbs: 5, fat: 2 },
      { calories: 250.5, protein: 20, carbs: 30, fat: 8 },
    ]);
    expect(total).toEqual({ calories: 350.5, protein: 30, carbs: 35, fat: 10 });
  });
});
