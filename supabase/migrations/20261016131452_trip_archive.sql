alter table public.trips add column archived_at timestamptz;

create function private.is_trip_active(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists(select 1 from public.trips where id=target_trip_id and archived_at is null); $$;
revoke all on function private.is_trip_active(uuid) from public,anon;
grant execute on function private.is_trip_active(uuid) to authenticated;

create or replace function private.is_trip_member(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from public.trip_members m join public.trips t on t.id=m.trip_id
    where m.trip_id=target_trip_id and m.user_id=auth.uid() and t.archived_at is null);
$$;
create or replace function private.is_trip_owner(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from public.trips t where t.id=target_trip_id and t.archived_at is null
    and (t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner')));
$$;
drop policy "members view trips" on public.trips;
create policy "members view trips" on public.trips for select to authenticated
  using (archived_at is null and (created_by=auth.uid() or private.is_trip_member(id)));
drop policy "recipients view own invitations" on public.trip_invitations;
create policy "recipients view own invitations" on public.trip_invitations for select to authenticated
  using (email=private.current_user_email() and private.is_trip_active(trip_id));

-- Archive state can only change through the versioned RPC and its Realtime notification.
revoke update on public.trips from authenticated;
grant update(name,destination,start_date,end_date,budget_vnd,max_members) on public.trips to authenticated;

create function public.get_my_archived_trips()
returns table(id uuid,name text,archived_at timestamptz,version integer)
language sql stable security definer set search_path = public, pg_temp
as $$
  select t.id,t.name,t.archived_at,t.version from public.trips t
  where auth.uid() is not null and t.archived_at is not null
    and (t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner'))
  order by t.archived_at desc,t.id;
$$;

create function public.set_trip_archived(target_trip_id uuid,archive_trip boolean,expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.trips%rowtype;
begin
  if archive_trip is null then raise exception 'Chọn lưu trữ hoặc khôi phục.' using errcode='22023'; end if;
  select t.* into target from public.trips t where t.id=target_trip_id and auth.uid() is not null
    and (t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner')) for update;
  if not found then raise exception 'Chỉ chủ nhóm được lưu trữ hoặc khôi phục chuyến đi.' using errcode='42501'; end if;
  if target.version is distinct from expected_version then
    raise exception 'Chuyến đi đã thay đổi. Hãy tải lại danh sách và thử lại.';
  end if;
  if (target.archived_at is not null)=archive_trip then return; end if;
  update public.trips set archived_at=case when archive_trip then now() else null end where trips.id=target_trip_id;
  -- Archived trip rows fail SELECT RLS and cannot deliver their own UPDATE to former
  -- viewers. Each member can still SELECT their own membership, so an unchanged
  -- membership UPDATE wakes the existing user-filtered channel without exposing content.
  update public.trip_members set role=role where trip_id=target_trip_id;
end;
$$;
revoke all on function public.get_my_archived_trips() from public,anon;
revoke all on function public.set_trip_archived(uuid,boolean,integer) from public,anon;
grant execute on function public.get_my_archived_trips() to authenticated;
grant execute on function public.set_trip_archived(uuid,boolean,integer) to authenticated;

create or replace function public.get_my_trip_invitations()
returns table(trip_id uuid,trip_name text,destination text,start_date date,end_date date)
language sql stable security definer set search_path = public, pg_temp
as $$
  select t.id,t.name,t.destination,t.start_date,t.end_date
  from public.trip_invitations i join public.trips t on t.id=i.trip_id
  where auth.uid() is not null and i.email=private.current_user_email() and t.archived_at is null
    and i.accepted_at is null and i.revoked_at is null and i.declined_at is null
  order by i.created_at,t.id;
$$;

create or replace function public.respond_trip_invitation(target_trip_id uuid,accept_invitation boolean)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare current_email text; invitation public.trip_invitations%rowtype; seat_limit integer; occupied_seats integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if accept_invitation is null then
    raise exception 'Vui lòng chọn chấp nhận hoặc từ chối lời mời.' using errcode='22023';
  end if;
  select max_members into seat_limit from public.trips where id=target_trip_id and archived_at is null for update;
  if not found then raise exception 'Chuyến đi không khả dụng. Hãy tải lại danh sách lời mời.'; end if;
  select lower(trim(u.email)) into current_email from auth.users u where u.id=auth.uid() for share;
  select * into invitation from public.trip_invitations where trip_id=target_trip_id and email=current_email;
  if not found or invitation.revoked_at is not null then raise exception 'Không tìm thấy lời mời đang chờ.'; end if;
  if (accept_invitation and invitation.accepted_at is not null)
    or (not accept_invitation and invitation.declined_at is not null) then return; end if;
  if invitation.accepted_at is not null or invitation.declined_at is not null then raise exception 'Lời mời đã được phản hồi.'; end if;
  if not accept_invitation then
    update public.trip_invitations set declined_at=now() where trip_id=target_trip_id and email=current_email;
    return;
  end if;
  select (select count(*) from public.trip_members where trip_id=target_trip_id)+
    (select count(*) from public.trip_invitations where trip_id=target_trip_id
      and accepted_at is null and revoked_at is null and declined_at is null) into occupied_seats;
  if occupied_seats>seat_limit then raise exception 'Chuyến đi đã dùng hết % chỗ thành viên và lời mời.',seat_limit; end if;
  update public.trip_invitations set accepted_at=now() where trip_id=target_trip_id and email=current_email;
  insert into public.trip_members(trip_id,user_id,role) values(target_trip_id,auth.uid(),'editor') on conflict(trip_id,user_id) do nothing;
end;
$$;
