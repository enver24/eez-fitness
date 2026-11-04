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
  // Clean up: each test user deletes their own account.
  for (const user of users) {
    const { error } = await user.client.rpc('delete_my_account');
    check('Test user deleted their account', !error);
  }
}

console.log(failures === 0 ? '\nAll privacy checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
