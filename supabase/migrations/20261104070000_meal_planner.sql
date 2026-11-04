-- =====================================================================
-- EEZ Fitness: meal planner. Meals come from the app's built-in library
-- (src/data/meal-library.ts), so tables store the library meal's id.
-- =====================================================================

-- planned_meals: one planned meal per user, day and meal slot.
create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  planned_on date not null,
  meal public.meal_type not null,
  meal_id text not null check (char_length(meal_id) <= 60),
  servings numeric(3, 2) not null default 1 check (servings between 0.25 and 4),
  created_at timestamptz not null default now(),
  unique (user_id, planned_on, meal)
);

comment on table public.planned_meals is 'Meal plan entries. Private to the user.';

alter table public.planned_meals enable row level security;

create policy "Users can view their own meal plan" on public.planned_meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add to their own meal plan" on public.planned_meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can change their own meal plan" on public.planned_meals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can remove from their own meal plan" on public.planned_meals
  for delete to authenticated using ((select auth.uid()) = user_id);


-- favourite_meals: library meals the user has starred.
create table public.favourite_meals (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  meal_id text not null check (char_length(meal_id) <= 60),
  created_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

comment on table public.favourite_meals is 'Starred meals. Private to the user.';

alter table public.favourite_meals enable row level security;

create policy "Users can view their own favourites" on public.favourite_meals
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can add their own favourites" on public.favourite_meals
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can remove their own favourites" on public.favourite_meals
  for delete to authenticated using ((select auth.uid()) = user_id);


-- Food budget used when planning meals.
alter table public.profiles
  add column meal_budget text not null default 'any' check (meal_budget in ('low', 'medium', 'any'));

-- Diary entries can now come from the meal plan.
alter table public.food_entries drop constraint food_entries_source_check;
alter table public.food_entries
  add constraint food_entries_source_check check (source in ('afcd', 'off', 'manual', 'ai', 'plan'));
