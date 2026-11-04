/**
 * body-visual: creates an AI-edited preview of one of the user's progress
 * photos, showing roughly how they might look at their goal.
 *
 * Runs on Supabase's servers so the image-AI key is never exposed. For each
 * request it:
 *   1. checks the caller is signed in and has agreed to AI previews,
 *   2. checks the image AI is set up (otherwise "ai_not_configured"),
 *   3. checks the photo belongs to the caller,
 *   4. counts one preview against the daily limit,
 *   5. sends the photo to the image AI and saves the result privately in the
 *      user's own folder, expiring after 30 days.
 * It also deletes the user's expired previews.
 *
 * Secrets (set with `supabase secrets set`, never in code):
 *   OPENAI_API_KEY        required to switch previews on
 *   IMAGE_MODEL           optional, defaults to gpt-image-1.5
 *   DAILY_VISUAL_LIMIT    optional, defaults to 3
 */

import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const BUCKET = 'progress-photos';
const DEFAULT_MODEL = 'gpt-image-1.5';
const DEFAULT_DAILY_LIMIT = 3;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

type Goal = 'lose_fat' | 'maintain' | 'build_muscle' | 'recomp';

function buildPrompt(input: { currentKg: number; goalKg: number; goal: Goal; heightCm: number }) {
  const change = input.goalKg - input.currentKg;
  const direction =
    Math.abs(change) < 0.5
      ? 'about the same body weight'
      : change < 0
        ? `about ${Math.abs(change).toFixed(1)} kg lighter, mainly from less body fat`
        : `about ${change.toFixed(1)} kg heavier, mainly from added muscle`;
  const training =
    input.goal === 'build_muscle' || input.goal === 'recomp'
      ? 'after months of consistent strength training, with moderately more muscle definition'
      : 'after months of consistent training and healthy eating';
  return `Edit this photo to show the same person ${direction}, ${training}.

Strict rules:
- Keep it the same real person: same face, skin tone, hair, tattoos, height and proportions.
- Keep the same pose, camera angle, clothing, lighting and background. Do not add or remove clothing.
- Make only realistic, modest, healthy changes that are achievable naturally. No exaggerated muscles, no extreme leanness, no idealised or "fitness model" look.
- Do not change anything other than body shape. Photorealistic, natural result.`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // 1. Who is calling, and have they agreed?
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply(401, { error: 'not_signed_in' });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return reply(401, { error: 'not_signed_in' });
  const userId = userData.user.id;

  const { data: profile } = await admin
    .from('profiles')
    .select('weight_kg, goal_weight_kg, goal, height_cm, body_visual_consent_at, progress_photos_consent_at')
    .eq('id', userId)
    .single();
  if (!profile?.body_visual_consent_at || !profile.progress_photos_consent_at) {
    return reply(403, { error: 'consent_required' });
  }
  if (!profile.weight_kg || !profile.goal_weight_kg || !profile.goal || !profile.height_cm) {
    return reply(400, { error: 'goal_required' });
  }

  // Tidy up: delete this user's expired previews.
  const { data: expired } = await admin
    .from('body_visuals')
    .select('id, storage_path')
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString());
  if (expired?.length) {
    await admin.storage.from(BUCKET).remove(expired.map((v) => v.storage_path));
    await admin.from('body_visuals').delete().in('id', expired.map((v) => v.id));
  }

  // 2. Is the image AI switched on?
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) return reply(503, { error: 'ai_not_configured' });

  // 3. Is the photo the caller's own?
  let photoId: string;
  try {
    photoId = String((await request.json()).photoId ?? '');
  } catch {
    return reply(400, { error: 'invalid_request' });
  }
  const { data: photo } = await admin
    .from('progress_photos')
    .select('id, storage_path, user_id')
    .eq('id', photoId)
    .single();
  if (!photo || photo.user_id !== userId) return reply(404, { error: 'photo_not_found' });

  // 4. Daily limit.
  const dailyLimit = Number(Deno.env.get('DAILY_VISUAL_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const { data: allowed, error: quotaError } = await admin.rpc('consume_ai_quota', {
    p_user_id: userId,
    p_feature: 'body_visual',
    p_daily_limit: dailyLimit,
  });
  if (quotaError) return reply(500, { error: 'server_error' });
  if (!allowed) return reply(429, { error: 'daily_limit_reached', limit: dailyLimit });
  const refund = () => admin.rpc('refund_ai_quota', { p_user_id: userId, p_feature: 'body_visual' });

  try {
    // 5. Send the photo to the image AI.
    const { data: original, error: downloadError } = await admin.storage.from(BUCKET).download(photo.storage_path);
    if (downloadError || !original) throw new Error('download_failed');

    const form = new FormData();
    form.append('model', Deno.env.get('IMAGE_MODEL') || DEFAULT_MODEL);
    form.append('image', new File([original], 'photo.jpg', { type: 'image/jpeg' }));
    form.append(
      'prompt',
      buildPrompt({
        currentKg: Number(profile.weight_kg),
        goalKg: Number(profile.goal_weight_kg),
        goal: profile.goal as Goal,
        heightCm: Number(profile.height_cm),
      }),
    );
    form.append('n', '1');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
    if (!response.ok) {
      await refund();
      const detail = await response.text();
      console.error('Image AI error', response.status, detail.slice(0, 500));
      if (response.status === 401) return reply(503, { error: 'ai_not_configured' });
      if (response.status === 429) return reply(503, { error: 'ai_busy' });
      // The provider's safety system declined this photo.
      if (response.status === 400 && /safety|moderation|policy/i.test(detail)) {
        return reply(422, { error: 'declined_by_ai' });
      }
      return reply(502, { error: 'ai_failed' });
    }
    const result = (await response.json()) as { data?: { b64_json?: string }[] };
    const base64 = result.data?.[0]?.b64_json;
    if (!base64) {
      await refund();
      return reply(502, { error: 'ai_failed' });
    }

    // Save the preview privately in the user's own folder.
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${userId}/visual-${crypto.randomUUID()}.png`;
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'image/png', upsert: false });
    if (uploadError) throw uploadError;

    const { data: saved, error: rowError } = await admin
      .from('body_visuals')
      .insert({ user_id: userId, source_photo_id: photo.id, storage_path: path, goal_weight_kg: profile.goal_weight_kg })
      .select('id')
      .single();
    if (rowError) {
      await admin.storage.from(BUCKET).remove([path]);
      throw rowError;
    }
    return reply(200, { id: saved.id });
  } catch (error) {
    await refund();
    console.error('body-visual failed', error);
    return reply(502, { error: 'ai_failed' });
  }
});
