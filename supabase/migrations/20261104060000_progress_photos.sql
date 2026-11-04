-- =====================================================================
-- EEZ Fitness: private progress photos.
--
-- Image files live in a PRIVATE Supabase Storage bucket, inside a folder
-- named after the owner's user id: progress-photos/<user id>/<file>.jpg
-- Storage rules only let a user touch files in their own folder, and the
-- app only shows photos through short-lived signed links.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880, array['image/jpeg']);

create policy "Users can view their own progress photo files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can upload progress photo files to their own folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users can delete their own progress photo files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);


-- ---------------------------------------------------------------------
-- progress_photos: details about each photo. Private to the user.
-- ---------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 200),
  taken_on date not null,
  pose text not null default 'front' check (pose in ('front', 'side', 'back', 'other')),
  note text check (char_length(note) <= 200),
  created_at timestamptz not null default now(),
  -- The file must be in the owner's own folder.
  check (split_part(storage_path, '/', 1) = user_id::text)
);

comment on table public.progress_photos is 'Progress photo details; files are in the private progress-photos bucket. Private to the user.';

create index progress_photos_user_day on public.progress_photos (user_id, taken_on desc);

alter table public.progress_photos enable row level security;

create policy "Users can view their own progress photos"
  on public.progress_photos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add their own progress photos"
  on public.progress_photos for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own progress photos"
  on public.progress_photos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own progress photos"
  on public.progress_photos for delete to authenticated
  using ((select auth.uid()) = user_id);


-- When the user agreed to progress photos being stored.
alter table public.profiles add column progress_photos_consent_at timestamptz;
