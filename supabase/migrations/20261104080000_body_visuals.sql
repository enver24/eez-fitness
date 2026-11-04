-- =====================================================================
-- EEZ Fitness: AI body previews (switched off until an image-AI key is set).
--
-- Each preview is an AI-edited copy of one of the user's progress photos.
-- The image file lives in the private progress-photos bucket, in the
-- user's own folder, so the same storage rules apply. Previews expire
-- after 30 days unless the user chooses to keep them.
-- =====================================================================

create table public.body_visuals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_photo_id uuid references public.progress_photos (id) on delete set null,
  storage_path text not null unique check (char_length(storage_path) <= 200),
  goal_weight_kg numeric(4, 1),
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '30 days'),
  check (split_part(storage_path, '/', 1) = user_id::text)
);

comment on table public.body_visuals is 'AI-edited previews of progress photos. Private; expire after 30 days unless kept.';

create index body_visuals_user on public.body_visuals (user_id, created_at desc);

alter table public.body_visuals enable row level security;

create policy "Users can view their own previews" on public.body_visuals
  for select to authenticated using ((select auth.uid()) = user_id);

-- Users can keep a preview (clear expires_at) but can't change anything else.
create policy "Users can keep their own previews" on public.body_visuals
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Users can delete their own previews" on public.body_visuals
  for delete to authenticated using ((select auth.uid()) = user_id);

-- No insert policy: only the body-visual server function creates previews.

-- When the user agreed to their photos being sent to an image AI.
alter table public.profiles add column body_visual_consent_at timestamptz;
