# Supabase backend

The migrations create the owner-scoped normalized store for `DIGITAL-PLANNER-SUPABASE-V1`.
Apply them in filename order with the Supabase CLI. The browser uses only an authenticated
session plus the project URL and publishable/anon key; never expose a service-role key.

RPC contract:

* `get_planner_state()` returns normalized arrays and profile metadata for `auth.uid()`.
  Its `runningTodos` array contains top-level short/long list items; `dailyTodos`
  remains the separate date-scoped numbered list.
* `save_planner_state(payload, expected_edited_at)` transactionally maps the current
  `PlannerState`; the expected edit value is an optimistic concurrency gate.
* `import_legacy_planner_state(payload, import_key)` is idempotent for a user/key and
  refuses to run if any cloud planner already exists. Keep the local backup until the
  user has verified the import.
* `materialize_daily_routine(target_day)` inserts the applicable date-effective
  revisions once and returns the stable daily snapshots. Automatic periods use
  the same shorter-column/tie-alternation rule as the frontend.

`daily_routine_instances` permits completion changes on historical rows while a trigger
prevents edits to their snapshotted identity/content fields. Materialization uses a
unique `(owner_id, day, source_routine_id)` key and `ON CONFLICT DO NOTHING`.

Local verification:

```sh
supabase db reset
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/schema_contract.sql
```

Runtime RLS, authentication, Realtime, and two-client sync still require an owner-created
Supabase project and should be verified before production deployment.

## Live planner verification checklist

For `DIGITAL-PLANNER-SUPABASE-V1`, verify:

1. `supabase migration list --linked` shows migrations `20260723000100` through
   `20260723000300` on both local and remote.
2. Start the frontend with its project URL and publishable key, request an email magic
   link, open it on the same origin, and confirm the planner loads as authenticated.
3. With legacy local data present, review and confirm the one-time import. Reload and
   confirm a second import is refused and the local backup remains available.
4. Create or edit a routine, toggle a daily routine and Daily To Do, edit Wind-down,
   and create/move a linked Time Alignment block. Reload after each group and confirm
   the authoritative state returns.
5. Open the same account in a second browser/device. Confirm changes invalidate and
   refetch within a few seconds in both directions.
6. Take one client offline, make a change, confirm it is labelled unsaved, reconnect,
   retry, and verify both clients converge without silently overwriting a newer edit.
7. Open yesterday, today, and a future date. Confirm past routine snapshot content is
   immutable, completion remains editable, and today/future revisions reconcile.
8. Confirm an unauthenticated client and a different authenticated identity cannot read
   or mutate the owner's planner rows or execute planner RPCs.
9. Verify the owner-local date boundary around midnight using the configured profile
   timezone.

Completion dates are interpreted as owner-local SQL `date` values. Historical guards
use `preferences.timeZone` only when it matches PostgreSQL's timezone catalog, and
otherwise default to `Asia/Kolkata` for the current single owner.
