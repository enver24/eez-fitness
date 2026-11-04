/// <reference types="jest" />

import { INGREDIENTS, MEALS } from '@/data/meal-library';
import {
  MEAL_SHARES,
  formatServings,
  generatePlan,
  isMealAllowed,
  mealNutrition,
  seededRandom,
  servingsFor,
  shoppingList,
  type PlanPreferences,
} from '@/lib/meal-planner';

const base: PlanPreferences = { dietaryPreferences: [], allergies: [], budget: 'any', favourites: [] };
const week = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'];
const meal = (id: string) => MEALS.find((m) => m.id === id)!;

function planFor(prefs: Partial<PlanPreferences>, calorieTarget = 2200) {
  return generatePlan({
    dates: week,
    calorieTarget,
    library: MEALS,
    ingredients: INGREDIENTS,
    prefs: { ...base, ...prefs },
    random: seededRandom(42),
  });
}

describe('meal library', () => {
  it('has meals for every slot, each with a method and real ingredients', () => {
    for (const type of ['breakfast', 'lunch', 'dinner', 'snack'] as const) {
      expect(MEALS.filter((m) => m.mealType === type).length).toBeGreaterThanOrEqual(8);
    }
    for (const m of MEALS) {
      expect(m.method.length).toBeGreaterThan(10);
      for (const item of m.ingredients) expect(INGREDIENTS[item.key]).toBeDefined();
    }
  });

  it('never labels a meal with meat or fish as vegetarian', () => {
    for (const m of MEALS) {
      const kinds = m.ingredients.map((i) => INGREDIENTS[i.key].kind);
      if (kinds.some((k) => ['poultry', 'beef', 'lamb', 'pork', 'game', 'fish', 'shellfish'].includes(k))) {
        expect(m.diets).not.toContain('vegetarian');
      }
    }
  });
});

describe('allergy and diet safety', () => {
  it('never includes a meal with the user’s allergen', () => {
    for (const allergy of ['Peanuts', 'Tree nuts', 'Milk / dairy', 'Eggs', 'Gluten / wheat', 'Soy', 'Fish', 'Shellfish', 'Sesame']) {
      const plan = planFor({ allergies: [allergy] });
      expect(plan.length).toBeGreaterThan(0);
      const key = { Peanuts: 'peanuts', 'Tree nuts': 'tree_nuts', 'Milk / dairy': 'milk', Eggs: 'eggs', 'Gluten / wheat': 'gluten', Soy: 'soy', Fish: 'fish', Shellfish: 'shellfish', Sesame: 'sesame' }[allergy]!;
      for (const slot of plan) expect(meal(slot.mealId).allergens).not.toContain(key);
    }
  });

  it('respects typed-in allergies by ingredient name', () => {
    const plan = planFor({ allergies: ['Avocado'] });
    for (const slot of plan) {
      const labels = meal(slot.mealId).ingredients.map((i) => INGREDIENTS[i.key].label.toLowerCase());
      expect(labels.join(' ')).not.toContain('avocado');
    }
  });

  it('only gives vegans vegan meals', () => {
    const plan = planFor({ dietaryPreferences: ['Vegan'] });
    expect(plan.length).toBeGreaterThan(0);
    for (const slot of plan) expect(meal(slot.mealId).diets).toContain('vegan');
  });

  it('never gives pork to halal plans', () => {
    const plan = planFor({ dietaryPreferences: ['Halal'] });
    for (const slot of plan) {
      const kinds = meal(slot.mealId).ingredients.map((i) => INGREDIENTS[i.key].kind);
      expect(kinds).not.toContain('pork');
    }
  });

  it('keeps budget plans to budget meals', () => {
    for (const slot of planFor({ budget: 'low' })) expect(meal(slot.mealId).cost).toBe(1);
  });

  it('allows a meal only when every restriction passes', () => {
    expect(isMealAllowed(meal('pb-banana-toast'), { ...base, allergies: ['Peanuts'] }, INGREDIENTS)).toBe(false);
    expect(isMealAllowed(meal('pb-banana-toast'), { ...base, dietaryPreferences: ['Vegan'] }, INGREDIENTS)).toBe(true);
  });
});

describe('planning', () => {
  it('plans four meals a day for a week', () => {
    expect(planFor({})).toHaveLength(28);
  });

  it('lands close to the calorie target each day', () => {
    const target = 2200;
    const plan = planFor({}, target);
    for (const date of week) {
      const day = plan.filter((s) => s.date === date);
      const kcal = day.reduce((sum, s) => sum + mealNutrition(meal(s.mealId), s.servings).calories, 0);
      expect(Math.abs(kcal - target) / target).toBeLessThan(0.15);
    }
  });

  it('doesn’t repeat a main meal on back-to-back days', () => {
    const plan = planFor({});
    for (let d = 1; d < week.length; d++) {
      const today = plan.filter((s) => s.date === week[d] && s.meal === 'dinner')[0];
      const yesterday = plan.filter((s) => s.date === week[d - 1] && s.meal === 'dinner')[0];
      expect(today.mealId).not.toBe(yesterday.mealId);
    }
  });

  it('scales servings in quarters between ½ and 2½', () => {
    const smoothie = meal('protein-smoothie');
    expect(servingsFor(smoothie, smoothie.perServing.kcal * 1.5)).toBe(1.5);
    expect(servingsFor(smoothie, 10)).toBe(0.5);
    expect(servingsFor(smoothie, 99999)).toBe(2.5);
    expect(MEAL_SHARES.breakfast + MEAL_SHARES.lunch + MEAL_SHARES.dinner + MEAL_SHARES.snack).toBeCloseTo(1);
  });
});

describe('shopping list', () => {
  it('adds up ingredients across meals and servings', () => {
    const list = shoppingList(
      [
        { mealId: 'scrambled-eggs-toast', servings: 2 },
        { mealId: 'boiled-eggs-tomatoes', servings: 1 },
      ],
      MEALS,
      INGREDIENTS,
    );
    const eggs = list.flatMap((a) => a.items).find((i) => i.label === 'Eggs');
    // 150 g × 2 + 100 g, merged across raw and boiled eggs.
    expect(eggs?.grams).toBe(400);
  });

  it('formats servings as fractions', () => {
    expect(formatServings(1.5)).toBe('1½');
    expect(formatServings(0.75)).toBe('¾');
    expect(formatServings(2)).toBe('2');
  });
});
