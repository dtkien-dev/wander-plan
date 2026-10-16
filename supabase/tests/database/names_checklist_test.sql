begin;
select plan(24);
insert into auth.users(id, email, raw_user_meta_data) values
 ('a1414141-0000-0000-0000-000000000001','owner@test.local','{}'),
 ('a1414141-0000-0000-0000-000000000002','member@test.local','{}'),
 ('a1414141-0000-0000-0000-000000000003','outsider@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b1414141-0000-0000-0000-000000000001','Trip one','Hue','2026-11-01','2026-11-03','a1414141-0000-0000-0000-000000000001'),
 ('b1414141-0000-0000-0000-000000000002','Trip two','Hue','2026-11-01','2026-11-03','a1414141-0000-0000-0000-000000000003');
insert into public.trip_members(trip_id,user_id,role) values
 ('b1414141-0000-0000-0000-000000000001','a1414141-0000-0000-0000-000000000001','owner'),
 ('b1414141-0000-0000-0000-000000000001','a1414141-0000-0000-0000-000000000002','editor'),
 ('b1414141-0000-0000-0000-000000000002','a1414141-0000-0000-0000-000000000003','owner');
select set_config('request.jwt.claim.sub','a1414141-0000-0000-0000-000000000002',true);
set local role authenticated;
select is((select display_name from public.get_trip_people('b1414141-0000-0000-0000-000000000001') where user_id=auth.uid()),'member','legacy email name uses local part');
select lives_ok($$select public.save_my_display_name('  Người đồng hành  ')$$,'member can set own name');
select is((select display_name from public.profiles where id=auth.uid()),'Người đồng hành','name trimmed');
select lives_ok($$select public.save_my_display_name('')$$,'name optional');
select is((select display_name from public.get_trip_people('b1414141-0000-0000-0000-000000000001') where user_id=auth.uid()),'member','empty name uses local part');
select throws_ok($$select public.save_my_display_name(repeat('x',81))$$,'22023',null,'name length bounded');
update public.profiles set display_name='forged' where id='a1414141-0000-0000-0000-000000000001';
select is((select display_name from public.profiles where id='a1414141-0000-0000-0000-000000000001'),'owner@test.local','cannot rename another member');
select is((select count(*) from public.profiles where id='a1414141-0000-0000-0000-000000000003'),0::bigint,'outsider profile hidden');
select throws_ok($$select * from public.get_trip_people('b1414141-0000-0000-0000-000000000002')$$,'P0001',null,'other trip emails hidden');
select lives_ok($$insert into public.checklist_items(trip_id,title,assigned_to) values('b1414141-0000-0000-0000-000000000001','Mang áo mưa','a1414141-0000-0000-0000-000000000002')$$,'member adds assigned item');
select throws_ok($$insert into public.checklist_items(trip_id,title,assigned_to) values('b1414141-0000-0000-0000-000000000001','Bad assignee','a1414141-0000-0000-0000-000000000003')$$,'23514',null,'outside assignee rejected');
select throws_ok($$insert into public.checklist_items(trip_id,title) values('b1414141-0000-0000-0000-000000000002','Cross trip')$$,'42501',null,'cross trip insert rejected');
select throws_ok($$update public.checklist_items set trip_id='b1414141-0000-0000-0000-000000000002'$$,'42501',null,'trip immutable to API');
select lives_ok($$update public.checklist_items set title='Mang áo khoác',completed=true where version=1$$,'member edits and checks item');
select is((select version from public.checklist_items),2,'version incremented');
with stale as (update public.checklist_items set title='stale' where version=1 returning id)
select is((select count(*) from stale),0::bigint,'stale write changes nothing');
select lives_ok($$update public.checklist_items set deleted_at=now() where version=2$$,'member soft deletes with realtime update');
select is((select count(*) from public.checklist_items where deleted_at is null),0::bigint,'deleted item hidden by list query');
reset role;
delete from public.trip_members where trip_id='b1414141-0000-0000-0000-000000000001' and user_id='a1414141-0000-0000-0000-000000000002';
select is((select assigned_to from public.checklist_items),null::uuid,'removed member unassigned without losing item');
select set_config('request.jwt.claim.sub','a1414141-0000-0000-0000-000000000003',true);
set local role authenticated;
select is((select count(*) from public.checklist_items),0::bigint,'other trip cannot read checklist');
with forbidden as (update public.checklist_items set title='intrusion' returning id)
select is((select count(*) from forbidden),0::bigint,'other trip cannot edit checklist');
reset role;
set local role anon;
select throws_ok($$select * from public.checklist_items$$,'42501',null,'signed-out checklist access denied');
select throws_ok($$select public.save_my_display_name('Anon')$$,'42501',null,'signed-out name RPC denied');
reset role;
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='checklist_items'),'checklist published for realtime');
select * from finish();
rollback;
