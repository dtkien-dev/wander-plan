-- Invitations reserve a seat until the recipient responds or the owner revokes.
-- Existing accepted invitations and memberships remain unchanged.
alter table public.trip_invitations
  add column revoked_at timestamptz,
  add column declined_at timestamptz,
  add constraint trip_invitations_one_response check (
    num_nonnulls(accepted_at, revoked_at, declined_at) <= 1
  );

create or replace function private.current_user_email()
returns text
language sql stable security definer
set search_path = public, pg_temp
as $$
  select lower(trim(u.email)) from auth.users u where u.id = auth.uid();
$$;
revoke all on function private.current_user_email() from public;
grant execute on function private.current_user_email() to authenticated;

create policy "recipients view own invitations"
on public.trip_invitations for select to authenticated
using (email = private.current_user_email());
-- Mutations are only available through the serialized invitation RPCs.
revoke insert, update, delete on public.trip_invitations from anon, authenticated;
grant select on public.trip_invitations to authenticated;

create or replace function public.validate_trip_capacity()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  occupied_seats integer;
begin
  -- UPDATE already holds this same trip row lock used by invitation RPCs.
  select
    (select count(*) from public.trip_members where trip_id = new.id) +
    (select count(*) from public.trip_invitations where trip_id = new.id
      and accepted_at is null and revoked_at is null and declined_at is null)
  into occupied_seats;
  if new.max_members < occupied_seats then
    raise exception 'Số người tối đa không thể thấp hơn % chỗ đang được sử dụng.', occupied_seats
      using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Existing owner RLS permits direct member inserts too. Enforce the same seat
-- invariant at that boundary, with the trip lock preceding membership changes.
create or replace function private.validate_member_capacity()
returns trigger
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  seat_limit integer;
  occupied_seats integer;
begin
  select max_members into seat_limit from public.trips where id = new.trip_id for update;
  if exists (select 1 from public.trip_members where trip_id = new.trip_id and user_id = new.user_id) then
    return new;
  end if;
  select
    (select count(*) from public.trip_members where trip_id = new.trip_id) +
    (select count(*) from public.trip_invitations where trip_id = new.trip_id
      and accepted_at is null and revoked_at is null and declined_at is null)
  into occupied_seats;
  if occupied_seats >= seat_limit then
    raise exception 'Chuyến đi đã dùng hết % chỗ thành viên và lời mời.', seat_limit using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_member_capacity() from public;
create trigger trip_members_validate_capacity before insert on public.trip_members
for each row execute function private.validate_member_capacity();

create or replace function private.validate_membership_identity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.trip_id is distinct from old.trip_id or new.user_id is distinct from old.user_id then
    raise exception 'Không thể chuyển thành viên sang chuyến đi hoặc tài khoản khác.' using errcode = '23514';
  end if;
  if old.role = 'owner' and new.role <> 'owner' then
    raise exception 'Không thể thay đổi vai trò chủ nhóm.' using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_membership_identity() from public;
create trigger trip_members_validate_identity before update on public.trip_members
for each row execute function private.validate_membership_identity();

create or replace function public.invite_trip_member(target_trip_id uuid, target_email text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(trim(target_email));
  seat_limit integer;
  occupied_seats integer;
begin
  select max_members into seat_limit from public.trips where id = target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể mời thành viên.';
  end if;
  if seat_limit is null then raise exception 'Không tìm thấy chuyến đi.'; end if;
  if normalized_email is null or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Email không hợp lệ.';
  end if;
  if exists (
    select 1 from public.trip_members m join auth.users u on u.id = m.user_id
    where m.trip_id = target_trip_id and lower(trim(u.email)) = normalized_email
  ) or exists (
    select 1 from public.trip_invitations where trip_id = target_trip_id and email = normalized_email
      and accepted_at is null and revoked_at is null and declined_at is null
  ) then return; end if;

  select
    (select count(*) from public.trip_members where trip_id = target_trip_id) +
    (select count(*) from public.trip_invitations where trip_id = target_trip_id
      and accepted_at is null and revoked_at is null and declined_at is null)
  into occupied_seats;
  if occupied_seats >= seat_limit then
    raise exception 'Chuyến đi đã dùng hết % chỗ thành viên và lời mời.', seat_limit;
  end if;
  insert into public.trip_invitations (trip_id, email, role, invited_by)
  values (target_trip_id, normalized_email, 'editor', auth.uid())
  on conflict (trip_id, email) do update
  set invited_by = excluded.invited_by, created_at = now(),
      accepted_at = null, revoked_at = null, declined_at = null;
end;
$$;

create or replace function public.revoke_trip_invitation(target_trip_id uuid, target_email text)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể thu hồi lời mời.';
  end if;
  update public.trip_invitations set revoked_at = now()
  where trip_id = target_trip_id and email = lower(trim(target_email))
    and accepted_at is null and revoked_at is null and declined_at is null;
end;
$$;

-- Keep older clients safe: loading a workspace must never accept invitations.
create or replace function public.claim_trip_invitations()
returns integer
language sql security definer
set search_path = public, pg_temp
as $$ select 0; $$;

create or replace function public.get_my_trip_invitations()
returns table (trip_id uuid, trip_name text, destination text, start_date date, end_date date)
language sql stable security definer
set search_path = public, pg_temp
as $$
  select t.id, t.name, t.destination, t.start_date, t.end_date
  from public.trip_invitations i join public.trips t on t.id = i.trip_id
  where auth.uid() is not null and i.email = private.current_user_email()
    and i.accepted_at is null and i.revoked_at is null and i.declined_at is null
  order by i.created_at, t.id;
$$;

create or replace function public.respond_trip_invitation(target_trip_id uuid, accept_invitation boolean)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  current_email text;
  invitation public.trip_invitations%rowtype;
  seat_limit integer;
  occupied_seats integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if accept_invitation is null then
    raise exception 'Vui lòng chọn chấp nhận hoặc từ chối lời mời.' using errcode = '22023';
  end if;
  select max_members into seat_limit from public.trips where id = target_trip_id for update;
  -- Use the current database identity, never a stale or supplied JWT email.
  select lower(trim(u.email)) into current_email from auth.users u where u.id = auth.uid() for share;
  select * into invitation from public.trip_invitations
  where trip_id = target_trip_id and email = current_email;
  if not found or invitation.revoked_at is not null then
    raise exception 'Không tìm thấy lời mời đang chờ.';
  end if;
  if (accept_invitation and invitation.accepted_at is not null)
    or (not accept_invitation and invitation.declined_at is not null) then return; end if;
  if invitation.accepted_at is not null or invitation.declined_at is not null then
    raise exception 'Lời mời đã được phản hồi.';
  end if;
  if not accept_invitation then
    update public.trip_invitations set declined_at = now()
    where trip_id = target_trip_id and email = current_email;
    return;
  end if;
  select
    (select count(*) from public.trip_members where trip_id = target_trip_id) +
    (select count(*) from public.trip_invitations where trip_id = target_trip_id
      and accepted_at is null and revoked_at is null and declined_at is null)
  into occupied_seats;
  if occupied_seats > seat_limit then
    raise exception 'Chuyến đi đã dùng hết % chỗ thành viên và lời mời.', seat_limit;
  end if;
  update public.trip_invitations set accepted_at = now()
  where trip_id = target_trip_id and email = current_email;
  insert into public.trip_members (trip_id, user_id, role)
  values (target_trip_id, auth.uid(), 'editor')
  on conflict (trip_id, user_id) do nothing;
end;
$$;

create or replace function public.remove_trip_member(target_trip_id uuid, target_user_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_role text;
begin
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể loại thành viên.';
  end if;
  select role into target_role from public.trip_members
  where trip_id = target_trip_id and user_id = target_user_id for update;
  if target_role is null then raise exception 'Không tìm thấy thành viên trong chuyến đi.'; end if;
  if target_role = 'owner' then raise exception 'Không thể loại chủ nhóm khỏi chuyến đi.'; end if;
  delete from public.trip_members where trip_id = target_trip_id and user_id = target_user_id;
end;
$$;

create or replace function public.get_trip_people(target_trip_id uuid)
returns table (user_id uuid, email text, display_name text, role text, status text, joined_at timestamptz)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.'; end if;
  return query
  select people.user_id, people.email, people.display_name, people.role, people.status, people.joined_at
  from (
    select m.user_id, u.email::text, coalesce(p.display_name, u.email, 'Thành viên')::text as display_name,
           m.role::text, 'active'::text as status, m.joined_at
    from public.trip_members m join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id where m.trip_id = target_trip_id
    union all
    select null::uuid, i.email, i.email, i.role::text, 'invited'::text, null::timestamptz
    from public.trip_invitations i where i.trip_id = target_trip_id
      and i.accepted_at is null and i.revoked_at is null and i.declined_at is null
  ) people
  order by case when people.role = 'owner' then 0 when people.status = 'active' then 1 else 2 end,
    people.display_name;
end;
$$;

revoke all on function public.revoke_trip_invitation(uuid, text) from public;
revoke all on function public.get_my_trip_invitations() from public;
revoke all on function public.respond_trip_invitation(uuid, boolean) from public;
grant execute on function public.revoke_trip_invitation(uuid, text) to authenticated;
grant execute on function public.get_my_trip_invitations() to authenticated;
grant execute on function public.respond_trip_invitation(uuid, boolean) to authenticated;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'trip_invitations') then
    alter publication supabase_realtime add table public.trip_invitations;
  end if;
end;
$$;

-- Request keys are private: callers see trips only through the existing RLS.
create table private.trip_creation_requests (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null,
  trip_id uuid not null references public.trips(id) on delete cascade,
  primary key (owner_id, request_id)
);
revoke all on private.trip_creation_requests from public, anon, authenticated;

create or replace function public.create_trip(
  trip_name text, trip_destination text, trip_start_date date, trip_end_date date,
  trip_budget_vnd numeric, trip_max_members integer, request_id uuid
)
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  new_trip_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if request_id is null then raise exception 'Mã yêu cầu không hợp lệ.' using errcode = '22023'; end if;
  if trip_name is null or char_length(trim(trip_name)) not between 2 and 100
    or trip_destination is null or char_length(trim(trip_destination)) not between 2 and 150 then
    raise exception 'Tên chuyến đi hoặc điểm đến không hợp lệ.' using errcode = '22023';
  end if;
  if trip_start_date is null or trip_end_date is null
    or not isfinite(trip_start_date) or not isfinite(trip_end_date) or trip_end_date < trip_start_date then
    raise exception 'Ngày chuyến đi không hợp lệ.' using errcode = '22023';
  end if;
  if trip_budget_vnd is null or trip_budget_vnd < 0 or trip_budget_vnd > 9223372036854775807
    or trip_budget_vnd <> trunc(trip_budget_vnd) then
    raise exception 'Ngân sách phải là số nguyên VND không âm.' using errcode = '22023';
  end if;
  if trip_max_members is null or trip_max_members not between 1 and 20 then
    raise exception 'Số người tối đa phải từ 1 đến 20.' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || request_id::text, 0));
  select r.trip_id into new_trip_id from private.trip_creation_requests r
  where r.owner_id = auth.uid() and r.request_id = create_trip.request_id;
  if found then return new_trip_id; end if;
  insert into public.trips (name, destination, start_date, end_date, timezone, budget_vnd, max_members, created_by)
  values (trim(trip_name), trim(trip_destination), trip_start_date, trip_end_date,
    'Asia/Ho_Chi_Minh', trip_budget_vnd::bigint, trip_max_members, auth.uid())
  returning id into new_trip_id;
  insert into public.trip_members (trip_id, user_id, role) values (new_trip_id, auth.uid(), 'owner');
  insert into private.trip_creation_requests (owner_id, request_id, trip_id)
  values (auth.uid(), request_id, new_trip_id);
  return new_trip_id;
end;
$$;
revoke all on function public.create_trip(text, text, date, date, numeric, integer, uuid) from public;
grant execute on function public.create_trip(text, text, date, date, numeric, integer, uuid) to authenticated;

create or replace function public.create_default_trip()
returns uuid
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  new_trip_id uuid;
  current_user_is_creator boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('wanderplan-default-trip:' || auth.uid()::text, 0));
  select t.id, t.created_by = auth.uid() into new_trip_id, current_user_is_creator
  from public.trips t left join public.trip_members m on m.trip_id = t.id and m.user_id = auth.uid()
  where m.user_id is not null or t.created_by = auth.uid()
  order by t.created_at, t.id limit 1;
  if found then
    if current_user_is_creator then
      insert into public.trip_members (trip_id, user_id, role) values (new_trip_id, auth.uid(), 'owner')
      on conflict (trip_id, user_id) do update set role = 'owner';
    end if;
    return new_trip_id;
  end if;
  return public.create_trip('Đà Lạt trong sương', 'Đà Lạt, Lâm Đồng', date '2026-11-27',
    date '2026-11-30', 9000000, 4, gen_random_uuid());
end;
$$;
