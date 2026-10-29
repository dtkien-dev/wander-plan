-- A063/P34: deleted expenses are kept 7 days so the deleting member or an owner can restore them.
-- Trash rows live outside public.expenses, so balances, exports, reschedule and clone never see them.
create table public.expense_trash (
  id uuid not null,
  trip_id uuid not null references public.trips(id) on delete cascade,
  deleted_by uuid not null references auth.users(id),
  snapshot jsonb not null,
  deleted_at timestamptz not null,
  expires_at timestamptz not null,
  primary key (trip_id, id),
  constraint expense_trash_snapshot_identity check (
    (snapshot->>'id')::uuid is not distinct from id and (snapshot->>'trip_id')::uuid is not distinct from trip_id
  )
);
create index expense_trash_expiry_idx on public.expense_trash(expires_at);
alter table public.expense_trash enable row level security;
revoke all on public.expense_trash from public, anon, authenticated;
grant select on public.expense_trash to authenticated;
grant all on public.expense_trash to service_role;
create policy "deleter or owners view unexpired expense trash" on public.expense_trash for select to authenticated
  using (expires_at > now() and (private.is_trip_owner(trip_id) or (deleted_by = auth.uid() and private.is_trip_member(trip_id))));

-- BEFORE DELETE so the participants still exist; the former-member guard may still refuse the delete.
create function private.keep_deleted_expense()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed_at timestamptz := clock_timestamp();
begin
  -- Cascades (trip removal) and service deletes without a user are not recoverable user deletes.
  if pg_trigger_depth() = 1 and auth.uid() is not null
    and exists(select 1 from public.trips where id = old.trip_id) then
    insert into public.expense_trash(id, trip_id, deleted_by, snapshot, deleted_at, expires_at)
    values (old.id, old.trip_id, auth.uid(),
      to_jsonb(old) || jsonb_build_object('expense_participants', coalesce((
        select jsonb_agg(to_jsonb(p) order by p.user_id) from public.expense_participants p where p.expense_id = old.id), '[]'::jsonb)),
      removed_at, removed_at + interval '7 days')
    on conflict (trip_id, id) do update set deleted_by = excluded.deleted_by, snapshot = excluded.snapshot,
      deleted_at = excluded.deleted_at, expires_at = excluded.expires_at;
  end if;
  return old;
end;
$$;
create trigger expenses_keep_deleted before delete on public.expenses
  for each row execute function private.keep_deleted_expense();
revoke all on function private.keep_deleted_expense() from public, anon, authenticated;

create function public.restore_trip_expense(target_trip_id uuid, target_expense_id uuid, expected_version integer, expected_deleted_at timestamptz)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed public.expense_trash%rowtype;
begin
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501'; end if;
  perform 1 from public.trips where id = target_trip_id for update;
  if not private.is_trip_member(target_trip_id) then raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501'; end if;
  select * into removed from public.expense_trash where id = target_expense_id and trip_id = target_trip_id for update;
  if not found or removed.expires_at <= clock_timestamp() or removed.deleted_at is distinct from expected_deleted_at
    or (removed.snapshot->>'version')::integer is distinct from expected_version then
    raise exception 'Khoản chi đã thay đổi hoặc hết 7 ngày khôi phục. Hãy tải lại.' using errcode = '40001';
  end if;
  if not private.is_trip_owner(target_trip_id) and removed.deleted_by is distinct from auth.uid() then
    raise exception 'Chỉ người đã xóa hoặc chủ nhóm được khôi phục khoản chi.' using errcode = '42501';
  end if;
  -- A063: anyone who left after the delete has already settled; restoring would reopen their balance.
  if not exists(select 1 from public.trip_members m where m.trip_id = target_trip_id and m.user_id = (removed.snapshot->>'paid_by')::uuid)
    or exists(select 1 from jsonb_array_elements(removed.snapshot->'expense_participants') p
      where not exists(select 1 from public.trip_members m where m.trip_id = target_trip_id and m.user_id = (p->>'user_id')::uuid)) then
    raise exception 'Không thể khôi phục vì người trả hoặc người tham gia khoản chi này đã rời nhóm.' using errcode = '23514';
  end if;
  if exists(select 1 from public.expenses where id = target_expense_id) then
    raise exception 'Khoản chi này đã tồn tại. Hãy tải lại.' using errcode = '40001';
  end if;
  -- Date, payer, participant and split triggers still validate the restored rows.
  insert into public.expenses
    select (jsonb_populate_record(null::public.expenses, (removed.snapshot - 'expense_participants') ||
      jsonb_build_object('id', target_expense_id, 'trip_id', target_trip_id, 'version', expected_version + 1,
        'updated_by', auth.uid(), 'updated_at', now()))).*;
  insert into public.expense_participants
    select (jsonb_populate_record(null::public.expense_participants, p || jsonb_build_object('expense_id', target_expense_id))).*
    from jsonb_array_elements(removed.snapshot->'expense_participants') p;
  delete from public.expense_trash where id = target_expense_id and trip_id = target_trip_id;
  update public.trips set updated_at = now() where id = target_trip_id;
end;
$$;
revoke all on function public.restore_trip_expense(uuid, uuid, integer, timestamptz) from public, anon;
grant execute on function public.restore_trip_expense(uuid, uuid, integer, timestamptz) to authenticated;

create function private.purge_expired_expense_trash()
returns integer language plpgsql security definer set search_path = public, pg_temp
as $$
declare removed integer;
begin
  delete from public.expense_trash where expires_at <= clock_timestamp();
  get diagnostics removed = row_count;
  return removed;
end;
$$;
revoke all on function private.purge_expired_expense_trash() from public, anon, authenticated;

do $schedule$
begin
  -- Embedded PostgreSQL has no scheduler; full Supabase and deployment must verify the job.
  if exists(select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('wander-plan-expense-trash-expiry', '0 * * * *', 'select private.purge_expired_expense_trash()');
  end if;
  if exists(select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.expense_trash;
  end if;
end;
$schedule$;
