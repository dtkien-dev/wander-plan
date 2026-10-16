-- R06: the recipient records "payer đã trả recipient X đồng"; balances subtract these records.
create table public.settlement_payments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_user_id uuid not null references auth.users(id),
  to_user_id uuid not null references auth.users(id),
  amount_vnd bigint not null check (amount_vnd > 0),
  -- Undo keeps the row as history and delivers a trip-filtered UPDATE through Realtime RLS.
  deleted_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  updated_by uuid not null default auth.uid() references auth.users(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_user_id <> to_user_id)
);
create index settlement_payments_trip_idx on public.settlement_payments(trip_id, created_at);
alter table public.settlement_payments enable row level security;
revoke all on public.settlement_payments from public, anon, authenticated;
grant select on public.settlement_payments to authenticated;
grant all on public.settlement_payments to service_role;
create policy "members view settlement payments" on public.settlement_payments for select to authenticated
  using (private.is_trip_member(trip_id));
create trigger settlement_payments_touch before update on public.settlement_payments
for each row execute function public.touch_versioned_row();

-- expected_payment_count is the number of payment rows (including undone ones) the
-- caller has seen for the trip, so a second tab cannot record the same transfer twice.
create function public.record_settlement_payment(
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
  if not exists (select 1 from public.trip_members where trip_id = target_trip_id and user_id = payer_user_id)
    and not exists (select 1 from public.expenses where trip_id = target_trip_id and paid_by = payer_user_id)
    and not exists (select 1 from public.expense_participants p join public.expenses e on e.id = p.expense_id
      where e.trip_id = target_trip_id and p.user_id = payer_user_id) then
    raise exception 'Người trả phải thuộc chuyến đi này.' using errcode = '23514';
  end if;
  if (select count(*) from public.settlement_payments where trip_id = target_trip_id) is distinct from expected_payment_count then
    raise exception 'Thanh toán vừa được cập nhật. Hãy xem lại danh sách rồi thử lại.';
  end if;
  insert into public.settlement_payments(trip_id, from_user_id, to_user_id, amount_vnd)
    values (target_trip_id, payer_user_id, auth.uid(), payment_amount_vnd) returning id into saved_id;
  return saved_id;
end;
$$;

create function public.undo_settlement_payment(target_trip_id uuid, target_payment_id uuid)
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
  update public.settlement_payments set deleted_at = now()
    where id = target_payment_id and trip_id = target_trip_id and to_user_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Chỉ người nhận tiền được hủy xác nhận này, hoặc xác nhận đã được hủy.';
  end if;
end;
$$;
revoke all on function public.record_settlement_payment(uuid, uuid, bigint, integer) from public, anon;
revoke all on function public.undo_settlement_payment(uuid, uuid) from public, anon;
grant execute on function public.record_settlement_payment(uuid, uuid, bigint, integer) to authenticated;
grant execute on function public.undo_settlement_payment(uuid, uuid) to authenticated;

alter publication supabase_realtime add table public.settlement_payments;
