alter table public.trips
add column if not exists max_members smallint not null default 4;

update public.trips
set max_members = 4
where max_members < 4;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'trips_max_members_check'
      and conrelid = 'public.trips'::regclass
  ) then
    alter table public.trips
    add constraint trips_max_members_check check (max_members between 1 and 20);
  end if;
end;
$$;

create or replace function public.validate_trip_capacity()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  occupied_seats integer;
begin
  select
    (select count(*) from public.trip_members where trip_id = new.id) +
    (select count(*) from public.trip_invitations where trip_id = new.id and accepted_at is null)
  into occupied_seats;

  if new.max_members < occupied_seats then
    raise exception 'Số người tối đa không thể thấp hơn % chỗ đang được sử dụng.', occupied_seats
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trips_validate_capacity on public.trips;
create trigger trips_validate_capacity before update of max_members on public.trips
for each row execute function public.validate_trip_capacity();

create or replace function public.invite_trip_member(target_trip_id uuid, target_email text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_email text := lower(trim(target_email));
  invited_user_id uuid;
  occupied_seats integer;
  seat_limit integer;
begin
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể mời thành viên.';
  end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Email không hợp lệ.';
  end if;

  select max_members into seat_limit
  from public.trips
  where id = target_trip_id
  for update;

  if seat_limit is null then
    raise exception 'Không tìm thấy chuyến đi.';
  end if;

  select u.id into invited_user_id from auth.users u where lower(u.email) = normalized_email limit 1;
  if invited_user_id is not null and exists (
    select 1 from public.trip_members where trip_id = target_trip_id and user_id = invited_user_id
  ) then
    return;
  end if;
  if exists (
    select 1 from public.trip_invitations where trip_id = target_trip_id and email = normalized_email and accepted_at is null
  ) then
    return;
  end if;

  select
    (select count(*) from public.trip_members where trip_id = target_trip_id) +
    (select count(*) from public.trip_invitations where trip_id = target_trip_id and accepted_at is null)
  into occupied_seats;
  if occupied_seats >= seat_limit then
    raise exception 'Chuyến đi đã dùng hết % chỗ thành viên và lời mời.', seat_limit;
  end if;

  insert into public.trip_invitations (trip_id, email, role, invited_by, accepted_at)
  values (target_trip_id, normalized_email, 'editor', auth.uid(), case when invited_user_id is null then null else now() end)
  on conflict (trip_id, email) do update
  set invited_by = excluded.invited_by,
      accepted_at = excluded.accepted_at;

  if invited_user_id is not null then
    insert into public.trip_members (trip_id, user_id, role)
    values (target_trip_id, invited_user_id, 'editor')
    on conflict (trip_id, user_id) do nothing;
  end if;
end;
$$;

revoke all on function public.invite_trip_member(uuid, text) from public;
grant execute on function public.invite_trip_member(uuid, text) to authenticated;
