begin;

alter table public.chore_definitions
  add column cycle_weeks smallint[],
  add column cycle_anchor_date date,
  add column duration_minutes integer,
  add column default_start_slot integer,
  add column auto_schedule boolean not null default false,
  add constraint chore_definitions_cycle_weeks_check check (
    cycle_weeks is null
    or cycle_weeks = array[1]::smallint[]
    or cycle_weeks = array[2]::smallint[]
    or cycle_weeks = array[1, 2]::smallint[]
  ),
  add constraint chore_definitions_cycle_anchor_check check (
    cycle_weeks is null or cycle_anchor_date is not null
  ),
  add constraint chore_definitions_duration_minutes_check check (
    duration_minutes is null or duration_minutes between 0 and 1440
  ),
  add constraint chore_definitions_default_start_slot_check check (
    default_start_slot is null or default_start_slot between 0 and 47
  );

alter table public.routine_revisions
  add column auto_schedule_weekdays smallint[],
  add column auto_schedule_label text,
  add constraint routine_revisions_auto_schedule_weekdays_check check (
    auto_schedule_weekdays is null or (
      cardinality(auto_schedule_weekdays) <= 7
      and auto_schedule_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
      and array_position(auto_schedule_weekdays, null) is null
    )
  ),
  add constraint routine_revisions_auto_schedule_label_check check (
    auto_schedule_label is null or length(auto_schedule_label) between 1 and 1000
  );

-- Keep the previously reviewed aggregate writer intact as a private core. The
-- public wrapper below adds recurrence metadata in the same transaction.
alter function public.save_planner_state(jsonb, bigint)
  rename to save_planner_state_core;

revoke all on function public.save_planner_state_core(jsonb, bigint)
  from public, anon, authenticated;

create function public.save_planner_state(
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
  routine jsonb;
  revision jsonb;
  chore jsonb;
begin
  if owner is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be an object';
  end if;

  saved_edited_at := public.save_planner_state_core(payload, expected_edited_at);

  for routine in
    select value
    from jsonb_array_elements(
      case when jsonb_typeof(payload->'routineHabits') = 'array'
        then payload->'routineHabits' else '[]'::jsonb end
    )
  loop
    for revision in
      select value
      from jsonb_array_elements(
        case when jsonb_typeof(routine->'revisions') = 'array'
          then routine->'revisions' else '[]'::jsonb end
      )
    loop
      update public.routine_revisions
      set
        auto_schedule_weekdays = case
          when jsonb_typeof(revision->'autoScheduleWeekdays') = 'array' then
            array(
              select value::smallint
              from jsonb_array_elements_text(revision->'autoScheduleWeekdays')
            )
          else null
        end,
        auto_schedule_label = nullif(revision->>'autoScheduleLabel', '')
      where owner_id = owner
        and routine_id = routine->>'id'
        and effective_from = (revision->>'effectiveFrom')::date;
    end loop;
  end loop;

  for chore in
    select value
    from jsonb_array_elements(
      case when jsonb_typeof(payload->'habitRows') = 'array'
        then payload->'habitRows' else '[]'::jsonb end
    )
  loop
    update public.chore_definitions
    set
      cycle_weeks = case
        when jsonb_typeof(chore->'cycleWeeks') = 'array' then
          array(
            select value::smallint
            from jsonb_array_elements_text(chore->'cycleWeeks')
          )
        else null
      end,
      cycle_anchor_date = nullif(chore->>'cycleAnchorDate', '')::date,
      duration_minutes = nullif(chore->>'durationMinutes', '')::integer,
      default_start_slot = nullif(chore->>'defaultStartSlot', '')::integer,
      auto_schedule = coalesce(nullif(chore->>'autoSchedule', '')::boolean, false)
    where owner_id = owner and id = chore->>'id';
  end loop;

  return saved_edited_at;
end;
$$;

revoke all on function public.save_planner_state(jsonb, bigint)
  from public, anon;
grant execute on function public.save_planner_state(jsonb, bigint)
  to authenticated;

commit;
