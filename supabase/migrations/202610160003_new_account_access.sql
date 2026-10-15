-- New-account switch, applied from config/access.json by `npm run access:apply`.
-- Existing accounts are unaffected: Supabase Auth calls the hook only before creating a user.
create table if not exists private.access_settings (
  singleton boolean primary key default true check (singleton),
  allow_new_accounts boolean not null,
  updated_at timestamptz not null default now()
);

-- Closed until the configured value is applied, matching the released config file.
insert into private.access_settings (singleton, allow_new_accounts)
values (true, false)
on conflict (singleton) do nothing;

revoke all on private.access_settings from public, anon, authenticated;

create or replace function public.hook_before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_email text := lower(trim(coalesce(event->'user'->>'email', '')));
begin
  if coalesce((select allow_new_accounts from private.access_settings where singleton), false) then
    return '{}'::jsonb;
  end if;
  if new_email <> '' and exists (
    select 1 from public.trip_invitations
    where email = new_email and accepted_at is null and revoked_at is null and declined_at is null
  ) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'WanderPlan đang tạm dừng nhận tài khoản mới. Hãy nhờ chủ nhóm gửi lời mời đến email của bạn rồi thử lại.'
  ));
end;
$$;

revoke execute on function public.hook_before_user_created(jsonb) from public, anon, authenticated;
grant execute on function public.hook_before_user_created(jsonb) to supabase_auth_admin;
