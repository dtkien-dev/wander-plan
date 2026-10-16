-- A024: once someone has left, the money on expenses they were part of is frozen so they
-- cannot end up owing (or being owed) again. Title, category, dates and notes stay editable.
create function private.expense_involves_former_member(target_expense_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.expenses e
    where e.id = target_expense_id and (
      not exists (select 1 from public.trip_members m where m.trip_id = e.trip_id and m.user_id = e.paid_by)
      or exists (
        select 1 from public.expense_participants p
        where p.expense_id = e.id
          and not exists (select 1 from public.trip_members m where m.trip_id = e.trip_id and m.user_id = p.user_id)
      )
    )
  );
$$;
revoke all on function private.expense_involves_former_member(uuid) from public, anon, authenticated;

create function private.guard_former_member_expense()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- Cascades (trip or expense removal by the database itself) are not user edits.
  if pg_trigger_depth() > 1 or not private.expense_involves_former_member(old.id) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  if tg_op = 'DELETE' then
    raise exception 'Khoản chi có người đã rời nhóm nên không thể xóa.' using errcode = '23514';
  end if;
  if (new.estimated_amount_vnd, new.actual_amount_vnd, new.paid_by, new.split_method, new.trip_id)
     is distinct from (old.estimated_amount_vnd, old.actual_amount_vnd, old.paid_by, old.split_method, old.trip_id) then
    raise exception 'Khoản chi có người đã rời nhóm: không thể đổi số tiền, cách chia hay người trả. Chỉ sửa được tên, phân loại, ngày và ghi chú.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger expenses_former_member_money_locked before update or delete on public.expenses
for each row execute function private.guard_former_member_expense();

create function private.guard_former_member_participants()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare checked_expense uuid := case when tg_op = 'INSERT' then new.expense_id else old.expense_id end;
begin
  if pg_trigger_depth() > 1 or not private.expense_involves_former_member(checked_expense) then
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  -- Saving an unchanged split rewrites the same values; only real changes are refused.
  if tg_op = 'UPDATE' and (new.expense_id, new.user_id, new.share_units, new.share_amount_vnd)
     is not distinct from (old.expense_id, old.user_id, old.share_units, old.share_amount_vnd) then
    return new;
  end if;
  raise exception 'Khoản chi có người đã rời nhóm: không thể đổi người tham gia hay phần chia.' using errcode = '23514';
end;
$$;
create trigger expense_participants_former_member_locked before insert or update or delete on public.expense_participants
for each row execute function private.guard_former_member_participants();

-- Payments with someone who left stay as recorded.
create or replace function public.record_settlement_payment(
  target_trip_id uuid, payer_user_id uuid, payment_amount_vnd bigint, expected_payment_count integer
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare saved_id uuid;
begin
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  if payment_amount_vnd is null or payment_amount_vnd <= 0 then
    raise exception 'Số tiền thanh toán phải lớn hơn 0.' using errcode = '22023';
  end if;
  if payer_user_id is null or payer_user_id = auth.uid() then
    raise exception 'Chọn người đã trả tiền cho bạn.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.trip_members where trip_id = target_trip_id and user_id = payer_user_id) then
    raise exception 'Người trả phải là thành viên hiện tại của chuyến đi.' using errcode = '23514';
  end if;
  if (select count(*) from public.settlement_payments where trip_id = target_trip_id) is distinct from expected_payment_count then
    raise exception 'Thanh toán vừa được cập nhật. Hãy xem lại danh sách rồi thử lại.';
  end if;
  insert into public.settlement_payments(trip_id, from_user_id, to_user_id, amount_vnd)
    values (target_trip_id, payer_user_id, auth.uid(), payment_amount_vnd) returning id into saved_id;
  return saved_id;
end;
$$;

create or replace function public.undo_settlement_payment(target_trip_id uuid, target_payment_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.settlement_payments s
    where s.id = target_payment_id and s.trip_id = target_trip_id
      and not exists (select 1 from public.trip_members m where m.trip_id = target_trip_id and m.user_id = s.from_user_id)
  ) then
    raise exception 'Người trả đã rời nhóm nên thanh toán này được giữ nguyên.' using errcode = '23514';
  end if;
  update public.settlement_payments set deleted_at = now()
    where id = target_payment_id and trip_id = target_trip_id and to_user_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Chỉ người nhận tiền được hủy xác nhận này, hoặc xác nhận đã được hủy.';
  end if;
end;
$$;
