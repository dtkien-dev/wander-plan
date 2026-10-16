create or replace function private.validate_checklist_assignee()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  -- BEFORE triggers precede RLS WITH CHECK: authorize before revealing validation details.
  if new.assigned_to is not null and auth.uid() is not null and not private.is_trip_member(new.trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id = new.trip_id for update;
  if new.assigned_to is not null and not exists (
    select 1 from public.trip_members where trip_id = new.trip_id and user_id = new.assigned_to
  ) then raise exception 'Người phụ trách phải là thành viên của chuyến đi.' using errcode = '23514'; end if;
  return new;
end;
$$;
