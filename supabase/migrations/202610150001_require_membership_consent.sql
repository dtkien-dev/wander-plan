-- Membership creation must go through the security-definer trip creation and
-- invitation response RPCs. An owner policy alone does not establish consent.
revoke insert on public.trip_members from public, anon, authenticated;
