/**
 * Progress photos: stored in a private Supabase Storage bucket, in a folder
 * named after the user's id. Storage rules and Row Level Security mean only
 * the owner can ever read, add or delete them. Photos are shown through
 * signed links that expire after an hour, and are never sent to AI.
 */

import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { PhotoReminder } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { startOfWeek } from '@/lib/workouts';

export const PHOTO_BUCKET = 'progress-photos';
const SIGNED_URL_SECONDS = 60 * 60;
const MAX_SIDE = 1440;

export type Pose = 'front' | 'side' | 'back' | 'other';

export const POSES: { value: Pose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
  { value: 'other', label: 'Other' },
];

export type ProgressPhoto = {
  id: string;
  storagePath: string;
  takenOn: string;
  pose: Pose;
  note: string | null;
};

type Row = { id: string; storage_path: string; taken_on: string; pose: Pose; note: string | null };

/** All photos, newest first. */
export async function fetchPhotos(): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from('progress_photos')
    .select('id, storage_path, taken_on, pose, note')
    .order('taken_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Row[]).map((row) => ({
    id: row.id,
    storagePath: row.storage_path,
    takenOn: row.taken_on,
    pose: row.pose,
    note: row.note,
  }));
}

/** Temporary links (valid for an hour) to display photos, keyed by storage path. */
export async function fetchSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw error;
  const urls: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
  }
  return urls;
}

function randomId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Shrinks the photo, uploads it to the user's private folder and records it. */
export async function uploadPhoto(input: {
  userId: string;
  uri: string;
  width: number;
  height: number;
  takenOn: string;
  pose: Pose;
  note: string;
}) {
  const context = ImageManipulator.manipulate(input.uri);
  if (Math.max(input.width, input.height) > MAX_SIDE) {
    context.resize(input.width >= input.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  const bytes = await new File(saved.uri).arrayBuffer();

  const path = `${input.userId}/${randomId()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });
  if (uploadError) throw uploadError;

  const { error: rowError } = await supabase
    .from('progress_photos')
    .insert({
      storage_path: path,
      taken_on: input.takenOn,
      pose: input.pose,
      note: input.note.trim().slice(0, 200) || null,
    });
  if (rowError) {
    // Don't leave an orphaned file behind.
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
    throw rowError;
  }
}

/** Changes a photo's note (an empty note removes it). */
export async function updatePhotoNote(id: string, note: string) {
  const { error } = await supabase
    .from('progress_photos')
    .update({ note: note.trim().slice(0, 200) || null })
    .eq('id', id);
  if (error) throw error;
}

/** Deletes the photo file and its details. */
export async function deletePhoto(photo: ProgressPhoto) {
  const { error: fileError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storagePath]);
  if (fileError) throw fileError;
  const { error } = await supabase.from('progress_photos').delete().eq('id', photo.id);
  if (error) throw error;
}

/**
 * Deletes every photo file in the user's folder. Called before deleting an
 * account, because removing the account doesn't remove stored files.
 */
export async function deleteAllPhotoFiles(userId: string) {
  const storage = supabase.storage.from(PHOTO_BUCKET);
  for (;;) {
    const { data, error } = await storage.list(userId, { limit: 100 });
    if (error) throw error;
    if (!data || data.length === 0) return;
    const { error: removeError } = await storage.remove(data.map((file) => `${userId}/${file.name}`));
    if (removeError) throw removeError;
  }
}

/** The earliest and latest photo of the same pose, for a before/after view. */
export function comparisonPair(photos: ProgressPhoto[], pose: Pose) {
  const matching = photos.filter((p) => p.pose === pose);
  if (matching.length < 2) return null;
  const sorted = [...matching].sort((a, b) => (a.takenOn < b.takenOn ? -1 : a.takenOn > b.takenOn ? 1 : 0));
  return { before: sorted[0], after: sorted[sorted.length - 1] };
}

export const REMINDER_OPTIONS: { value: PhotoReminder; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'week_start', label: 'Start of week (Mon)' },
  { value: 'week_end', label: 'End of week (Sun)' },
];

/**
 * Whether to show the weekly photo check-in today: it's the chosen day
 * (Monday for the start of the week, Sunday for the end) and there's no
 * photo yet this week (weeks run Monday to Sunday).
 */
export function isPhotoCheckInDue(reminder: PhotoReminder, photos: ProgressPhoto[], today = new Date()) {
  if (reminder === 'off') return false;
  const day = today.getDay(); // Sunday = 0, Monday = 1
  if (reminder === 'week_start' && day !== 1) return false;
  if (reminder === 'week_end' && day !== 0) return false;
  const weekStart = startOfWeek(today);
  return !photos.some((photo) => photo.takenOn >= weekStart);
}

/** e.g. "4 Nov 2026" */
export function formatPhotoDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
