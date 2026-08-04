-- Run after `supabase db reset`: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/schema_contract.sql
begin;

do $$
declare missing text[];
begin
  select array_agg(required.name) into missing
  from (values
    ('planner_profiles'),('routine_definitions'),('routine_revisions'),('daily_routine_instances'),
    ('daily_todos'),('running_todos'),('wind_down_days'),('wind_down_items'),('time_blocks'),
    ('chore_definitions'),('chore_occurrences'),('legacy_imports')
  ) required(name)
  where not exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname=required.name and c.relrowsecurity and c.relforcerowsecurity
  );
  if missing is not null then raise exception 'tables missing forced RLS: %', missing; end if;
end $$;

do $$
declare bad_count integer;
begin
  select count(*) into bad_count
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relkind='r'
    and c.relname in ('planner_profiles','routine_definitions','routine_revisions','daily_routine_instances',
      'daily_todos','running_todos','wind_down_days','wind_down_items','time_blocks','chore_definitions','chore_occurrences','legacy_imports')
    and not exists (
      select 1 from pg_policy p where p.polrelid=c.oid
        and pg_get_expr(p.polqual,p.polrelid) like '%auth.uid()%'
        and pg_get_expr(p.polwithcheck,p.polrelid) like '%auth.uid()%'
    );
  if bad_count <> 0 then raise exception '% planner tables lack owner-scoped policies', bad_count; end if;
end $$;

do $$
declare table_name text;
declare function_signature text;
begin
  foreach table_name in array array[
    'planner_profiles','routine_definitions','routine_revisions','daily_routine_instances',
    'daily_todos','running_todos','wind_down_days','wind_down_items','time_blocks',
    'chore_definitions','chore_occurrences','legacy_imports'
  ] loop
    if has_table_privilege('authenticated',format('public.%I',table_name),'INSERT')
      or has_table_privilege('authenticated',format('public.%I',table_name),'UPDATE')
      or has_table_privilege('authenticated',format('public.%I',table_name),'DELETE')
      or has_table_privilege('authenticated',format('public.%I',table_name),'TRUNCATE')
      or has_table_privilege('anon',format('public.%I',table_name),'INSERT')
      or has_table_privilege('anon',format('public.%I',table_name),'UPDATE')
      or has_table_privilege('anon',format('public.%I',table_name),'DELETE')
      or has_table_privilege('anon',format('public.%I',table_name),'TRUNCATE')
    then raise exception 'direct DML remains granted on %',table_name; end if;
    if not has_table_privilege('authenticated',format('public.%I',table_name),'SELECT')
    then raise exception 'authenticated Realtime/select missing on %',table_name; end if;
  end loop;

  foreach function_signature in array array[
    'get_planner_state()','save_planner_state(jsonb,bigint)',
    'import_legacy_planner_state(jsonb,text)','materialize_daily_routine(date)'
  ] loop
    if not (select prosecdef from pg_proc where oid=('public.'||function_signature)::regprocedure)
    then raise exception 'RPC is not SECURITY DEFINER: %',function_signature; end if;
  end loop;
end $$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='protect_historical_routine_snapshot' and not tgisinternal)
  then raise exception 'historical snapshot protection trigger missing'; end if;
  if (select count(*) from pg_trigger where tgname in ('routine_linked_completion','todo_linked_completion','block_linked_completion') and not tgisinternal) <> 3
  then raise exception 'linked completion triggers missing'; end if;
  if not exists (select 1 from pg_proc where proname='import_legacy_planner_state')
  then raise exception 'legacy import RPC missing'; end if;
  if not exists (select 1 from pg_proc where proname='materialize_daily_routine')
  then raise exception 'materialization RPC missing'; end if;
end $$;

do $$
declare missing text[];
begin
  select array_agg(required.column_name) into missing
  from (values
    ('chore_definitions','cycle_weeks'),
    ('chore_definitions','cycle_anchor_date'),
    ('chore_definitions','duration_minutes'),
    ('chore_definitions','default_start_slot'),
    ('chore_definitions','auto_schedule'),
    ('routine_revisions','auto_schedule_weekdays'),
    ('routine_revisions','auto_schedule_label'),
    ('time_blocks','note'),
    ('wind_down_days','suppressed_auto_block_ids')
  ) required(table_name,column_name)
  where not exists (
    select 1 from information_schema.columns c
    where c.table_schema='public'
      and c.table_name=required.table_name
      and c.column_name=required.column_name
  );
  if missing is not null then raise exception 'recurring schedule columns missing: %',missing; end if;

  if (select data_type from information_schema.columns where table_schema='public' and table_name='time_blocks' and column_name='start_slot') <> 'numeric'
    or (select data_type from information_schema.columns where table_schema='public' and table_name='time_blocks' and column_name='end_slot') <> 'numeric'
  then raise exception 'time block boundaries must support fractional slots'; end if;

  if (select count(*) from pg_constraint
      where conname in (
        'chore_definitions_cycle_weeks_check','chore_definitions_cycle_anchor_check',
        'chore_definitions_duration_minutes_check','chore_definitions_default_start_slot_check',
        'routine_revisions_auto_schedule_weekdays_check','routine_revisions_auto_schedule_label_check'
      )) <> 6
  then raise exception 'recurring schedule constraints missing'; end if;

  if has_function_privilege('authenticated','public.save_planner_state_core(jsonb,bigint)','EXECUTE')
    or has_function_privilege('anon','public.save_planner_state_core(jsonb,bigint)','EXECUTE')
  then raise exception 'private aggregate writer core is executable by an API role'; end if;

  if not (select prosecdef from pg_proc where oid='public.save_planner_state(jsonb,bigint)'::regprocedure)
    or (select proconfig from pg_proc where oid='public.save_planner_state(jsonb,bigint)'::regprocedure)
      is distinct from array['search_path=pg_catalog, public']
  then raise exception 'recurring schedule writer lacks SECURITY DEFINER or fixed search_path'; end if;
end $$;

rollback;
