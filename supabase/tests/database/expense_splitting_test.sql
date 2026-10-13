begin;

select plan(14);

select has_column('public', 'expenses', 'paid_by', 'expenses records its payer');
select has_table('public', 'expense_participants', 'expense participants table exists');

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner@test.local', '{}'::jsonb, '{"full_name":"Owner"}'::jsonb, now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'friend@test.local', '{}'::jsonb, '{"full_name":"Friend"}'::jsonb, now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'outsider@test.local', '{}'::jsonb, '{"full_name":"Outsider"}'::jsonb, now(), now());

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'orphan-owner@test.local', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Orphan owner trip', 'Da Lat', date '2026-12-01', date '2026-12-02', 1000000, '44444444-4444-4444-4444-444444444444');

set local role authenticated;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.create_default_trip()$$,
  'an existing trip creator can recover a missing owner membership'
);

select is(
  (select role::text from public.trip_members where trip_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' and user_id = '44444444-4444-4444-4444-444444444444'),
  'owner',
  'the recovered creator membership has the owner role'
);

reset role;

insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Integration trip', 'Da Lat', date '2026-11-27', date '2026-11-30', 9000000, '11111111-1111-1111-1111-111111111111');

insert into public.trip_members (trip_id, user_id, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'editor');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.save_expense_with_participants(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, null, 'Dinner', 'food', date '2026-11-27',
    120000, 90001, '11111111-1111-1111-1111-111111111111',
    array['11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid], 'create'
  )$$,
  'an authenticated member can create an expense with participants'
);

select is(
  (select count(*) from public.expense_participants ep join public.expenses e on e.id = ep.expense_id where e.title = 'Dinner'),
  2::bigint,
  'both selected participants are stored'
);

set constraints all immediate;

select lives_ok(
  $$select public.save_expense_with_participants(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (select id from public.expenses where title = 'Dinner'), 1,
    'Dinner updated', 'food', date '2026-11-27', 120000, 90001,
    '22222222-2222-2222-2222-222222222222', array['22222222-2222-2222-2222-222222222222'::uuid], 'update'
  )$$,
  'participant replacement works even with immediate constraints'
);

select is((select version from public.expenses where title = 'Dinner updated'), 2, 'optimistic version increments');
select is(
  (select paid_by from public.expenses where title = 'Dinner updated'),
  '22222222-2222-2222-2222-222222222222'::uuid,
  'payer is updated'
);
select is(
  (select array_agg(ep.user_id order by ep.user_id) from public.expense_participants ep join public.expenses e on e.id = ep.expense_id where e.title = 'Dinner updated'),
  array['22222222-2222-2222-2222-222222222222'::uuid],
  'participants are replaced atomically'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, null, 'Empty split', 'food', date '2026-11-27',
    1000, 1000, '11111111-1111-1111-1111-111111111111', array[]::uuid[], ''
  )$$,
  '22023',
  'Khoản chi phải có ít nhất một người tham gia.',
  'empty participant lists are rejected'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, null, 'Outsider split', 'food', date '2026-11-27',
    1000, 1000, '11111111-1111-1111-1111-111111111111', array['33333333-3333-3333-3333-333333333333'::uuid], ''
  )$$,
  '22023',
  'Người tham gia phải là thành viên đang hoạt động của chuyến đi.',
  'non-members cannot participate'
);

select lives_ok(
  $$select public.import_trip_data(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object(
      'id', null, 'version', null, 'title', 'Imported lunch', 'category', 'food',
      'expense_date', '2026-11-28', 'estimated_amount_vnd', 50000, 'actual_amount_vnd', 45000,
      'paid_by', '11111111-1111-1111-1111-111111111111',
      'participant_ids', array['11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid],
      'notes', 'Excel import'
    ))
  )$$,
  'Excel import creates an expense with its split data'
);

select is(
  (select count(*) from public.expense_participants ep join public.expenses e on e.id = ep.expense_id where e.title = 'Imported lunch'),
  2::bigint,
  'Excel import stores selected participants'
);

select * from finish();
rollback;
