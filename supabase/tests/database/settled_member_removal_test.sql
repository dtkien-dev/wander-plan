begin;
select plan(18);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a2323232-0000-0000-0000-000000000001','rm-owner@test.local','{}'),
 ('a2323232-0000-0000-0000-000000000002','rm-member@test.local','{}'),
 ('a2323232-0000-0000-0000-000000000003','rm-third@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by,max_members) values
 ('b2323232-0000-0000-0000-000000000001','Removal trip','Hue','2026-11-01','2026-11-03','a2323232-0000-0000-0000-000000000001',4);
insert into public.trip_members(trip_id,user_id,role) values
 ('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000001','owner'),
 ('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002','editor'),
 ('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003','editor');
update public.profiles set display_name='Bình' where id='a2323232-0000-0000-0000-000000000002';
select set_config('request.jwt.claim.sub','a2323232-0000-0000-0000-000000000001',true);
set local role authenticated;
create temp table ids(name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

-- Owner paid 100 split 1:2 with the member (shares, owner absorbs leftover): member owes 66.
insert into ids select 'dinner', public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',null,null,'Dinner','food','2026-11-01',0,100,
  'a2323232-0000-0000-0000-000000000001',array['a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002']::uuid[],'',null,'shares',
  '{"a2323232-0000-0000-0000-000000000001":1,"a2323232-0000-0000-0000-000000000002":2}'::jsonb);
set constraints all immediate; set constraints all deferred;
reset role;
select is(private.member_trip_balance('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002'),-66::bigint,'member balance mirrors share split');
select is(private.member_trip_balance('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000001'),66::bigint,'payer balance mirrors share split');
set local role authenticated;
select throws_like($$select public.remove_trip_member('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002')$$,'%còn nợ 66 đ%','debtor cannot be removed');

-- An estimate-only expense also blocks removal of the third member, even with a zero balance.
insert into ids select 'taxi', public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',null,null,'Taxi','transport','2026-11-02',50000,null,
  'a2323232-0000-0000-0000-000000000003',array['a2323232-0000-0000-0000-000000000003']::uuid[],'',null,'equal',null);
select throws_like($$select public.remove_trip_member('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003')$$,'%chưa có số Thực tế%','estimate-only involvement blocks removal');

-- The owner is owed 66: recorded payment settles both; then the member can be removed.
select set_config('request.jwt.claim.sub','a2323232-0000-0000-0000-000000000001',true);
select public.record_settlement_payment('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002',66,0);
select lives_ok($$select public.remove_trip_member('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002')$$,'settled member can be removed');
select is((select display_name from public.get_trip_former_people('b2323232-0000-0000-0000-000000000001')),'Bình','former member named for old expenses');

-- Old expense stays editable and keeps the former participant; shares may still change.
select lives_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',(select id from ids where name='dinner'),1,'Dinner edited','food','2026-11-01',0,100,
  'a2323232-0000-0000-0000-000000000001',array['a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000002']::uuid[],'note',null,'shares',
  '{"a2323232-0000-0000-0000-000000000001":1,"a2323232-0000-0000-0000-000000000002":2}'::jsonb); set constraints all immediate$$,'expense with former participant is editable');
set constraints all deferred;
select is((select title from public.expenses where id=(select id from ids where name='dinner')),'Dinner edited','edit saved');
select throws_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',(select id from ids where name='dinner'),2,'Dinner','food','2026-11-01',0,100,
  'a2323232-0000-0000-0000-000000000001',array['a2323232-0000-0000-0000-000000000001']::uuid[],'',null,'equal',null)$$,'22023',null,'former participant cannot be dropped');
select throws_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',(select id from ids where name='taxi'),1,'Taxi','transport','2026-11-02',50000,null,
  'a2323232-0000-0000-0000-000000000003',array['a2323232-0000-0000-0000-000000000003','a2323232-0000-0000-0000-000000000002']::uuid[],'',null,'equal',null)$$,'22023',null,'former member cannot join another expense');
select throws_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',null,null,'New','food','2026-11-02',1,null,
  'a2323232-0000-0000-0000-000000000002',array['a2323232-0000-0000-0000-000000000001']::uuid[],'',null,'equal',null)$$,'22023',null,'former member cannot pay a new expense');

-- A former payer stays payer.
reset role;
delete from public.settlement_payments;
delete from public.expenses where id=(select id from ids where name='taxi');
set local role authenticated;
insert into ids select 'hotel', public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',null,null,'Hotel','stay','2026-11-01',0,90,
  'a2323232-0000-0000-0000-000000000003',array['a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003']::uuid[],'',null,'equal',null);
reset role;
-- Third member paid 90 split equally with the owner: settle the 45 they are owed.
delete from public.settlement_payments;
insert into public.settlement_payments(trip_id,from_user_id,to_user_id,amount_vnd,created_by,updated_by) values
 ('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003',45,'a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000001');
select is(private.member_trip_balance('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003'),0::bigint,'third member settled');
set local role authenticated;
select lives_ok($$select public.remove_trip_member('b2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003')$$,'settled payer removed');
select lives_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',(select id from ids where name='hotel'),1,'Hotel 2','stay','2026-11-01',0,90,
  'a2323232-0000-0000-0000-000000000003',array['a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003']::uuid[],'',null,'equal',null); set constraints all immediate$$,'former payer kept on edit');
set constraints all deferred;
select throws_ok($$select public.save_expense_with_participants('b2323232-0000-0000-0000-000000000001',(select id from ids where name='hotel'),2,'Hotel','stay','2026-11-01',0,90,
  'a2323232-0000-0000-0000-000000000001',array['a2323232-0000-0000-0000-000000000001','a2323232-0000-0000-0000-000000000003']::uuid[],'',null,'equal',null)$$,'22023',null,'former payer cannot be replaced');

-- Hardening: trigger functions are not callable by signed-in users.
select ok(not has_function_privilege('authenticated','public.validate_trip_capacity()','execute'),'trigger functions revoked');
select ok(not has_column_privilege('authenticated','public.expense_participants','user_id','update') and has_column_privilege('authenticated','public.expense_participants','share_units','update'),'participants: only split values updatable');
select ok(has_function_privilege('authenticated','public.get_trip_former_people(uuid)','execute') and not has_function_privilege('anon','public.get_trip_former_people(uuid)','execute'),'former people RPC for signed-in users only');
reset role;
select * from finish();
rollback;
