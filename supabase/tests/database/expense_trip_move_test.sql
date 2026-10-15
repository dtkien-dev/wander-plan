begin;

select plan(6);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('a1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'mover@test.local', '{}'::jsonb, '{"full_name":"Mover"}'::jsonb, now(), now()),
  ('a2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'source-only@test.local', '{}'::jsonb, '{"full_name":"Source only"}'::jsonb, now(), now()),
  ('a3333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'both-trips@test.local', '{}'::jsonb, '{"full_name":"Both trips"}'::jsonb, now(), now());

insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values
  ('c1111111-1111-1111-1111-111111111111', 'Source trip', 'Da Lat', date '2026-11-27', date '2026-11-30', 1000000, 'a1111111-1111-1111-1111-111111111111'),
  ('c2222222-2222-2222-2222-222222222222', 'Destination trip', 'Hue', date '2026-11-27', date '2026-11-30', 1000000, 'a1111111-1111-1111-1111-111111111111');

insert into public.trip_members (trip_id, user_id, role)
values
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'owner'),
  ('c1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'editor'),
  ('c1111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'editor'),
  ('c2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'owner'),
  ('c2222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 'editor');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select public.save_expense_with_participants(
  'c1111111-1111-1111-1111-111111111111', null, null, 'Shared with source-only member', 'food', date '2026-11-28',
  100000, 100000, 'a1111111-1111-1111-1111-111111111111',
  array['a1111111-1111-1111-1111-111111111111'::uuid, 'a2222222-2222-2222-2222-222222222222'::uuid], ''
);
select public.save_expense_with_participants(
  'c1111111-1111-1111-1111-111111111111', null, null, 'Shared with both-trip member', 'food', date '2026-11-28',
  100000, 100000, 'a1111111-1111-1111-1111-111111111111',
  array['a1111111-1111-1111-1111-111111111111'::uuid, 'a3333333-3333-3333-3333-333333333333'::uuid], ''
);

select throws_ok(
  $$update public.expenses set trip_id = 'c2222222-2222-2222-2222-222222222222'
    where title = 'Shared with source-only member'$$,
  '23514',
  'Người tham gia phải là thành viên đang hoạt động của chuyến đi.',
  'moving an expense rejects participants who are not destination members'
);

select is(
  (select trip_id from public.expenses where title = 'Shared with source-only member'),
  'c1111111-1111-1111-1111-111111111111'::uuid,
  'the rejected expense stays in its source trip'
);

select lives_ok(
  $$update public.expenses set trip_id = 'c2222222-2222-2222-2222-222222222222'
    where title = 'Shared with both-trip member'$$,
  'moving an expense whose participants all belong to the destination still works'
);

select is(
  (select trip_id from public.expenses where title = 'Shared with both-trip member'),
  'c2222222-2222-2222-2222-222222222222'::uuid,
  'the permitted move reaches the destination trip'
);

reset role;
delete from public.trip_members
where trip_id = 'c1111111-1111-1111-1111-111111111111' and user_id = 'a2222222-2222-2222-2222-222222222222';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'a1111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$update public.expenses set notes = 'History kept', trip_id = trip_id
    where title = 'Shared with source-only member'$$,
  'same-trip updates keep participants recorded before a member was removed'
);

select is(
  (select count(*) from public.expense_participants ep join public.expenses e on e.id = ep.expense_id
   where e.title = 'Shared with source-only member'),
  2::bigint,
  'removed-member participation history is preserved'
);

select * from finish();
rollback;
