begin;

-- RPCs are the sole mutation boundary. Every function derives its owner from
-- auth.uid(), rejects a missing identity, and has a fixed search_path.
alter function public.get_planner_state() security definer;
alter function public.save_planner_state(jsonb,bigint) security definer;
alter function public.import_legacy_planner_state(jsonb,text) security definer;

create or replace function public.materialize_daily_routine(target_day date)
returns setof public.daily_routine_instances
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner uuid := auth.uid();
  entry record;
  resolved_period text;
  am_count integer := 0;
  pm_count integer := 0;
  tie_goes_to_am boolean := true;
begin
  if owner is null then raise exception 'authentication required' using errcode = '28000'; end if;

  for entry in
    select d.id, r.effective_from, r.label, r.period, r.duration_minutes,
      r.default_start_slot, r.sort_order
    from public.routine_definitions d
    cross join lateral (
      select rr.* from public.routine_revisions rr
      where rr.owner_id=owner and rr.routine_id=d.id and rr.effective_from<=target_day
      order by rr.effective_from desc limit 1
    ) r
    where d.owner_id=owner and d.since<=target_day and not r.archived
    order by r.sort_order, d.id
  loop
    if entry.period <> 'auto' then
      resolved_period := entry.period;
    elsif am_count < pm_count then
      resolved_period := 'AM';
    elsif pm_count < am_count then
      resolved_period := 'PM';
    else
      resolved_period := case when tie_goes_to_am then 'AM' else 'PM' end;
      tie_goes_to_am := not tie_goes_to_am;
    end if;
    if resolved_period='AM' then am_count:=am_count+1; else pm_count:=pm_count+1; end if;

    insert into public.daily_routine_instances(
      owner_id,day,id,source_routine_id,revision_effective_from,label,period,
      duration_minutes,default_start_slot,sort_order,completed
    ) values(
      owner,target_day,'routine_' || target_day::text || '_' || entry.id,
      entry.id,entry.effective_from,entry.label,resolved_period,
      entry.duration_minutes,entry.default_start_slot,entry.sort_order,false
    )
    on conflict(owner_id,day,source_routine_id) do nothing;
  end loop;

  return query select * from public.daily_routine_instances i
    where i.owner_id=owner and i.day=target_day order by i.sort_order,i.id;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'planner_profiles','routine_definitions','routine_revisions','daily_routine_instances',
    'daily_todos','running_todos','wind_down_days','wind_down_items','time_blocks',
    'chore_definitions','chore_occurrences','legacy_imports'
  ] loop
    execute format('revoke insert, update, delete, truncate on table public.%I from authenticated, anon',table_name);
    execute format('grant select on table public.%I to authenticated',table_name);
  end loop;
end $$;

revoke usage, select, update on all sequences in schema public from authenticated, anon;
revoke all on function public.materialize_daily_routine(date) from public, anon;
grant execute on function public.materialize_daily_routine(date) to authenticated;

commit;
