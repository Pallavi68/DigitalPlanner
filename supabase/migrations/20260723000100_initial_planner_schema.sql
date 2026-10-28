begin;

create extension if not exists pgcrypto;

create table public.planner_profiles (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  schema_version integer not null default 1 check (schema_version > 0),
  setup_complete boolean not null default false,
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  client_edited_at bigint not null default 0 check (client_edited_at >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_definitions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  since date not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  primary key (owner_id, id)
);

create table public.routine_revisions (
  owner_id uuid not null,
  routine_id text not null,
  effective_from date not null,
  label text not null check (length(label) between 1 and 500),
  period text not null check (period in ('AM', 'PM', 'auto')),
  duration_minutes integer not null check (duration_minutes between 0 and 1440),
  default_start_slot integer check (default_start_slot between 0 and 47),
  sort_order integer not null check (sort_order >= 0),
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (owner_id, routine_id, effective_from),
  foreign key (owner_id, routine_id) references public.routine_definitions(owner_id, id) on delete cascade
);

create table public.daily_routine_instances (
  owner_id uuid not null,
  day date not null,
  id text not null check (length(id) between 1 and 240),
  source_routine_id text not null,
  revision_effective_from date,
  label text not null check (length(label) between 1 and 500),
  period text not null check (period in ('AM', 'PM')),
  duration_minutes integer not null check (duration_minutes between 0 and 1440),
  default_start_slot integer check (default_start_slot between 0 and 47),
  sort_order integer not null check (sort_order >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, day, id),
  unique (owner_id, day, source_routine_id),
  foreign key (owner_id, source_routine_id) references public.routine_definitions(owner_id, id) on delete restrict
);

create table public.daily_todos (
  owner_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  id text not null check (length(id) between 1 and 240),
  position integer not null check (position >= 0),
  text text not null default '' check (length(text) <= 10000),
  completed boolean not null default false,
  completed_at timestamptz,
  source_ref_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, day, id),
  unique (owner_id, day, position)
);

create table public.wind_down_days (
  owner_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  tomorrow_plan text not null default '' check (length(tomorrow_plan) <= 20000),
  bedtime text not null default '' check (length(bedtime) <= 100),
  updated_at timestamptz not null default now(),
  primary key (owner_id, day)
);

create table public.wind_down_items (
  owner_id uuid not null,
  day date not null,
  id text not null check (length(id) between 1 and 240),
  position integer not null check (position >= 0),
  label text not null check (length(label) between 1 and 1000),
  completed boolean not null default false,
  completed_at timestamptz,
  primary key (owner_id, day, id),
  unique (owner_id, day, position),
  foreign key (owner_id, day) references public.wind_down_days(owner_id, day) on delete cascade
);

create table public.time_blocks (
  owner_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  id text not null check (length(id) between 1 and 240),
  start_slot integer not null check (start_slot between 0 and 47),
  end_slot integer not null check (end_slot between 1 and 48),
  label text not null check (length(label) between 1 and 1000),
  tag text not null check (tag in ('goodDay', 'todo', 'routine', 'chore', 'fixed', 'manual')),
  fixed boolean not null default false,
  source_ref_id text,
  completed boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (owner_id, day, id),
  check (end_slot > start_slot)
);

create table public.chore_definitions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  label text not null check (length(label) between 1 and 1000),
  category text not null check (category in ('Workout','Moneymaker','Walk','Chores','Self-care','Finance','Social','Other')),
  weekday integer check (weekday between 0 and 6),
  since date not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create table public.chore_occurrences (
  owner_id uuid not null,
  chore_id text not null,
  scheduled_date date not null,
  mark text not null default 'blank' check (mark in ('blank', 'check', 'cross')),
  completed_at timestamptz,
  actual_completion_date date,
  updated_at timestamptz not null default now(),
  primary key (owner_id, chore_id, scheduled_date),
  foreign key (owner_id, chore_id) references public.chore_definitions(owner_id, id) on delete restrict,
  check (
    (mark = 'check' and actual_completion_date is not null)
    or (mark <> 'check' and actual_completion_date is null)
  )
);

create table public.legacy_imports (
  owner_id uuid not null references auth.users(id) on delete cascade,
  import_key text not null check (length(import_key) between 1 and 200),
  source_version integer,
  imported_at timestamptz not null default now(),
  primary key (owner_id, import_key)
);

create index routine_revisions_lookup_idx on public.routine_revisions(owner_id, routine_id, effective_from desc);
create index daily_routines_day_idx on public.daily_routine_instances(owner_id, day);
create index daily_todos_day_idx on public.daily_todos(owner_id, day, position);
create index time_blocks_day_idx on public.time_blocks(owner_id, day, start_slot);
create index chore_occurrences_day_idx on public.chore_occurrences(owner_id, scheduled_date);

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger planner_profiles_touch before update on public.planner_profiles
for each row execute function public.touch_updated_at();
create trigger daily_routine_instances_touch before update on public.daily_routine_instances
for each row execute function public.touch_updated_at();
create trigger daily_todos_touch before update on public.daily_todos
for each row execute function public.touch_updated_at();
create trigger wind_down_days_touch before update on public.wind_down_days
for each row execute function public.touch_updated_at();
create trigger time_blocks_touch before update on public.time_blocks
for each row execute function public.touch_updated_at();
create trigger chore_definitions_touch before update on public.chore_definitions
for each row execute function public.touch_updated_at();
create trigger chore_occurrences_touch before update on public.chore_occurrences
for each row execute function public.touch_updated_at();

create function public.planner_today(target_owner uuid) returns date
language sql stable
set search_path = pg_catalog, public
as $$
  select (now() at time zone coalesce(
    (select z.name from public.planner_profiles p
      join pg_catalog.pg_timezone_names z on z.name=nullif(p.preferences->>'timeZone','')
      where p.owner_id=target_owner),
    'Asia/Kolkata'
  ))::date
$$;

create function public.protect_historical_routine_snapshot() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
begin
  if old.day < public.planner_today(old.owner_id) and (
    new.owner_id is distinct from old.owner_id or
    new.day is distinct from old.day or
    new.id is distinct from old.id or
    new.source_routine_id is distinct from old.source_routine_id or
    new.revision_effective_from is distinct from old.revision_effective_from or
    new.label is distinct from old.label or
    new.period is distinct from old.period or
    new.duration_minutes is distinct from old.duration_minutes or
    new.default_start_slot is distinct from old.default_start_slot or
    new.sort_order is distinct from old.sort_order
  ) then
    raise exception 'historical routine snapshot fields are immutable';
  end if;
  return new;
end;
$$;

create trigger protect_historical_routine_snapshot
before update on public.daily_routine_instances
for each row execute function public.protect_historical_routine_snapshot();

create function public.sync_linked_completion() returns trigger
language plpgsql set search_path = pg_catalog, public as $$
declare done boolean := new.completed;
declare done_at timestamptz := case when done then coalesce(new.completed_at, now()) end;
declare linked_id text;
begin
  if tg_op = 'UPDATE' and new.completed is not distinct from old.completed then return new; end if;
  if pg_trigger_depth() > 1 then return new; end if;

  if tg_table_name = 'time_blocks' then
    linked_id := new.source_ref_id;
    if linked_id is null then return new; end if;
    update public.daily_routine_instances set completed=done, completed_at=done_at
      where owner_id=new.owner_id and day=new.day and id=linked_id;
    update public.daily_todos set completed=done, completed_at=done_at
      where owner_id=new.owner_id and day=new.day and id=linked_id;
  else
    linked_id := new.id;
  end if;

  update public.time_blocks set completed=done, completed_at=done_at
    where owner_id=new.owner_id and day=new.day and source_ref_id=linked_id
      and completed is distinct from done;
  return new;
end;
$$;

create trigger routine_linked_completion after insert or update of completed
on public.daily_routine_instances for each row execute function public.sync_linked_completion();
create trigger todo_linked_completion after insert or update of completed
on public.daily_todos for each row execute function public.sync_linked_completion();
create trigger block_linked_completion after insert or update of completed
on public.time_blocks for each row execute function public.sync_linked_completion();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'planner_profiles','routine_definitions','routine_revisions','daily_routine_instances',
    'daily_todos','wind_down_days','wind_down_items','time_blocks','chore_definitions',
    'chore_occurrences','legacy_imports'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format(
      'create policy owner_all on public.%I for all to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)',
      table_name
    );
  end loop;
end $$;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.protect_historical_routine_snapshot() from public, anon, authenticated;
revoke all on function public.sync_linked_completion() from public, anon, authenticated;
revoke all on function public.planner_today(uuid) from public, anon, authenticated;

commit;
