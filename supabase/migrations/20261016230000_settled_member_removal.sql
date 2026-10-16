-- A023: a member can only be removed once their money is settled; afterwards old
-- expenses keep them as a former member and stay editable.

-- Mirrors splitExpenseAmount in src/lib/expenseSettlement.ts: participants ordered by
-- user id; shares give leftover đồng to a participating payer, otherwise one each in order.
create function private.member_trip_balance(target_trip_id uuid, target_user_id uuid)
returns bigint language sql stable security definer set search_path = public, pg_temp
as $$
  with actual as (
    select id, actual_amount_vnd as amount, paid_by, split_method from public.expenses
    where trip_id = target_trip_id and actual_amount_vnd is not null
  ), parts as (
    select x.id, x.amount, x.paid_by, x.split_method, p.user_id, p.share_amount_vnd,
      case when x.split_method = 'shares' then p.share_units else 1 end as units,
      row_number() over (partition by x.id order by p.user_id) - 1 as position,
      bool_or(p.user_id = x.paid_by) over (partition by x.id) as payer_participates
    from actual x join public.expense_participants p on p.expense_id = x.id
  ), floored as (
    select *, case when split_method = 'amounts' then share_amount_vnd
      else amount * units / sum(units) over (partition by id) end as base
    from parts
  ), shares as (
    select user_id, case
      when split_method = 'amounts' then base
      when split_method = 'shares' and payer_participates then
        base + case when user_id = paid_by then amount - sum(base) over (partition by id) else 0 end
      else base + case when position < amount - sum(base) over (partition by id) then 1 else 0 end
    end as share
    from floored
  )
  select (coalesce((select sum(amount) from actual where paid_by = target_user_id), 0)
    - coalesce((select sum(share) from shares where user_id = target_user_id), 0)
    + coalesce((select sum(amount_vnd) from public.settlement_payments
        where trip_id = target_trip_id and deleted_at is null and from_user_id = target_user_id), 0)
    - coalesce((select sum(amount_vnd) from public.settlement_payments
        where trip_id = target_trip_id and deleted_at is null and to_user_id = target_user_id), 0))::bigint;
$$;
revoke all on function private.member_trip_balance(uuid, uuid) from public, anon, authenticated;

create or replace function public.remove_trip_member(target_trip_id uuid, target_user_id uuid)
returns void
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_role text;
  balance bigint;
  amount_text text;
begin
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể loại thành viên.';
  end if;
  select role into target_role from public.trip_members
  where trip_id = target_trip_id and user_id = target_user_id for update;
  if target_role is null then raise exception 'Không tìm thấy thành viên trong chuyến đi.'; end if;
  if target_role = 'owner' then raise exception 'Không thể loại chủ nhóm khỏi chuyến đi.'; end if;
  if exists (
    select 1 from public.expenses e
    where e.trip_id = target_trip_id and e.actual_amount_vnd is null
      and (e.paid_by = target_user_id or exists (
        select 1 from public.expense_participants p where p.expense_id = e.id and p.user_id = target_user_id))
  ) then
    raise exception 'Chưa thể loại: thành viên này còn trong khoản chi chưa có số Thực tế. Hãy nhập Thực tế và quyết toán, hoặc bỏ họ khỏi khoản đó.'
      using errcode = '23514';
  end if;
  balance := private.member_trip_balance(target_trip_id, target_user_id);
  amount_text := replace(to_char(abs(balance), 'FM999,999,999,999,999'), ',', '.') || ' đ';
  if balance < 0 then
    raise exception 'Chưa thể loại: thành viên này còn nợ %. Hãy quyết toán xong trước.', amount_text using errcode = '23514';
  elsif balance > 0 then
    raise exception 'Chưa thể loại: thành viên này còn được nhận lại %. Hãy quyết toán xong trước.', amount_text using errcode = '23514';
  end if;
  delete from public.trip_members where trip_id = target_trip_id and user_id = target_user_id;
end;
$$;

-- Former members are named so old expenses and payments stay readable; no email is exposed.
create function public.get_trip_former_people(target_trip_id uuid)
returns table (user_id uuid, display_name text)
language plpgsql stable security definer
set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501'; end if;
  return query
  select u.id,
    coalesce(nullif(nullif(btrim(p.display_name), ''), u.email), nullif(split_part(u.email, '@', 1), ''), 'Thành viên')::text
  from (
    select e.paid_by as id from public.expenses e where e.trip_id = target_trip_id
    union select ep.user_id from public.expense_participants ep join public.expenses e on e.id = ep.expense_id where e.trip_id = target_trip_id
    union select s.from_user_id from public.settlement_payments s where s.trip_id = target_trip_id
    union select s.to_user_id from public.settlement_payments s where s.trip_id = target_trip_id
  ) involved
  join auth.users u on u.id = involved.id
  left join public.profiles p on p.id = u.id
  where not exists (select 1 from public.trip_members m where m.trip_id = target_trip_id and m.user_id = u.id)
  order by 2;
end;
$$;
revoke all on function public.get_trip_former_people(uuid) from public, anon;
grant execute on function public.get_trip_former_people(uuid) to authenticated;

-- An unchanged former payer may stay on an edited expense; new payers must be members.
create or replace function private.validate_expense_payer()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and new.paid_by = old.paid_by and new.trip_id = old.trip_id then return new; end if;
  if not exists (
    select 1 from public.trip_members
    where trip_id = new.trip_id and user_id = new.paid_by
  ) then
    raise exception 'Người thanh toán phải là thành viên đang hoạt động của chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Membership is checked when a participant is added; share values may change later.
drop trigger expense_participants_validate_member on public.expense_participants;
create trigger expense_participants_validate_member before insert or update of expense_id, user_id
on public.expense_participants for each row execute function private.validate_expense_participant();
-- The platform grants table-wide UPDATE by default; only split values may change in place.
revoke update on public.expense_participants from anon, authenticated;
grant update (share_units, share_amount_vnd) on public.expense_participants to authenticated;
create policy "members update expense participants" on public.expense_participants for update to authenticated
using (exists (select 1 from public.expenses e where e.id = expense_id and private.is_trip_member(e.trip_id)))
with check (exists (select 1 from public.expenses e where e.id = expense_id and private.is_trip_member(e.trip_id)));

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
  saved_payer uuid;
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
  if target_expense_id is not null then
    select paid_by into saved_payer from public.expenses where id = target_expense_id and trip_id = target_trip_id;
    -- Former members stay exactly as recorded on their old expenses.
    if saved_payer is not null and saved_payer <> payer_user_id and not exists (
      select 1 from public.trip_members where trip_id = target_trip_id and user_id = saved_payer
    ) then
      raise exception 'Người thanh toán đã rời nhóm nên được giữ nguyên cho khoản chi này.' using errcode = '22023';
    end if;
    if exists (
      select 1 from public.expense_participants p
      where p.expense_id = target_expense_id and not (p.user_id = any(participant_user_ids))
        and not exists (select 1 from public.trip_members m where m.trip_id = target_trip_id and m.user_id = p.user_id)
    ) then
      raise exception 'Người đã rời nhóm được giữ nguyên trong khoản chi cũ.' using errcode = '22023';
    end if;
  end if;
  if not exists (
    select 1 from public.trip_members where trip_id = target_trip_id and user_id = payer_user_id
  ) and payer_user_id is distinct from saved_payer then
    raise exception 'Người thanh toán phải là thành viên đang hoạt động của chuyến đi.' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(participant_user_ids) participant_id
    where not exists (
      select 1 from public.trip_members
      where trip_id = target_trip_id and user_id = participant_id
    ) and not exists (
      select 1 from public.expense_participants
      where expense_id = target_expense_id and user_id = participant_id
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
    delete from public.expense_participants
    where expense_id = saved_expense_id and not (user_id = any(participant_user_ids));
  end if;

  -- Existing rows are updated in place so former members keep their participation;
  -- only newly added participants are inserted (and checked for membership).
  update public.expense_participants p
  set share_units = case when method = 'shares' then (target_split_values ->> p.user_id::text)::integer end,
      share_amount_vnd = case when method = 'amounts' then (target_split_values ->> p.user_id::text)::bigint end
  where p.expense_id = saved_expense_id;
  insert into public.expense_participants (expense_id, user_id, share_units, share_amount_vnd)
  select saved_expense_id, participant_id,
    case when method = 'shares' then (target_split_values ->> participant_id::text)::integer end,
    case when method = 'amounts' then (target_split_values ->> participant_id::text)::bigint end
  from (select distinct unnest(participant_user_ids) as participant_id) selected
  where not exists (select 1 from public.expense_participants p where p.expense_id = saved_expense_id and p.user_id = participant_id);

  return saved_expense_id;
end;
$$;

-- Trigger functions are not part of the API (they still fire as triggers).
revoke execute on function public.validate_expense_date() from public, anon, authenticated;
revoke execute on function public.validate_trip_child_dates() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_versioned_row() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.touch_trip() from public, anon, authenticated;
revoke execute on function public.validate_itinerary_date() from public, anon, authenticated;
revoke execute on function public.validate_trip_capacity() from public, anon, authenticated;
