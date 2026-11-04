/**
 * AI body previews: AI-edited copies of a user's progress photos, made by the
 * body-visual server function. Stored privately in the user's photo folder;
 * they expire after 30 days unless kept.
 */

import { FunctionsHttpError } from '@supabase/supabase-js';

import { PHOTO_BUCKET } from '@/lib/progress-photos';
import { supabase } from '@/lib/supabase';

export type BodyVisual = {
  id: string;
  sourcePhotoId: string | null;
  storagePath: string;
  goalWeightKg: number | null;
  createdAt: string;
  expiresAt: string | null;
};

export type VisualErrorCode =
  | 'ai_not_configured'
  | 'consent_required'
  | 'goal_required'
  | 'daily_limit_reached'
  | 'declined_by_ai'
  | 'ai_busy'
  | 'photo_not_found'
  | 'network'
  | 'unknown';

export const VISUAL_ERROR_MESSAGES: Record<VisualErrorCode, string> = {
  ai_not_configured: 'AI previews aren’t switched on yet.',
  consent_required: 'Agree to AI previews first.',
  goal_required: 'Set your goal and goal weight in Profile first.',
  daily_limit_reached: 'You’ve made all your previews for today. Try again tomorrow.',
  declined_by_ai: 'The AI service declined this photo. Try a different photo.',
  ai_busy: 'The AI service is busy. Try again in a minute.',
  photo_not_found: 'That photo couldn’t be found.',
  network: 'Couldn’t connect. Check your internet connection and try again.',
  unknown: 'Something went wrong making the preview. Try again later.',
};

export class VisualError extends Error {
  constructor(public code: VisualErrorCode) {
    super(code);
  }
}

type Row = {
  id: string;
  source_photo_id: string | null;
  storage_path: string;
  goal_weight_kg: number | string | null;
  created_at: string;
  expires_at: string | null;
};

export async function fetchVisuals(): Promise<BodyVisual[]> {
  const { data, error } = await supabase
    .from('body_visuals')
    .select('id, source_photo_id, storage_path, goal_weight_kg, created_at, expires_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  const now = Date.now();
  return (data as Row[])
    .map((row) => ({
      id: row.id,
      sourcePhotoId: row.source_photo_id,
      storagePath: row.storage_path,
      goalWeightKg: row.goal_weight_kg === null ? null : Number(row.goal_weight_kg),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }))
    .filter((visual) => !visual.expiresAt || new Date(visual.expiresAt).getTime() > now);
}

export async function createVisual(photoId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ id: string }>('body-visual', { body: { photoId } });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const body = (await error.context.json().catch(() => ({}))) as { error?: VisualErrorCode };
      throw new VisualError(body.error && body.error in VISUAL_ERROR_MESSAGES ? body.error : 'unknown');
    }
    throw new VisualError('network');
  }
  if (!data?.id) throw new VisualError('unknown');
  return data.id;
}

/** Keep a preview (it won't expire) or let it expire 30 days after it was made. */
export async function setKeepVisual(visual: BodyVisual, keep: boolean) {
  const expiresAt = keep ? null : new Date(new Date(visual.createdAt).getTime() + 30 * 86400000).toISOString();
  const { error } = await supabase.from('body_visuals').update({ expires_at: expiresAt }).eq('id', visual.id);
  if (error) throw error;
}

export async function deleteVisual(visual: BodyVisual) {
  const { error: fileError } = await supabase.storage.from(PHOTO_BUCKET).remove([visual.storagePath]);
  if (fileError) throw fileError;
  const { error } = await supabase.from('body_visuals').delete().eq('id', visual.id);
  if (error) throw error;
}

/** Days until a preview expires, or null if it's kept. */
export function daysLeft(visual: BodyVisual, now = new Date()) {
  if (!visual.expiresAt) return null;
  return Math.max(Math.ceil((new Date(visual.expiresAt).getTime() - now.getTime()) / 86400000), 0);
}
