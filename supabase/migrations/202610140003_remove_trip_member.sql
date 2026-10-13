create or replace function public.remove_trip_member(target_trip_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_role text;
begin
  if not private.is_trip_owner(target_trip_id) then
    raise exception 'Chỉ chủ nhóm mới có thể loại thành viên.';
  end if;

  select role into target_role
  from public.trip_members
  where trip_id = target_trip_id and user_id = target_user_id
  for update;

  if target_role is null then
    raise exception 'Không tìm thấy thành viên trong chuyến đi.';
  end if;
  if target_role = 'owner' then
    raise exception 'Không thể loại chủ nhóm khỏi chuyến đi.';
  end if;

  delete from public.trip_members
  where trip_id = target_trip_id and user_id = target_user_id;
end;
$$;

revoke all on function public.remove_trip_member(uuid, uuid) from public;
grant execute on function public.remove_trip_member(uuid, uuid) to authenticated;
