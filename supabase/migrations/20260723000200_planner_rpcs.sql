begin;

create function public.materialize_daily_routine(target_day date)
returns setof public.daily_routine_instances
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare owner uuid := auth.uid();
begin
  if owner is null then raise exception 'authentication required' using errcode = '28000'; end if;

  insert into public.daily_routine_instances (
    owner_id, day, id, source_routine_id, revision_effective_from, label, period,
    duration_minutes, default_start_slot, sort_order, completed
  )
  select owner, target_day, 'routine_' || encode(digest(d.id || ':' || target_day::text, 'sha256'), 'hex'),
    d.id, r.effective_from, r.label,
    case when r.period = 'PM' then 'PM' else 'AM' end,
    r.duration_minutes, r.default_start_slot, r.sort_order, false
  from public.routine_definitions d
  cross join lateral (
    select rr.* from public.routine_revisions rr
    where rr.owner_id = owner and rr.routine_id = d.id and rr.effective_from <= target_day
    order by rr.effective_from desc limit 1
  ) r
  where d.owner_id = owner and d.since <= target_day and not r.archived
  on conflict (owner_id, day, source_routine_id) do nothing;

  return query select * from public.daily_routine_instances i
    where i.owner_id = owner and i.day = target_day order by i.sort_order, i.id;
end;
$$;

create function public.get_planner_state()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
declare owner uuid := auth.uid();
begin
if owner is null then raise exception 'authentication required' using errcode = '28000'; end if;
return jsonb_build_object(
  'profile', (select to_jsonb(p) - 'owner_id' from public.planner_profiles p where p.owner_id = owner),
  'routineDefinitions', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.id) from public.routine_definitions x where x.owner_id = owner), '[]'::jsonb),
  'routineRevisions', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.routine_id, x.effective_from) from public.routine_revisions x where x.owner_id = owner), '[]'::jsonb),
  'dailyRoutineInstances', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.day, x.sort_order) from public.daily_routine_instances x where x.owner_id = owner), '[]'::jsonb),
  'dailyTodos', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.day, x.position) from public.daily_todos x where x.owner_id = owner), '[]'::jsonb),
  'runningTodos', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.captured_at_ms, x.id) from public.running_todos x where x.owner_id = owner), '[]'::jsonb),
  'windDownDays', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.day) from public.wind_down_days x where x.owner_id = owner), '[]'::jsonb),
  'windDownItems', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.day, x.position) from public.wind_down_items x where x.owner_id = owner), '[]'::jsonb),
  'timeBlocks', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.day, x.start_slot) from public.time_blocks x where x.owner_id = owner), '[]'::jsonb),
  'choreDefinitions', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.id) from public.chore_definitions x where x.owner_id = owner), '[]'::jsonb),
  'choreOccurrences', coalesce((select jsonb_agg(to_jsonb(x) - 'owner_id' order by x.scheduled_date, x.chore_id) from public.chore_occurrences x where x.owner_id = owner), '[]'::jsonb)
);
end;
$$;

create function public.save_planner_state(payload jsonb, expected_edited_at bigint default null)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  owner uuid := auth.uid();
  incoming_edited_at bigint := coalesce((payload->>'lastEditedAt')::bigint, 0);
  current_edited_at bigint;
  rec jsonb;
  day_key text;
  day_value jsonb;
  item jsonb;
  pos integer;
begin
  if owner is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if jsonb_typeof(payload) <> 'object' then raise exception 'payload must be an object'; end if;

  select client_edited_at into current_edited_at from public.planner_profiles where owner_id = owner for update;
  if found and expected_edited_at is not null and current_edited_at <> expected_edited_at then
    raise exception 'planner state conflict' using errcode = '40001',
      detail = format('expected %s, current %s', expected_edited_at, current_edited_at);
  end if;

  insert into public.planner_profiles(owner_id, schema_version, setup_complete, preferences, client_edited_at)
  values (owner, greatest(coalesce((payload->>'version')::integer, 1), 1),
    coalesce((payload->>'setupComplete')::boolean, false), coalesce(payload->'preferences', '{}'::jsonb), incoming_edited_at)
  on conflict (owner_id) do update set schema_version=excluded.schema_version,
    setup_complete=excluded.setup_complete, preferences=excluded.preferences,
    client_edited_at=excluded.client_edited_at;

  for rec in select value from jsonb_array_elements(coalesce(payload->'routineHabits', '[]'::jsonb))
  loop
    insert into public.routine_definitions(owner_id,id,since,archived_at)
    values(owner,rec->>'id',(rec->>'since')::date,case when coalesce((rec->>'archived')::boolean,false) then now() end)
    on conflict(owner_id,id) do update set since=excluded.since, archived_at=excluded.archived_at;
    for item in select value from jsonb_array_elements(coalesce(rec->'revisions','[]'::jsonb))
    loop
      insert into public.routine_revisions(owner_id,routine_id,effective_from,label,period,duration_minutes,default_start_slot,sort_order,archived)
      values(owner,rec->>'id',(item->>'effectiveFrom')::date,item->>'label',item->>'period',
        coalesce((item->>'durationMinutes')::integer,0),(item->>'defaultStartSlot')::integer,
        coalesce((item->>'sortOrder')::integer,0),coalesce((item->>'archived')::boolean,false))
      on conflict(owner_id,routine_id,effective_from) do update set label=excluded.label,period=excluded.period,
        duration_minutes=excluded.duration_minutes,default_start_slot=excluded.default_start_slot,
        sort_order=excluded.sort_order,archived=excluded.archived;
    end loop;
  end loop;

  delete from public.running_todos x where x.owner_id=owner
    and not exists (
      select 1 from jsonb_array_elements(coalesce(payload->'todos','[]'::jsonb)) j
      where j->>'id'=x.id
    );
  for rec in select value from jsonb_array_elements(coalesce(payload->'todos','[]'::jsonb))
  loop
    insert into public.running_todos(
      owner_id,id,text,completed,list_kind,note,sub_steps,assigned_date,captured_at_ms,source,completed_at
    )
    values(
      owner,rec->>'id',rec->>'text',coalesce((rec->>'done')::boolean,false),rec->>'list',
      rec->>'note',coalesce(rec->'subSteps','[]'::jsonb),(rec->>'assignedDate')::date,
      coalesce((rec->>'createdAt')::bigint,0),coalesce(rec->>'source','ui'),
      case when coalesce((rec->>'done')::boolean,false) then now() end
    )
    on conflict(owner_id,id) do update set
      text=excluded.text,completed=excluded.completed,list_kind=excluded.list_kind,note=excluded.note,
      sub_steps=excluded.sub_steps,assigned_date=excluded.assigned_date,
      captured_at_ms=excluded.captured_at_ms,source=excluded.source,
      completed_at=case when excluded.completed then coalesce(running_todos.completed_at,now()) end;
  end loop;

  for day_key, day_value in select key,value from jsonb_each(coalesce(payload->'days','{}'::jsonb))
  loop
    delete from public.daily_todos x where x.owner_id=owner and x.day=day_key::date
      and not exists (select 1 from jsonb_array_elements(coalesce(day_value->'todos','[]'::jsonb)) j where j->>'id'=x.id);
    delete from public.time_blocks x where x.owner_id=owner and x.day=day_key::date
      and not exists (select 1 from jsonb_array_elements(coalesce(day_value->'blocks','[]'::jsonb)) j where j->>'id'=x.id);
    delete from public.wind_down_items x where x.owner_id=owner and x.day=day_key::date
      and not exists (select 1 from jsonb_array_elements(coalesce(day_value#>'{windDown,checklist}','[]'::jsonb)) j where j->>'id'=x.id);

    pos := 0;
    for item in select value from jsonb_array_elements(coalesce(day_value->'routineInstances','[]'::jsonb))
    loop
      insert into public.daily_routine_instances(owner_id,day,id,source_routine_id,label,period,duration_minutes,default_start_slot,sort_order,completed,completed_at)
      values(owner,day_key::date,item->>'id',item->>'sourceRoutineId',item->>'label',item->>'period',
        coalesce((item->>'durationMinutes')::integer,0),(item->>'defaultStartSlot')::integer,
        coalesce((item->>'sortOrder')::integer,pos),coalesce((item->>'done')::boolean,false),
        case when coalesce((item->>'done')::boolean,false) then now() end)
      on conflict(owner_id,day,id) do update set
        label=case when excluded.day >= public.planner_today(owner) then excluded.label else daily_routine_instances.label end,
        period=case when excluded.day >= public.planner_today(owner) then excluded.period else daily_routine_instances.period end,
        duration_minutes=case when excluded.day >= public.planner_today(owner) then excluded.duration_minutes else daily_routine_instances.duration_minutes end,
        default_start_slot=case when excluded.day >= public.planner_today(owner) then excluded.default_start_slot else daily_routine_instances.default_start_slot end,
        sort_order=case when excluded.day >= public.planner_today(owner) then excluded.sort_order else daily_routine_instances.sort_order end,
        completed=excluded.completed,
        completed_at=case when excluded.completed then coalesce(daily_routine_instances.completed_at,now()) end;
      pos := pos + 1;
    end loop;

    pos := 0;
    for item in select value from jsonb_array_elements(coalesce(day_value->'todos','[]'::jsonb))
    loop
      insert into public.daily_todos(owner_id,day,id,position,text,completed,completed_at,source_ref_id)
      values(owner,day_key::date,item->>'id',pos,coalesce(item->>'text',''),coalesce((item->>'done')::boolean,false),
        case when coalesce((item->>'done')::boolean,false) then now() end,item->>'sourceRefId')
      on conflict(owner_id,day,id) do update set position=excluded.position,text=excluded.text,completed=excluded.completed,
        completed_at=case when excluded.completed then coalesce(daily_todos.completed_at,now()) end,source_ref_id=excluded.source_ref_id;
      pos := pos + 1;
    end loop;

    insert into public.wind_down_days(owner_id,day,tomorrow_plan,bedtime)
    values(owner,day_key::date,coalesce(day_value#>>'{windDown,tomorrowPlan}',''),coalesce(day_value#>>'{windDown,bedtime}',''))
    on conflict(owner_id,day) do update set tomorrow_plan=excluded.tomorrow_plan,bedtime=excluded.bedtime;
    pos := 0;
    for item in select value from jsonb_array_elements(coalesce(day_value#>'{windDown,checklist}','[]'::jsonb))
    loop
      insert into public.wind_down_items(owner_id,day,id,position,label,completed,completed_at)
      values(owner,day_key::date,item->>'id',pos,item->>'label',coalesce((item->>'done')::boolean,false),
        case when coalesce((item->>'done')::boolean,false) then now() end)
      on conflict(owner_id,day,id) do update set position=excluded.position,label=excluded.label,completed=excluded.completed,
        completed_at=case when excluded.completed then coalesce(wind_down_items.completed_at,now()) end;
      pos := pos + 1;
    end loop;

    for item in select value from jsonb_array_elements(coalesce(day_value->'blocks','[]'::jsonb))
    loop
      insert into public.time_blocks(owner_id,day,id,start_slot,end_slot,label,tag,fixed,source_ref_id,completed,completed_at)
      values(owner,day_key::date,item->>'id',(item->>'startSlot')::integer,(item->>'endSlot')::integer,
        item->>'label',item->>'tag',coalesce((item->>'fixed')::boolean,false),item->>'sourceRefId',
        coalesce((item->>'completed')::boolean,false),case when coalesce((item->>'completed')::boolean,false) then now() end)
      on conflict(owner_id,day,id) do update set start_slot=excluded.start_slot,end_slot=excluded.end_slot,label=excluded.label,
        tag=excluded.tag,fixed=excluded.fixed,source_ref_id=excluded.source_ref_id,completed=excluded.completed,
        completed_at=case when excluded.completed then coalesce(time_blocks.completed_at,now()) end;
    end loop;
  end loop;

  for rec in select value from jsonb_array_elements(coalesce(payload->'habitRows','[]'::jsonb))
  loop
    insert into public.chore_definitions(owner_id,id,label,category,weekday,since,archived_at)
    values(owner,rec->>'id',rec->>'label',rec->>'category',(rec->>'weekday')::integer,(rec->>'since')::date,
      case when coalesce((rec->>'archived')::boolean,false) then now() end)
    on conflict(owner_id,id) do update set label=excluded.label,category=excluded.category,weekday=excluded.weekday,
      since=excluded.since,archived_at=excluded.archived_at;
  end loop;

  delete from public.chore_occurrences where owner_id=owner;
  for day_key, rec in select split_part(key,'|',1), jsonb_build_object('chore_id',split_part(key,'|',2),'mark',value)
    from jsonb_each_text(coalesce(payload->'gridMarks','{}'::jsonb))
  loop
    insert into public.chore_occurrences(owner_id,chore_id,scheduled_date,mark,completed_at,actual_completion_date)
    values(owner,rec->>'chore_id',day_key::date,rec->>'mark',
      case when rec->>'mark'='check' then now() end,case when rec->>'mark'='check' then day_key::date end)
    on conflict(owner_id,chore_id,scheduled_date) do update set mark=excluded.mark,
      completed_at=case when excluded.mark='check' then coalesce(chore_occurrences.completed_at,now()) end,
      actual_completion_date=excluded.actual_completion_date;
  end loop;

  -- A later completion may differ from its scheduled grid date. Entries absent
  -- from gridMarks are still imported as completed occurrences.
  for day_key, rec in
    select split_part(key,'|',1),
      jsonb_build_object(
        'chore_id',split_part(key,'|',2),
        'mark',value->>'mark',
        'actual_date',value->>'actualCompletionDate'
      )
    from jsonb_each(coalesce(payload->'choreCompletions','{}'::jsonb))
    where value->>'mark'='check' and nullif(value->>'actualCompletionDate','') is not null
  loop
    insert into public.chore_occurrences(
      owner_id,chore_id,scheduled_date,mark,completed_at,actual_completion_date
    )
    values(owner,rec->>'chore_id',day_key::date,'check',now(),(rec->>'actual_date')::date)
    on conflict(owner_id,chore_id,scheduled_date) do update set
      mark='check',completed_at=coalesce(chore_occurrences.completed_at,now()),
      actual_completion_date=excluded.actual_completion_date;
  end loop;

  return incoming_edited_at;
end;
$$;

create function public.import_legacy_planner_state(payload jsonb, import_key text)
returns bigint
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare owner uuid := auth.uid(); result bigint;
begin
  if owner is null then raise exception 'authentication required' using errcode = '28000'; end if;
  if import_key is null or length(import_key) not between 1 and 200 then raise exception 'invalid import key'; end if;
  perform 1 from public.legacy_imports where owner_id=owner and legacy_imports.import_key=$2;
  if found then return (select client_edited_at from public.planner_profiles where owner_id=owner); end if;
  if exists(select 1 from public.planner_profiles where owner_id=owner)
     or exists(select 1 from public.routine_definitions where owner_id=owner)
     or exists(select 1 from public.routine_revisions where owner_id=owner)
     or exists(select 1 from public.daily_routine_instances where owner_id=owner)
     or exists(select 1 from public.daily_todos where owner_id=owner)
     or exists(select 1 from public.running_todos where owner_id=owner)
     or exists(select 1 from public.wind_down_days where owner_id=owner)
     or exists(select 1 from public.wind_down_items where owner_id=owner)
     or exists(select 1 from public.time_blocks where owner_id=owner)
     or exists(select 1 from public.chore_definitions where owner_id=owner)
     or exists(select 1 from public.chore_occurrences where owner_id=owner)
     or exists(select 1 from public.legacy_imports where owner_id=owner)
  then raise exception 'legacy import refused: cloud planner data already exists' using errcode='23505'; end if;
  result := public.save_planner_state(payload, null);
  insert into public.legacy_imports(owner_id,import_key,source_version)
    values(owner,import_key,(payload->>'version')::integer);
  return result;
end;
$$;

revoke all on function public.materialize_daily_routine(date) from public, anon;
revoke all on function public.get_planner_state() from public, anon;
revoke all on function public.save_planner_state(jsonb,bigint) from public, anon;
revoke all on function public.import_legacy_planner_state(jsonb,text) from public, anon;
grant execute on function public.materialize_daily_routine(date) to authenticated;
grant execute on function public.get_planner_state() to authenticated;
grant execute on function public.save_planner_state(jsonb,bigint) to authenticated;
grant execute on function public.import_legacy_planner_state(jsonb,text) to authenticated;

commit;
