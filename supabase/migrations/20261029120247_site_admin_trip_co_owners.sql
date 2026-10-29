-- Bootstrap/revoke through the controlled operator runbook, never a browser write.
create table private.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table private.site_admins enable row level security;
revoke all on private.site_admins from public, anon, authenticated;

create function private.is_site_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists(select 1 from private.site_admins where user_id=auth.uid()); $$;
revoke all on function private.is_site_admin() from public, anon;
grant execute on function private.is_site_admin() to authenticated;

create function public.get_my_site_admin_status()
returns boolean language sql stable security invoker set search_path = public, pg_temp
as $$ select private.is_site_admin(); $$;
revoke all on function public.get_my_site_admin_status() from public, anon;
grant execute on function public.get_my_site_admin_status() to authenticated;

create or replace function private.is_trip_member(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from public.trips t where t.id=target_trip_id and t.archived_at is null
    and (private.is_site_admin() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid())));
$$;
create or replace function private.is_trip_owner(target_trip_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$
  select exists(select 1 from public.trips t where t.id=target_trip_id and t.archived_at is null
    and (private.is_site_admin() or t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner')));
$$;

create or replace function public.get_my_archived_trips()
returns table(id uuid,name text,archived_at timestamptz,version integer)
language sql stable security definer set search_path = public, pg_temp
as $$
  select t.id,t.name,t.archived_at,t.version from public.trips t
  where auth.uid() is not null and t.archived_at is not null
    and (private.is_site_admin() or t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner'))
  order by t.archived_at desc,t.id;
$$;

create or replace function public.set_trip_archived(target_trip_id uuid,archive_trip boolean,expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.trips%rowtype;
begin
  if archive_trip is null then raise exception 'Chọn lưu trữ hoặc khôi phục.' using errcode='22023'; end if;
  select t.* into target from public.trips t where t.id=target_trip_id and auth.uid() is not null
    and (private.is_site_admin() or t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner')) for update;
  if not found then raise exception 'Chỉ chủ nhóm được lưu trữ hoặc khôi phục chuyến đi.' using errcode='42501'; end if;
  if target.version is distinct from expected_version then
    raise exception 'Chuyến đi đã thay đổi. Hãy tải lại danh sách và thử lại.';
  end if;
  if (target.archived_at is not null)=archive_trip then return; end if;
  update public.trips set archived_at=case when archive_trip then now() else null end where trips.id=target_trip_id;
  update public.trip_members set role=role where trip_id=target_trip_id;
end;
$$;

-- Authenticated role changes must take the same trip lock and recheck authority.
revoke update on public.trip_members from public, anon, authenticated;
create or replace function private.validate_membership_identity()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  if new.trip_id is distinct from old.trip_id or new.user_id is distinct from old.user_id then
    raise exception 'Không thể chuyển thành viên sang chuyến đi hoặc tài khoản khác.' using errcode='23514';
  end if;
  if old.role='owner' and new.role<>'owner' and not exists (
    select 1 from public.trips t where t.id=old.trip_id and t.created_by=auth.uid() and t.created_by<>old.user_id
  ) then
    raise exception 'Chỉ người tạo chuyến được thu hồi quyền đồng chủ nhóm.' using errcode='42501';
  end if;
  return new;
end;
$$;

create function public.set_trip_member_role(target_trip_id uuid,target_user_id uuid,new_role text,expected_role text)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare creator uuid; previous_role text;
begin
  if new_role is null or new_role not in ('owner','editor') or expected_role is null or expected_role not in ('owner','editor') then
    raise exception 'Vai trò không hợp lệ.' using errcode='22023';
  end if;
  select t.created_by into creator from public.trips t where t.id=target_trip_id and t.archived_at is null for update;
  if not found or not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm được thay đổi vai trò thành viên.' using errcode='42501';
  end if;
  if new_role='editor' and (auth.uid() is distinct from creator or target_user_id=creator) then
    raise exception 'Chỉ người tạo chuyến được thu hồi quyền đồng chủ nhóm.' using errcode='42501';
  end if;
  select m.role into previous_role from public.trip_members m
    where m.trip_id=target_trip_id and m.user_id=target_user_id for update;
  if not found then raise exception 'Chỉ bổ nhiệm thành viên đã tham gia chuyến đi.' using errcode='22023'; end if;
  if previous_role is distinct from expected_role then
    raise exception 'Vai trò đã thay đổi. Hãy tải lại danh sách và thử lại.' using errcode='40001';
  end if;
  if previous_role=new_role then return; end if;
  if new_role='editor' and (select count(*) from public.trip_members where trip_id=target_trip_id and role='owner')<=1 then
    raise exception 'Chuyến đi phải có ít nhất một chủ nhóm.' using errcode='23514';
  end if;
  update public.trip_members set role=new_role where trip_id=target_trip_id and user_id=target_user_id;
end;
$$;
revoke all on function public.set_trip_member_role(uuid,uuid,text,text) from public, anon;
grant execute on function public.set_trip_member_role(uuid,uuid,text,text) to authenticated;

-- Admin content access does not make the admin a payment recipient/member.
create or replace function public.record_settlement_payment(
  target_trip_id uuid, payer_user_id uuid, payment_amount_vnd bigint, expected_payment_count integer
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare saved_id uuid;
begin
  if not private.is_trip_member(target_trip_id) or not exists (select 1 from public.trip_members where trip_id=target_trip_id and user_id=auth.uid()) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_member(target_trip_id) or not exists (select 1 from public.trip_members where trip_id=target_trip_id and user_id=auth.uid()) then
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
  if not private.is_trip_member(target_trip_id) or not exists (select 1 from public.trip_members where trip_id=target_trip_id and user_id=auth.uid()) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_member(target_trip_id) or not exists (select 1 from public.trip_members where trip_id=target_trip_id and user_id=auth.uid()) then
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
