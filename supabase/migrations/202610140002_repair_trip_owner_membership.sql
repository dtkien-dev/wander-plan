-- Keep the trip creator and the owner membership in sync. Older/partially
-- completed bootstrap attempts may have left a trip whose creator was not a
-- member, making the UI unable to load the workspace.
insert into public.trip_members (trip_id, user_id, role)
select id, created_by, 'owner'
from public.trips
where created_by is not null
on conflict (trip_id, user_id) do update
set role = 'owner';

create or replace function public.create_default_trip()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_trip_id uuid;
  current_user_is_creator boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select t.id, t.created_by = auth.uid()
  into new_trip_id, current_user_is_creator
  from public.trips t
  left join public.trip_members m on m.trip_id = t.id and m.user_id = auth.uid()
  where m.user_id is not null or t.created_by = auth.uid()
  order by t.created_at
  limit 1;

  if new_trip_id is not null then
    if current_user_is_creator then
      insert into public.trip_members (trip_id, user_id, role)
      values (new_trip_id, auth.uid(), 'owner')
      on conflict (trip_id, user_id) do update
      set role = 'owner';
    end if;
    return new_trip_id;
  end if;

  perform pg_advisory_xact_lock(hashtext('wanderplan-single-trip'));
  if exists (select 1 from public.trips) then
    raise exception 'Chuyến đi đã được tạo. Hãy nhờ chủ nhóm mời đúng email của bạn.';
  end if;

  insert into public.trips (name, destination, start_date, end_date, timezone, budget_vnd, created_by)
  values ('Đà Lạt trong sương', 'Đà Lạt, Lâm Đồng', date '2026-11-27', date '2026-11-30', 'Asia/Ho_Chi_Minh', 9000000, auth.uid())
  returning id into new_trip_id;

  insert into public.trip_members (trip_id, user_id, role)
  values (new_trip_id, auth.uid(), 'owner')
  on conflict (trip_id, user_id) do update
  set role = 'owner';

  return new_trip_id;
end;
$$;

revoke all on function public.create_default_trip() from public;
grant execute on function public.create_default_trip() to authenticated;
