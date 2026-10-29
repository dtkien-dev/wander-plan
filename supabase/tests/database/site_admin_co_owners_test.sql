begin;
select plan(36);
insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data) values
 ('a3333333-0000-0000-0000-000000000001','creator@test.local','{}','{}'),
 ('a3333333-0000-0000-0000-000000000002','co-owner@test.local','{}','{}'),
 ('a3333333-0000-0000-0000-000000000003','member@test.local','{}','{}'),
 ('a3333333-0000-0000-0000-000000000004','outsider@test.local','{}','{"role":"admin","is_site_admin":true}'),
 ('a3333333-0000-0000-0000-000000000005','admin@test.local','{}','{}');
insert into public.trips(id,name,destination,start_date,end_date,budget_vnd,created_by) values
 ('b3333333-0000-0000-0000-000000000001','Role management','Hue','2026-11-01','2026-11-03',0,'a3333333-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000001','owner'),
 ('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','editor'),
 ('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000003','editor');
insert into private.site_admins(user_id) values('a3333333-0000-0000-0000-000000000005');
insert into public.trip_invitations(trip_id,email,role,invited_by) values
 ('b3333333-0000-0000-0000-000000000001','outsider@test.local','editor','a3333333-0000-0000-0000-000000000001');

select ok(not has_function_privilege('anon','public.set_trip_member_role(uuid,uuid,text,text)','EXECUTE'),'anonymous cannot change roles');
select ok(not has_function_privilege('anon','public.get_my_site_admin_status()','EXECUTE'),'anonymous cannot query admin status');
select ok(not has_table_privilege('authenticated','private.site_admins','SELECT,INSERT,UPDATE,DELETE'),'registry inaccessible to authenticated');
select ok(not has_table_privilege('authenticated','public.trip_members','UPDATE'),'direct membership updates revoked');
select ok(not has_table_privilege('authenticated','public.trip_members','DELETE'),'member removal cannot bypass settlement RPC');

set local role authenticated;
select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000004',true);
select is(public.get_my_site_admin_status(),false,'user-editable metadata does not confer admin');
select is((select count(*) from public.trips where id='b3333333-0000-0000-0000-000000000001'),0::bigint,'ordinary outsider sees no trip');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000004','owner','editor')$$,'42501',null,'outsider cannot promote self');
select throws_ok($$insert into private.site_admins(user_id) values(auth.uid())$$,'42501',null,'cannot self-register as admin');

select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000003',true);
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000003','owner','editor')$$,'42501',null,'editor cannot promote self');
select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000001',true);
select throws_ok($$delete from public.trip_members where trip_id='b3333333-0000-0000-0000-000000000001' and user_id='a3333333-0000-0000-0000-000000000003'$$,'42501',null,'owner direct delete cannot bypass member-removal checks');
select lives_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','owner','editor')$$,'creator appoints co-owner');
select is((select count(*) from public.trip_members where role='owner'),2::bigint,'two owners coexist');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000004','owner','editor')$$,'22023',null,'outsider has not consented to membership');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','owner','editor')$$,'40001',null,'stale duplicate promotion rejected');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000001','editor','owner')$$,'42501',null,'creator cannot be demoted');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000003','admin','editor')$$,'22023',null,'arbitrary role rejected');

select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000002',true);
select lives_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000003','owner','editor')$$,'co-owner may appoint another member');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000003','editor','owner')$$,'42501',null,'co-owner cannot demote another owner');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','editor','owner')$$,'42501',null,'co-owner cannot demote self');
select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000001',true);
select lives_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','editor','owner')$$,'creator demotes co-owner without removing membership');
select is((select count(*) from public.trip_members),3::bigint,'role changes keep member count');

select set_config('request.jwt.claim.sub','a3333333-0000-0000-0000-000000000005',true);
select is(public.get_my_site_admin_status(),true,'operator registry grants admin');
select is((select count(*) from public.trips where id='b3333333-0000-0000-0000-000000000001'),1::bigint,'admin sees trip without membership');
select lives_ok($$select * from public.get_trip_people('b3333333-0000-0000-0000-000000000001')$$,'admin sees trip people');
select lives_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','owner','editor')$$,'admin can appoint accepted member');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','editor','owner')$$,'42501',null,'admin cannot bypass creator-only demotion');
select throws_ok($$select public.record_settlement_payment('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000001',100,0)$$,'42501',null,'admin access does not create a payment recipient');
select is((select count(*) from public.trip_members where user_id=auth.uid()),0::bigint,'admin gains no implicit membership or seat');
select lives_ok($$select public.set_trip_archived('b3333333-0000-0000-0000-000000000001',true,1)$$,'admin can archive');
select is((select count(*) from public.trips where id='b3333333-0000-0000-0000-000000000001'),0::bigint,'archived contents remain hidden from admin');
select is((select count(*) from public.get_my_archived_trips() where id='b3333333-0000-0000-0000-000000000001'),1::bigint,'admin can list archived metadata');
select throws_ok($$select public.set_trip_member_role('b3333333-0000-0000-0000-000000000001','a3333333-0000-0000-0000-000000000002','owner','owner')$$,'42501',null,'archived trip roles cannot change');
select lives_ok($$select public.set_trip_archived('b3333333-0000-0000-0000-000000000001',false,2)$$,'admin restores without membership');
reset role;
delete from private.site_admins where user_id='a3333333-0000-0000-0000-000000000005';
set local role authenticated;
select is(public.get_my_site_admin_status(),false,'registry revocation applies without JWT refresh');
select is((select count(*) from public.trips where id='b3333333-0000-0000-0000-000000000001'),0::bigint,'revoked admin loses cross-trip access');
select * from finish();
rollback;
