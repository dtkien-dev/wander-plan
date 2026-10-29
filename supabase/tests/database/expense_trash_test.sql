begin;
select plan(17);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a3434343-0000-0000-0000-000000000001','etrash-owner@test.local','{}'),
 ('a3434343-0000-0000-0000-000000000002','etrash-member@test.local','{}'),
 ('a3434343-0000-0000-0000-000000000003','etrash-other@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b3434343-0000-0000-0000-000000000001','Expense trash trip','Hue','2026-11-01','2026-11-03','a3434343-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000001','owner'),
 ('b3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000002','editor'),
 ('b3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000003','editor');
create temp table ids(name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;

-- The member records and deletes their own expense.
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000002',true);
set local role authenticated;
insert into ids select 'meal', public.save_expense_with_participants('b3434343-0000-0000-0000-000000000001',null,null,'Meal','food','2026-11-01',0,100,
 'a3434343-0000-0000-0000-000000000002',array['a3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000002']::uuid[],null);
delete from public.expenses where id=(select id from ids where name='meal') and version=1;
select is((select count(*)::integer from public.expense_trash where id=(select id from ids where name='meal')),1,'deleting member sees own trash entry');
select is((select jsonb_array_length(snapshot->'expense_participants') from public.expense_trash where id=(select id from ids where name='meal')),2,'snapshot keeps participants');
select throws_ok($$insert into public.expense_trash(id,trip_id,deleted_by,snapshot,deleted_at,expires_at) values (gen_random_uuid(),'b3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000002','{}',now(),now()+interval '1 day')$$,'42501',null,'clients cannot write trash directly');

-- Another member neither sees nor restores it.
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000003',true);
select is((select count(*)::integer from public.expense_trash),0,'other member cannot see trash entry');
select throws_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='meal'),1,(select deleted_at from public.expense_trash where id=(select id from ids where name='meal')))$$,'40001',null,'other member cannot restore an entry hidden from them');
reset role;
select set_config('test.deleted_at',(select deleted_at::text from public.expense_trash where id=(select id from ids where name='meal')),true);
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000003',true);
set local role authenticated;
select throws_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='meal'),1,current_setting('test.deleted_at')::timestamptz)$$,'42501',null,'other member refused even with exact token');

-- The owner sees it; a stale version is refused; the deleter restores it.
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000001',true);
select is((select count(*)::integer from public.expense_trash),1,'owner sees member deletion');
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000002',true);
select throws_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='meal'),2,current_setting('test.deleted_at')::timestamptz)$$,'40001',null,'stale version refused');
select lives_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='meal'),1,current_setting('test.deleted_at')::timestamptz)$$,'deleter restores');
select is((select version from public.expenses where id=(select id from ids where name='meal')),2,'restored expense version incremented');
select is((select count(*)::integer from public.expense_participants where expense_id=(select id from ids where name='meal')),2,'participants restored');
select is((select count(*)::integer from public.expense_trash),0,'trash entry removed after restore');

-- The owner may restore what a member deleted.
delete from public.expenses where id=(select id from ids where name='meal') and version=2;
select set_config('request.jwt.claim.sub','a3434343-0000-0000-0000-000000000001',true);
select lives_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='meal'),2,(select deleted_at from public.expense_trash where id=(select id from ids where name='meal')))$$,'owner restores member deletion');

-- A063: restore is refused once a participant has left the group.
insert into ids select 'taxi', public.save_expense_with_participants('b3434343-0000-0000-0000-000000000001',null,null,'Taxi','transport','2026-11-02',0,100,
 'a3434343-0000-0000-0000-000000000001',array['a3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000003']::uuid[],null);
delete from public.expenses where id=(select id from ids where name='taxi') and version=1;
select public.remove_trip_member('b3434343-0000-0000-0000-000000000001','a3434343-0000-0000-0000-000000000003');
select throws_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='taxi'),1,(select deleted_at from public.expense_trash where id=(select id from ids where name='taxi')))$$,'23514',null,'restore blocked after participant left');

-- Expired entries cannot be restored and are purged.
reset role;
update public.expense_trash set expires_at=now()-interval '1 second' where id=(select id from ids where name='taxi');
select throws_ok($$select public.restore_trip_expense('b3434343-0000-0000-0000-000000000001',(select id from ids where name='taxi'),1,(select deleted_at from public.expense_trash where id=(select id from ids where name='taxi')))$$,'40001',null,'expired entry refused');
select is(private.purge_expired_expense_trash(),1,'purge removes expired entry');
select ok(not has_function_privilege('anon','public.restore_trip_expense(uuid,uuid,integer,timestamptz)','execute'),'anon cannot restore');
select * from finish();
rollback;
