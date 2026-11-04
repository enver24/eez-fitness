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
