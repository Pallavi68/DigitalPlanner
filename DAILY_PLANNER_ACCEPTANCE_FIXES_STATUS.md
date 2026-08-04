# Daily Planner Acceptance Fixes — Implementation Status

> **Spec ID:** `DAILY-PLANNER-ACCEPTANCE-FIXES-V1`
> **Specification:** Owner acceptance feedback from 2026-08-04
> **Orchestration:** [`daily-planner-acceptance-fixes-orchestration.md`](daily-planner-acceptance-fixes-orchestration.md)
> **Last updated:** 2026-08-04

## Current phase

P1–P3 implementation and remote schema gates are complete. Awaiting owner-authenticated browser round-trip acceptance.

## Completed gates and evidence

* Re-read project product/design/status sources and inspected the current Daily Page, recurrence engine, aggregate persistence, backend normalizer, and live migration history.
* Identified a concrete aggregate-save failure path: frontend short blocks use fractional slot values while `time_blocks.start_slot/end_slot` and the save RPC cast them to integers. One rejected block can produce Sync failed and make a local uncheck revert after refresh.
* Confirmed auto blocks regenerate after deletion because no per-day suppression state exists.
* Confirmed the current wind-down model creates one aggregate block and a separate left-page section, contrary to clarified behavior.
* Changed live `time_blocks` boundaries to numeric fractional slots, added persisted block notes and per-day automatic-block suppression, and preserved the authenticated aggregate RPC/RLS boundary.
* Removed the left-page Wind-down presentation and replaced the aggregate block with Mobility 11:00–11:15 PM, Vitamins 11:15–11:20 PM, Clean down 11:20–11:30 PM, and Night-time skincare 11:30–11:40 PM.
* Movement is the Successful Day wording; Gym remains the scheduled label on configured weekdays.
* Automatic Gym/evening blocks can be removed for one date without regeneration; Time Alignment blocks open an accessible notes editor and render notes as subordinate grey text.
* Note lines using `- [ ] item` or `[ ] item` render as interactive checkboxes; checking rewrites the persisted note to `[x]` and therefore round-trips through the existing note field.
* Every Time Alignment block now retains a visible pencil control so its details dialog can be reopened after notes or checkboxes have been added; label click remains supported.
* Isolated Supabase dry run listed only `20260804000100_daily_acceptance_fixes.sql`; Bingo was absent. Migration application passed, follow-up dry run reported up to date, and live schema lint found no errors.
* Owner screenshot exposed the exact remaining save error: `canceling statement due to statement timeout`. Added a function-scoped 30-second timeout to `save_planner_state` per Supabase guidance; isolated dry run/application passed and retry confirms remote up to date.
* Follow-up screenshot exposed intermittent `canceling statement due to lock timeout` during rapid note/checkbox edits. Root cause was concurrent aggregate saves sharing the same planner-row lock. PlannerContext now permits one save at a time and coalesces edits made in flight into the next serialized save.

## Active assignments and exclusive ownership

Primary agent owns all scoped work sequentially; no delegated writers.

## Decisions and ADRs

* Keep 30-minute grid indexing while permitting fractional numeric slots for exact short durations.
* Persist per-day suppression of default auto blocks; deletion affects only that date.
* Preserve hidden wind-down item completion data as the source for three schedule blocks; remove only the left-page presentation.

## Checks run

* `npm run typecheck` — passed.
* `npm test` — passed: 9 files, 47 tests.
* `npm run build` — passed: 133 modules; existing non-failing >500 kB warning remains.
* Isolated linked Supabase dry run — passed; exactly one approved migration listed.
* Remote migration application — passed.
* Post-apply dry run — remote database up to date.
* `supabase db lint --linked --level warning` — passed with no schema errors.

## Blockers / authority needed

Owner-session browser verification is required for the real save/uncheck/reload path. Bingo remains excluded and unapplied.

## Next exact action

Owner refreshes the running site, uses Retry if an old failure remains, then verifies sync, uncheck/reload, exact evening blocks, per-day deletion persistence, Movement/Gym wording, and note persistence.
