begin;

select plan(14);

select has_column('public', 'expenses', 'end_date', 'expenses records an optional end date');

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('d1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'ranges@test.local', '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('e1111111-1111-1111-1111-111111111111', 'Range trip', 'Da Lat', date '2026-11-27', date '2026-11-30', 1000000, 'd1111111-1111-1111-1111-111111111111');
insert into public.trip_members (trip_id, user_id, role)
values ('e1111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'owner');

set local role authenticated;
select set_config('request.jwt.claim.sub', 'd1111111-1111-1111-1111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select lives_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Round trip bus', 'transport', date '2026-11-27',
    500000, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-30'
  )$$,
  'a round-trip transport expense stores its return date'
);
select is((select end_date from public.expenses where title = 'Round trip bus'), date '2026-11-30', 'the return date is saved');

select lives_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Same-day return', 'transport', date '2026-11-28',
    100000, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-28'
  )$$,
  'a round trip may return on the departure day'
);

select lives_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Hotel', 'stay', date '2026-11-27',
    1800000, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-30'
  )$$,
  'a stay stores check-in and check-out dates'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Zero-night stay', 'stay', date '2026-11-28',
    1, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-28'
  )$$,
  '22023',
  'Ngày trả phòng phải sau ngày nhận phòng.',
  'a stay needs at least one night'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Backwards bus', 'transport', date '2026-11-29',
    1, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-28'
  )$$,
  '22023',
  'Ngày về phải từ ngày đi trở đi.',
  'a return date cannot precede departure'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Dinner range', 'food', date '2026-11-28',
    1, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-11-29'
  )$$,
  '22023',
  'Chỉ khoản Di chuyển khứ hồi và Lưu trú mới có ngày kết thúc.',
  'other categories cannot have an end date'
);

select throws_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'Late return', 'transport', date '2026-11-29',
    1, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], '',
    date '2026-12-01'
  )$$,
  '23514',
  'Ngày chi phải nằm trong thời gian chuyến đi.',
  'the end date must stay within the trip'
);

select throws_ok(
  $$update public.expenses set category = 'food' where title = 'Hotel'$$,
  '23514',
  null,
  'direct writes cannot keep an end date on an unsupported category'
);

select lives_ok(
  $$select public.save_expense_with_participants(
    'e1111111-1111-1111-1111-111111111111', null, null, 'One-way taxi', 'transport', date '2026-11-28',
    1, null, 'd1111111-1111-1111-1111-111111111111', array['d1111111-1111-1111-1111-111111111111'::uuid], ''
  )$$,
  'callers without an end date still save single-day expenses'
);
select is((select end_date from public.expenses where title = 'One-way taxi'), null::date, 'single-day expenses keep no end date');

select throws_ok(
  $$update public.trips set end_date = date '2026-11-29' where id = 'e1111111-1111-1111-1111-111111111111'$$,
  '23514',
  'Khoảng ngày mới không bao phủ toàn bộ lịch trình và chi phí hiện có.',
  'trip dates cannot shrink below an expense end date'
);

select lives_ok(
  $$select public.import_trip_data(
    'e1111111-1111-1111-1111-111111111111',
    '[]'::jsonb,
    jsonb_build_array(jsonb_build_object(
      'id', null, 'version', null, 'title', 'Imported hotel', 'category', 'stay',
      'expense_date', '2026-11-28', 'end_date', '2026-11-30', 'estimated_amount_vnd', 900000, 'actual_amount_vnd', null,
      'paid_by', 'd1111111-1111-1111-1111-111111111111',
      'participant_ids', array['d1111111-1111-1111-1111-111111111111'::uuid], 'notes', ''
    ))
  )$$,
  'Excel import stores an end date'
);

select * from finish();
rollback;
