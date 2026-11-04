/**
 * AI meal scanning: shrinks the photo on the phone, then sends it to our
 * analyse-meal server function, which holds the AI key and the daily limit.
 * The photo is never stored, on the phone or the server.
 */

import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { supabase } from '@/lib/supabase';

export type ScannedItem = {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
};

export type ScanResult = { isFood: boolean; items: ScannedItem[]; note: string };

export type ScanErrorCode =
  | 'ai_not_configured'
  | 'daily_limit_reached'
  | 'could_not_analyse'
  | 'image_too_large'
  | 'ai_busy'
  | 'not_signed_in'
  | 'network'
  | 'unknown';

export class ScanError extends Error {
  constructor(public code: ScanErrorCode) {
    super(code);
  }
}

export const SCAN_ERROR_MESSAGES: Record<ScanErrorCode, string> = {
  ai_not_configured: 'AI scanning isn’t switched on yet. You can still search for foods or add them manually.',
  daily_limit_reached: 'You’ve used all your scans for today. They reset at midnight.',
  could_not_analyse: 'The AI couldn’t analyse this photo. Try another photo, or add the food manually.',
  image_too_large: 'That photo is too large. Try taking it again.',
  ai_busy: 'The AI service is busy right now. Try again in a minute.',
  not_signed_in: 'Your session has expired. Sign out and back in, then try again.',
  network: 'Couldn’t connect. Check your internet connection and try again.',
  unknown: 'Something went wrong analysing the photo. Try again, or add the food manually.',
};

/** Resizes a photo to at most 1024 px on its longest side, as a compressed JPEG. */
export async function preparePhoto(uri: string, width: number, height: number) {
  const longest = Math.max(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (longest > 1024) {
    context.resize(width >= height ? { width: 1024 } : { height: 1024 });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ base64: true, compress: 0.7, format: SaveFormat.JPEG });
  if (!result.base64) throw new ScanError('unknown');
  return result.base64;
}

export async function analyseMeal(imageBase64: string): Promise<ScanResult> {
  const { data, error } = await supabase.functions.invoke<ScanResult>('analyse-meal', {
    body: { image: imageBase64, mediaType: 'image/jpeg' },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => ({}))) as { error?: ScanErrorCode };
      throw new ScanError(body.error && body.error in SCAN_ERROR_MESSAGES ? body.error : 'unknown');
    }
    throw new ScanError('network');
  }
  if (!data) throw new ScanError('unknown');
  return data;
}

/**
 * A made-up result for trying the review screen while AI is switched off.
 * Only offered in development builds, and clearly labelled as a sample.
 */
export const SAMPLE_SCAN_RESULT: ScanResult = {
  isFood: true,
  note: 'Sample result for testing. The oil used for cooking may add extra calories.',
  items: [
    { name: 'Grilled chicken breast', estimated_grams: 150, calories: 248, protein_g: 46.5, carbs_g: 0, fat_g: 5.4, confidence: 'high' },
    { name: 'Steamed white rice', estimated_grams: 180, calories: 234, protein_g: 4.3, carbs_g: 51.5, fat_g: 0.5, confidence: 'medium' },
    { name: 'Broccoli', estimated_grams: 80, calories: 27, protein_g: 2.8, carbs_g: 2.2, fat_g: 0.3, confidence: 'medium' },
  ],
};
