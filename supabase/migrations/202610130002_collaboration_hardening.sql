alter table public.trips
add column if not exists version integer not null default 1 check (version > 0);

update public.trips
set start_date = date '2026-11-27',
    end_date = date '2026-11-30',
    updated_at = now()
where destination ilike '%Đà Lạt%';

create table if not exists public.trip_invitations (
  trip_id uuid not null references public.trips(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role text not null default 'editor' check (role = 'editor'),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  primary key (trip_id, email)
);

alter table public.trip_invitations enable row level security;

create policy "owners view invitations"
on public.trip_invitations for select to authenticated
using (private.is_trip_owner(trip_id));

create or replace function public.touch_trip()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
for each row execute function public.touch_trip();

create or replace function public.validate_itinerary_date()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  trip_start date;
  trip_end date;
begin
  select start_date, end_date into trip_start, trip_end
  from public.trips where id = new.trip_id;
  if new.visit_date < trip_start or new.visit_date > trip_end then
    raise exception 'Ngày đến phải nằm trong thời gian chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.validate_expense_date()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  trip_start date;
  trip_end date;
begin
  select start_date, end_date into trip_start, trip_end
  from public.trips where id = new.trip_id;
  if new.expense_date < trip_start or new.expense_date > trip_end then
    raise exception 'Ngày chi phải nằm trong thời gian chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.validate_trip_child_dates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.itinerary_items
    where trip_id = new.id and (visit_date < new.start_date or visit_date > new.end_date)
  ) or exists (
    select 1 from public.expenses
    where trip_id = new.id and (expense_date < new.start_date or expense_date > new.end_date)
  ) then
    raise exception 'Khoảng ngày mới không bao phủ toàn bộ lịch trình và chi phí hiện có.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists itinerary_items_validate_date on public.itinerary_items;
create trigger itinerary_items_validate_date before insert or update of trip_id, visit_date
on public.itinerary_items for each row execute function public.validate_itinerary_date();

drop trigger if exists expenses_validate_date on public.expenses;
create trigger expenses_validate_date before insert or update of trip_id, expense_date
on public.expenses for each row execute function public.validate_expense_date();

drop trigger if exists trips_validate_child_dates on public.trips;
create trigger trips_validate_child_dates before update of start_date, end_date
on public.trips for each row execute function public.validate_trip_child_dates();

create or replace function public.create_default_trip()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_trip_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select t.id into new_trip_id
  from public.trips t
  left join public.trip_members m on m.trip_id = t.id and m.user_id = auth.uid()
  where m.user_id is not null or t.created_by = auth.uid()
  order by t.created_at
  limit 1;
  if new_trip_id is not null then return new_trip_id; end if;

  perform pg_advisory_xact_lock(hashtext('wanderplan-single-trip'));
  if exists (select 1 from public.trips) then
    raise exception 'Chuyến đi đã được tạo. Hãy nhờ chủ nhóm mời đúng email của bạn.';
  end if;

  insert into public.trips (name, destination, start_date, end_date, timezone, budget_vnd, created_by)
  values ('Đà Lạt trong sương', 'Đà Lạt, Lâm Đồng', date '2026-11-27', date '2026-11-30', 'Asia/Ho_Chi_Minh', 9000000, auth.uid())
  returning id into new_trip_id;

  insert into public.trip_members (trip_id, user_id, role)
  values (new_trip_id, auth.uid(), 'owner')
  on conflict (trip_id, user_id) do nothing;

  return new_trip_id;
end;
$$;

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
begin
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể mời thành viên.';
  end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Email không hợp lệ.';
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
  if occupied_seats >= 3 then
    raise exception 'Chuyến đi đã đủ 3 thành viên hoặc lời mời.';
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

create or replace function public.claim_trip_invitations()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed integer := 0;
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or current_email = '' then return 0; end if;

  insert into public.trip_members (trip_id, user_id, role)
  select i.trip_id, auth.uid(), i.role
  from public.trip_invitations i
  where i.email = current_email and i.accepted_at is null
  on conflict (trip_id, user_id) do nothing;
  get diagnostics claimed = row_count;

  update public.trip_invitations
  set accepted_at = now()
  where email = current_email and accepted_at is null;
  return claimed;
end;
$$;

create or replace function public.get_trip_people(target_trip_id uuid)
returns table (
  user_id uuid,
  email text,
  display_name text,
  role text,
  status text,
  joined_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.';
  end if;
  return query
  select people.user_id, people.email, people.display_name, people.role, people.status, people.joined_at
  from (
    select m.user_id, u.email::text, coalesce(p.display_name, u.email, 'Thành viên')::text as display_name,
           m.role::text, 'active'::text as status, m.joined_at
    from public.trip_members m
    join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id
    where m.trip_id = target_trip_id
    union all
    select null::uuid, i.email, i.email, i.role::text, 'invited'::text, null::timestamptz
    from public.trip_invitations i
    where i.trip_id = target_trip_id and i.accepted_at is null
  ) people
  order by case when people.role = 'owner' then 0 when people.status = 'active' then 1 else 2 end,
           people.display_name;
end;
$$;

revoke all on function public.invite_trip_member(uuid, text) from public;
revoke all on function public.claim_trip_invitations() from public;
revoke all on function public.get_trip_people(uuid) from public;
grant execute on function public.invite_trip_member(uuid, text) to authenticated;
grant execute on function public.claim_trip_invitations() to authenticated;
grant execute on function public.get_trip_people(uuid) to authenticated;

do $$
declare
  realtime_table text;
begin
  foreach realtime_table in array array['trips', 'trip_members', 'itinerary_items', 'expenses']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = realtime_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', realtime_table);
    end if;
  end loop;
end;
$$;
