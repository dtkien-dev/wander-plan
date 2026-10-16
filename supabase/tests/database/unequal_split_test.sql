begin;
select plan(17);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a2020202-0000-0000-0000-000000000001','split-owner@test.local','{}'),
 ('a2020202-0000-0000-0000-000000000002','split-member@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b2020202-0000-0000-0000-000000000001','Split trip','Hue','2026-11-01','2026-11-03','a2020202-0000-0000-0000-000000000001');
insert into public.trip_members(trip_id,user_id,role) values
 ('b2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000001','owner'),
 ('b2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002','editor');
select set_config('request.jwt.claim.sub','a2020202-0000-0000-0000-000000000001',true);
set local role authenticated;

create temp table ids(name text primary key, id uuid) on commit drop;
grant all on ids to authenticated;
insert into ids select 'shares', public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Phòng','stay','2026-11-01',300000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'shares',
  '{"a2020202-0000-0000-0000-000000000001":2,"a2020202-0000-0000-0000-000000000002":1}'::jsonb);
select is((select split_method from public.expenses where id=(select id from ids where name='shares')),'shares','shares method saved');
select is((select share_units from public.expense_participants where expense_id=(select id from ids where name='shares') and user_id='a2020202-0000-0000-0000-000000000001'),2,'share units saved');

insert into ids select 'amounts', public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Ăn tối','food','2026-11-01',100000,150000,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'amounts',
  '{"a2020202-0000-0000-0000-000000000001":50000,"a2020202-0000-0000-0000-000000000002":100000}'::jsonb);
select is((select sum(share_amount_vnd) from public.expense_participants where expense_id=(select id from ids where name='amounts')),150000::numeric,'exact amounts match actual');

select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Lệch','food','2026-11-01',100000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'amounts',
  '{"a2020202-0000-0000-0000-000000000001":50000,"a2020202-0000-0000-0000-000000000002":40000}'::jsonb); set constraints all immediate$$,'23514',null,'amounts must total the estimate when no actual');
set constraints all deferred;
select lives_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Dự kiến','food','2026-11-01',90000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'amounts',
  '{"a2020202-0000-0000-0000-000000000001":50000,"a2020202-0000-0000-0000-000000000002":40000}'::jsonb); set constraints all immediate$$,'amounts may match the estimate');
set constraints all deferred;
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Thiếu','food','2026-11-01',100000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'shares',
  '{"a2020202-0000-0000-0000-000000000001":2}'::jsonb); set constraints all immediate$$,'23514',null,'every participant needs shares');
set constraints all deferred;
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Ngoài','food','2026-11-01',100000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001']::uuid[],'',null,'shares',
  '{"a2020202-0000-0000-0000-000000000001":1,"a2020202-0000-0000-0000-000000000002":1}'::jsonb)$$,'22023',null,'values only for participants');
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Sai','food','2026-11-01',100000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001']::uuid[],'',null,'random','{}'::jsonb)$$,'22023',null,'unknown method rejected');
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Không','food','2026-11-01',100000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001']::uuid[],'',null,'shares',
  '{"a2020202-0000-0000-0000-000000000001":0}'::jsonb)$$,'23514',null,'zero shares rejected');

-- Editing the actual amount without re-entering exact amounts is blocked.
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',(select id from ids where name='amounts'),1,'Ăn tối','food','2026-11-01',100000,200000,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'amounts',
  '{"a2020202-0000-0000-0000-000000000001":50000,"a2020202-0000-0000-0000-000000000002":100000}'::jsonb); set constraints all immediate$$,'23514',null,'changed actual requires new amounts');
set constraints all deferred;
select throws_ok($$update public.expenses set actual_amount_vnd=1 where id=(select id from ids where name='amounts'); set constraints all immediate$$,'23514',null,'direct amount edit cannot break the split');
set constraints all deferred;
select throws_ok($$delete from public.expense_participants where expense_id=(select id from ids where name='amounts') and user_id='a2020202-0000-0000-0000-000000000002'; set constraints all immediate$$,'23514',null,'direct participant removal cannot break the split');
set constraints all deferred;

-- Older clients send no method: allowed for equal expenses, rejected for unequal ones.
select throws_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',(select id from ids where name='shares'),1,'Phòng','stay','2026-11-01',300000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001']::uuid[],'',null)$$,'22023',null,'old client cannot reset unequal split');
insert into ids select 'legacy', public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',null,null,'Cũ','food','2026-11-01',10000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001']::uuid[],'',null);
select is((select split_method from public.expenses where id=(select id from ids where name='legacy')),'equal','old client creates equal split');
select lives_ok($$select public.save_expense_with_participants('b2020202-0000-0000-0000-000000000001',(select id from ids where name='shares'),1,'Phòng','stay','2026-11-01',300000,null,
  'a2020202-0000-0000-0000-000000000001',array['a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002']::uuid[],'',null,'equal',null); set constraints all immediate$$,'switching back to equal clears values');
set constraints all deferred;
select is((select count(*) from public.expense_participants where expense_id=(select id from ids where name='shares') and share_units is null),2::bigint,'equal split stores no shares');
select lives_ok($$select public.import_trip_data('b2020202-0000-0000-0000-000000000001','[]'::jsonb,
  jsonb_build_array(jsonb_build_object('title','Vé','category','ticket','expense_date','2026-11-02','estimated_amount_vnd',30000,
    'paid_by','a2020202-0000-0000-0000-000000000002','participant_ids',jsonb_build_array('a2020202-0000-0000-0000-000000000001','a2020202-0000-0000-0000-000000000002'),
    'split_method','amounts','split_values',jsonb_build_object('a2020202-0000-0000-0000-000000000001',10000,'a2020202-0000-0000-0000-000000000002',20000)))); set constraints all immediate$$,'import accepts split columns');
reset role;
select * from finish();
rollback;
