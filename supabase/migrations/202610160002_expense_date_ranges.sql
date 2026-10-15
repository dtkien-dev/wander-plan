-- Round-trip transport keeps its return date and stays keep their check-out date.
-- The amount still belongs to expense_date; end_date only describes the range.
alter table public.expenses add column if not exists end_date date;

alter table public.expenses drop constraint if exists expenses_end_date_valid;
alter table public.expenses add constraint expenses_end_date_valid check (
  end_date is null
  or (category = 'transport' and end_date >= expense_date)
  or (category = 'stay' and end_date > expense_date)
);

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
  if new.expense_date < trip_start or new.expense_date > trip_end
     or coalesce(new.end_date, new.expense_date) > trip_end then
    raise exception 'Ngày chi phải nằm trong thời gian chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_validate_date on public.expenses;
create trigger expenses_validate_date before insert or update of trip_id, expense_date, end_date
on public.expenses for each row execute function public.validate_expense_date();

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
    where trip_id = new.id
      and (expense_date < new.start_date or coalesce(end_date, expense_date) > new.end_date)
  ) then
    raise exception 'Khoảng ngày mới không bao phủ toàn bộ lịch trình và chi phí hiện có.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop function if exists public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text);

create or replace function public.save_expense_with_participants(
  target_trip_id uuid,
  target_expense_id uuid,
  expected_version integer,
  expense_title text,
  expense_category text,
  target_expense_date date,
  target_estimated_amount_vnd bigint,
  target_actual_amount_vnd bigint,
  payer_user_id uuid,
  participant_user_ids uuid[],
  expense_notes text,
  target_end_date date default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  saved_expense_id uuid;
  affected_count integer;
begin
  set constraints expenses_require_participants, expense_participants_require_one deferred;

  if auth.uid() is null or not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  if coalesce(cardinality(participant_user_ids), 0) = 0 then
    raise exception 'Khoản chi phải có ít nhất một người tham gia.' using errcode = '22023';
  end if;
  if target_end_date is not null then
    if expense_category not in ('transport', 'stay') then
      raise exception 'Chỉ khoản Di chuyển khứ hồi và Lưu trú mới có ngày kết thúc.' using errcode = '22023';
    end if;
    if expense_category = 'transport' and target_end_date < target_expense_date then
      raise exception 'Ngày về phải từ ngày đi trở đi.' using errcode = '22023';
    end if;
    if expense_category = 'stay' and target_end_date <= target_expense_date then
      raise exception 'Ngày trả phòng phải sau ngày nhận phòng.' using errcode = '22023';
    end if;
  end if;
  if not exists (
    select 1 from public.trip_members where trip_id = target_trip_id and user_id = payer_user_id
  ) then
    raise exception 'Người thanh toán phải là thành viên đang hoạt động của chuyến đi.' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(participant_user_ids) participant_id
    where not exists (
      select 1 from public.trip_members
      where trip_id = target_trip_id and user_id = participant_id
    )
  ) then
    raise exception 'Người tham gia phải là thành viên đang hoạt động của chuyến đi.' using errcode = '22023';
  end if;

  if target_expense_id is null then
    insert into public.expenses (
      trip_id, title, category, expense_date, end_date, estimated_amount_vnd,
      actual_amount_vnd, paid_by, notes, created_by, updated_by
    ) values (
      target_trip_id, trim(expense_title), expense_category, target_expense_date, target_end_date, target_estimated_amount_vnd,
      target_actual_amount_vnd, payer_user_id, nullif(trim(expense_notes), ''), auth.uid(), auth.uid()
    ) returning id into saved_expense_id;
  else
    if expected_version is null then
      raise exception 'Version của khoản chi bị thiếu.' using errcode = '22023';
    end if;
    update public.expenses
    set title = trim(expense_title), category = expense_category, expense_date = target_expense_date,
        end_date = target_end_date,
        estimated_amount_vnd = target_estimated_amount_vnd, actual_amount_vnd = target_actual_amount_vnd,
        paid_by = payer_user_id, notes = nullif(trim(expense_notes), '')
    where id = target_expense_id and trip_id = target_trip_id and version = expected_version
    returning id into saved_expense_id;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Chi phí đã được người khác cập nhật. Hãy tải lại và thử lại.' using errcode = '40001';
    end if;
  end if;

  insert into public.expense_participants (expense_id, user_id)
  select saved_expense_id, participant_id
  from (select distinct unnest(participant_user_ids) as participant_id) selected
  on conflict (expense_id, user_id) do nothing;

  if target_expense_id is not null then
    delete from public.expense_participants
    where expense_id = saved_expense_id
      and not (user_id = any(participant_user_ids));
  end if;

  return saved_expense_id;
end;
$$;

revoke all on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date) from public;
grant execute on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date) to authenticated;

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
      raise exception 'Lịch trình % đã thay đổi hoặc không còn tồn tại. Hãy xuất file mới rồi thử lại.', import_row.id using errcode = '40001';
    end if;
    updated_count := updated_count + 1;
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
      id uuid, version integer, title text, category text, expense_date date, end_date date,
      estimated_amount_vnd bigint, actual_amount_vnd bigint, paid_by uuid,
      participant_ids uuid[], notes text
    )
  loop
    perform public.save_expense_with_participants(
      target_trip_id, import_row.id, import_row.version, import_row.title, import_row.category,
      import_row.expense_date, import_row.estimated_amount_vnd, import_row.actual_amount_vnd,
      import_row.paid_by, import_row.participant_ids, import_row.notes, import_row.end_date
    );
    if import_row.id is null then created_count := created_count + 1;
    else updated_count := updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object('created_count', created_count, 'updated_count', updated_count);
end;
$$;
