-- Versioned, owner-only deletion of an explicit selection, all or nothing.
create function public.delete_trip_itinerary_items(target_trip_id uuid, selected_items jsonb)
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
  -- Filtered DELETE events cannot reliably notify members; the existing trip channel can.
  update public.trips set updated_at=now() where id=target_trip_id;
end;
$$;
revoke all on function public.delete_trip_itinerary_items(uuid,jsonb) from public,anon;
grant execute on function public.delete_trip_itinerary_items(uuid,jsonb) to authenticated;
