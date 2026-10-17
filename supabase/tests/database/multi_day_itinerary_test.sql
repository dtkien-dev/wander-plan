begin;
select plan(11);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a2525252-0000-0000-0000-000000000001','multiday-owner@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b2525252-0000-0000-0000-000000000001','Multi-day trip','Da Lat','2026-11-27','2026-11-30','a2525252-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b2525252-0000-0000-0000-000000000001','a2525252-0000-0000-0000-000000000001','owner');
select set_config('request.jwt.claim.sub','a2525252-0000-0000-0000-000000000001',true);
set local role authenticated;

select lives_ok($$insert into public.itinerary_items(id,trip_id,title,visit_date,end_date,start_time,end_time) values
 ('c2525252-0000-0000-0000-000000000001','b2525252-0000-0000-0000-000000000001','Trekking','2026-11-27','2026-11-29','20:00','08:00')$$,
 'multi-day activity may end earlier in the day than it starts');
select throws_ok($$insert into public.itinerary_items(trip_id,title,visit_date,start_time,end_time) values
 ('b2525252-0000-0000-0000-000000000001','Backwards','2026-11-27','10:00','09:00')$$,
 '23514',null,'single-day activity still needs end time after start time');
select throws_ok($$insert into public.itinerary_items(trip_id,title,visit_date,end_date,start_time,end_time) values
 ('b2525252-0000-0000-0000-000000000001','Same day','2026-11-27','2026-11-27','08:00','09:00')$$,
 '23514',null,'end date must be after the start date');
select throws_ok($$insert into public.itinerary_items(trip_id,title,visit_date,end_date,start_time,end_time) values
 ('b2525252-0000-0000-0000-000000000001','Too long','2026-11-29','2026-12-01','08:00','09:00')$$,
 '23514','Ngày đến phải nằm trong thời gian chuyến đi.','end date must stay inside the trip');
select throws_ok($$update public.trips set end_date='2026-11-28' where id='b2525252-0000-0000-0000-000000000001'$$,
 '23514',null,'trip cannot shrink below a multi-day activity end date');

select public.import_trip_data('b2525252-0000-0000-0000-000000000001',
 '[{"id":"c2525252-0000-0000-0000-000000000001","version":1,"title":"Trekking v2","visit_date":"2026-11-27","start_time":"20:00","end_time":"08:00","estimated_cost_vnd":0}]'::jsonb);
select is((select end_date from public.itinerary_items where id='c2525252-0000-0000-0000-000000000001'),'2026-11-29'::date,
 'import row without end_date keeps the stored end date');
select is((select title from public.itinerary_items where id='c2525252-0000-0000-0000-000000000001'),'Trekking v2','import still updates other fields');

select public.import_trip_data('b2525252-0000-0000-0000-000000000001',
 '[{"id":"c2525252-0000-0000-0000-000000000001","version":2,"title":"Trekking v3","visit_date":"2026-11-27","end_date":"2026-11-28","start_time":"20:00","end_time":"08:00","estimated_cost_vnd":0}]'::jsonb);
select is((select end_date from public.itinerary_items where id='c2525252-0000-0000-0000-000000000001'),'2026-11-28'::date,'import row with end_date updates it');

select throws_ok($$select public.import_trip_data('b2525252-0000-0000-0000-000000000001',
 '[{"id":"c2525252-0000-0000-0000-000000000001","version":3,"title":"Trekking v4","visit_date":"2026-11-27","end_date":null,"start_time":"20:00","end_time":"08:00","estimated_cost_vnd":0}]'::jsonb)$$,
 '23514',null,'clearing end_date re-applies the same-day time rule');

select public.import_trip_data('b2525252-0000-0000-0000-000000000001',
 '[{"title":"Camping","visit_date":"2026-11-28","end_date":"2026-11-30","start_time":"16:00","end_time":"10:00","estimated_cost_vnd":0},{"title":"Cafe","visit_date":"2026-11-28","start_time":"09:00","end_time":"10:00","estimated_cost_vnd":0}]'::jsonb);
select is((select end_date from public.itinerary_items where title='Camping'),'2026-11-30'::date,'import creates multi-day rows');
select is((select end_date from public.itinerary_items where title='Cafe'),null,'import creates single-day rows without end_date');

select * from finish();
rollback;
