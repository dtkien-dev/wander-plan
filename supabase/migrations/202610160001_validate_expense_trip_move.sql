-- Participants are validated when they are written. Moving an expense to another trip
-- must apply the same rule to the participants it already has.
create or replace function private.validate_expense_trip_move_participants()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.trip_id is distinct from old.trip_id and exists (
    select 1
    from public.expense_participants ep
    where ep.expense_id = new.id
      and not exists (
        select 1 from public.trip_members m
        where m.trip_id = new.trip_id and m.user_id = ep.user_id
      )
  ) then
    raise exception 'Người tham gia phải là thành viên đang hoạt động của chuyến đi.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_validate_trip_move_participants on public.expenses;
create trigger expenses_validate_trip_move_participants before update of trip_id
on public.expenses for each row execute function private.validate_expense_trip_move_participants();
