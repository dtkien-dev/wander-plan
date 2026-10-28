-- Lock and compare the previewed child versions before moving or copying a plan.
create function private.check_trip_plan_snapshot(target_trip_id uuid,expected_itinerary jsonb,expected_expenses jsonb default null,expected_checklist jsonb default null)
returns void language plpgsql set search_path = public, pg_temp
as $$
declare current_rows jsonb; expected_rows jsonb;
begin
  if expected_itinerary is null or jsonb_typeof(expected_itinerary)<>'array' then raise exception 'Bản xem trước không hợp lệ.' using errcode='22023'; end if;
  perform 1 from public.itinerary_items where trip_id=target_trip_id order by id for update;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version) order by id),'[]') into current_rows from public.itinerary_items where trip_id=target_trip_id;
  select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'version',x.version) order by x.id),'[]') into expected_rows from jsonb_to_recordset(expected_itinerary) as x(id uuid,version integer);
  if current_rows is distinct from expected_rows then raise exception 'Lịch trình đã thay đổi. Đóng cửa sổ và xem trước lại.' using errcode='40001'; end if;
  if expected_expenses is not null then
    if jsonb_typeof(expected_expenses)<>'array' then raise exception 'Bản xem trước không hợp lệ.' using errcode='22023'; end if;
    perform 1 from public.expenses where trip_id=target_trip_id order by id for update;
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version) order by id),'[]') into current_rows from public.expenses where trip_id=target_trip_id;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'version',x.version) order by x.id),'[]') into expected_rows from jsonb_to_recordset(expected_expenses) as x(id uuid,version integer);
    if current_rows is distinct from expected_rows then raise exception 'Chi phí đã thay đổi. Đóng cửa sổ và xem trước lại.' using errcode='40001'; end if;
  end if;
  if expected_checklist is not null then
    if jsonb_typeof(expected_checklist)<>'array' then raise exception 'Bản xem trước không hợp lệ.' using errcode='22023'; end if;
    perform 1 from public.checklist_items where trip_id=target_trip_id and deleted_at is null order by id for update;
    select coalesce(jsonb_agg(jsonb_build_object('id',id,'version',version) order by id),'[]') into current_rows from public.checklist_items where trip_id=target_trip_id and deleted_at is null;
    select coalesce(jsonb_agg(jsonb_build_object('id',x.id,'version',x.version) order by x.id),'[]') into expected_rows from jsonb_to_recordset(expected_checklist) as x(id uuid,version integer);
    if current_rows is distinct from expected_rows then raise exception 'Checklist đã thay đổi. Đóng cửa sổ và xem trước lại.' using errcode='40001'; end if;
  end if;
end;
$$;
revoke all on function private.check_trip_plan_snapshot(uuid,jsonb,jsonb,jsonb) from public,anon,authenticated;

create function public.reschedule_trip(target_trip_id uuid,expected_version integer,new_start_date date,shift_expenses boolean,expected_itinerary jsonb,expected_expenses jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare source public.trips%rowtype; day_offset integer; new_end date;
begin
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được dời chuyến đi.' using errcode='42501'; end if;
  select * into source from public.trips where id=target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then raise exception 'Chỉ chủ nhóm được dời chuyến đi.' using errcode='42501'; end if;
  if source.version is distinct from expected_version then raise exception 'Chuyến đi đã thay đổi. Đóng cửa sổ và xem trước lại.' using errcode='40001'; end if;
  if new_start_date is null or not isfinite(new_start_date) or new_start_date not between date '0001-01-01' and date '9999-12-31' or new_start_date=source.start_date
    or shift_expenses is null or expected_expenses is null then raise exception 'Chọn ngày bắt đầu mới hợp lệ.' using errcode='22023'; end if;
  day_offset:=new_start_date-source.start_date;
  new_end:=source.end_date+day_offset;
  if new_end not between date '0001-01-01' and date '9999-12-31' then raise exception 'Ngày kết thúc mới không hợp lệ.' using errcode='22023'; end if;
  perform private.check_trip_plan_snapshot(target_trip_id,expected_itinerary,expected_expenses);
  if not shift_expenses and exists(select 1 from public.expenses where trip_id=target_trip_id and (expense_date<new_start_date or coalesce(end_date,expense_date)>new_end)) then
    raise exception 'Có chi phí nằm ngoài khoảng ngày mới. Chọn dời ngày chi phí hoặc điều chỉnh kế hoạch.' using errcode='23514';
  end if;
  -- Expand first, move children, then narrow; all three steps commit or roll back together.
  update public.trips set start_date=least(source.start_date,new_start_date),end_date=greatest(source.end_date,new_end) where id=target_trip_id;
  update public.itinerary_items set visit_date=visit_date+day_offset,end_date=end_date+day_offset where trip_id=target_trip_id;
  if shift_expenses then
    update public.expenses set expense_date=expense_date+day_offset,end_date=end_date+day_offset where trip_id=target_trip_id;
  end if;
  update public.trips set start_date=new_start_date,end_date=new_end where id=target_trip_id;
end;
$$;
revoke all on function public.reschedule_trip(uuid,integer,date,boolean,jsonb,jsonb) from public,anon;
grant execute on function public.reschedule_trip(uuid,integer,date,boolean,jsonb,jsonb) to authenticated;
