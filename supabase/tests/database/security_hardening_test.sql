begin;

select plan(11);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('a9999999-9999-9999-9999-999999999999', 'authenticated', 'authenticated', 'maps@test.local', '{}'::jsonb, '{}'::jsonb, now(), now());
insert into public.trips (id, name, destination, start_date, end_date, budget_vnd, created_by)
values ('b9999999-9999-9999-9999-999999999999', 'Maps trip', 'Hue', date '2026-11-27', date '2026-11-30', 0, 'a9999999-9999-9999-9999-999999999999');

create function pg_temp.add_place(url text) returns void language sql as $$
  insert into public.itinerary_items (trip_id, title, visit_date, start_time, end_time, estimated_cost_vnd, maps_url, created_by, updated_by)
  values ('b9999999-9999-9999-9999-999999999999', 'Place', date '2026-11-27', time '08:00', time '09:00', 0, url,
          'a9999999-9999-9999-9999-999999999999', 'a9999999-9999-9999-9999-999999999999')
$$;

select lives_ok($$select pg_temp.add_place('https://maps.app.goo.gl/abc123')$$, 'https Google Maps short links are accepted');
select lives_ok($$select pg_temp.add_place('https://www.google.com/maps/place/Da+Lat')$$, 'https Google Maps place links are accepted');
select lives_ok($$select pg_temp.add_place(null)$$, 'places without a link are accepted');
select throws_ok($$select pg_temp.add_place('http://maps.app.goo.gl/abc123')$$, '23514', null, 'plain http links are rejected');
select throws_ok($$select pg_temp.add_place('javascript:alert(1)')$$, '23514', null, 'script links are rejected');
select throws_ok($$select pg_temp.add_place('https://maps.app.goo.gl.evil.example/x')$$, '23514', null, 'look-alike hosts are rejected');

select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prokind = 'f'
     and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
     and has_function_privilege('anon', p.oid, 'execute')),
  0::bigint,
  'signed-out API callers cannot execute any application function'
);

select ok(
  has_function_privilege('authenticated', 'public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date)', 'execute')
  and has_function_privilege('authenticated', 'public.import_trip_data(uuid, jsonb, jsonb)', 'execute')
  and has_function_privilege('authenticated', 'public.respond_trip_invitation(uuid, boolean)', 'execute')
  and has_function_privilege('authenticated', 'public.get_trip_people(uuid)', 'execute'),
  'signed-in users keep the application RPCs'
);

select ok(
  not has_function_privilege('authenticated', 'public.hook_before_user_created(jsonb)', 'execute'),
  'the sign-up hook stays private to Supabase Auth'
);

create function public.future_hardening_probe() returns integer language sql as $$ select 1 $$;
select ok(
  not has_function_privilege('anon', 'public.future_hardening_probe()', 'execute'),
  'functions created later are not executable by signed-out callers by default'
);
select ok(
  not has_function_privilege('authenticated', 'public.future_hardening_probe()', 'execute'),
  'functions created later need an explicit grant for signed-in users'
);

select * from finish();
rollback;
