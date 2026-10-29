-- Keep deleted activities separate so old readers, imports and date validation see only active rows.
create table public.itinerary_trash (
  id uuid primary key,
  trip_id uuid not null references public.trips(id) on delete cascade,
  snapshot jsonb not null,
  deleted_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
create index itinerary_trash_expiry_idx on public.itinerary_trash(expires_at);
alter table public.itinerary_trash enable row level security;
revoke all on public.itinerary_trash from public,anon,authenticated;
grant select on public.itinerary_trash to authenticated;
grant all on public.itinerary_trash to service_role;
create policy "owners view unexpired itinerary trash" on public.itinerary_trash for select to authenticated
  using (expires_at > now() and private.is_trip_owner(trip_id));

create function private.keep_deleted_itinerary()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if pg_trigger_depth() = 1 and auth.uid() is not null
    and exists(select 1 from public.trips where id=old.trip_id) then
    insert into public.itinerary_trash(id,trip_id,snapshot) values(old.id,old.trip_id,to_jsonb(old))
      on conflict(id) do update set snapshot=excluded.snapshot,deleted_at=now(),expires_at=now()+interval '7 days';
  end if;
  return old;
end;
$$;
create trigger itinerary_keep_deleted after delete on public.itinerary_items
  for each row execute function private.keep_deleted_itinerary();

create function private.notify_deleted_itinerary()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if pg_trigger_depth() = 1 then
    update public.trips set updated_at=now() where id in(select distinct trip_id from deleted_items);
  end if;
  return null;
end;
$$;
create trigger itinerary_notify_deleted after delete on public.itinerary_items
  referencing old table as deleted_items for each statement execute function private.notify_deleted_itinerary();
revoke all on function private.keep_deleted_itinerary() from public,anon,authenticated;
revoke all on function private.notify_deleted_itinerary() from public,anon,authenticated;

-- All application deletes now lock the trip before the activity.
revoke delete on public.itinerary_items from authenticated;
create function public.delete_trip_itinerary_item(target_trip_id uuid,target_item_id uuid,expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.' using errcode='42501'; end if;
  perform 1 from public.trips where id=target_trip_id for update;
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.' using errcode='42501'; end if;
  delete from public.itinerary_items where id=target_item_id and trip_id=target_trip_id and version=expected_version;
  if not found then raise exception 'Lịch trình đã thay đổi. Hãy tải lại.' using errcode='40001'; end if;
end;
$$;
revoke all on function public.delete_trip_itinerary_item(uuid,uuid,integer) from public,anon;
grant execute on function public.delete_trip_itinerary_item(uuid,uuid,integer) to authenticated;

create function public.restore_trip_itinerary_item(target_trip_id uuid,target_item_id uuid,expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed public.itinerary_trash%rowtype;
begin
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được khôi phục lịch trình.' using errcode='42501'; end if;
  perform 1 from public.trips where id=target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được khôi phục lịch trình.' using errcode='42501'; end if;
  select * into removed from public.itinerary_trash where id=target_item_id and trip_id=target_trip_id for update;
  if not found or removed.expires_at <= clock_timestamp() or (removed.snapshot->>'version')::integer is distinct from expected_version then
    raise exception 'Mục đã thay đổi hoặc hết 7 ngày khôi phục. Hãy tải lại.' using errcode='40001';
  end if;
  if exists(select 1 from public.itinerary_items where id=target_item_id) then
    raise exception 'Mục này đã tồn tại. Hãy tải lại.' using errcode='40001';
  end if;
  insert into public.itinerary_items
    select (jsonb_populate_record(null::public.itinerary_items,removed.snapshot ||
      jsonb_build_object('version',expected_version+1,'updated_by',auth.uid(),'updated_at',now()))).*;
  delete from public.itinerary_trash where id=target_item_id;
  update public.trips set updated_at=now() where id=target_trip_id;
end;
$$;
revoke all on function public.restore_trip_itinerary_item(uuid,uuid,integer) from public,anon;
grant execute on function public.restore_trip_itinerary_item(uuid,uuid,integer) to authenticated;

create function private.purge_expired_itinerary_trash()
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed integer;
begin
  delete from public.itinerary_trash where expires_at <= clock_timestamp();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function private.purge_expired_itinerary_trash() from public,anon,authenticated;

do $schedule$
begin
  -- Embedded PostgreSQL has no scheduler; full Supabase and deployment must verify the job.
  if exists(select 1 from pg_available_extensions where name='pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('wander-plan-itinerary-trash-expiry','0 * * * *','select private.purge_expired_itinerary_trash()');
  end if;
  if exists(select 1 from pg_publication where pubname='supabase_realtime') then
    alter publication supabase_realtime add table public.itinerary_trash;
  end if;
end;
$schedule$;

-- Versioned, owner-only deletion of an explicit selection, all or nothing.
create or replace function public.delete_trip_itinerary_items(target_trip_id uuid, selected_items jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare deleted_count integer;
begin
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm được xóa nhiều mục lịch trình.' using errcode='42501';
  end if;
  perform 1 from public.trips where id=target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm được xóa nhiều mục lịch trình.' using errcode='42501';
  end if;
  if selected_items is null or jsonb_typeof(selected_items) <> 'array' then
    raise exception 'Danh sách lịch trình không hợp lệ.' using errcode='22023';
  end if;
  if jsonb_array_length(selected_items)=0 then
    raise exception 'Chọn ít nhất một mục lịch trình.' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_to_recordset(selected_items) as x(id uuid,version integer)
    where x.id is null or x.version is null or x.version < 1)
    or (select count(distinct x.id) from jsonb_to_recordset(selected_items) as x(id uuid,version integer)) <> jsonb_array_length(selected_items) then
    raise exception 'Danh sách lịch trình không hợp lệ.' using errcode='22023';
  end if;
  delete from public.itinerary_items i using jsonb_to_recordset(selected_items) as x(id uuid,version integer)
    where i.trip_id=target_trip_id and i.id=x.id and i.version=x.version;
  get diagnostics deleted_count = row_count;
  if deleted_count <> jsonb_array_length(selected_items) then
    raise exception 'Lịch trình đã thay đổi. Hãy tải lại và chọn lại các mục cần xóa.' using errcode='40001';
  end if;
  -- The statement trigger emits one trip update and saves each deleted snapshot.
end;
$$;
revoke all on function public.delete_trip_itinerary_items(uuid,jsonb) from public,anon;
grant execute on function public.delete_trip_itinerary_items(uuid,jsonb) to authenticated;
