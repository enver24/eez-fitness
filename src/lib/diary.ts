/**
 * The food diary: loading, adding, changing and deleting entries.
 * Row Level Security guarantees users only ever touch their own entries.
 */

import type { FoodItem, FoodSource, Nutrition } from '@/lib/food';
import { supabase } from '@/lib/supabase';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEALS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snacks' },
];

export type FoodEntry = Nutrition & {
  id: string;
  eatenOn: string;
  meal: MealType;
  name: string;
  brand: string | null;
  source: FoodSource;
  sourceId: string | null;
  amountG: number | null;
  amountLabel: string | null;
  createdAt: string;
};

export type NewFoodEntry = Omit<FoodEntry, 'id' | 'createdAt'>;

type EntryRow = {
  id: string;
  eaten_on: string;
  meal: MealType;
  name: string;
  brand: string | null;
  source: FoodSource;
  source_id: string | null;
  amount_g: number | string | null;
  amount_label: string | null;
  calories: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  created_at: string;
};

const COLUMNS =
  'id, eaten_on, meal, name, brand, source, source_id, amount_g, amount_label, calories, protein_g, carbs_g, fat_g, created_at';

function fromRow(row: EntryRow): FoodEntry {
  return {
    id: row.id,
    eatenOn: row.eaten_on,
    meal: row.meal,
    name: row.name,
    brand: row.brand,
    source: row.source,
    sourceId: row.source_id,
    amountG: row.amount_g === null ? null : Number(row.amount_g),
    amountLabel: row.amount_label,
    calories: Number(row.calories),
    protein: Number(row.protein_g),
    carbs: Number(row.carbs_g),
    fat: Number(row.fat_g),
    createdAt: row.created_at,
  };
}

function toRow(entry: Partial<NewFoodEntry>) {
  return {
    eaten_on: entry.eatenOn,
    meal: entry.meal,
    name: entry.name,
    brand: entry.brand,
    source: entry.source,
    source_id: entry.sourceId,
    amount_g: entry.amountG,
    amount_label: entry.amountLabel,
    calories: entry.calories,
    protein_g: entry.protein,
    carbs_g: entry.carbs,
    fat_g: entry.fat,
  };
}

/** All entries for one day (date as YYYY-MM-DD), oldest first. */
export async function fetchDayEntries(date: string): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select(COLUMNS)
    .eq('eaten_on', date)
    .order('created_at');
  if (error) throw error;
  return (data as EntryRow[]).map(fromRow);
}

/** The user's most recently logged foods, one per name, newest first. */
export async function fetchRecentFoods(limit = 15): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  const seen = new Set<string>();
  const recent: FoodEntry[] = [];
  for (const entry of (data as EntryRow[]).map(fromRow)) {
    const key = `${entry.name}|${entry.brand ?? ''}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push(entry);
    if (recent.length >= limit) break;
  }
  return recent;
}

export async function fetchEntry(id: string): Promise<FoodEntry> {
  const { data, error } = await supabase.from('food_entries').select(COLUMNS).eq('id', id).single();
  if (error) throw error;
  return fromRow(data as EntryRow);
}

export async function addEntry(entry: NewFoodEntry) {
  const { error } = await supabase.from('food_entries').insert(toRow(entry));
  if (error) throw error;
}

export async function updateEntry(id: string, changes: Partial<NewFoodEntry>) {
  const { error } = await supabase.from('food_entries').update(toRow(changes)).eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}

/** Today's date on this phone, as YYYY-MM-DD. */
export function localDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function sumNutrition(entries: Nutrition[]): Nutrition {
  return entries.reduce(
    (total, e) => ({
      calories: total.calories + e.calories,
      protein: total.protein + e.protein,
      carbs: total.carbs + e.carbs,
      fat: total.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

/**
 * Turns a logged entry back into a food (per 100 g), so it can be logged
 * again or edited. Returns null for entries without a weight in grams.
 */
export function entryToFoodItem(entry: FoodEntry): FoodItem | null {
  if (!entry.amountG) return null;
  const per100 = (value: number) => Math.round((value / entry.amountG!) * 1000) / 10;
  return {
    source: entry.source,
    sourceId: entry.sourceId ?? entry.id,
    name: entry.name,
    brand: entry.brand ?? undefined,
    per100g: {
      calories: per100(entry.calories),
      protein: per100(entry.protein),
      carbs: per100(entry.carbs),
      fat: per100(entry.fat),
    },
    serving: { grams: entry.amountG, label: `Last time (${entry.amountG} g)` },
  };
}

/** Adds several entries at once (e.g. every food from a meal scan). */
export async function addEntries(entries: NewFoodEntry[]) {
  const { error } = await supabase.from('food_entries').insert(entries.map(toRow));
  if (error) throw error;
}
