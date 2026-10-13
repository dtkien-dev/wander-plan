alter table public.expenses
add column if not exists paid_by uuid references auth.users(id);

update public.expenses
set paid_by = created_by
where paid_by is null;

alter table public.expenses
alter column paid_by set not null;

create table if not exists public.expense_participants (
  expense_id uuid not null references public.expenses(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (expense_id, user_id)
);

insert into public.expense_participants (expense_id, user_id)
select e.id, m.user_id
from public.expenses e
join public.trip_members m on m.trip_id = e.trip_id
on conflict (expense_id, user_id) do nothing;

create or replace function private.validate_expense_payer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.trip_members
    where trip_id = new.trip_id and user_id = new.paid_by
  ) then
    raise exception 'Người thanh toán phải là thành viên đang hoạt động của chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_validate_payer on public.expenses;
create trigger expenses_validate_payer before insert or update of trip_id, paid_by
on public.expenses for each row execute function private.validate_expense_payer();

create or replace function private.validate_expense_participant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.expenses e
    join public.trip_members m on m.trip_id = e.trip_id and m.user_id = new.user_id
    where e.id = new.expense_id
  ) then
    raise exception 'Người tham gia phải là thành viên đang hoạt động của chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists expense_participants_validate_member on public.expense_participants;
create trigger expense_participants_validate_member before insert or update
on public.expense_participants for each row execute function private.validate_expense_participant();

create or replace function private.ensure_expense_row_has_participants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (select 1 from public.expense_participants where expense_id = new.id) then
    raise exception 'Khoản chi phải có ít nhất một người tham gia.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_require_participants on public.expenses;
create constraint trigger expenses_require_participants
after insert or update on public.expenses
deferrable initially deferred
for each row execute function private.ensure_expense_row_has_participants();

create or replace function private.ensure_participant_expense_has_participants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  checked_expense_id uuid := case when tg_op = 'DELETE' then old.expense_id else new.expense_id end;
begin
  if exists (select 1 from public.expenses where id = checked_expense_id)
     and not exists (select 1 from public.expense_participants where expense_id = checked_expense_id) then
    raise exception 'Khoản chi phải có ít nhất một người tham gia.' using errcode = '23514';
  end if;
  return null;
end;
$$;

drop trigger if exists expense_participants_require_one on public.expense_participants;
create constraint trigger expense_participants_require_one
after insert or update or delete on public.expense_participants
deferrable initially deferred
for each row execute function private.ensure_participant_expense_has_participants();

alter table public.expense_participants enable row level security;

drop policy if exists "members view expense participants" on public.expense_participants;
create policy "members view expense participants"
on public.expense_participants for select to authenticated
using (exists (
  select 1 from public.expenses e
  where e.id = expense_id and private.is_trip_member(e.trip_id)
));

drop policy if exists "members add expense participants" on public.expense_participants;
create policy "members add expense participants"
on public.expense_participants for insert to authenticated
with check (exists (
  select 1 from public.expenses e
  where e.id = expense_id and private.is_trip_member(e.trip_id)
));

drop policy if exists "members remove expense participants" on public.expense_participants;
create policy "members remove expense participants"
on public.expense_participants for delete to authenticated
using (exists (
  select 1 from public.expenses e
  where e.id = expense_id and private.is_trip_member(e.trip_id)
));

grant select, insert, delete on public.expense_participants to authenticated;

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
  expense_notes text
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
      trip_id, title, category, expense_date, estimated_amount_vnd,
      actual_amount_vnd, paid_by, notes, created_by, updated_by
    ) values (
      target_trip_id, trim(expense_title), expense_category, target_expense_date, target_estimated_amount_vnd,
      target_actual_amount_vnd, payer_user_id, nullif(trim(expense_notes), ''), auth.uid(), auth.uid()
    ) returning id into saved_expense_id;
  else
    if expected_version is null then
      raise exception 'Version của khoản chi bị thiếu.' using errcode = '22023';
    end if;
    update public.expenses
    set title = trim(expense_title), category = expense_category, expense_date = target_expense_date,
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

revoke all on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text) from public;
grant execute on function public.save_expense_with_participants(uuid, uuid, integer, text, text, date, bigint, bigint, uuid, uuid[], text) to authenticated;

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
      id uuid, version integer, title text, category text, expense_date date,
      estimated_amount_vnd bigint, actual_amount_vnd bigint, paid_by uuid,
      participant_ids uuid[], notes text
    )
  loop
    perform public.save_expense_with_participants(
      target_trip_id, import_row.id, import_row.version, import_row.title, import_row.category,
      import_row.expense_date, import_row.estimated_amount_vnd, import_row.actual_amount_vnd,
      import_row.paid_by, import_row.participant_ids, import_row.notes
    );
    if import_row.id is null then created_count := created_count + 1;
    else updated_count := updated_count + 1;
    end if;
  end loop;

  return jsonb_build_object('created_count', created_count, 'updated_count', updated_count);
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expense_participants'
  ) then
    alter publication supabase_realtime add table public.expense_participants;
  end if;
end;
$$;
