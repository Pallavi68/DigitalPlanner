begin;

create table public.planner_documents (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision bigint not null,
  updated_at timestamptz not null default now()
);

alter table public.planner_documents enable row level security;
alter table public.planner_documents force row level security;

create policy planner_documents_owner_select on public.planner_documents
  for select to authenticated using (owner_id = (select auth.uid()));

create function public.get_planner_document()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select case when auth.uid() is null then null else (
    select jsonb_build_object(
      'state', payload,
      'revision', revision,
      'updated_at', updated_at
    )
    from public.planner_documents
    where owner_id = auth.uid()
  ) end;
$$;

create function public.save_planner_document(
  payload jsonb,
  expected_revision bigint default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
set statement_timeout = '8s'
as $$
declare
  owner uuid := auth.uid();
  current_revision bigint;
  incoming_revision bigint;
  saved_revision bigint;
  saved_at timestamptz;
begin
  if owner is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;
  if jsonb_typeof(payload) <> 'object' then
    raise exception 'payload must be an object' using errcode = '22023';
  end if;

  -- Serialize the initial insert as well as later updates. A row lock alone
  -- cannot protect two clients racing while the owner document is absent.
  perform pg_advisory_xact_lock(hashtextextended(owner::text, 0));

  select revision into current_revision
  from public.planner_documents
  where owner_id = owner
  for update;

  if found then
    if expected_revision is null or current_revision <> expected_revision then
      raise exception 'planner state conflict' using errcode = '40001',
        detail = format('expected %s, current %s', expected_revision, current_revision);
    end if;
  elsif expected_revision is not null then
    raise exception 'planner state conflict' using errcode = '40001',
      detail = format('expected %s, current document is absent', expected_revision);
  end if;

  incoming_revision := coalesce((payload->>'lastEditedAt')::bigint, 0);
  saved_revision := greatest(incoming_revision, coalesce(current_revision + 1, incoming_revision));

  insert into public.planner_documents(owner_id, payload, revision)
  values(owner, payload, saved_revision)
  on conflict(owner_id) do update set
    payload = excluded.payload,
    revision = excluded.revision,
    updated_at = now()
  returning revision, updated_at into saved_revision, saved_at;

  return jsonb_build_object(
    'revision', saved_revision,
    'updated_at', saved_at,
    'idempotent_replay', false
  );
end;
$$;

revoke all on table public.planner_documents from public, anon, authenticated;
grant select on table public.planner_documents to authenticated;
revoke all on function public.get_planner_document() from public, anon;
revoke all on function public.save_planner_document(jsonb, bigint) from public, anon;
grant execute on function public.get_planner_document() to authenticated;
grant execute on function public.save_planner_document(jsonb, bigint) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'planner_documents'
  ) then
    alter publication supabase_realtime add table public.planner_documents;
  end if;
end $$;

commit;
