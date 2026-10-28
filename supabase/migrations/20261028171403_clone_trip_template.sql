-- Reuse the existing idempotent creation key; record provenance to reject mixed-purpose retries.
alter table private.trip_creation_requests add column source_trip_id uuid,add column source_start_date date,add column source_version integer,add column clone_name text;

create function public.clone_trip_template(source_trip_id uuid,expected_version integer,new_trip_name text,new_start_date date,request_id uuid,expected_itinerary jsonb,expected_checklist jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare source public.trips%rowtype; previous private.trip_creation_requests%rowtype; new_id uuid; day_offset integer; new_end date;
begin
  if not private.is_trip_owner(source_trip_id) then raise exception 'Chỉ chủ nhóm được nhân bản chuyến đi.' using errcode='42501'; end if;
  if request_id is null then raise exception 'Mã yêu cầu không hợp lệ.' using errcode='22023'; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || ':' || request_id::text,0));
  select * into previous from private.trip_creation_requests r where r.owner_id=auth.uid() and r.request_id=clone_trip_template.request_id;
  if found then
    if previous.source_trip_id is distinct from clone_trip_template.source_trip_id or previous.source_start_date is distinct from new_start_date or previous.source_version is distinct from expected_version or previous.clone_name is distinct from btrim(new_trip_name) then
      raise exception 'Mã yêu cầu đã được dùng cho chuyến khác. Đóng cửa sổ và thử lại.' using errcode='22023';
    end if;
    return previous.trip_id;
  end if;
  select * into source from public.trips where id=source_trip_id for update;
  if not private.is_trip_owner(source_trip_id) then raise exception 'Chỉ chủ nhóm được nhân bản chuyến đi.' using errcode='42501'; end if;
  if source.version is distinct from expected_version then raise exception 'Chuyến gốc đã thay đổi. Đóng cửa sổ và xem trước lại.' using errcode='40001'; end if;
  if new_start_date is null or not isfinite(new_start_date) or new_start_date not between date '0001-01-01' and date '9999-12-31' or expected_checklist is null then
    raise exception 'Ngày mới hoặc bản xem trước không hợp lệ.' using errcode='22023';
  end if;
  day_offset:=new_start_date-source.start_date;
  new_end:=source.end_date+day_offset;
  if new_end not between date '0001-01-01' and date '9999-12-31' then raise exception 'Ngày kết thúc mới không hợp lệ.' using errcode='22023'; end if;
  perform private.check_trip_plan_snapshot(source_trip_id,expected_itinerary,null,expected_checklist);
  new_id:=public.create_trip(new_trip_name,source.destination,new_start_date,new_end,source.budget_vnd,source.max_members,request_id);
  update public.trips set timezone=source.timezone where id=new_id;
  insert into public.itinerary_items(trip_id,title,visit_date,end_date,start_time,end_time,estimated_cost_vnd,address,maps_url,notes)
    select new_id,title,visit_date+day_offset,end_date+day_offset,start_time,end_time,estimated_cost_vnd,address,maps_url,notes
      from public.itinerary_items where trip_id=source.id;
  insert into public.checklist_items(trip_id,title,assigned_to,completed)
    select new_id,title,null,false from public.checklist_items where trip_id=source.id and deleted_at is null;
  update private.trip_creation_requests r set source_trip_id=source.id,source_start_date=new_start_date,source_version=expected_version,clone_name=btrim(new_trip_name)
    where r.owner_id=auth.uid() and r.request_id=clone_trip_template.request_id;
  return new_id;
end;
$$;
revoke all on function public.clone_trip_template(uuid,integer,text,date,uuid,jsonb,jsonb) from public,anon;
grant execute on function public.clone_trip_template(uuid,integer,text,date,uuid,jsonb,jsonb) to authenticated;
