/**
 * Saving and loading the user's meal plan and favourite meals.
 * Row Level Security keeps both private to the user.
 */

import type { MealType } from '@/lib/diary';
import type { PlannedSlot } from '@/lib/meal-planner';
import { supabase } from '@/lib/supabase';

export type PlannedMeal = PlannedSlot & { id: string };

type Row = { id: string; planned_on: string; meal: MealType; meal_id: string; servings: number | string };

export async function fetchPlannedMeals(from: string, to: string): Promise<PlannedMeal[]> {
  const { data, error } = await supabase
    .from('planned_meals')
    .select('id, planned_on, meal, meal_id, servings')
    .gte('planned_on', from)
    .lte('planned_on', to)
    .order('planned_on');
  if (error) throw error;
  return (data as Row[]).map((row) => ({
    id: row.id,
    date: row.planned_on,
    meal: row.meal,
    mealId: row.meal_id,
    servings: Number(row.servings),
  }));
}

/** Replaces the plan for the given days with new slots. */
export async function replacePlan(dates: string[], slots: PlannedSlot[]) {
  const { error: deleteError } = await supabase.from('planned_meals').delete().in('planned_on', dates);
  if (deleteError) throw deleteError;
  if (slots.length === 0) return;
  const { error } = await supabase.from('planned_meals').insert(
    slots.map((slot) => ({
      planned_on: slot.date,
      meal: slot.meal,
      meal_id: slot.mealId,
      servings: slot.servings,
    })),
  );
  if (error) throw error;
}

export async function updatePlannedMeal(id: string, changes: { mealId?: string; servings?: number }) {
  const { error } = await supabase
    .from('planned_meals')
    .update({
      ...(changes.mealId !== undefined && { meal_id: changes.mealId }),
      ...(changes.servings !== undefined && { servings: changes.servings }),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deletePlannedMeal(id: string) {
  const { error } = await supabase.from('planned_meals').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchFavourites(): Promise<string[]> {
  const { data, error } = await supabase.from('favourite_meals').select('meal_id');
  if (error) throw error;
  return (data as { meal_id: string }[]).map((row) => row.meal_id);
}

export async function setFavourite(mealId: string, favourite: boolean) {
  const { error } = favourite
    ? await supabase.from('favourite_meals').upsert({ meal_id: mealId }, { onConflict: 'user_id,meal_id' })
    : await supabase.from('favourite_meals').delete().eq('meal_id', mealId);
  if (error) throw error;
}

/** The next `days` dates starting today, as YYYY-MM-DD. */
export function upcomingDates(days: number, from = new Date()) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(from);
    date.setDate(date.getDate() + index);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
}
