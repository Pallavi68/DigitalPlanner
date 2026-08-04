# Daily Planner Acceptance Fixes — Implementation Orchestration

> **Spec ID:** `DAILY-PLANNER-ACCEPTANCE-FIXES-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** Owner acceptance feedback from 2026-08-04 and [`prd.md`](prd.md)
> **Status:** [`DAILY_PLANNER_ACCEPTANCE_FIXES_STATUS.md`](DAILY_PLANNER_ACCEPTANCE_FIXES_STATUS.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md)

## 1. Objective and boundaries

Plan-and-run a focused repair of Daily Planner cloud persistence and accepted scheduling behavior: reliable uncheck persistence, three individually timed evening actions with no left-page Wind-down section, deletable per-day automatic blocks, `Movement` checklist wording with `Gym` schedule wording, and persisted notes on Time Alignment blocks. Weekly/monthly agenda work, standalone chore/to-do pages, deployment, and Bingo remain excluded.

## 2. Repository and architecture baseline

React 18/TypeScript/Vite uses aggregate `PlannerState`, Supabase RPC persistence, date-effective routine revisions, and fractional Time Alignment slots in the frontend. The live schema currently stores integer slots, which can reject short fractional blocks and fail the entire aggregate save. A follow-up additive migration must preserve RLS and the aggregate transaction boundary.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary integrator | Tier A | Current Codex model, high effort | Diagnosis, contracts, SQL, UI, tests, status, remote gate | All scoped files; sequential only |

No subagents: persistence, contracts, scheduling, and UI share the same state model and must remain sequential.

## 4. Dependency graph

```text
diagnose sync/schema mismatch
          ↓
state + SQL contracts → scheduling semantics → block-detail UI
          ↓                    ↓                  ↓
       unit/contract tests + typecheck/build + browser QA
          ↓
isolated migration dry run → approved remote apply → live round trip
```

## 5. Phase plan

### P1 — Contracts and durable persistence

Sequential. Add fractional persisted slots, block notes, and per-day suppressed automatic block IDs. Update backend normalization and regression tests. Gate: typecheck and unit tests pass; SQL static contract is complete.

### P2 — Accepted Daily Planner behavior

Sequential. Remove the left Wind-down surface; materialize Vitamins 11:00–11:05, Clean down 11:10–11:20, and Night-time skincare 11:30–11:40; rename the checklist source to Movement while retaining Gym auto labels; make explicit automatic-block deletion durable; add accessible click-to-edit block notes rendered in smaller grey type. Gate: focused tests and browser interaction checks pass.

### P3 — Verification and live repair

Run typecheck, all tests, build, focused browser checks, and read-only review. Use an isolated migration set that excludes Bingo; dry-run before requesting/applying remote schema changes. Gate: no critical/high findings, remote save/uncheck/reload round trip passes.

## 6. Parallelization rules

No concurrent writes. `types.ts`, `PlannerContext.tsx`, storage migration, RPC contracts, and SQL are shared merge points. Bingo files and migration remain untouched and unapplied.

## 7. Quality and safety gates

| Acceptance criterion | Evidence |
|---|---|
| Uncheck survives refresh | backend round-trip test and live browser reload |
| Fractional short blocks save | SQL numeric slots plus contract/round-trip coverage |
| No left Wind-down section | Daily Page browser/static assertion |
| Three evening actions at exact times | recurrence tests and browser inspection |
| Deleted auto block stays deleted for that day | suppression regression and reload test |
| Movement/Gym wording | date-effective migration and recurrence test |
| Notes persist and remain subordinate visually | contract test, accessible modal test, browser check |
| Bingo excluded | isolated migration dry run lists only the new approved migration |

## 8. Session continuity

Canonical status is `DAILY_PLANNER_ACCEPTANCE_FIXES_STATUS.md`; repository summary remains `PROJECT_STATUS.md`. Restart from `AGENTS.md`, this orchestration file, status, owner feedback, current code, then database migration evidence. A session is incomplete until local gates pass and live verification is either passed or precisely blocked.

## 9. Exact kickoff/resume prompt

> Resume `DAILY-PLANNER-ACCEPTANCE-FIXES-V1`. Read `AGENTS.md`, `daily-planner-acceptance-fixes-orchestration.md`, `DAILY_PLANNER_ACCEPTANCE_FIXES_STATUS.md`, `PROJECT_STATUS.md`, `decision-list.md`, and the current implementation. Continue at the first incomplete gate, preserve all uncommitted backend/Bingo work, keep Bingo unapplied, run relevant checks, and update status before stopping.
