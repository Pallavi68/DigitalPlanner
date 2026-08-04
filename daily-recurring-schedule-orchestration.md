# Daily Recurring Schedule — Implementation Orchestration

> **Spec ID:** `DAILY-RECURRING-SCHEDULE-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** [`planner-schedule-seed.md`](planner-schedule-seed.md), steps 1–4 approved by the owner on 2026-08-03
> **Status:** [`DAILY_RECURRING_SCHEDULE_STATUS.md`](DAILY_RECURRING_SCHEDULE_STATUS.md)
> **Handoff:** [`DAILY_RECURRING_SCHEDULE_HANDOFF.md`](DAILY_RECURRING_SCHEDULE_HANDOFF.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md)

## 1. Objective and boundaries

Plan-and-run implementation of the approved repeating two-week chore pattern, daily movement/Gym behavior, automatic Gym and wind-down timeline placement, stable completion linkage, source colors, and Supabase persistence through the existing aggregate planner RPC boundary.

In scope: recurrence/domain rules, seed data, daily materialization, deduplication, blue Successful Day/Gym blocks, purple chore blocks, aggregate Supabase serialization, migrations/contracts where required, unit/contract tests, and status documentation.

Out of scope: production deployment, applying a new migration remotely, the paused Bingo implementation/migration, the full editable Two-Week Habit Planner UI, intelligent scheduling, calendar-capacity UI, and arbitrary chore-time editing. Untimed chores surface for manual placement.

## 2. Repository and architecture baseline

* React 18, TypeScript, Vite, Vitest frontend under `frontend/`.
* `PlannerContext` owns aggregate planner state; `save_planner_state` and `get_planner_state` map it to normalized forced-RLS Supabase tables.
* Daily routines already use date-effective definitions/snapshots and stable links to Time Alignment blocks.
* Chore definitions/occurrences exist in the schema, but two-week cadence, default timing, daily occurrence materialization, and daily-page UI are missing.
* Existing uncommitted Supabase/backend and paused Bingo work is protected. The Bingo migration remains unapplied.
* Architecture decision for this feature: deterministic client materialization from persisted definitions, saved through the existing transactional aggregate RPC. Stable occurrence IDs are derived from chore definition and date; reopening a date is idempotent.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary integrator | Tier A | Current Codex, high effort | Contracts, integration, UI, verification, fixes | Shared frontend integration files and status docs |
| Recurrence implementation agent | Tier B | Runtime-selected, medium effort | Deterministic two-week recurrence/materialization module and unit tests | New recurrence module/test files only |
| Supabase implementation agent | Tier A | Runtime-selected, high effort | New planner migration/schema contract changes | New migration and planner SQL test changes only |
| Independent QA agent | Tier A | Runtime-selected, high effort | Read-only compliance, integrity, UX/security review | None |

## 4. Dependency graph

```text
P0 inspect/protect baseline
  -> P1 shared TypeScript contract
      -> P2A recurrence engine/tests ----\
      -> P2B Supabase migration/tests ----> P3 PlannerContext + Daily Page + colors
                                             -> P4 full verification
                                                -> P5 independent QA
                                                   -> P6 fixes/reverification/status
```

## 5. Phase plan

### P0 — Baseline and protection

Sequential. Read sources of truth, inspect status/history/working tree, record protected files, and establish artifacts. Gate: no source mutation before architecture and ownership are explicit.

### P1 — Shared contract

Sequential, primary-owned. Extend planner types with two-week cadence metadata, occurrence identity, optional timing/auto-schedule fields, and source linkage while keeping legacy-state migration safe. Gate: typecheck passes or expected downstream failures are bounded and documented.

### P2A — Recurrence engine

Parallel after P1. Implement pure deterministic helpers for cycle-week calculation, applicable chore selection, occurrence IDs, daily chore occurrence construction, and deduplicated auto-block construction. Tests cover dates before/at/after the 2026-08-10 anchor, alternate Sunday/Thursday chores, daily movement, Gym weekdays/times, wind-down, and idempotency.

### P2B — Supabase persistence

Parallel after P1. Add a new forward-only planner migration if normalized columns/tables are required, update planner SQL contract tests, preserve forced RLS, and do not change/apply the Bingo migration. Gate: static SQL contract and repository migration ordering pass; local reset only if available and non-destructive to approved remote state.

### P3 — Integration

Sequential, primary-owned. Seed approved definitions, materialize daily occurrences in `PlannerContext`, render chores on the daily page, support drag/manual placement and linked completion, auto-place Gym/wind-down, normalize backend load/save, and update source colors. Gate: feature unit/contract tests, typecheck, and existing tests pass.

### P4 — Verification

Sequential. Run typecheck, full tests, build, relevant SQL checks, and browser verification of representative Week 1/Week 2 dates, deduplication, auto-blocks, manual chore drag, colors, and completion linkage.

### P5 — Independent QA

Read-only agent review for acceptance compliance, data durability, recurrence/date correctness, duplication, RLS/RPC safety, legacy migration, accessibility, regressions, and paused-Bingo isolation. Gate: no unresolved critical/high findings.

### P6 — Fixes and handoff

Primary fixes findings sequentially, reruns affected gates, updates `PROJECT_STATUS.md` and feature status. No commit/push/deployment without separate approval.

## 6. Parallelization rules

* Only new recurrence module/tests and new SQL migration/tests may be written in parallel.
* `types.ts`, `PlannerContext.tsx`, `App.tsx`, backend normalizers, seed data, shared CSS/tokens, and status documents remain primary-owned.
* No agent may edit, apply, stage, or delete `20260727000100_vision_action_bingo.sql`.
* Collisions stop the affected workstream and are resequenced through the primary.

## 7. Quality and safety gates

* Correct two-week anchor and alternating chores: pure date tests.
* Gym M/T/Th/F at 9:30–12:00, daily movement retained: unit and integration tests.
* Wind-down daily 23:00–00:00: boundary representation test within the existing 8 AM–2 AM slot model.
* No duplicate occurrences/blocks: repeated materialization test.
* Stable completion linkage and historical data: context/domain tests and backend round-trip contracts.
* Blue Successful Day/Gym and purple chores: token assertions plus browser inspection.
* Supabase persistence/RLS: schema contract and RPC mapping review/tests.
* Legacy planner state remains loadable: migration/contract regression tests.
* Paused Bingo remains isolated and its migration unapplied.

## 8. Session continuity

Canonical status: `DAILY_RECURRING_SCHEDULE_STATUS.md`. Update after every phase and before an incomplete handoff. Resume by reading `AGENTS.md`, the schedule seed, this orchestration file, feature status, `PROJECT_STATUS.md`, backend status, then inspect the actual working tree and tests.

Completion requires all steps 1–4 implemented, relevant checks passing, no critical/high QA findings, and documentation updated. Deployment remains a separately authorized follow-up.

## 9. Exact kickoff/resume prompt

```text
Resume DAILY-RECURRING-SCHEDULE-V1 in the repository root. Read AGENTS.md, planner-schedule-seed.md, daily-recurring-schedule-orchestration.md, DAILY_RECURRING_SCHEDULE_STATUS.md, PROJECT_STATUS.md, and BACKEND_IMPLEMENTATION_STATUS.md. Inspect repository evidence and continue from the first incomplete gate. Preserve all uncommitted backend/Bingo work, do not apply the Bingo migration, delegate only non-overlapping approved workstreams, run the recorded gates, and maintain the feature status file.
```
