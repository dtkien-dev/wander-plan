create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  destination text not null check (char_length(destination) between 2 and 150),
  start_date date not null,
  end_date date not null,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  budget_vnd bigint not null default 0 check (budget_vnd >= 0),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_trip_dates check (end_date >= start_date)
);

create table if not exists public.trip_members (
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'editor')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 150),
  visit_date date not null,
  start_time time not null,
  end_time time not null,
  estimated_cost_vnd bigint not null default 0 check (estimated_cost_vnd >= 0),
  address text,
  maps_url text,
  notes text check (char_length(notes) <= 500),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_itinerary_time check (end_time > start_time)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 150),
  category text not null check (category in ('food', 'transport', 'stay', 'ticket', 'other')),
  expense_date date not null,
  estimated_amount_vnd bigint not null default 0 check (estimated_amount_vnd >= 0),
  actual_amount_vnd bigint check (actual_amount_vnd >= 0),
  notes text check (char_length(notes) <= 500),
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists itinerary_items_trip_schedule_idx on public.itinerary_items(trip_id, visit_date, start_time);
create index if not exists expenses_trip_date_idx on public.expenses(trip_id, expense_date);
create index if not exists trip_members_user_idx on public.trip_members(user_id, trip_id);

create or replace function private.is_trip_member(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id and user_id = auth.uid()
  );
$$;

create or replace function private.is_trip_owner(target_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = target_trip_id and user_id = auth.uid() and role = 'owner'
  ) or exists (
    select 1 from public.trips
    where id = target_trip_id and created_by = auth.uid()
  );
$$;

revoke all on function private.is_trip_member(uuid) from public;
revoke all on function private.is_trip_owner(uuid) from public;
grant execute on function private.is_trip_member(uuid) to authenticated;
grant execute on function private.is_trip_owner(uuid) to authenticated;

create or replace function public.touch_versioned_row()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists itinerary_items_touch on public.itinerary_items;
create trigger itinerary_items_touch before update on public.itinerary_items
for each row execute function public.touch_versioned_row();

drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
for each row execute function public.touch_versioned_row();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

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

revoke all on function public.create_default_trip() from public;
grant execute on function public.create_default_trip() to authenticated;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "members can view profiles" on public.profiles;
create policy "members can view profiles"
on public.profiles for select to authenticated
using (
  id = auth.uid() or exists (
    select 1 from public.trip_members mine
    join public.trip_members theirs on theirs.trip_id = mine.trip_id
    where mine.user_id = auth.uid() and theirs.user_id = profiles.id
  )
);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members view trips" on public.trips;
create policy "members view trips"
on public.trips for select to authenticated
using (created_by = auth.uid() or private.is_trip_member(id));

drop policy if exists "users create trips" on public.trips;
create policy "users create trips"
on public.trips for insert to authenticated
with check (created_by = auth.uid());

drop policy if exists "owners update trips" on public.trips;
create policy "owners update trips"
on public.trips for update to authenticated
using (private.is_trip_owner(id)) with check (private.is_trip_owner(id));

drop policy if exists "owners delete trips" on public.trips;
create policy "owners delete trips"
on public.trips for delete to authenticated
using (private.is_trip_owner(id));

drop policy if exists "members view membership" on public.trip_members;
create policy "members view membership"
on public.trip_members for select to authenticated
using (private.is_trip_member(trip_id) or user_id = auth.uid());

drop policy if exists "owners add members" on public.trip_members;
create policy "owners add members"
on public.trip_members for insert to authenticated
with check (private.is_trip_owner(trip_id));

drop policy if exists "owners update members" on public.trip_members;
create policy "owners update members"
on public.trip_members for update to authenticated
using (private.is_trip_owner(trip_id)) with check (private.is_trip_owner(trip_id));

drop policy if exists "owners remove members" on public.trip_members;
create policy "owners remove members"
on public.trip_members for delete to authenticated
using (private.is_trip_owner(trip_id) and role <> 'owner');

drop policy if exists "members view itinerary" on public.itinerary_items;
create policy "members view itinerary"
on public.itinerary_items for select to authenticated
using (private.is_trip_member(trip_id));

drop policy if exists "members add itinerary" on public.itinerary_items;
create policy "members add itinerary"
on public.itinerary_items for insert to authenticated
with check (private.is_trip_member(trip_id) and created_by = auth.uid());

drop policy if exists "members update itinerary" on public.itinerary_items;
create policy "members update itinerary"
on public.itinerary_items for update to authenticated
using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));

drop policy if exists "members delete itinerary" on public.itinerary_items;
create policy "members delete itinerary"
on public.itinerary_items for delete to authenticated
using (private.is_trip_member(trip_id));

drop policy if exists "members view expenses" on public.expenses;
create policy "members view expenses"
on public.expenses for select to authenticated
using (private.is_trip_member(trip_id));

drop policy if exists "members add expenses" on public.expenses;
create policy "members add expenses"
on public.expenses for insert to authenticated
with check (private.is_trip_member(trip_id) and created_by = auth.uid());

drop policy if exists "members update expenses" on public.expenses;
create policy "members update expenses"
on public.expenses for update to authenticated
using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));

drop policy if exists "members delete expenses" on public.expenses;
create policy "members delete expenses"
on public.expenses for delete to authenticated
using (private.is_trip_member(trip_id));

grant usage on schema private to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.trip_members to authenticated;
grant select, insert, update, delete on public.itinerary_items to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
