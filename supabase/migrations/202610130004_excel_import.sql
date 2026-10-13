create or replace function public.import_trip_data(
  target_trip_id uuid,
  itinerary_rows jsonb default '[]'::jsonb,
  expense_rows jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  import_row record;
  affected_count integer;
  created_count integer := 0;
  updated_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.';
  end if;
  if jsonb_typeof(itinerary_rows) <> 'array' or jsonb_typeof(expense_rows) <> 'array' then
    raise exception 'Dữ liệu nhập phải là danh sách.' using errcode = '22023';
  end if;
  if jsonb_array_length(itinerary_rows) + jsonb_array_length(expense_rows) > 1000 then
    raise exception 'Mỗi lần chỉ được nhập tối đa 1000 dòng.' using errcode = '22023';
  end if;

  for import_row in
    select * from jsonb_to_recordset(itinerary_rows) as row(
      id uuid, version integer, title text, visit_date date, start_time time, end_time time,
      estimated_cost_vnd bigint, address text, maps_url text, notes text
    ) where row.id is not null
  loop
    if import_row.version is null then
      raise exception 'Version của lịch trình % bị thiếu.', import_row.id using errcode = '22023';
    end if;
    update public.itinerary_items
    set title = trim(import_row.title), visit_date = import_row.visit_date,
        start_time = import_row.start_time, end_time = import_row.end_time,
        estimated_cost_vnd = import_row.estimated_cost_vnd,
        address = nullif(trim(import_row.address), ''), maps_url = nullif(trim(import_row.maps_url), ''),
        notes = nullif(trim(import_row.notes), '')
    where id = import_row.id and trip_id = target_trip_id and version = import_row.version;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Lịch trình % đã thay đổi hoặc không còn tồn tại. Hãy xuất file mới rồi thử lại.', import_row.id
        using errcode = '40001';
    end if;
    updated_count := updated_count + affected_count;
  end loop;

  insert into public.itinerary_items (
    trip_id, title, visit_date, start_time, end_time, estimated_cost_vnd,
    address, maps_url, notes, created_by, updated_by
  )
  select target_trip_id, trim(row.title), row.visit_date, row.start_time, row.end_time,
         row.estimated_cost_vnd, nullif(trim(row.address), ''), nullif(trim(row.maps_url), ''),
         nullif(trim(row.notes), ''), auth.uid(), auth.uid()
  from jsonb_to_recordset(itinerary_rows) as row(
    id uuid, version integer, title text, visit_date date, start_time time, end_time time,
    estimated_cost_vnd bigint, address text, maps_url text, notes text
  ) where row.id is null;
  get diagnostics affected_count = row_count;
  created_count := created_count + affected_count;

  for import_row in
    select * from jsonb_to_recordset(expense_rows) as row(
      id uuid, version integer, title text, category text, expense_date date,
      estimated_amount_vnd bigint, actual_amount_vnd bigint, notes text
    ) where row.id is not null
  loop
    if import_row.version is null then
      raise exception 'Version của khoản chi % bị thiếu.', import_row.id using errcode = '22023';
    end if;
    update public.expenses
    set title = trim(import_row.title), category = import_row.category,
        expense_date = import_row.expense_date, estimated_amount_vnd = import_row.estimated_amount_vnd,
        actual_amount_vnd = import_row.actual_amount_vnd, notes = nullif(trim(import_row.notes), '')
    where id = import_row.id and trip_id = target_trip_id and version = import_row.version;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Khoản chi % đã thay đổi hoặc không còn tồn tại. Hãy xuất file mới rồi thử lại.', import_row.id
        using errcode = '40001';
    end if;
    updated_count := updated_count + affected_count;
  end loop;

  insert into public.expenses (
    trip_id, title, category, expense_date, estimated_amount_vnd,
    actual_amount_vnd, notes, created_by, updated_by
  )
  select target_trip_id, trim(row.title), row.category, row.expense_date,
         row.estimated_amount_vnd, row.actual_amount_vnd, nullif(trim(row.notes), ''),
         auth.uid(), auth.uid()
  from jsonb_to_recordset(expense_rows) as row(
    id uuid, version integer, title text, category text, expense_date date,
    estimated_amount_vnd bigint, actual_amount_vnd bigint, notes text
  ) where row.id is null;
  get diagnostics affected_count = row_count;
  created_count := created_count + affected_count;

  return jsonb_build_object('created_count', created_count, 'updated_count', updated_count);
end;
$$;

revoke all on function public.import_trip_data(uuid, jsonb, jsonb) from public;
grant execute on function public.import_trip_data(uuid, jsonb, jsonb) to authenticated;
