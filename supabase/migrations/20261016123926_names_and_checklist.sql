-- Display names are optional. Keep chosen legacy names; email-as-name is a fallback.
create or replace function public.save_my_display_name(target_name text)
returns void language plpgsql security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Bạn cần đăng nhập.' using errcode = '42501'; end if;
  if char_length(btrim(target_name)) > 80 then
    raise exception 'Tên hiển thị tối đa 80 ký tự.' using errcode = '22023';
  end if;
  update public.profiles set display_name = nullif(btrim(target_name), '') where id = auth.uid();
  if not found then raise exception 'Không tìm thấy hồ sơ.'; end if;
end;
$$;
revoke all on function public.save_my_display_name(text) from public, anon;
grant execute on function public.save_my_display_name(text) to authenticated;

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
    select m.user_id, u.email::text,
      coalesce(nullif(nullif(btrim(p.display_name), ''), u.email), nullif(split_part(u.email, '@', 1), ''), 'Thành viên')::text as display_name,
      m.role::text, 'active'::text as status, m.joined_at
    from public.trip_members m join auth.users u on u.id = m.user_id
    left join public.profiles p on p.id = m.user_id where m.trip_id = target_trip_id
    union all
    select null::uuid, i.email, split_part(i.email, '@', 1), i.role::text, 'invited'::text, null::timestamptz
    from public.trip_invitations i where i.trip_id = target_trip_id
      and i.accepted_at is null and i.revoked_at is null and i.declined_at is null
  ) people
  order by case when people.role = 'owner' then 0 when people.status = 'active' then 1 else 2 end, people.display_name;
end;
$$;

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 150),
  completed boolean not null default false,
  assigned_to uuid references auth.users(id) on delete set null,
  -- Tombstones deliver trip-filtered UPDATE events, including removal, through Realtime RLS.
  deleted_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index checklist_items_trip_idx on public.checklist_items(trip_id, created_at);
alter table public.checklist_items enable row level security;
revoke all on public.checklist_items from public, anon, authenticated;
grant select on public.checklist_items to authenticated;
grant insert (trip_id, title, assigned_to) on public.checklist_items to authenticated;
grant update (title, completed, assigned_to, deleted_at) on public.checklist_items to authenticated;
grant all on public.checklist_items to service_role;
create policy "members view checklist" on public.checklist_items for select to authenticated
  using (private.is_trip_member(trip_id));
create policy "members add checklist" on public.checklist_items for insert to authenticated
  with check (private.is_trip_member(trip_id));
create policy "members update checklist" on public.checklist_items for update to authenticated
  using (private.is_trip_member(trip_id)) with check (private.is_trip_member(trip_id));

create function private.validate_checklist_assignee()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Serialize assigning/removing members with the existing trip-level membership lock.
  perform 1 from public.trips where id = new.trip_id for update;
  if new.assigned_to is not null and not exists (
    select 1 from public.trip_members where trip_id = new.trip_id and user_id = new.assigned_to
  ) then raise exception 'Người phụ trách phải là thành viên của chuyến đi.' using errcode = '23514'; end if;
  return new;
end;
$$;
create trigger checklist_assignee before insert or update of assigned_to on public.checklist_items
for each row execute function private.validate_checklist_assignee();
create trigger checklist_touch before update on public.checklist_items
for each row execute function public.touch_versioned_row();

create function private.clear_checklist_assignee()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.checklist_items set assigned_to = null
    where trip_id = old.trip_id and assigned_to = old.user_id;
  return old;
end;
$$;
create trigger checklist_member_removed after delete on public.trip_members
for each row execute function private.clear_checklist_assignee();

alter publication supabase_realtime add table public.checklist_items;
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
