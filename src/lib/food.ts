/**
 * Food search: the Australian Food Composition Database (stored in our own
 * Supabase database) and Open Food Facts (packaged products, searched live).
 */

import Constants from 'expo-constants';

import { supabase } from '@/lib/supabase';

export type FoodSource = 'afcd' | 'off' | 'manual' | 'ai';

/** A food that can be added to the diary, with nutrition per 100 g. */
export type FoodItem = {
  source: FoodSource;
  sourceId: string;
  name: string;
  brand?: string;
  per100g: { calories: number; protein: number; carbs: number; fat: number };
  /** A typical serving, if known (e.g. from the product label). */
  serving?: { grams: number; label: string };
};

export type Nutrition = { calories: number; protein: number; carbs: number; fat: number };

/** Nutrition for a given amount of a food. */
export function nutritionFor(item: FoodItem, grams: number): Nutrition {
  const factor = grams / 100;
  const round = (value: number) => Math.round(value * factor * 10) / 10;
  return {
    calories: round(item.per100g.calories),
    protein: round(item.per100g.protein),
    carbs: round(item.per100g.carbs),
    fat: round(item.per100g.fat),
  };
}

type FoodRow = {
  id: string;
  name: string;
  kcal_100g: number | string;
  protein_100g: number | string;
  carbs_100g: number | string;
  fat_100g: number | string;
};

/** Searches the Australian Food Composition Database. */
export async function searchAustralianFoods(query: string): Promise<FoodItem[]> {
  const { data, error } = await supabase.rpc('search_foods', { query, max_results: 25 });
  if (error) throw error;
  return (data as FoodRow[]).map((row) => ({
    source: 'afcd',
    sourceId: row.id,
    name: row.name,
    per100g: {
      calories: Number(row.kcal_100g),
      protein: Number(row.protein_100g),
      carbs: Number(row.carbs_100g),
      fat: Number(row.fat_100g),
    },
  }));
}

// Open Food Facts asks every app to identify itself with a contact email,
// set in .env as EXPO_PUBLIC_OFF_CONTACT_EMAIL.
const OFF_CONTACT = process.env.EXPO_PUBLIC_OFF_CONTACT_EMAIL || 'private beta';
const OFF_USER_AGENT = `EEZFitness/${Constants.expoConfig?.version ?? '1.0'} (${OFF_CONTACT})`;

type OffHit = {
  code?: string;
  product_name?: string;
  brands?: string[] | string;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: Record<string, number | string | undefined>;
};

/**
 * Searches Open Food Facts for packaged products sold in Australia.
 * Their free API allows about 10 searches a minute per person, so the app
 * only searches when the user stops typing.
 */
export async function searchPackagedFoods(query: string): Promise<FoodItem[]> {
  const params = new URLSearchParams({
    q: `${query} countries_tags:"en:australia"`,
    page_size: '20',
    fields: 'code,product_name,brands,serving_quantity,serving_size,nutriments',
  });
  const response = await fetch(`https://search.openfoodfacts.org/search?${params}`, {
    headers: { 'User-Agent': OFF_USER_AGENT },
  });
  if (!response.ok) throw new Error(`Open Food Facts search failed (${response.status})`);
  const body = (await response.json()) as { hits?: OffHit[] };

  const items: FoodItem[] = [];
  for (const hit of body.hits ?? []) {
    const n = hit.nutriments ?? {};
    const kcal = toNumber(n['energy-kcal_100g']) ?? kjToKcal(toNumber(n['energy-kj_100g']));
    // Skip products without basic nutrition information.
    if (!hit.code || !hit.product_name || kcal === undefined) continue;
    const brand = Array.isArray(hit.brands) ? hit.brands[0] : hit.brands?.split(',')[0];
    const servingGrams = toNumber(hit.serving_quantity);
    items.push({
      source: 'off',
      sourceId: hit.code,
      name: hit.product_name.trim(),
      brand: brand?.trim() || undefined,
      per100g: {
        calories: round1(kcal),
        protein: round1(toNumber(n['proteins_100g']) ?? 0),
        carbs: round1(toNumber(n['carbohydrates_100g']) ?? 0),
        fat: round1(toNumber(n['fat_100g']) ?? 0),
      },
      serving:
        servingGrams && servingGrams > 0 && servingGrams < 2000
          ? { grams: servingGrams, label: hit.serving_size?.trim() || `${servingGrams} g` }
          : undefined,
    });
  }
  return items;
}

function toNumber(value: number | string | undefined) {
  if (value === undefined || value === '') return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function kjToKcal(kj: number | undefined) {
  return kj === undefined ? undefined : kj / 4.184;
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export const SOURCE_LABELS: Record<FoodSource, string> = {
  afcd: 'Australian Food Composition Database',
  off: 'Open Food Facts (product label)',
  manual: 'Entered by you',
  ai: 'AI estimate from photo',
};
