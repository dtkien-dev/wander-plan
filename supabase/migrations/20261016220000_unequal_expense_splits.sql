-- R10: an expense is split equally (default), by shares, or by exact amounts per participant.
alter table public.expenses add column split_method text not null default 'equal'
  check (split_method in ('equal', 'shares', 'amounts'));
alter table public.expense_participants
  add column share_units integer check (share_units between 1 and 1000),
  add column share_amount_vnd bigint check (share_amount_vnd >= 0);

-- Checked at commit so the RPC, direct API writes and later amount edits all keep the
-- split consistent: exact amounts must total the actual amount, or the estimate while
-- no actual exists.
create function private.check_expense_split(target_expense_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  target public.expenses%rowtype;
  invalid_rows integer;
  split_total bigint;
begin
  select * into target from public.expenses where id = target_expense_id;
  if not found then return; end if;
  select count(*) filter (where case target.split_method
      when 'equal' then share_units is not null or share_amount_vnd is not null
      when 'shares' then share_units is null or share_amount_vnd is not null
      else share_amount_vnd is null or share_units is not null end),
    coalesce(sum(share_amount_vnd), 0)
  into invalid_rows, split_total
  from public.expense_participants where expense_id = target_expense_id;
  if invalid_rows > 0 then
    raise exception 'Cách chia của khoản chi chưa đủ thông tin cho từng người tham gia.' using errcode = '23514';
  end if;
  if target.split_method = 'amounts'
     and split_total <> coalesce(target.actual_amount_vnd, target.estimated_amount_vnd) then
    raise exception 'Tổng tiền chia (% đ) phải bằng số tiền khoản chi (% đ). Hãy nhập lại phần chia.',
      split_total, coalesce(target.actual_amount_vnd, target.estimated_amount_vnd) using errcode = '23514';
  end if;
end;
$$;
revoke all on function private.check_expense_split(uuid) from public, anon, authenticated;

create function private.check_expense_split_from_expense()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$ begin perform private.check_expense_split(new.id); return null; end; $$;
create function private.check_expense_split_from_participant()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  perform private.check_expense_split(case when tg_op = 'DELETE' then old.expense_id else new.expense_id end);
  return null;
end;
$$;
create constraint trigger expenses_split_consistent after insert or update on public.expenses
deferrable initially deferred for each row execute function private.check_expense_split_from_expense();
create constraint trigger expense_participants_split_consistent after insert or update or delete on public.expense_participants
deferrable initially deferred for each row execute function private.check_expense_split_from_participant();

drop function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date);

-- target_split_method null keeps an older client (or Excel file without split columns)
-- from silently resetting an unequal split: it means equal for new and equal expenses only.
create function public.save_expense_with_participants(
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
  target_end_date date default null,
  target_split_method text default null,
  target_split_values jsonb default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  saved_expense_id uuid;
  affected_count integer;
  method text := target_split_method;
begin
  set constraints expenses_require_participants, expense_participants_require_one,
    expenses_split_consistent, expense_participants_split_consistent deferred;

  if auth.uid() is null or not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  if coalesce(cardinality(participant_user_ids), 0) = 0 then
    raise exception 'Khoản chi phải có ít nhất một người tham gia.' using errcode = '22023';
  end if;
  if method is null then
    if target_expense_id is not null and exists (
      select 1 from public.expenses where id = target_expense_id and trip_id = target_trip_id and split_method <> 'equal'
    ) then
      raise exception 'Khoản chi này chia không đều. Hãy tải lại trang để sửa bằng phiên bản mới.' using errcode = '22023';
    end if;
    method := 'equal';
  end if;
  if method not in ('equal', 'shares', 'amounts') then
    raise exception 'Cách chia không hợp lệ.' using errcode = '22023';
  end if;
  if method <> 'equal' and (jsonb_typeof(target_split_values) is distinct from 'object' or exists (
    select 1 from jsonb_object_keys(target_split_values) split_key
    where not (split_key = any(select participant_id::text from unnest(participant_user_ids) participant_id))
  )) then
    raise exception 'Phần chia chỉ được nhập cho người tham gia khoản chi.' using errcode = '22023';
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
      actual_amount_vnd, paid_by, notes, split_method, created_by, updated_by
    ) values (
      target_trip_id, trim(expense_title), expense_category, target_expense_date, target_end_date, target_estimated_amount_vnd,
      target_actual_amount_vnd, payer_user_id, nullif(trim(expense_notes), ''), method, auth.uid(), auth.uid()
    ) returning id into saved_expense_id;
  else
    if expected_version is null then
      raise exception 'Version của khoản chi bị thiếu.' using errcode = '22023';
    end if;
    update public.expenses
    set title = trim(expense_title), category = expense_category, expense_date = target_expense_date,
        end_date = target_end_date,
        estimated_amount_vnd = target_estimated_amount_vnd, actual_amount_vnd = target_actual_amount_vnd,
        paid_by = payer_user_id, notes = nullif(trim(expense_notes), ''), split_method = method
    where id = target_expense_id and trip_id = target_trip_id and version = expected_version
    returning id into saved_expense_id;
    get diagnostics affected_count = row_count;
    if affected_count <> 1 then
      raise exception 'Chi phí đã được người khác cập nhật. Hãy tải lại và thử lại.' using errcode = '40001';
    end if;
    -- Participants carry the split values, so rewrite the whole set (checks are deferred).
    delete from public.expense_participants where expense_id = saved_expense_id;
  end if;

  insert into public.expense_participants (expense_id, user_id, share_units, share_amount_vnd)
  select saved_expense_id, participant_id,
    case when method = 'shares' then (target_split_values ->> participant_id::text)::integer end,
    case when method = 'amounts' then (target_split_values ->> participant_id::text)::bigint end
  from (select distinct unnest(participant_user_ids) as participant_id) selected;

  return saved_expense_id;
end;
$$;

revoke all on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date, text, jsonb) from public, anon;
grant execute on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text, date, text, jsonb) to authenticated;

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
