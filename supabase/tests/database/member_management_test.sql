begin;

select plan(5);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'group-owner@test.local', '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('66666666-6666-6666-6666-666666666666', 'authenticated', 'authenticated', 'group-member@test.local', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Member management', 'Da Lat', date '2026-11-27', date '2026-11-30', 1000000, '55555555-5555-5555-5555-555555555555');

insert into public.trip_members (trip_id, user_id, role)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555', 'owner'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', 'editor');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);

select throws_ok(
  $$select public.remove_trip_member('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555')$$,
  'P0001',
  'Chỉ chủ nhóm mới có thể loại thành viên.',
  'a regular member cannot remove another member'
);

select set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555555', true);

select throws_ok(
  $$select public.remove_trip_member('cccccccc-cccc-cccc-cccc-cccccccccccc', '55555555-5555-5555-5555-555555555555')$$,
  'P0001',
  'Không thể loại chủ nhóm khỏi chuyến đi.',
  'the owner membership cannot be removed'
);

select lives_ok(
  $$select public.remove_trip_member('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666')$$,
  'the owner can remove a regular member'
);

select is(
  (select count(*) from public.trip_members where trip_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and user_id = '66666666-6666-6666-6666-666666666666'),
  0::bigint,
  'the removed membership no longer exists'
);

select throws_ok(
  $$select public.remove_trip_member('cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666')$$,
  'P0001',
  'Không tìm thấy thành viên trong chuyến đi.',
  'removing an absent member reports a clear error'
);

select * from finish();
rollback;
