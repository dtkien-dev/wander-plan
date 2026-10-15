begin;

select plan(10);

select is(
  (select allow_new_accounts from private.access_settings),
  false,
  'new accounts are closed until the configured value is applied'
);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('f1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'host@test.local', '{}'::jsonb, '{}'::jsonb, now(), now());
insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('f2222222-2222-2222-2222-222222222222', 'Access trip', 'Hue', date '2026-11-27', date '2026-11-30', 0, 'f1111111-1111-1111-1111-111111111111');
insert into public.trip_members (trip_id, user_id, role)
values ('f2222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'owner');
insert into public.trip_invitations (trip_id, email, invited_by)
values
  ('f2222222-2222-2222-2222-222222222222', 'invited@test.local', 'f1111111-1111-1111-1111-111111111111'),
  ('f2222222-2222-2222-2222-222222222222', 'revoked@test.local', 'f1111111-1111-1111-1111-111111111111');
update public.trip_invitations set revoked_at = now() where email = 'revoked@test.local';

create function pg_temp.signup(email text) returns jsonb language sql as $$
  select public.hook_before_user_created(jsonb_build_object('user', jsonb_build_object('email', email, 'app_metadata', jsonb_build_object('provider', 'google'))))
$$;

select ok(pg_temp.signup('stranger@test.local') ? 'error', 'closed: an uninvited email cannot create an account');
select is(
  pg_temp.signup('stranger@test.local')->'error'->>'http_code',
  '403',
  'closed: the rejection is a 403'
);
select is(pg_temp.signup('invited@test.local'), '{}'::jsonb, 'closed: an email with a pending invitation can create an account');
select is(pg_temp.signup('  Invited@Test.Local '), '{}'::jsonb, 'closed: invitation matching ignores case and spaces');
select ok(pg_temp.signup('revoked@test.local') ? 'error', 'closed: a revoked invitation does not open access');
select ok(pg_temp.signup('') ? 'error', 'closed: a sign-up without email is rejected');

update private.access_settings set allow_new_accounts = true;
select is(pg_temp.signup('stranger@test.local'), '{}'::jsonb, 'open: any email can create an account');

select ok(
  not has_function_privilege('authenticated', 'public.hook_before_user_created(jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.hook_before_user_created(jsonb)', 'execute'),
  'API roles cannot call the hook'
);
select ok(
  has_function_privilege('supabase_auth_admin', 'public.hook_before_user_created(jsonb)', 'execute'),
  'Supabase Auth can call the hook'
);

select * from finish();
rollback;
