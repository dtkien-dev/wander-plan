begin;
select plan(22);
insert into auth.users(id,email,raw_user_meta_data) values
 ('a1616161-0000-0000-0000-000000000001','pay-owner@test.local','{}'),
 ('a1616161-0000-0000-0000-000000000002','pay-member@test.local','{}'),
 ('a1616161-0000-0000-0000-000000000003','pay-outsider@test.local','{}');
insert into public.trips(id,name,destination,start_date,end_date,created_by) values
 ('b1616161-0000-0000-0000-000000000001','Pay trip','Hue','2026-11-01','2026-11-03','a1616161-0000-0000-0000-000000000001'),
 ('b1616161-0000-0000-0000-000000000002','Other trip','Hue','2026-11-01','2026-11-03','a1616161-0000-0000-0000-000000000003');
insert into public.trip_members(trip_id,user_id,role) values
 ('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000001','owner'),
 ('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002','editor'),
 ('b1616161-0000-0000-0000-000000000002','a1616161-0000-0000-0000-000000000003','owner');

-- Owner (recipient) records that the member paid them.
select set_config('request.jwt.claim.sub','a1616161-0000-0000-0000-000000000001',true);
set local role authenticated;
select lives_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002',50000,0)$$,'recipient records payment');
select is((select to_user_id from public.settlement_payments),'a1616161-0000-0000-0000-000000000001'::uuid,'recipient is always the caller');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002',50000,0)$$,'P0001',null,'stale count blocks duplicate record');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002',0,1)$$,'22023',null,'zero amount rejected');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000001',1000,1)$$,'22023',null,'cannot pay yourself');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000003',1000,1)$$,'23514',null,'payer outside trip rejected');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000002','a1616161-0000-0000-0000-000000000003',1000,0)$$,'42501',null,'cannot record in another trip');
select throws_ok($$insert into public.settlement_payments(trip_id,from_user_id,to_user_id,amount_vnd) values('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002','a1616161-0000-0000-0000-000000000001',1)$$,'42501',null,'direct insert denied');
select throws_ok($$update public.settlement_payments set amount_vnd=1$$,'42501',null,'direct update denied');

-- The payer cannot confirm or undo on the recipient's behalf.
select set_config('request.jwt.claim.sub','a1616161-0000-0000-0000-000000000002',true);
select is((select count(*) from public.settlement_payments),1::bigint,'member sees trip payments');
select throws_ok($$select public.undo_settlement_payment('b1616161-0000-0000-0000-000000000001',(select id from public.settlement_payments))$$,'P0001',null,'payer cannot undo');
select lives_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000001',20000,1)$$,'member records money they received');
select is((select to_user_id from public.settlement_payments order by created_at desc, amount_vnd limit 1),'a1616161-0000-0000-0000-000000000002'::uuid,'member is recipient of own record');

select set_config('request.jwt.claim.sub','a1616161-0000-0000-0000-000000000001',true);
select lives_ok($$select public.undo_settlement_payment('b1616161-0000-0000-0000-000000000001',(select id from public.settlement_payments where amount_vnd=50000))$$,'recipient undoes');
select is((select count(*) from public.settlement_payments where amount_vnd=50000 and deleted_at is not null),1::bigint,'undo keeps the row as history');
select throws_ok($$select public.undo_settlement_payment('b1616161-0000-0000-0000-000000000001',(select id from public.settlement_payments where amount_vnd=50000))$$,'P0001',null,'undo only once');

select set_config('request.jwt.claim.sub','a1616161-0000-0000-0000-000000000003',true);
select is((select count(*) from public.settlement_payments),0::bigint,'outsider cannot read payments');
select throws_ok($$select public.undo_settlement_payment('b1616161-0000-0000-0000-000000000001',(select id from public.settlement_payments limit 1))$$,'42501',null,'outsider cannot undo');
reset role;

-- Archived trips hide payments and block writes.
update public.trips set archived_at=now() where id='b1616161-0000-0000-0000-000000000001';
select set_config('request.jwt.claim.sub','a1616161-0000-0000-0000-000000000001',true);
set local role authenticated;
select is((select count(*) from public.settlement_payments),0::bigint,'archived payments hidden');
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002',1000,2)$$,'42501',null,'archived trip blocks record');
reset role;
set local role anon;
select throws_ok($$select public.record_settlement_payment('b1616161-0000-0000-0000-000000000001','a1616161-0000-0000-0000-000000000002',1000,2)$$,'42501',null,'signed-out RPC denied');
reset role;
select ok(exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='settlement_payments'),'payments published for realtime');
select * from finish();
rollback;
