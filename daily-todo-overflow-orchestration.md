# Daily To-Do Overflow — Implementation Orchestration

> **Spec ID:** `DAILY-TODO-OVERFLOW-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** `prd.md` FR-3 and the owner's 2026-08-12 overflow-control request
> **Status:** `PROJECT_STATUS.md`
> **Repository instructions:** `AGENTS.md` and `CLAUDE.md`

## 1. Objective and boundaries

Plan-and-run a focused Daily To Dos UX completion: retain the initial 01–15 paper rows, allow unlimited persisted rows, keep rows after 15 collapsed by default, and provide an explicit button that adds and reveals an overflow row. Navigation, persistence contracts, scheduling, and unrelated Bingo work are excluded.

## 2. Repository and architecture baseline

The React/TypeScript Daily Page already routes `/` and invalid URLs to the device-local date from `todayISO()`. `DayState.todos` already grows dynamically and persists through the existing planner store/backend. `ToDos.tsx` renders every row and supports Enter-to-append, but has no visible overflow control or collapsed state.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary implementation and integration | Tier A | Current Codex model, high effort | UI behavior, styling, verification, status | `frontend/src/pages/daily/ToDos.tsx`, `frontend/src/index.css`, this document, `PROJECT_STATUS.md` |

No subagent is assigned: the UI behavior and integration share one component, and unrelated uncommitted work is present.

## 4. Dependency graph

`inspect existing behavior → implement overflow controls → type/test/build → browser check → status handoff`

## 5. Phase plan

1. Sequential inspection: confirm today routing and existing dynamic row persistence.
2. Sequential implementation: add collapsed overflow rendering, explicit add/reveal control, keyboard continuity, and accessible labels.
3. Sequential verification: typecheck, automated tests, production build, and affected browser flow.
4. Final review: inspect the scoped diff and update status.

## 6. Parallelization rules

No parallel writes. Read-only review may occur only after implementation if risk or findings warrant it.

## 7. Quality and safety gates

| Acceptance criterion | Evidence |
|---|---|
| Root intentionally opens device-local today | Route and `todayISO()` inspection |
| Initial view shows rows 01–15 | Browser/DOM check |
| Explicit action adds row 16 and focuses it | Browser interaction check |
| Overflow can be collapsed and reopened without data loss | Browser interaction check |
| Enter continues into hidden overflow or appends a new row | Browser interaction check |
| Existing persistence and linked scheduling contracts remain unchanged | Scoped diff plus type/test/build |

## 8. Session continuity

`PROJECT_STATUS.md` records the current phase and verification. Resume by reading `AGENTS.md`, this file, the project sources of truth, and the working-tree diff, while preserving unrelated uncommitted work.

## 9. Exact kickoff/resume prompt

> Resume `DAILY-TODO-OVERFLOW-V1`. Read `AGENTS.md`, `daily-todo-overflow-orchestration.md`, `prd.md`, `design-brief.md`, `decision-list.md`, and `PROJECT_STATUS.md`; inspect the current diff, continue from the first incomplete gate, avoid unrelated Bingo files, and keep status evidence current.
