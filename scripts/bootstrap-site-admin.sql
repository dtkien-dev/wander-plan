\set ON_ERROR_STOP on
begin;
select set_config('app.bootstrap_admin_email', :'site_admin_email', true) as bootstrap_email \gset
do $$
declare target uuid;
begin
  select id into strict target from auth.users
    where lower(email)=lower(btrim(current_setting('app.bootstrap_admin_email')))
      and email_confirmed_at is not null;
  insert into private.site_admins(user_id) values(target) on conflict(user_id) do nothing;
exception
  when no_data_found then raise exception 'Không tìm thấy đúng một tài khoản đã xác minh email. Không cấp quyền.';
  when too_many_rows then raise exception 'Email không xác định duy nhất một tài khoản. Không cấp quyền.';
end;
$$;
commit;
