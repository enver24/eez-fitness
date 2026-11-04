-- =====================================================================
-- EEZ Fitness: body check-ins (weight and optional measurements).
-- One check-in per user per day. Private to the user.
-- =====================================================================

create table public.body_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,

  weight_kg numeric(4, 1) check (weight_kg between 30 and 300),
  -- Optional body measurements in centimetres.
  waist_cm numeric(4, 1) check (waist_cm between 30 and 250),
  hips_cm numeric(4, 1) check (hips_cm between 30 and 250),
  chest_cm numeric(4, 1) check (chest_cm between 30 and 250),
  arm_cm numeric(4, 1) check (arm_cm between 10 and 100),
  thigh_cm numeric(4, 1) check (thigh_cm between 20 and 150),
  note text check (char_length(note) <= 200),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (user_id, measured_on),
  -- A check-in must record at least one thing.
  check (coalesce(weight_kg, waist_cm, hips_cm, chest_cm, arm_cm, thigh_cm) is not null)
);

comment on table public.body_check_ins is 'Weight and body measurements, one per user per day. Private to the user.';

create index body_check_ins_user_day on public.body_check_ins (user_id, measured_on desc);

alter table public.body_check_ins enable row level security;

create policy "Users can view their own check-ins"
  on public.body_check_ins for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own check-ins"
  on public.body_check_ins for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own check-ins"
  on public.body_check_ins for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own check-ins"
  on public.body_check_ins for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create trigger body_check_ins_set_updated_at
  before update on public.body_check_ins
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------
-- Keep profiles.weight_kg equal to the most recent weigh-in, so calorie
-- targets always use the latest weight.
-- ---------------------------------------------------------------------
create function public.sync_profile_weight()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid := coalesce(new.user_id, old.user_id);
  latest numeric(4, 1);
begin
  select c.weight_kg into latest
  from public.body_check_ins c
  where c.user_id = owner and c.weight_kg is not null
  order by c.measured_on desc
  limit 1;

  if latest is not null then
    update public.profiles set weight_kg = latest where id = owner;
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_profile_weight() from public, anon, authenticated;

create trigger body_check_ins_sync_profile_weight
  after insert or update or delete on public.body_check_ins
  for each row execute function public.sync_profile_weight();


-- Start everyone's history with the weight they gave during onboarding.
insert into public.body_check_ins (user_id, measured_on, weight_kg)
select p.id, coalesce(p.onboarding_completed_at, p.created_at)::date, p.weight_kg
from public.profiles p
where p.weight_kg is not null
on conflict (user_id, measured_on) do nothing;
