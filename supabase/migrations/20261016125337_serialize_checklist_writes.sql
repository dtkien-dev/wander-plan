-- Match membership removal's trip -> checklist lock order for every app write.
revoke insert, update, delete on public.checklist_items from authenticated;
revoke insert (trip_id, title, assigned_to) on public.checklist_items from authenticated;
revoke update (title, completed, assigned_to, deleted_at) on public.checklist_items from authenticated;

create function public.save_trip_checklist(
  target_trip_id uuid, target_item_id uuid, expected_version integer,
  item_title text, assignee_user_id uuid, item_completed boolean
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
  if target_item_id is null then
    insert into public.checklist_items(trip_id,title,assigned_to,completed)
      values(target_trip_id,btrim(item_title),assignee_user_id,item_completed) returning id into saved_id;
  else
    update public.checklist_items set title=btrim(item_title),assigned_to=assignee_user_id,completed=item_completed
      where id=target_item_id and trip_id=target_trip_id and version=expected_version and deleted_at is null
      returning id into saved_id;
    if saved_id is null then
      raise exception 'Mục chuẩn bị đã thay đổi. Đóng cửa sổ rồi mở lại mục để dùng bản mới nhất.';
    end if;
  end if;
  return saved_id;
end;
$$;

create function public.remove_trip_checklist(target_trip_id uuid, target_item_id uuid, expected_version integer)
returns void language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  perform 1 from public.trips where id=target_trip_id for update;
  if not private.is_trip_member(target_trip_id) then
    raise exception 'Bạn không thuộc chuyến đi này.' using errcode = '42501';
  end if;
  update public.checklist_items set deleted_at=now()
    where id=target_item_id and trip_id=target_trip_id and version=expected_version and deleted_at is null;
  if not found then
    raise exception 'Mục chuẩn bị đã thay đổi. Đóng cửa sổ rồi mở lại mục để dùng bản mới nhất.';
  end if;
end;
$$;
revoke all on function public.save_trip_checklist(uuid,uuid,integer,text,uuid,boolean) from public,anon;
revoke all on function public.remove_trip_checklist(uuid,uuid,integer) from public,anon;
grant execute on function public.save_trip_checklist(uuid,uuid,integer,text,uuid,boolean) to authenticated;
grant execute on function public.remove_trip_checklist(uuid,uuid,integer) to authenticated;
