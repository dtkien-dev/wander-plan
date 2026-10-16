begin;
select plan(35);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1818181-0000-0000-0000-000000000001','archive-owner@test.local','{}'),
 ('a1818181-0000-0000-0000-000000000002','archive-editor@test.local','{}'),
 ('a1818181-0000-0000-0000-000000000003','archive-outsider@test.local','{}'),
 ('a1818181-0000-0000-0000-000000000004','archive-invitee@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b1818181-0000-0000-0000-000000000001','Archived journey','Hue','2026-11-01','2026-11-03','a1818181-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b1818181-0000-0000-0000-000000000001','a1818181-0000-0000-0000-000000000001','owner'),
 ('b1818181-0000-0000-0000-000000000001','a1818181-0000-0000-0000-000000000002','editor');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000001',true);
insert into public.itinerary_items(trip_id,title,visit_date,start_time,end_time) values
 ('b1818181-0000-0000-0000-000000000001','Museum','2026-11-01','08:00','09:00');
insert into public.expenses(id,trip_id,title,category,expense_date,estimated_amount_vnd,paid_by) values
 ('c1818181-0000-0000-0000-000000000001','b1818181-0000-0000-0000-000000000001','Lunch','food','2026-11-01',100000,'a1818181-0000-0000-0000-000000000001');
insert into public.expense_participants(expense_id,user_id) values
 ('c1818181-0000-0000-0000-000000000001','a1818181-0000-0000-0000-000000000002');
select public.save_trip_checklist('b1818181-0000-0000-0000-000000000001',null,null,'Raincoat','a1818181-0000-0000-0000-000000000002',false);
select public.invite_trip_member('b1818181-0000-0000-0000-000000000001','archive-invitee@test.local');
create temp table archive_baseline as select jsonb_build_object(
 'itinerary',(select jsonb_agg(to_jsonb(i) order by id) from public.itinerary_items i where trip_id='b1818181-0000-0000-0000-000000000001'),
 'expenses',(select jsonb_agg(to_jsonb(e) order by id) from public.expenses e where trip_id='b1818181-0000-0000-0000-000000000001'),
 'checklist',(select jsonb_agg(to_jsonb(c) order by id) from public.checklist_items c where trip_id='b1818181-0000-0000-0000-000000000001'),
 'members',(select jsonb_agg(to_jsonb(m) order by user_id) from public.trip_members m where trip_id='b1818181-0000-0000-0000-000000000001'),
 'invitations',(select jsonb_agg(to_jsonb(i) order by email) from public.trip_invitations i where trip_id='b1818181-0000-0000-0000-000000000001')) as data;
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000002',true);
set local role authenticated;
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',true,1)$$,'42501',null,'editor cannot archive');
select is((select count(*) from public.get_my_archived_trips()),0::bigint,'editor archive list empty');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000003',true);
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',true,1)$$,'42501',null,'outsider cannot archive');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000001',true);
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',true,0)$$,'P0001',null,'stale archive rejected');
select throws_ok($$update public.trips set archived_at=now() where id='b1818181-0000-0000-0000-000000000001'$$,'42501',null,'direct archive cannot bypass notification/version RPC');
select lives_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',true,1)$$,'owner archives');
select is((select count(*) from public.trips where id='b1818181-0000-0000-0000-000000000001'),0::bigint,'archived trip hidden even from owner normal query');
select is((select count(*) from public.itinerary_items where trip_id='b1818181-0000-0000-0000-000000000001'),0::bigint,'archived itinerary hidden');
select is((select count(*) from public.expenses where trip_id='b1818181-0000-0000-0000-000000000001'),0::bigint,'archived expenses hidden');
select is((select count(*) from public.expense_participants where expense_id='c1818181-0000-0000-0000-000000000001'),0::bigint,'archived participants hidden');
select is((select count(*) from public.checklist_items where trip_id='b1818181-0000-0000-0000-000000000001'),0::bigint,'archived checklist hidden');
select is((select count(*) from public.trip_members where trip_id='b1818181-0000-0000-0000-000000000001'),1::bigint,'only own membership metadata retained for notifications');
select is((select count(*) from public.get_my_archived_trips()),1::bigint,'owner can list archived metadata');
select ok(not ((select to_jsonb(a) from public.get_my_archived_trips() a) ? 'budget_vnd'),'archive list omits financial contents');
select throws_ok($$select * from public.get_trip_people('b1818181-0000-0000-0000-000000000001')$$,'P0001',null,'people RPC cannot expose archived group');
select throws_ok($$select public.save_trip_checklist('b1818181-0000-0000-0000-000000000001',null,null,'hidden',null,false)$$,'42501',null,'archived checklist writes denied');
select throws_ok($$select public.import_trip_data('b1818181-0000-0000-0000-000000000001','[]','[]')$$,'42501',null,'archived import denied');
with denied as (update public.itinerary_items set title='forged' where trip_id='b1818181-0000-0000-0000-000000000001' returning id)
select is((select count(*) from denied),0::bigint,'archived direct edit changes nothing');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000002',true);
select is((select count(*) from public.get_my_archived_trips()),0::bigint,'member cannot list owner archive metadata');
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',false,2)$$,'42501',null,'member cannot restore');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000004',true);
select is((select count(*) from public.trip_invitations where trip_id='b1818181-0000-0000-0000-000000000001'),0::bigint,'archived raw invitation hidden from recipient');
select is((select count(*) from public.get_my_trip_invitations()),0::bigint,'archived incoming invitation hidden');
select throws_ok($$select public.respond_trip_invitation('b1818181-0000-0000-0000-000000000001',true)$$,'P0001',null,'archived invitation cannot be accepted');
select throws_ok($$select public.respond_trip_invitation('b1818181-0000-0000-0000-000000000001',false)$$,'P0001',null,'archived invitation cannot be declined');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000001',true);
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',false,1)$$,'P0001',null,'stale restore rejected');
select lives_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',false,2)$$,'owner restores');
select is((select count(*) from public.trips where id='b1818181-0000-0000-0000-000000000001'),1::bigint,'restored trip accessible');
select is((select count(*) from public.itinerary_items where trip_id='b1818181-0000-0000-0000-000000000001'),1::bigint,'restored itinerary accessible');
select is((select count(*) from public.expenses where trip_id='b1818181-0000-0000-0000-000000000001'),1::bigint,'restored expenses accessible');
select is((select count(*) from public.checklist_items where trip_id='b1818181-0000-0000-0000-000000000001'),1::bigint,'restored checklist accessible');
select set_config('request.jwt.claim.sub','a1818181-0000-0000-0000-000000000004',true);
select is((select count(*) from public.get_my_trip_invitations()),1::bigint,'pending invitation returns after restore');
reset role;
select is(jsonb_build_object(
 'itinerary',(select jsonb_agg(to_jsonb(i) order by id) from public.itinerary_items i where trip_id='b1818181-0000-0000-0000-000000000001'),
 'expenses',(select jsonb_agg(to_jsonb(e) order by id) from public.expenses e where trip_id='b1818181-0000-0000-0000-000000000001'),
 'checklist',(select jsonb_agg(to_jsonb(c) order by id) from public.checklist_items c where trip_id='b1818181-0000-0000-0000-000000000001'),
 'members',(select jsonb_agg(to_jsonb(m) order by user_id) from public.trip_members m where trip_id='b1818181-0000-0000-0000-000000000001'),
 'invitations',(select jsonb_agg(to_jsonb(i) order by email) from public.trip_invitations i where trip_id='b1818181-0000-0000-0000-000000000001')), (select data from archive_baseline),'planner/member/invitation records unchanged after restore');
select is((select count(*) from public.trip_members where trip_id='b1818181-0000-0000-0000-000000000001'),2::bigint,'memberships retained');
set local role anon;
select throws_ok($$select public.set_trip_archived('b1818181-0000-0000-0000-000000000001',true,3)$$,'42501',null,'anon archive RPC denied');
select throws_ok($$select * from public.get_my_archived_trips()$$,'42501',null,'anon archive list denied');
reset role;
select * from finish();
rollback;
