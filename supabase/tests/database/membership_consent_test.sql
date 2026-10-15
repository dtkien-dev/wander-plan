begin;
select plan(12);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('50000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'consent-owner@test.local', '{}', '{}', now(), now()),
  ('50000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'consent-recipient@test.local', '{}', '{}', now(), now());
update public.profiles set display_name = 'Private recipient name'
where id = '50000000-0000-0000-0000-000000000002';

create temporary table consent_trip (id uuid);
grant all on consent_trip to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);
insert into consent_trip select public.create_trip(
  'Consent regression', 'Da Lat', '2026-11-01', '2026-11-02', 0, 4,
  '60000000-0000-0000-0000-000000000001'
);

select is((select count(*) from public.profiles where id = '50000000-0000-0000-0000-000000000002'), 0::bigint,
  'an unrelated recipient profile is private');
select throws_ok(
  $$insert into public.trip_members (trip_id, user_id, role)
    select id, '50000000-0000-0000-0000-000000000002', 'editor' from consent_trip$$,
  '42501', 'permission denied for table trip_members',
  'even an owner with spare capacity cannot enroll another account directly'
);
select is((select count(*) from public.trip_members where trip_id = (select id from consent_trip)), 1::bigint,
  'a rejected direct enrollment leaves only the owner');
select is((select count(*) from public.profiles where id = '50000000-0000-0000-0000-000000000002'), 0::bigint,
  'a rejected enrollment cannot disclose the recipient profile');
select lives_ok(
  $$select public.invite_trip_member((select id from consent_trip), 'consent-recipient@test.local')$$,
  'the owner can still reserve a place through the invitation RPC'
);
select is((select count(*) from public.trip_members where trip_id = (select id from consent_trip)), 1::bigint,
  'a pending invitation grants no membership');

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.trips), 0::bigint, 'the recipient has no trip access before acceptance');
select lives_ok($$select public.respond_trip_invitation((select id from consent_trip), true)$$,
  'the recipient can explicitly accept despite the direct insert restriction');
select is((select count(*) from public.trip_members where trip_id = (select id from consent_trip)), 2::bigint,
  'acceptance stores the owner and recipient memberships');
select is((select role from public.trip_members where trip_id = (select id from consent_trip)
  and user_id = '50000000-0000-0000-0000-000000000002'), 'editor', 'acceptance grants the editor role');

select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);
select is((select display_name from public.profiles where id = '50000000-0000-0000-0000-000000000002'),
  'Private recipient name', 'the profile is shared only after explicit acceptance');
select ok(not has_table_privilege('anon', 'public.trip_members', 'INSERT'),
  'anonymous callers cannot insert memberships either');

select * from finish();
rollback;
