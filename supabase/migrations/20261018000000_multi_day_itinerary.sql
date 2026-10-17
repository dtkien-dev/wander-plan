-- Multi-day itinerary activities (R11 part 2): an activity may end on a later date.
-- Start time belongs to visit_date and end time to end_date; the same-day time rule
-- applies only when end_date is null. Existing rows stay single-day.
alter table public.itinerary_items add column if not exists end_date date;

alter table public.itinerary_items drop constraint if exists valid_itinerary_time;
alter table public.itinerary_items add constraint valid_itinerary_time check (
  coalesce(end_date > visit_date, end_time > start_time)
);

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
  if new.visit_date < trip_start or new.visit_date > trip_end
     or coalesce(new.end_date, new.visit_date) > trip_end then
    raise exception 'Ngày đến phải nằm trong thời gian chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists itinerary_items_validate_date on public.itinerary_items;
create trigger itinerary_items_validate_date before insert or update of trip_id, visit_date, end_date
on public.itinerary_items for each row execute function public.validate_itinerary_date();

create or replace function public.validate_trip_child_dates()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.itinerary_items
    where trip_id = new.id
      and (visit_date < new.start_date or coalesce(end_date, visit_date) > new.end_date)
  ) or exists (
    select 1 from public.expenses
    where trip_id = new.id
      and (expense_date < new.start_date or coalesce(end_date, expense_date) > new.end_date)
  ) then
    raise exception 'Khoảng ngày mới không bao phủ toàn bộ lịch trình và chi phí hiện có.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function public.validate_itinerary_date() from public, anon, authenticated;
revoke execute on function public.validate_trip_child_dates() from public, anon, authenticated;

-- Same signature as 20261016220000; itinerary rows now carry end_date (null = single day).
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
  if auth.uid() is null or not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  if jsonb_typeof(itinerary_rows) <> 'array' or jsonb_typeof(expense_rows) <> 'array' then
    raise exception 'Dữ liệu nhập phải là danh sách.' using errcode = '22023';
  end if;
  if jsonb_array_length(itinerary_rows) + jsonb_array_length(expense_rows) > 1000 then
    raise exception 'Mỗi lần chỉ được nhập tối đa 1000 dòng.' using errcode = '22023';
  end if;

  -- Rows from older clients omit end_date; keep the stored value instead of clearing it.
  for import_row in
    select item.*, element.value ? 'end_date' as has_end_date
    from jsonb_array_elements(itinerary_rows) as element
    cross join lateral jsonb_to_record(element.value) as item(
      id uuid, version integer, title text, visit_date date, end_date date, start_time time, end_time time,
      estimated_cost_vnd bigint, address text, maps_url text, notes text
    ) where item.id is not null
  loop
    if import_row.version is null then
      raise exception 'Version của lịch trình % bị thiếu.', import_row.id using errcode = '22023';
    end if;
    update public.itinerary_items
    set title = trim(import_row.title), visit_date = import_row.visit_date,
        end_date = case when import_row.has_end_date then import_row.end_date else end_date end,
        start_time = import_row.start_time, end_time = import_row.end_time,
        estimated_cost_vnd = import_row.estimated_cost_vnd,
        address = nullif(trim(import_row.address), ''), maps_url = nullif(trim(import_row.maps_url), ''),
        notes = nullif(trim(import_row.notes), '')
    where id = import_row.id and trip_id = target_trip_id and version = import_row.version;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Lịch trình % đã thay đổi hoặc không còn tồn tại. Hãy xuất file mới rồi thử lại.', import_row.id using errcode = '40001';
    end if;
    updated_count := updated_count + 1;
  end loop;

  insert into public.itinerary_items (
    trip_id, title, visit_date, end_date, start_time, end_time, estimated_cost_vnd,
    address, maps_url, notes, created_by, updated_by
  )
  select target_trip_id, trim(row.title), row.visit_date, row.end_date, row.start_time, row.end_time,
         row.estimated_cost_vnd, nullif(trim(row.address), ''), nullif(trim(row.maps_url), ''),
         nullif(trim(row.notes), ''), auth.uid(), auth.uid()
  from jsonb_to_recordset(itinerary_rows) as row(
    id uuid, version integer, title text, visit_date date, end_date date, start_time time, end_time time,
    estimated_cost_vnd bigint, address text, maps_url text, notes text
  ) where row.id is null;
  get diagnostics affected_count = row_count;
  created_count := created_count + affected_count;

  for import_row in
    select * from jsonb_to_recordset(expense_rows) as row(
      id uuid, version integer, title text, category text, expense_date date, end_date date,
      estimated_amount_vnd bigint, actual_amount_vnd bigint, paid_by uuid,
      participant_ids uuid[], notes text, split_method text, split_values jsonb
    )
  loop
    perform public.save_expense_with_participants(
      target_trip_id, import_row.id, import_row.version, import_row.title, import_row.category,
      import_row.expense_date, import_row.estimated_amount_vnd, import_row.actual_amount_vnd,
      import_row.paid_by, import_row.participant_ids, import_row.notes, import_row.end_date,
      import_row.split_method, import_row.split_values
    );
    if import_row.id is null then created_count := created_count + 1;
    else updated_count := updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object('created_count', created_count, 'updated_count', updated_count);
end;
$$;
revoke all on function public.import_trip_data(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.import_trip_data(uuid, jsonb, jsonb) to authenticated;
