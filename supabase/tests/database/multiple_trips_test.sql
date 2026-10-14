begin;
select plan(22);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'multi-owner@test.local', '{}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'other-owner@test.local', '{}', '{}', now(), now()),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'default-owner@test.local', '{}', '{}', now(), now());
create temporary table created_trips (label text primary key, id uuid);
grant all on created_trips to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000001', true);

insert into created_trips values ('first', public.create_trip('  First trip  ', '  Da Lat  ', '2026-11-01', '2026-11-04', 1200000, 2, '40000000-0000-0000-0000-000000000001'));
select is(public.create_trip('Retry payload', 'Da Nang', '2026-12-01', '2026-12-02', 0, 1, '40000000-0000-0000-0000-000000000001'), (select id from created_trips where label = 'first'), 'retrying the owner request key returns the original trip');
select is((select count(*) from public.trips), 1::bigint, 'repeated creation requests do not create duplicates');
select is((select name from public.trips), 'First trip', 'names are trimmed and retry does not overwrite the trip');
select is((select timezone from public.trips), 'Asia/Ho_Chi_Minh', 'new trips use the supported timezone');
select is((select role from public.trip_members), 'owner', 'creation atomically adds the owner membership');
insert into created_trips values ('second', public.create_trip('Second trip', 'Da Nang', '2026-12-01', '2026-12-02', 0, 1, '40000000-0000-0000-0000-000000000002'));
select isnt((select id from created_trips where label = 'second'), (select id from created_trips where label = 'first'), 'a new request key creates another trip');
select is((select count(*) from public.trips), 2::bigint, 'the same owner can own multiple trips');
select throws_ok($$select public.create_trip('x', 'Da Lat', '2026-11-01', '2026-11-02', 0, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Tên chuyến đi hoặc điểm đến không hợp lệ.', 'invalid names are rejected');
select throws_ok($$select public.create_trip('Invalid trip', ' ', '2026-11-01', '2026-11-02', 0, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Tên chuyến đi hoặc điểm đến không hợp lệ.', 'invalid destinations are rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-02', '2026-11-01', 0, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Ngày chuyến đi không hợp lệ.', 'reversed dates are rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '-infinity', 'infinity', 0, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Ngày chuyến đi không hợp lệ.', 'infinite dates are rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-01', '2026-11-02', 0.5, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Ngân sách phải là số nguyên VND không âm.', 'fractional VND cannot silently round');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-01', '2026-11-02', 'NaN', 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Ngân sách phải là số nguyên VND không âm.', 'non-finite budgets are rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-01', '2026-11-02', -1, 2, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Ngân sách phải là số nguyên VND không âm.', 'negative budgets are rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-01', '2026-11-02', 0, 21, '40000000-0000-0000-0000-000000000003')$$, '22023', 'Số người tối đa phải từ 1 đến 20.', 'capacity above the schema limit is rejected');
select throws_ok($$select public.create_trip('Invalid trip', 'Da Lat', '2026-11-01', '2026-11-02', 0, 2, null)$$, '22023', 'Mã yêu cầu không hợp lệ.', 'idempotency keys are required');

insert into public.itinerary_items (trip_id, title, visit_date, start_time, end_time)
select id, 'Private schedule', '2026-11-02', '10:00', '11:00' from created_trips where label = 'first';
select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000002', true);
select is((select count(*) from public.trips), 0::bigint, 'other owners cannot read unrelated trips');
select is((select count(*) from public.itinerary_items), 0::bigint, 'trip child data remains isolated');
select throws_ok($$insert into public.itinerary_items (trip_id, title, visit_date, start_time, end_time) select id, 'Forbidden schedule', '2026-11-02', '12:00', '13:00' from created_trips where label = 'first'$$, '42501', 'new row violates row-level security policy for table "itinerary_items"', 'other owners cannot write unrelated trip child data');
insert into created_trips values ('other', public.create_trip('Other owner trip', 'Hue', '2026-11-01', '2026-11-02', 0, 2, '40000000-0000-0000-0000-000000000001'));
select isnt((select id from created_trips where label = 'other'), (select id from created_trips where label = 'first'), 'request keys are scoped to each owner');
select is((select count(*) from public.trips), 1::bigint, 'owners see only their own trips');

select set_config('request.jwt.claim.sub', '30000000-0000-0000-0000-000000000003', true);
select lives_ok($$select public.create_default_trip(); select public.create_default_trip()$$, 'legacy default creation works alongside other owners and is idempotent');

select * from finish();
rollback;
