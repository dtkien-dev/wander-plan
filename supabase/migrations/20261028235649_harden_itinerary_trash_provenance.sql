-- Reject inconsistent legacy snapshots before adopting the stricter restore contract.
delete from public.itinerary_trash where (snapshot->>'id')::uuid is distinct from id or (snapshot->>'trip_id')::uuid is distinct from trip_id;
alter table public.itinerary_trash drop constraint itinerary_trash_pkey;
alter table public.itinerary_trash add primary key(trip_id,id);
alter table public.itinerary_trash add constraint itinerary_trash_snapshot_identity check (
  (snapshot->>'id')::uuid is not distinct from id and (snapshot->>'trip_id')::uuid is not distinct from trip_id
);
drop function public.restore_trip_itinerary_item(uuid,uuid,integer);

create or replace function private.keep_deleted_itinerary()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed_at timestamptz := clock_timestamp();
begin
  if pg_trigger_depth() = 1 and auth.uid() is not null
    and exists(select 1 from public.trips where id=old.trip_id) then
    insert into public.itinerary_trash(id,trip_id,snapshot,deleted_at,expires_at) values(old.id,old.trip_id,to_jsonb(old),removed_at,removed_at+interval '7 days')
      on conflict(trip_id,id) do update set snapshot=excluded.snapshot,deleted_at=excluded.deleted_at,expires_at=excluded.expires_at;
  end if;
  return old;
end;
$$;

create function public.restore_trip_itinerary_item(target_trip_id uuid,target_item_id uuid,expected_version integer,expected_deleted_at timestamptz)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed public.itinerary_trash%rowtype;
begin
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được khôi phục lịch trình.' using errcode='42501'; end if;
  perform 1 from public.trips where id=target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được khôi phục lịch trình.' using errcode='42501'; end if;
  select * into removed from public.itinerary_trash where id=target_item_id and trip_id=target_trip_id for update;
  if not found or removed.expires_at <= clock_timestamp() or removed.deleted_at is distinct from expected_deleted_at or (removed.snapshot->>'version')::integer is distinct from expected_version then
    raise exception 'Mục đã thay đổi hoặc hết 7 ngày khôi phục. Hãy tải lại.' using errcode='40001';
  end if;
  if exists(select 1 from public.itinerary_items where id=target_item_id) then
    raise exception 'Mục này đã tồn tại. Hãy tải lại.' using errcode='40001';
  end if;
  insert into public.itinerary_items
    select (jsonb_populate_record(null::public.itinerary_items,removed.snapshot ||
      jsonb_build_object('id',target_item_id,'trip_id',target_trip_id,'version',expected_version+1,'updated_by',auth.uid(),'updated_at',now()))).*;
  delete from public.itinerary_trash where id=target_item_id and trip_id=target_trip_id;
  update public.trips set updated_at=now() where id=target_trip_id;
end;
$$;
revoke all on function public.restore_trip_itinerary_item(uuid,uuid,integer,timestamptz) from public,anon;
grant execute on function public.restore_trip_itinerary_item(uuid,uuid,integer,timestamptz) to authenticated;

