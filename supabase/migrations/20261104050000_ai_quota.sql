-- =====================================================================
-- EEZ Fitness: daily limits for AI features.
-- Only server functions (using the service role) can call this; users
-- can't raise or reset their own limits.
-- =====================================================================

-- Counts one use of an AI feature for today and returns true, or returns
-- false (and counts nothing) if the user has already reached the limit.
-- The check and the increment happen in one statement, so two scans sent
-- at the same moment can't both slip past the limit.
create function public.consume_ai_quota(p_user_id uuid, p_feature text, p_daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage (user_id, usage_date, feature, count)
  values (p_user_id, current_date, p_feature, 1)
  on conflict (user_id, usage_date, feature)
  do update set count = public.ai_usage.count + 1
  where public.ai_usage.count < p_daily_limit
  returning count into new_count;

  return new_count is not null;
end;
$$;

-- Gives back a use when the AI call itself failed, so errors don't eat
-- into the user's daily limit.
create function public.refund_ai_quota(p_user_id uuid, p_feature text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
  set count = greatest(count - 1, 0)
  where user_id = p_user_id and usage_date = current_date and feature = p_feature;
$$;

revoke execute on function public.consume_ai_quota(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.refund_ai_quota(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, text, integer) to service_role;
grant execute on function public.refund_ai_quota(uuid, text) to service_role;
