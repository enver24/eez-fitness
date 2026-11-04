-- Optional weekly progress photo check-in: off, at the start of the
-- training week (Monday) or at the end (Sunday).
alter table public.profiles
  add column progress_photo_reminder text not null default 'off'
    check (progress_photo_reminder in ('off', 'week_start', 'week_end'));
