begin;
select plan(12);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a2424242-0000-0000-0000-000000000001','lock-owner@test.local','{}'),
 ('a2424242-0000-0000-0000-000000000002','lock-member@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b2424242-0000-0000-0000-000000000001','Lock trip','Hue','2026-11-01','2026-11-03','a2424242-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000001','owner'),
 ('b2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002','editor');
select set_config('request.jwt.claim.sub','a2424242-0000-0000-0000-000000000001',true);
set local role authenticated;
create temp table ids(name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;
-- Owner paid 100 shared with the member; the member pays back 50, then leaves.
insert into ids select 'meal', public.save_expense_with_participants('b2424242-0000-0000-0000-000000000001',null,null,'Meal','food','2026-11-01',0,100,
  'a2424242-0000-0000-0000-000000000001',array['a2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002']::uuid[],'',null,'equal',null);
insert into ids select 'payment', public.record_settlement_payment('b2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002',50,0);
select lives_ok($$select public.remove_trip_member('b2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002')$$,'settled member removed');

select lives_ok($$select public.save_expense_with_participants('b2424242-0000-0000-0000-000000000001',(select id from ids where name='meal'),1,'Bữa tối','other','2026-11-02',0,100,
  'a2424242-0000-0000-0000-000000000001',array['a2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002']::uuid[],'ghi chú',null,'equal',null); set constraints all immediate$$,'title, category, date and notes stay editable');
set constraints all deferred;
select is((select title || '|' || category || '|' || expense_date || '|' || notes from public.expenses where id=(select id from ids where name='meal')),'Bữa tối|other|2026-11-02|ghi chú','non-money edit saved');
select throws_ok($$select public.save_expense_with_participants('b2424242-0000-0000-0000-000000000001',(select id from ids where name='meal'),2,'Bữa tối','other','2026-11-02',0,120,
  'a2424242-0000-0000-0000-000000000001',array['a2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002']::uuid[],'',null,'equal',null)$$,'23514',null,'actual amount locked');
select throws_ok($$select public.save_expense_with_participants('b2424242-0000-0000-0000-000000000001',(select id from ids where name='meal'),2,'Bữa tối','other','2026-11-02',0,100,
  'a2424242-0000-0000-0000-000000000001',array['a2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002']::uuid[],'',null,'shares',
  '{"a2424242-0000-0000-0000-000000000001":1,"a2424242-0000-0000-0000-000000000002":3}'::jsonb)$$,'23514',null,'split method locked');
select throws_ok($$update public.expenses set estimated_amount_vnd=1 where id=(select id from ids where name='meal')$$,'23514',null,'direct estimate edit locked');
select throws_ok($$delete from public.expenses where id=(select id from ids where name='meal')$$,'23514',null,'expense with former member cannot be deleted');
select throws_ok($$delete from public.expense_participants where expense_id=(select id from ids where name='meal') and user_id='a2424242-0000-0000-0000-000000000001'$$,'23514',null,'participants locked');
select throws_ok($$select public.undo_settlement_payment('b2424242-0000-0000-0000-000000000001',(select id from ids where name='payment'))$$,'23514',null,'payment from former member stays');
select throws_ok($$select public.record_settlement_payment('b2424242-0000-0000-0000-000000000001','a2424242-0000-0000-0000-000000000002',10,1)$$,'23514',null,'former member cannot be recorded as payer');

-- Expenses with only current members are unaffected.
insert into ids select 'taxi', public.save_expense_with_participants('b2424242-0000-0000-0000-000000000001',null,null,'Taxi','transport','2026-11-02',10,null,
  'a2424242-0000-0000-0000-000000000001',array['a2424242-0000-0000-0000-000000000001']::uuid[],'',null,'equal',null);
select lives_ok($$update public.expenses set estimated_amount_vnd=20 where id=(select id from ids where name='taxi')$$,'current-member expense still editable');
select lives_ok($$delete from public.expenses where id=(select id from ids where name='taxi')$$,'current-member expense still deletable');
reset role;
select * from finish();
rollback;
