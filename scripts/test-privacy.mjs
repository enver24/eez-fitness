/**
 * Privacy test: proves one user can't see or change another user's data.
 *
 * Run with:  npm run test:privacy
 *
 * It creates two temporary accounts (A and B) in the Supabase project from
 * .env, runs the checks, then deletes both accounts again.
 * Requires email confirmation to be OFF (true in development).
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase settings. Run this with: npm run test:privacy');
  process.exit(1);
}

const stamp = Date.now();
const password = `Test-${stamp}-${Math.random().toString(36).slice(2)}`;
let failures = 0;

function check(description, passed) {
  console.log(`${passed ? '✅' : '❌'} ${description}`);
  if (!passed) failures += 1;
}

async function createUser(label) {
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.auth.signUp({
    email: `eez-privacy-test-${label}-${stamp}@example.com`,
    password,
    options: { data: { first_name: `Test ${label}` } },
  });
  if (error) throw new Error(`Couldn't create test user ${label}: ${error.message}`);
  if (!data.session) throw new Error('No session: turn off "Confirm email" in Supabase for this test.');
  return { client, id: data.user.id };
}

const users = [];
try {
  const a = await createUser('a');
  users.push(a);
  const b = await createUser('b');
  users.push(b);
  console.log('Created two temporary test users.\n');

  // A saves some private details.
  const { error: saveError } = await a.client.from('profiles').update({ weight_kg: 81.5 }).eq('id', a.id);
  check('User A can update their own profile', !saveError);

  const { data: ownProfile } = await a.client.from('profiles').select('weight_kg').eq('id', a.id).single();
  check('User A can read their own profile', Number(ownProfile?.weight_kg) === 81.5);

  // B tries to read A's profile.
  const { data: peek } = await b.client.from('profiles').select('*').eq('id', a.id);
  check("User B can't read User A's profile", Array.isArray(peek) && peek.length === 0);

  const { data: everyone } = await b.client.from('profiles').select('id');
  check('User B sees only their own profile when listing all', everyone?.length === 1 && everyone[0].id === b.id);

  // B tries to change A's profile.
  await b.client.from('profiles').update({ weight_kg: 50 }).eq('id', a.id);
  const { data: afterTamper } = await a.client.from('profiles').select('weight_kg').eq('id', a.id).single();
  check("User B can't change User A's profile", Number(afterTamper?.weight_kg) === 81.5);

  // Users can't upgrade their own plan or reset their AI usage.
  await b.client.from('entitlements').update({ plan: 'pro' }).eq('user_id', b.id);
  const { data: plan } = await b.client.from('entitlements').select('plan').eq('user_id', b.id).single();
  check("Users can't change their own subscription plan", plan?.plan === 'beta');

  const { error: usageError } = await b.client
    .from('ai_usage')
    .insert({ user_id: b.id, feature: 'meal_scan', count: 0 });
  check("Users can't write their own AI usage counter", !!usageError);

  // Food diary.
  const entry = {
    eaten_on: '2026-01-01',
    meal: 'lunch',
    name: 'Privacy test sandwich',
    source: 'manual',
    calories: 400,
  };
  const { data: added, error: addError } = await a.client.from('food_entries').insert(entry).select('id').single();
  check('User A can add a food diary entry', !addError && !!added);

  const { data: diaryPeek } = await b.client.from('food_entries').select('id').eq('id', added?.id);
  check("User B can't see User A's food diary", Array.isArray(diaryPeek) && diaryPeek.length === 0);

  await b.client.from('food_entries').update({ calories: 1 }).eq('id', added?.id);
  await b.client.from('food_entries').delete().eq('id', added?.id);
  const { data: stillThere } = await a.client.from('food_entries').select('calories').eq('id', added?.id).single();
  check("User B can't change or delete User A's diary entry", Number(stillThere?.calories) === 400);

  const { error: forgeError } = await b.client.from('food_entries').insert({ ...entry, user_id: a.id });
  check("User B can't add entries to User A's diary", !!forgeError);

  // Weight and measurements.
  const { error: weighError } = await a.client
    .from('body_check_ins')
    .insert({ measured_on: '2026-01-02', weight_kg: 79.5, waist_cm: 84 });
  check('User A can log their weight', !weighError);

  const { data: synced } = await a.client.from('profiles').select('weight_kg').eq('id', a.id).single();
  check("Logging a weight updates the user's profile weight", Number(synced?.weight_kg) === 79.5);

  const { data: weightPeek } = await b.client.from('body_check_ins').select('id').eq('user_id', a.id);
  check("User B can't see User A's weight history", Array.isArray(weightPeek) && weightPeek.length === 0);

  const { error: forgeWeight } = await b.client
    .from('body_check_ins')
    .insert({ user_id: a.id, measured_on: '2026-01-03', weight_kg: 50 });
  check("User B can't add weigh-ins for User A", !!forgeWeight);

  // Workouts.
  const { data: library } = await a.client.from('exercises').select('id').is('user_id', null).limit(1);
  check('Users can see the built-in exercise library', library?.length === 1);

  const { data: custom, error: customError } = await a.client
    .from('exercises')
    .insert({ name: 'Privacy test lift', user_id: a.id })
    .select('id')
    .single();
  check('User A can create a custom exercise', !customError && !!custom);

  const { data: workoutId, error: saveWorkoutError } = await a.client.rpc('save_workout', {
    p_workout_id: null,
    p_name: 'Privacy test workout',
    p_performed_on: '2026-01-02',
    p_duration_min: 45,
    p_notes: null,
    p_sets: [
      { exercise_id: library[0].id, exercise_position: 0, set_number: 1, reps: 8, weight_kg: 60 },
      { exercise_id: custom.id, exercise_position: 1, set_number: 1, reps: 10, weight_kg: 20 },
    ],
  });
  check('User A can save a workout with sets', !saveWorkoutError && !!workoutId);

  const { data: workoutPeek } = await b.client.from('workouts').select('id').eq('id', workoutId);
  const { data: setsPeek } = await b.client.from('workout_sets').select('id').eq('workout_id', workoutId);
  check("User B can't see User A's workouts or sets", workoutPeek?.length === 0 && setsPeek?.length === 0);

  const { data: customPeek } = await b.client.from('exercises').select('id').eq('id', custom.id);
  check("User B can't see User A's custom exercises", customPeek?.length === 0);

  const { error: hijackError } = await b.client.rpc('save_workout', {
    p_workout_id: workoutId,
    p_name: 'Hijacked',
    p_performed_on: '2026-01-02',
    p_duration_min: 1,
    p_notes: null,
    p_sets: [{ exercise_id: library[0].id, exercise_position: 0, set_number: 1, reps: 1, weight_kg: 1 }],
  });
  const { data: afterHijack } = await a.client.from('workouts').select('name').eq('id', workoutId).single();
  check("User B can't overwrite User A's workout", !!hijackError && afterHijack?.name === 'Privacy test workout');

  const { error: injectError } = await b.client
    .from('workout_sets')
    .insert({ workout_id: workoutId, exercise_id: library[0].id, exercise_position: 0, set_number: 9, reps: 1 });
  check("User B can't add sets to User A's workout", !!injectError);

  const { error: libraryEdit } = await b.client.from('exercises').update({ name: 'Hacked' }).eq('id', library[0].id).select().single();
  check("Users can't rename built-in exercises", !!libraryEdit);

  // AI meal scanning.
  const { error: quotaHack } = await b.client.rpc('consume_ai_quota', {
    p_user_id: b.id,
    p_feature: 'meal_scan',
    p_daily_limit: 1000,
  });
  const { error: refundHack } = await b.client.rpc('refund_ai_quota', { p_user_id: b.id, p_feature: 'meal_scan' });
  check("Users can't use or reset AI scan limits themselves", !!quotaHack && !!refundHack);

  const { data: scanData, error: scanError } = await a.client.functions.invoke('analyse-meal', {
    body: { image: 'aGVsbG8=', mediaType: 'image/jpeg' },
  });
  const scanStatus = scanError?.context?.status;
  const scanBody = scanError?.context ? await scanError.context.json().catch(() => ({})) : scanData;
  check(
    'Signed-in users reach the meal scanner (it reports AI is off until a key is added)',
    (scanStatus === 503 && scanBody?.error === 'ai_not_configured') || (!scanError && scanData !== null),
  );

  // Progress photos (private storage).
  // A tiny valid JPEG (1×1 pixel) stands in for a real photo.
  const jpeg = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
    'base64',
  );
  const photoPath = `${a.id}/privacy-test.jpg`;
  const { error: uploadError } = await a.client.storage
    .from('progress-photos')
    .upload(photoPath, jpeg, { contentType: 'image/jpeg' });
  check('User A can upload a progress photo to their own folder', !uploadError);

  const { error: photoRowError } = await a.client
    .from('progress_photos')
    .insert({ storage_path: photoPath, taken_on: '2026-01-02', pose: 'front', note: 'Week 1' });
  check('User A can save a progress photo with a note', !photoRowError);

  const { data: photoRowPeek } = await b.client.from('progress_photos').select('id').eq('storage_path', photoPath);
  check("User B can't see User A's photo details", photoRowPeek?.length === 0);

  const { error: downloadError } = await b.client.storage.from('progress-photos').download(photoPath);
  const { data: signedPeek } = await b.client.storage.from('progress-photos').createSignedUrl(photoPath, 60);
  const { data: listPeek } = await b.client.storage.from('progress-photos').list(a.id);
  check(
    "User B can't download, link to or list User A's photos",
    !!downloadError && !signedPeek?.signedUrl && (listPeek?.length ?? 0) === 0,
  );

  await b.client.storage.from('progress-photos').remove([photoPath]);
  const { data: stillStored } = await a.client.storage.from('progress-photos').list(a.id);
  check("User B can't delete User A's photos", stillStored?.some((f) => f.name === 'privacy-test.jpg'));

  const { error: plantError } = await b.client.storage
    .from('progress-photos')
    .upload(`${a.id}/planted.jpg`, jpeg, { contentType: 'image/jpeg' });
  check("User B can't upload into User A's photo folder", !!plantError);

  const { error: publicError } = await createClient(url, key).storage.from('progress-photos').download(photoPath);
  check('Signed-out visitors can\'t download photos', !!publicError);

  // Reference foods: readable, but not editable.
  const { data: found } = await b.client.rpc('search_foods', { query: 'banana' });
  check('Signed-in users can search Australian foods', Array.isArray(found) && found.length > 0);

  await b.client.from('foods').update({ kcal_100g: 0 }).eq('id', found?.[0]?.id);
  const { data: food } = await b.client.from('foods').select('kcal_100g').eq('id', found?.[0]?.id).single();
  check("Users can't change reference food data", Number(food?.kcal_100g) > 0);
} catch (error) {
  console.error(`\n${error.message}`);
  failures += 1;
} finally {
  // Clean up: each test user deletes their photo files, then their account.
  for (const user of users) {
    const { data: files } = await user.client.storage.from('progress-photos').list(user.id);
    if (files?.length) {
      await user.client.storage.from('progress-photos').remove(files.map((f) => `${user.id}/${f.name}`));
    }
    const { error } = await user.client.rpc('delete_my_account');
    check('Test user deleted their account', !error);
  }
}

console.log(failures === 0 ? '\nAll privacy checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
