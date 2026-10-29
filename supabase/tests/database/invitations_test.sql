begin;
select plan(42);

insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'invite-owner@test.local', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'existing@test.local', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'uninvited@test.local', '{}', '{}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'legacy@test.local', '{}', '{}', now(), now());
insert into public.trips (id, name, destination, start_date, end_date, max_members, created_by)
values
  ('20000000-0000-0000-0000-000000000001', 'Explicit invitations', 'Da Lat', '2026-11-27', '2026-11-30', 3, '10000000-0000-0000-0000-000000000001'),
  ('20000000-0000-0000-0000-000000000002', 'Accepted history', 'Da Nang', '2026-12-01', '2026-12-02', 3, '10000000-0000-0000-0000-000000000001');
insert into public.trip_members (trip_id, user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'editor');
insert into public.trip_invitations (trip_id, email, invited_by, accepted_at)
values ('20000000-0000-0000-0000-000000000002', 'legacy@test.local', '10000000-0000-0000-0000-000000000001', '2026-10-01T00:00:00Z');

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok($$select public.invite_trip_member('20000000-0000-0000-0000-000000000001', ' Existing@Test.Local ')$$, 'an existing account receives a pending invitation');
select lives_ok($$select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'late@test.local')$$, 'an unregistered email reserves a seat');
select is((select count(*) from public.trip_members where trip_id = '20000000-0000-0000-0000-000000000001'), 1::bigint, 'inviting existing users does not enroll them');
select lives_ok($$select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'existing@test.local')$$, 'retrying a pending invitation at capacity is idempotent');
select throws_ok($$select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'third@test.local')$$, 'P0001', 'Chuyến đi đã dùng hết 3 chỗ thành viên và lời mời.', 'pending invitations consume capacity');
select throws_ok($$insert into public.trip_members (trip_id, user_id, role) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'editor')$$, '42501', 'permission denied for table trip_members', 'direct owner inserts cannot bypass consent or reserved seats');
select throws_ok($$update public.trips set max_members = 2 where id = '20000000-0000-0000-0000-000000000001'$$, '23514', 'Số người tối đa không thể thấp hơn 3 chỗ đang được sử dụng.', 'capacity updates include all pending invitations');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select set_config('request.jwt.claims', '{"email":"existing@test.local"}', true);
select is((select count(*) from public.get_my_trip_invitations()), 0::bigint, 'a stale or forged JWT email cannot expose another user invitation');
select is((select count(*) from public.trip_invitations), 0::bigint, 'outsiders cannot read invitation rows');
select throws_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'P0001', 'Không tìm thấy lời mời đang chờ.', 'response uses the database user email');
select throws_ok($$select public.revoke_trip_invitation('20000000-0000-0000-0000-000000000001', 'late@test.local')$$, 'P0001', 'Chỉ chủ nhóm mới có thể thu hồi lời mời.', 'only owners may revoke');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select is((select trip_name from public.get_my_trip_invitations()), 'Explicit invitations', 'recipients can see an invitation summary before membership');
select is((select count(*) from public.trip_invitations), 1::bigint, 'recipients can read only their invitation rows');
select is((select count(*) from public.trips), 0::bigint, 'pending invitations do not grant trip access');
select is(public.claim_trip_invitations(), 0, 'legacy automatic claim safely does nothing');
select is((select count(*) from public.trip_members), 0::bigint, 'legacy claim does not create membership');
select lives_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'explicit acceptance converts a reservation at capacity');
select lives_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'acceptance retries are idempotent');
select is((select count(*) from public.trip_members where trip_id = '20000000-0000-0000-0000-000000000001'), 2::bigint, 'acceptance stores one membership');
select is((select count(*) from public.get_my_trip_invitations()), 0::bigint, 'accepted invitations leave the inbox');
select is((select count(*) from public.trips), 1::bigint, 'acceptance grants access only to the accepted trip');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select throws_ok($$update public.trip_members set trip_id = '20000000-0000-0000-0000-000000000002' where trip_id = '20000000-0000-0000-0000-000000000001' and user_id = '10000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table trip_members', 'owners cannot bypass invitation and capacity rules by moving membership');
select throws_ok($$update public.trip_members set user_id = '10000000-0000-0000-0000-000000000003' where trip_id = '20000000-0000-0000-0000-000000000001' and user_id = '10000000-0000-0000-0000-000000000002'$$, '42501', 'permission denied for table trip_members', 'owners cannot transfer accepted membership to another account');
select throws_ok($$update public.trip_members set role = 'editor' where trip_id = '20000000-0000-0000-0000-000000000001' and user_id = '10000000-0000-0000-0000-000000000001'$$, '42501', 'permission denied for table trip_members', 'owner membership cannot be downgraded');
select lives_ok($$select public.revoke_trip_invitation('20000000-0000-0000-0000-000000000001', 'existing@test.local')$$, 'revoking an accepted invitation does not remove membership');
select is((select count(*) from public.get_trip_people('20000000-0000-0000-0000-000000000001') where status = 'active'), 2::bigint, 'accepted people remain active after revoke retry');
select lives_ok($$select public.revoke_trip_invitation('20000000-0000-0000-0000-000000000001', 'late@test.local'); select public.revoke_trip_invitation('20000000-0000-0000-0000-000000000001', 'late@test.local')$$, 'revocation is idempotent');
select is((select count(*) from public.get_trip_people('20000000-0000-0000-0000-000000000001') where status = 'invited'), 0::bigint, 'revoked invitations leave the people list');
select lives_ok($$update public.trips set max_members = 2 where id = '20000000-0000-0000-0000-000000000001'$$, 'revocation releases capacity');
select lives_ok($$update public.trips set max_members = 3 where id = '20000000-0000-0000-0000-000000000001'; select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'late@test.local')$$, 'owners can reinvite a revoked recipient');

reset role;
insert into auth.users (id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('10000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'late@test.local', '{}', '{}', now(), now());
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select is((select count(*) from public.trip_members), 0::bigint, 'signup does not automatically accept a pending invitation');
select lives_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', false); select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', false)$$, 'decline and its retry succeed');
select is((select count(*) from public.get_my_trip_invitations()), 0::bigint, 'declined invitations leave the inbox');
select throws_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'P0001', 'Lời mời đã được phản hồi.', 'a declined invitation cannot be accepted without reinviting');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select lives_ok($$update public.trips set max_members = 2 where id = '20000000-0000-0000-0000-000000000001'$$, 'decline also releases its reserved seat');
select lives_ok($$update public.trips set max_members = 3 where id = '20000000-0000-0000-0000-000000000001'; select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'late@test.local'); select public.revoke_trip_invitation('20000000-0000-0000-0000-000000000001', 'late@test.local')$$, 'a declined recipient can receive a fresh invitation');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select throws_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'P0001', 'Không tìm thấy lời mời đang chờ.', 'revoked invitations cannot be accepted');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select public.invite_trip_member('20000000-0000-0000-0000-000000000001', 'late@test.local');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);
select lives_ok($$select public.respond_trip_invitation('20000000-0000-0000-0000-000000000001', true)$$, 'a newly registered user explicitly accepts a reinvitation');
select is((select count(*) from public.trip_members where trip_id = '20000000-0000-0000-0000-000000000001'), 3::bigint, 'acceptance never exceeds the seat limit');
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is((select accepted_at from public.trip_invitations where trip_id = '20000000-0000-0000-0000-000000000002'), '2026-10-01T00:00:00Z'::timestamptz, 'legacy accepted invitation history remains unchanged');
select is((select count(*) from public.get_trip_people('20000000-0000-0000-0000-000000000002') where status = 'active'), 2::bigint, 'legacy accepted members remain active');
select ok(exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'trip_invitations'), 'invitation changes are published for authorized realtime subscriptions');

select * from finish();
rollback;
