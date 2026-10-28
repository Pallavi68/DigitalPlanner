begin;

create table public.running_todos (
  owner_id uuid not null references auth.users(id) on delete cascade,
  id text not null check (length(id) between 1 and 240),
  text text not null check (length(text) between 1 and 10000),
  completed boolean not null default false,
  list_kind text not null check (list_kind in ('short', 'long')),
  note text check (length(note) <= 50000),
  sub_steps jsonb not null default '[]'::jsonb check (jsonb_typeof(sub_steps) = 'array'),
  assigned_date date,
  captured_at_ms bigint not null check (captured_at_ms >= 0),
  source text not null check (source in ('ui', 'whatsapp', 'telegram')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, id)
);

create index running_todos_owner_list_idx
  on public.running_todos(owner_id, list_kind, completed, captured_at_ms);
create index running_todos_assigned_date_idx
  on public.running_todos(owner_id, assigned_date) where assigned_date is not null;

create trigger running_todos_touch before update on public.running_todos
for each row execute function public.touch_updated_at();

alter table public.running_todos enable row level security;
alter table public.running_todos force row level security;
create policy owner_all on public.running_todos
for all to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

revoke all on public.running_todos from anon;
grant select, insert, update, delete on public.running_todos to authenticated;

commit;
