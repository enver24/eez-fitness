-- Check the "exercise still in use" rule at the end of each statement
-- (NO ACTION) instead of immediately (RESTRICT). Deleting an account removes
-- the user's custom exercises and their sets in the same statement, which
-- RESTRICT would wrongly block. Deleting a custom exercise that's still used
-- in a workout is still prevented.
alter table public.workout_sets
  drop constraint workout_sets_exercise_id_fkey,
  add constraint workout_sets_exercise_id_fkey
    foreign key (exercise_id) references public.exercises (id) on delete no action;
