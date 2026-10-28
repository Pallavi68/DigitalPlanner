# Daily Planner Production Launch — Resume Handoff

> Last updated: 2026-08-06
> Branch: `release/daily-planner-v1`
> Production: `https://digital-planner-plum.vercel.app`

## Resume here

The Daily Planner is deployed and usable in production. Do not redo deployment or Auth setup.

The exact next action is the final fresh-session Realtime test:

1. Hard-refresh laptop and phone; sign in again if requested.
2. Confirm both devices show `Synced` on the same date.
3. Edit one test To Do on the laptop and wait for `Synced`.
4. Do not refresh the phone; observe whether it updates within 15 seconds.
5. Repeat phone-to-laptop if the first direction passes.

If that passes, continue with the live checklist in `supabase/README.md`: offline/reconnect/retry/conflict behavior, yesterday/today/future historical guards, recurring Week 1/Week 2 materialization and colors, linked completion, reopen deduplication, and two-device convergence.

## Completed production work

* Pushed release baseline: `8c2c6c8 Prepare Daily Planner production release`.
* Created Vercel project `digital-planner` and deployed the frontend from planner-only source without local credentials.
* Configured Vercel production variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from ignored `frontend/.env.local` without printing their values.
* Configured Supabase Auth Site URL and redirect wildcard for the permanent Vercel URL; retained `http://localhost:5173/**`.
* Verified magic-link login on laptop and phone, production save/reload persistence, and cross-device persistence after refresh.
* Diagnosed missing live updates: the frontend subscribed to `planner_profiles`, but the table was absent from `supabase_realtime`.
* Added and applied planner-only migration `20260805000100_enable_planner_realtime.sql`; the isolated dry run listed only that migration. Post-apply dry run is clean and linked schema lint reports no errors.
* Diagnosed subsequent laptop `Sync failed`: tooltip was `InvalidJWTToken: Token has expired 1478 seconds ago`.
* Updated the frontend to refresh an expired/nearly expired Supabase session before planner load/save and deployed that fix to the permanent alias.
* Token-refresh fix verification: typecheck passed, 9 test files/47 tests passed, and production build passed (107 modules).

## Protected uncommitted launch work

Do not lose or overwrite:

* `frontend/src/backend/auth.ts` — explicit session-expiry/refresh check.
* `frontend/src/backend/plannerBackend.ts` — planner load/save uses refreshed authenticated user.
* `supabase/migrations/20260805000100_enable_planner_realtime.sql` — already applied remotely but not committed.
* `supabase/tests/schema_contract.sql` — publication regression assertion.
* `frontend/.gitignore` — Vercel CLI ensured local environment/OIDC files remain ignored; review this focused diff before commit.
* `PROJECT_STATUS.md` and this handoff.

## Remaining release administration

* After acceptance, review the focused launch diff and run typecheck, tests, build, SQL checks, and sensitive-data scan.
* Request explicit approval before Git staging, commit, or push.
* Vercel Git integration is not connected. `vercel git connect` failed because the Vercel account lacks a GitHub Login Connection. Add that connection in Vercel, then connect `https://github.com/Pallavi68/DigitalPlanner` and configure the intended production branch.
* Do not expose or commit `frontend/.env.local`, Vercel OIDC credentials, Supabase keys, or `.vercel/`.
