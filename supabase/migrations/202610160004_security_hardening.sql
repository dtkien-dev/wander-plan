-- Maps links are rendered as outbound links, so the database accepts only https Google Maps hosts,
-- matching isGoogleMapsUrl in the app. Existing rows were checked before this release.
alter table public.itinerary_items drop constraint if exists itinerary_items_maps_url_google;
alter table public.itinerary_items add constraint itinerary_items_maps_url_google check (
  maps_url is null
  or maps_url ~ '^https://(www\.google\.com|google\.com|maps\.google\.com|maps\.app\.goo\.gl)(/|$)'
);

-- Every application function needs a signed-in user. Remove the PUBLIC/anon execute grants and keep
-- explicit grants only for roles that already used them. Trigger functions do not need EXECUTE to fire.
do $$
declare
  function_signature regprocedure;
  had_authenticated boolean;
  had_service_role boolean;
begin
  for function_signature, had_authenticated, had_service_role in
    select p.oid::regprocedure,
           has_function_privilege('authenticated', p.oid, 'execute'),
           has_function_privilege('service_role', p.oid, 'execute')
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  loop
    execute format('revoke execute on function %s from public, anon', function_signature);
    if had_authenticated then
      execute format('grant execute on function %s to authenticated', function_signature);
    end if;
    if had_service_role then
      execute format('grant execute on function %s to service_role', function_signature);
    end if;
  end loop;
end;
$$;

-- New functions must be granted explicitly (see AGENTS.md).
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
