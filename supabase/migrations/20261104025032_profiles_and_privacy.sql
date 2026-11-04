-- =====================================================================
-- EEZ Fitness: profiles, plans, AI usage, and account deletion.
--
-- PRIVACY RULE FOR EVERY TABLE: Row Level Security (RLS) is switched on,
-- and policies only ever allow a signed-in user to see their OWN rows
-- (rows where the user id equals auth.uid(), the id in their login token).
-- =====================================================================


-- ---------------------------------------------------------------------
-- Choice lists (Postgres "enums") used by the profile.
-- ---------------------------------------------------------------------
create type public.sex as enum ('male', 'female');
create type public.activity_level as enum ('sedentary', 'light', 'moderate', 'active', 'very_active');
create type public.fitness_goal as enum ('lose_fat', 'maintain', 'build_muscle', 'recomp');
create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');


-- ---------------------------------------------------------------------
-- profiles: one row per user, created automatically at sign-up.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,

  first_name text not null default '' check (char_length(first_name) <= 50),
  birth_year smallint check (birth_year between 1900 and 2100),
  -- Used only for the calorie formula, which differs by sex.
  sex public.sex,
  height_cm numeric(4, 1) check (height_cm between 100 and 250),
  -- Latest known weight. From Stage 7 the weight log keeps this up to date.
  weight_kg numeric(4, 1) check (weight_kg between 30 and 300),
  body_fat_percent numeric(3, 1) check (body_fat_percent between 3 and 60),

  goal public.fitness_goal,
  goal_weight_kg numeric(4, 1) check (goal_weight_kg between 30 and 300),
  activity_level public.activity_level,
  experience public.experience_level,
  dietary_preferences text[] not null default '{}',
  allergies text[] not null default '{}',

  -- Daily targets, calculated by the app from the details above.
  calorie_target integer check (calorie_target between 1000 and 6000),
  protein_target_g integer check (protein_target_g between 0 and 500),
  carbs_target_g integer check (carbs_target_g between 0 and 1000),
  fat_target_g integer check (fat_target_g between 0 and 400),

  -- Record of what the user agreed to at sign-up.
  adult_confirmed_at timestamptz,
  consent_version text,
  consent_given_at timestamptz,

  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user: personal details, goals and daily targets. Private to the user.';

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- No insert or delete policies: rows are created by the sign-up trigger
-- below and removed automatically when the account is deleted.


-- ---------------------------------------------------------------------
-- entitlements: which plan each user is on (free / beta / pro).
-- Users can READ their plan but never change it themselves. Later, the
-- payment system (running on the server with admin rights) updates it.
-- ---------------------------------------------------------------------
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'beta' check (plan in ('free', 'beta', 'pro')),
  updated_at timestamptz not null default now()
);

comment on table public.entitlements is 'Subscription plan per user. Read-only for users; changed only by the server.';

alter table public.entitlements enable row level security;

create policy "Users can view their own plan"
  on public.entitlements for select
  to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- ai_usage: how many times each user used an AI feature each day.
-- Used to enforce daily limits (e.g. 10 meal scans). Written only by
-- server-side functions, so users can't reset their own counters.
-- ---------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  feature text not null check (feature in ('meal_scan', 'meal_plan', 'body_visual')),
  count integer not null default 0 check (count >= 0),
  primary key (user_id, usage_date, feature)
);

comment on table public.ai_usage is 'Daily AI feature usage per user, for usage limits. Written only by the server.';

alter table public.ai_usage enable row level security;

create policy "Users can view their own AI usage"
  on public.ai_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- Keep updated_at current whenever a row changes.
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger entitlements_set_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- When someone signs up, create their profile and plan rows, copying the
-- name and consent record the app sent with the sign-up.
-- ("security definer" lets this trigger write rows the user can't insert.)
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, adult_confirmed_at, consent_version, consent_given_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'first_name', ''), 50),
    (new.raw_user_meta_data ->> 'adult_confirmed_at')::timestamptz,
    new.raw_user_meta_data ->> 'consent_version',
    (new.raw_user_meta_data ->> 'consent_given_at')::timestamptz
  );
  insert into public.entitlements (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts created before this migration (e.g. during Stage 3 testing).
insert into public.profiles (id, first_name, adult_confirmed_at, consent_version, consent_given_at)
select
  u.id,
  left(coalesce(u.raw_user_meta_data ->> 'first_name', ''), 50),
  (u.raw_user_meta_data ->> 'adult_confirmed_at')::timestamptz,
  u.raw_user_meta_data ->> 'consent_version',
  (u.raw_user_meta_data ->> 'consent_given_at')::timestamptz
from auth.users u
on conflict (id) do nothing;

insert into public.entitlements (user_id)
select id from auth.users
on conflict (user_id) do nothing;


-- ---------------------------------------------------------------------
-- delete_my_account(): permanently deletes the signed-in user.
-- Deleting the auth user cascades to every table above (and, in later
-- stages, to meals, workouts, weights and photo records).
-- It can only ever delete the caller's own account.
-- ---------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = caller;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- Trigger helper functions must never be called directly through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
