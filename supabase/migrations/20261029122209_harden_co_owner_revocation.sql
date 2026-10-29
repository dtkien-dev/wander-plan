-- Member removal must retain settlement and trip-lock checks in its RPC.
revoke delete on public.trip_members from public, anon, authenticated;

-- Demotion can commit while an archive request waits for the trip lock.
create or replace function public.set_trip_archived(target_trip_id uuid,archive_trip boolean,expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
declare target public.trips%rowtype;
begin
  if archive_trip is null then raise exception 'Chọn lưu trữ hoặc khôi phục.' using errcode='22023'; end if;
  select t.* into target from public.trips t where t.id=target_trip_id and auth.uid() is not null
    and (private.is_site_admin() or t.created_by=auth.uid() or exists(select 1 from public.trip_members m
      where m.trip_id=t.id and m.user_id=auth.uid() and m.role='owner')) for update;
  if not found or not (private.is_site_admin() or target.created_by=auth.uid() or exists(select 1 from public.trip_members m where m.trip_id=target_trip_id and m.user_id=auth.uid() and m.role='owner')) then
    raise exception 'Chỉ chủ nhóm được lưu trữ hoặc khôi phục chuyến đi.' using errcode='42501';
  end if;
  if target.version is distinct from expected_version then
    raise exception 'Chuyến đi đã thay đổi. Hãy tải lại danh sách và thử lại.';
  end if;
  if (target.archived_at is not null)=archive_trip then return; end if;
  update public.trips set archived_at=case when archive_trip then now() else null end where trips.id=target_trip_id;
  update public.trip_members set role=role where trip_id=target_trip_id;
end;
$$;
