begin;

alter table public.time_blocks
  alter column start_slot type numeric(8,4) using start_slot::numeric,
  alter column end_slot type numeric(8,4) using end_slot::numeric,
  add column note text check (note is null or length(note) <= 5000);

alter table public.wind_down_days
  add column suppressed_auto_block_ids text[] not null default '{}';

-- The legacy core casts time-block boundaries to integers. Give it a safe
-- integer-shaped copy, then restore exact fractional boundaries and new fields
-- in the same transaction after the core has persisted every existing entity.
create or replace function public.save_planner_state(
  payload jsonb,
  expected_edited_at bigint default null
)
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  owner uuid := auth.uid();
  saved_edited_at bigint;
  sanitized_payload jsonb := payload;
  routine jsonb;
  revision jsonb;
  chore jsonb;
  day_key text;
  day_value jsonb;
  item jsonb;
  sanitized_blocks jsonb;
begin
  if owner is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be an object';
  end if;

  for day_key, day_value in
    select key, value from jsonb_each(coalesce(payload->'days', '{}'::jsonb))
  loop
    sanitized_blocks := '[]'::jsonb;
    for item in
      select value from jsonb_array_elements(coalesce(day_value->'blocks', '[]'::jsonb))
    loop
      sanitized_blocks := sanitized_blocks || jsonb_build_array(
        jsonb_set(
          jsonb_set(item, '{startSlot}', to_jsonb(floor((item->>'startSlot')::numeric)::integer)),
          '{endSlot}', to_jsonb(ceil((item->>'endSlot')::numeric)::integer)
        )
      );
    end loop;
    sanitized_payload := jsonb_set(sanitized_payload, array['days', day_key, 'blocks'], sanitized_blocks, true);
  end loop;

  saved_edited_at := public.save_planner_state_core(sanitized_payload, expected_edited_at);

  for routine in
    select value from jsonb_array_elements(
      case when jsonb_typeof(payload->'routineHabits') = 'array' then payload->'routineHabits' else '[]'::jsonb end
    )
  loop
    for revision in
      select value from jsonb_array_elements(
        case when jsonb_typeof(routine->'revisions') = 'array' then routine->'revisions' else '[]'::jsonb end
      )
    loop
      update public.routine_revisions
      set
        auto_schedule_weekdays = case when jsonb_typeof(revision->'autoScheduleWeekdays') = 'array'
          then array(select value::smallint from jsonb_array_elements_text(revision->'autoScheduleWeekdays')) else null end,
        auto_schedule_label = nullif(revision->>'autoScheduleLabel', '')
      where owner_id = owner
        and routine_id = routine->>'id'
        and effective_from = (revision->>'effectiveFrom')::date;
    end loop;
  end loop;

  for chore in
    select value from jsonb_array_elements(
      case when jsonb_typeof(payload->'habitRows') = 'array' then payload->'habitRows' else '[]'::jsonb end
    )
  loop
    update public.chore_definitions
    set
      cycle_weeks = case when jsonb_typeof(chore->'cycleWeeks') = 'array'
        then array(select value::smallint from jsonb_array_elements_text(chore->'cycleWeeks')) else null end,
      cycle_anchor_date = nullif(chore->>'cycleAnchorDate', '')::date,
      duration_minutes = nullif(chore->>'durationMinutes', '')::integer,
      default_start_slot = nullif(chore->>'defaultStartSlot', '')::integer,
      auto_schedule = coalesce(nullif(chore->>'autoSchedule', '')::boolean, false)
    where owner_id = owner and id = chore->>'id';
  end loop;

  for day_key, day_value in
    select key, value from jsonb_each(coalesce(payload->'days', '{}'::jsonb))
  loop
    update public.wind_down_days
    set suppressed_auto_block_ids = case
      when jsonb_typeof(day_value->'suppressedAutoBlockIds') = 'array'
        then array(select value from jsonb_array_elements_text(day_value->'suppressedAutoBlockIds'))
      else '{}'::text[]
    end
    where owner_id = owner and day = day_key::date;

    for item in
      select value from jsonb_array_elements(coalesce(day_value->'blocks', '[]'::jsonb))
    loop
      update public.time_blocks
      set
        start_slot = (item->>'startSlot')::numeric,
        end_slot = (item->>'endSlot')::numeric,
        note = nullif(item->>'note', '')
      where owner_id = owner and day = day_key::date and id = item->>'id';
    end loop;
  end loop;

  return saved_edited_at;
end;
$$;

revoke all on function public.save_planner_state(jsonb, bigint) from public, anon;
grant execute on function public.save_planner_state(jsonb, bigint) to authenticated;

commit;
