-- =====================================================================
-- EEZ Fitness: food reference data and the private food diary.
-- =====================================================================

-- Fuzzy text matching, used to rank food search results.
create extension if not exists pg_trgm with schema extensions;


-- ---------------------------------------------------------------------
-- foods: reference nutrition data per 100 g, shared by all users.
-- Source: Australian Food Composition Database (AFCD) Release 3,
-- © Food Standards Australia New Zealand, CC BY-SA 3.0 AU.
-- Signed-in users can read it; nobody can change it through the API.
-- ---------------------------------------------------------------------
create table public.foods (
  id text primary key,                 -- AFCD "Public Food Key", e.g. F002258
  source text not null default 'afcd' check (source in ('afcd')),
  name text not null,
  classification text,
  kcal_100g numeric(6, 1) not null check (kcal_100g >= 0),
  protein_100g numeric(5, 1) not null default 0 check (protein_100g >= 0),
  carbs_100g numeric(5, 1) not null default 0 check (carbs_100g >= 0),
  fat_100g numeric(5, 1) not null default 0 check (fat_100g >= 0),
  fibre_100g numeric(5, 1),
  sugars_100g numeric(5, 1),
  saturated_fat_100g numeric(5, 1),
  sodium_mg_100g numeric(7, 1)
);

comment on table public.foods is 'Reference foods per 100 g from AFCD Release 3 (© FSANZ, CC BY-SA 3.0 AU). Read-only.';

create index foods_name_trgm on public.foods using gin (name extensions.gin_trgm_ops);

alter table public.foods enable row level security;

create policy "Signed-in users can read reference foods"
  on public.foods for select
  to authenticated
  using (true);


-- ---------------------------------------------------------------------
-- search_foods(query): ranked search over reference foods.
-- Every word typed must appear in the name; closest matches first.
-- ---------------------------------------------------------------------
create function public.search_foods(query text, max_results integer default 25)
returns setof public.foods
language sql
stable
set search_path = ''
as $$
  select f.*
  from public.foods f
  where (
    select bool_and(f.name ilike '%' || word || '%')
    from unnest(regexp_split_to_array(trim(query), '\s+')) as word
    where word <> ''
  )
  order by
    -- Prefer names that start with the query (e.g. "Banana, ..." for "banana").
    (f.name ilike trim(query) || '%') desc,
    extensions.similarity(f.name, query) desc,
    length(f.name)
  limit least(greatest(max_results, 1), 50);
$$;

revoke execute on function public.search_foods(text, integer) from public, anon;
grant execute on function public.search_foods(text, integer) to authenticated;


-- ---------------------------------------------------------------------
-- food_entries: each user's private food diary.
-- Each entry stores its own copy of the nutrition for the amount eaten,
-- so the diary never changes if reference data is updated later.
-- ---------------------------------------------------------------------
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack');

create table public.food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  eaten_on date not null,
  meal public.meal_type not null,

  name text not null check (char_length(name) between 1 and 120),
  brand text check (char_length(brand) <= 80),
  -- Where the food came from: Australian database, Open Food Facts,
  -- typed in by the user, or (Stage 6) the AI photo scanner.
  source text not null check (source in ('afcd', 'off', 'manual', 'ai')),
  source_id text check (char_length(source_id) <= 64),

  amount_g numeric(6, 1) check (amount_g > 0 and amount_g <= 5000),
  -- Optional label for the amount, e.g. "1 bowl" for manual entries.
  amount_label text check (char_length(amount_label) <= 40),

  -- Totals for the amount eaten.
  calories numeric(6, 1) not null check (calories >= 0 and calories <= 10000),
  protein_g numeric(5, 1) not null default 0 check (protein_g >= 0 and protein_g <= 1000),
  carbs_g numeric(5, 1) not null default 0 check (carbs_g >= 0 and carbs_g <= 1000),
  fat_g numeric(5, 1) not null default 0 check (fat_g >= 0 and fat_g <= 1000),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.food_entries is 'Each user''s food diary. Private to the user.';

create index food_entries_user_day on public.food_entries (user_id, eaten_on);
create index food_entries_user_recent on public.food_entries (user_id, created_at desc);

alter table public.food_entries enable row level security;

create policy "Users can view their own food entries"
  on public.food_entries for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own food entries"
  on public.food_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own food entries"
  on public.food_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own food entries"
  on public.food_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger food_entries_set_updated_at
  before update on public.food_entries
  for each row execute function public.set_updated_at();
