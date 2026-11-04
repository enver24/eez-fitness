/**
 * analyse-meal: estimates the foods, portions and nutrition in a meal photo.
 *
 * Runs on Supabase's servers (an "Edge Function"), never on the phone, so
 * the AI provider's secret key is never exposed. For each request it:
 *   1. checks the caller is signed in,
 *   2. checks the AI key is set up (otherwise returns "ai_not_configured"),
 *   3. counts one scan against the user's daily limit,
 *   4. sends the photo to the AI and returns structured estimates.
 *
 * The photo is not stored anywhere: it's only held in memory while the
 * request runs.
 *
 * Secrets (set with `supabase secrets set`, never in code):
 *   ANTHROPIC_API_KEY     required to switch scanning on
 *   AI_MODEL              optional, defaults to claude-opus-5-5
 *   DAILY_SCAN_LIMIT      optional, defaults to 10
 */

import Anthropic from 'npm:@anthropic-ai/sdk@1.3.0';
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const DEFAULT_MODEL = 'claude-opus-5-5';
const DEFAULT_DAILY_LIMIT = 10;
// Base64 is ~4/3 the size of the image; the app sends ~1024 px JPEGs (~200 KB).
const MAX_IMAGE_BASE64_LENGTH = 4_000_000;

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

/** The exact JSON shape the AI must return. */
const RESULT_SCHEMA = {
  type: 'object',
  properties: {
    is_food: {
      type: 'boolean',
      description: 'False if the photo does not clearly show food or drink.',
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Plain name of the food, e.g. "Grilled chicken breast".' },
          estimated_grams: { type: 'number', description: 'Estimated weight of this item as served, in grams.' },
          calories: { type: 'number', description: 'Estimated kcal for the estimated amount.' },
          protein_g: { type: 'number' },
          carbs_g: { type: 'number' },
          fat_g: { type: 'number' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['name', 'estimated_grams', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'confidence'],
        additionalProperties: false,
      },
    },
    note: {
      type: 'string',
      description: 'One short sentence about anything uncertain, e.g. hidden oil or sauce. Empty if nothing.',
    },
  },
  required: ['is_food', 'items', 'note'],
  additionalProperties: false,
} as const;

const PROMPT = `You estimate the nutrition of meals from photos for a food-tracking app used in Australia.

Identify each distinct food or drink in the photo and estimate its weight in grams as served, then estimate calories (kcal), protein, carbohydrate and fat for that amount, using typical Australian food composition values.

Guidelines:
- List separate components separately (e.g. rice, curry, naan) unless they're a single item like a sandwich.
- Use visual cues (plate size, cutlery, hands, packaging) to judge portion size.
- Include likely cooking oil, butter or sauces in the item they're part of, and mention them in "note" if unsure.
- Set confidence to "low" when an item is hard to identify or its portion is hard to judge.
- If the photo doesn't show food or drink, set is_food to false and return an empty items list.
- Never return negative numbers. Round grams and kcal to whole numbers and macros to one decimal place.`;

type ScanItem = {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: 'low' | 'medium' | 'high';
};

/** Keeps only sensible, non-negative values so bad output can't reach the diary. */
function cleanItems(items: ScanItem[]) {
  const clamp = (value: number, max: number) =>
    Number.isFinite(value) ? Math.min(Math.max(value, 0), max) : 0;
  return items
    .filter((item) => typeof item.name === 'string' && item.name.trim() !== '')
    .slice(0, 15)
    .map((item) => ({
      name: item.name.trim().slice(0, 120),
      estimated_grams: Math.round(clamp(item.estimated_grams, 5000)),
      calories: Math.round(clamp(item.calories, 10000)),
      protein_g: Math.round(clamp(item.protein_g, 1000) * 10) / 10,
      carbs_g: Math.round(clamp(item.carbs_g, 1000) * 10) / 10,
      fat_g: Math.round(clamp(item.fat_g, 1000) * 10) / 10,
      confidence: ['low', 'medium', 'high'].includes(item.confidence) ? item.confidence : 'low',
    }));
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });

  // 1. Who is calling? Verify the signed-in user's token with Supabase.
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply(401, { error: 'not_signed_in' });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return reply(401, { error: 'not_signed_in' });
  const userId = userData.user.id;

  // 2. Is AI scanning switched on?
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return reply(503, { error: 'ai_not_configured' });

  // Check the photo before using up a scan.
  let image: string;
  let mediaType: 'image/jpeg' | 'image/png';
  try {
    const body = await request.json();
    image = String(body.image ?? '');
    mediaType = body.mediaType === 'image/png' ? 'image/png' : 'image/jpeg';
  } catch {
    return reply(400, { error: 'invalid_request' });
  }
  if (!image || !/^[A-Za-z0-9+/=]+$/.test(image)) return reply(400, { error: 'invalid_image' });
  if (image.length > MAX_IMAGE_BASE64_LENGTH) return reply(413, { error: 'image_too_large' });

  // 3. Count this scan against today's limit.
  const dailyLimit = Number(Deno.env.get('DAILY_SCAN_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const { data: allowed, error: quotaError } = await admin.rpc('consume_ai_quota', {
    p_user_id: userId,
    p_feature: 'meal_scan',
    p_daily_limit: dailyLimit,
  });
  if (quotaError) return reply(500, { error: 'server_error' });
  if (!allowed) return reply(429, { error: 'daily_limit_reached', limit: dailyLimit });

  const refund = () => admin.rpc('refund_ai_quota', { p_user_id: userId, p_feature: 'meal_scan' });

  // 4. Ask the AI.
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.beta.messages.create({
      model: Deno.env.get('AI_MODEL') || DEFAULT_MODEL,
      max_tokens: 16000,
      // A simple, well-defined task: low effort keeps it fast and cheap.
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: RESULT_SCHEMA },
      },
      // If a safety filter wrongly declines a photo, Anthropic retries it on
      // a suitable fallback model automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);

    if (response.stop_reason === 'refusal') {
      await refund();
      return reply(422, { error: 'could_not_analyse' });
    }
    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') {
      await refund();
      return reply(502, { error: 'ai_failed' });
    }
    const parsed = JSON.parse(text.text) as { is_food: boolean; items: ScanItem[]; note: string };
    if (!parsed.is_food || parsed.items.length === 0) {
      // Not food: don't charge the user a scan.
      await refund();
      return reply(200, { isFood: false, items: [], note: parsed.note ?? '' });
    }
    return reply(200, {
      isFood: true,
      items: cleanItems(parsed.items),
      note: String(parsed.note ?? '').slice(0, 300),
    });
  } catch (error) {
    await refund();
    if (error instanceof Anthropic.RateLimitError) return reply(503, { error: 'ai_busy' });
    if (error instanceof Anthropic.AuthenticationError) return reply(503, { error: 'ai_not_configured' });
    if (error instanceof Anthropic.APIError) return reply(502, { error: 'ai_failed' });
    return reply(502, { error: 'ai_failed' });
  }
});
