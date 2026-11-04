/**
 * Turning AI scan results into editable rows. When the user changes the
 * amount, calories and macros scale with it, keeping the AI's per-gram ratio.
 */

import type { ScannedItem } from '@/lib/meal-scan';

export type ReviewItem = {
  key: string;
  name: string;
  /** What the user typed, kept as text while editing. */
  grams: string;
  confidence: ScannedItem['confidence'];
  /** Nutrition per gram, from the AI's estimate. */
  perGram: { calories: number; protein: number; carbs: number; fat: number };
};

let counter = 0;

export function reviewItemFromScan(item: ScannedItem): ReviewItem {
  const grams = item.estimated_grams > 0 ? item.estimated_grams : 100;
  return {
    key: `scan-${counter++}`,
    name: item.name,
    grams: String(item.estimated_grams > 0 ? item.estimated_grams : ''),
    confidence: item.confidence,
    perGram: {
      calories: item.calories / grams,
      protein: item.protein_g / grams,
      carbs: item.carbs_g / grams,
      fat: item.fat_g / grams,
    },
  };
}

/** Nutrition for the amount entered, or null if the row isn't valid yet. */
export function scaleReviewItem(item: ReviewItem) {
  const grams = Number(item.grams.replace(',', '.'));
  const name = item.name.trim();
  if (!name || !Number.isFinite(grams) || grams <= 0 || grams > 5000) return null;
  const round = (value: number) => Math.round(value * grams * 10) / 10;
  return {
    name: name.slice(0, 120),
    grams: Math.round(grams * 10) / 10,
    calories: round(item.perGram.calories),
    protein: round(item.perGram.protein),
    carbs: round(item.perGram.carbs),
    fat: round(item.perGram.fat),
  };
}
