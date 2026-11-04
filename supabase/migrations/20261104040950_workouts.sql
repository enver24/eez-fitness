-- =====================================================================
-- EEZ Fitness: exercise library, workouts and sets.
-- =====================================================================


-- ---------------------------------------------------------------------
-- exercises: built-in exercises (user_id is null, visible to everyone)
-- plus each user's own custom exercises (private to them).
-- ---------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  muscle_group text not null default 'Other' check (char_length(muscle_group) <= 30),
  created_at timestamptz not null default now()
);

comment on table public.exercises is 'Built-in exercises (user_id null) and users'' own custom exercises.';

-- No duplicate names within the built-in list or within one user's list.
create unique index exercises_unique_name
  on public.exercises (coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

alter table public.exercises enable row level security;

create policy "Users can view built-in and their own exercises"
  on public.exercises for select
  to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "Users can add their own exercises"
  on public.exercises for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can rename their own exercises"
  on public.exercises for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own exercises"
  on public.exercises for delete
  to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- workouts: one row per training session. Private to the user.
-- ---------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  performed_on date not null,
  duration_min integer check (duration_min between 0 and 600),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.workouts is 'Training sessions. Private to the user.';

create index workouts_user_day on public.workouts (user_id, performed_on desc);

alter table public.workouts enable row level security;

create policy "Users can view their own workouts"
  on public.workouts for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own workouts"
  on public.workouts for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own workouts"
  on public.workouts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own workouts"
  on public.workouts for delete to authenticated
  using ((select auth.uid()) = user_id);

create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- workout_sets: the sets performed in a workout.
-- A set can only be added to the user's own workout, using an exercise
-- the user can see.
-- ---------------------------------------------------------------------
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  -- Order of the exercise within the workout, then of the set within it.
  exercise_position smallint not null check (exercise_position between 0 and 100),
  set_number smallint not null check (set_number between 1 and 100),
  reps smallint not null check (reps between 0 and 1000),
  weight_kg numeric(5, 1) not null default 0 check (weight_kg between 0 and 1000),
  created_at timestamptz not null default now()
);

comment on table public.workout_sets is 'Sets within a workout. Private to the user.';

create index workout_sets_workout on public.workout_sets (workout_id, exercise_position, set_number);
create index workout_sets_user_exercise on public.workout_sets (user_id, exercise_id);

alter table public.workout_sets enable row level security;

create policy "Users can view their own sets"
  on public.workout_sets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add sets to their own workouts"
  on public.workout_sets for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and (e.user_id is null or e.user_id = (select auth.uid()))
    )
  );

create policy "Users can delete their own sets"
  on public.workout_sets for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ---------------------------------------------------------------------
-- save_workout(): creates or replaces a workout and all its sets in one
-- step, so a workout is never left half-saved. Runs with the caller's
-- permissions, so all the privacy rules above still apply.
--
-- p_sets is a JSON array of
--   { "exercise_id": uuid, "exercise_position": n, "set_number": n, "reps": n, "weight_kg": n }
-- ---------------------------------------------------------------------
create function public.save_workout(
  p_workout_id uuid,
  p_name text,
  p_performed_on date,
  p_duration_min integer,
  p_notes text,
  p_sets jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
begin
  if jsonb_typeof(p_sets) <> 'array' or jsonb_array_length(p_sets) = 0 then
    raise exception 'A workout needs at least one set';
  end if;
  if jsonb_array_length(p_sets) > 500 then
    raise exception 'Too many sets';
  end if;

  if p_workout_id is null then
    insert into public.workouts (name, performed_on, duration_min, notes)
    values (p_name, p_performed_on, p_duration_min, p_notes)
    returning id into saved_id;
  else
    update public.workouts
    set name = p_name, performed_on = p_performed_on, duration_min = p_duration_min, notes = p_notes
    where id = p_workout_id
    returning id into saved_id;
    if saved_id is null then
      raise exception 'Workout not found';
    end if;
    delete from public.workout_sets where workout_id = saved_id;
  end if;

  insert into public.workout_sets (workout_id, exercise_id, exercise_position, set_number, reps, weight_kg)
  select
    saved_id,
    (s ->> 'exercise_id')::uuid,
    (s ->> 'exercise_position')::smallint,
    (s ->> 'set_number')::smallint,
    (s ->> 'reps')::smallint,
    coalesce((s ->> 'weight_kg')::numeric, 0)
  from jsonb_array_elements(p_sets) as s;

  return saved_id;
end;
$$;

revoke execute on function public.save_workout(uuid, text, date, integer, text, jsonb) from public, anon;
grant execute on function public.save_workout(uuid, text, date, integer, text, jsonb) to authenticated;


-- ---------------------------------------------------------------------
-- Built-in exercise library.
-- ---------------------------------------------------------------------
insert into public.exercises (name, muscle_group) values
  ('Bench press', 'Chest'),
  ('Incline bench press', 'Chest'),
  ('Dumbbell bench press', 'Chest'),
  ('Incline dumbbell press', 'Chest'),
  ('Chest fly', 'Chest'),
  ('Cable crossover', 'Chest'),
  ('Push-up', 'Chest'),
  ('Dip', 'Chest'),
  ('Deadlift', 'Back'),
  ('Romanian deadlift', 'Hamstrings'),
  ('Pull-up', 'Back'),
  ('Chin-up', 'Back'),
  ('Lat pulldown', 'Back'),
  ('Barbell row', 'Back'),
  ('Dumbbell row', 'Back'),
  ('Seated cable row', 'Back'),
  ('T-bar row', 'Back'),
  ('Face pull', 'Shoulders'),
  ('Overhead press', 'Shoulders'),
  ('Dumbbell shoulder press', 'Shoulders'),
  ('Lateral raise', 'Shoulders'),
  ('Rear delt fly', 'Shoulders'),
  ('Upright row', 'Shoulders'),
  ('Shrug', 'Back'),
  ('Barbell curl', 'Biceps'),
  ('Dumbbell curl', 'Biceps'),
  ('Hammer curl', 'Biceps'),
  ('Preacher curl', 'Biceps'),
  ('Cable curl', 'Biceps'),
  ('Tricep pushdown', 'Triceps'),
  ('Overhead tricep extension', 'Triceps'),
  ('Skull crusher', 'Triceps'),
  ('Close-grip bench press', 'Triceps'),
  ('Back squat', 'Legs'),
  ('Front squat', 'Legs'),
  ('Goblet squat', 'Legs'),
  ('Leg press', 'Legs'),
  ('Hack squat', 'Legs'),
  ('Bulgarian split squat', 'Legs'),
  ('Walking lunge', 'Legs'),
  ('Leg extension', 'Legs'),
  ('Leg curl', 'Hamstrings'),
  ('Hip thrust', 'Glutes'),
  ('Glute bridge', 'Glutes'),
  ('Standing calf raise', 'Calves'),
  ('Seated calf raise', 'Calves'),
  ('Plank', 'Core'),
  ('Hanging leg raise', 'Core'),
  ('Cable crunch', 'Core'),
  ('Ab wheel rollout', 'Core'),
  ('Russian twist', 'Core'),
  ('Kettlebell swing', 'Full body'),
  ('Farmer''s carry', 'Full body'),
  ('Clean and press', 'Full body');
