begin;

-- Planner saves always update this owner-scoped revision row. Publishing that
-- single table lets clients invalidate and refetch the authoritative aggregate
-- without broadcasting changes from every normalized planner table.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_profiles'
  ) then
    alter publication supabase_realtime add table public.planner_profiles;
  end if;
end $$;

commit;
