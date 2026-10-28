# Digital Planner Daily Layout and Workflow Refinement — Implementation Orchestration

> **Spec ID:** `DAILY-PLANNER-REFINE-V2`
> **Document role:** Implementation execution source of truth
> **Implements:** `prd.md`, `design-brief.md`, `decision-list.md`, and the approved 2026-07-23 Daily Planner refinement brief
> **Status:** Complete; verification evidence is recorded in `PROJECT_STATUS.md`
> **Repository instructions:** `AGENTS.md` and `CLAUDE.md`

## 1. Objective and boundaries

Plan-and-run the approved Daily Planner corrections:

* replace relative previous/selected/next week tabs with every week intersecting the selected month;
* reduce header height so the planner dominates the viewport;
* let the numbered Daily To Dos grow beyond their initial ruled rows;
* add per-to-do deletion that also removes linked schedule blocks;
* keep schedule-only deletion one-way so it never deletes the source to-do;
* add optional routine default start time for quick-add scheduling;
* move Wind-down to the left page and reserve the right page for Time Alignment.

Backend implementation is excluded. The visible “Saved locally” wording remains because `localStorage` is still the only persistence layer.

## 2. Repository and architecture baseline

* React 18, TypeScript, Vite, React Router, and a local storage adapter.
* Daily state is date-scoped in `PlannerContext`; Time Alignment blocks link to source items.
* Daily to-dos currently use array indices in links and therefore require stable IDs before deletion/reordering can be safe.
* Routine definitions already use date-effective revisions and daily snapshots; optional default time belongs in both.
* Calendar helpers already generate every four-, five-, or six-week month grid.
* Existing uncommitted navigation, page-turn, checklist, and to-do changes must be preserved.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary implementation/integration | Tier A | Current Codex model, high effort | Data migration, navigation, layout, interactions, tests, documentation | Relevant frontend and planning/status files |
| Independent QA reviewer | Tier A | Runtime-selected Codex agent, high effort | Read-only requirements, migration, UX, accessibility, deletion safety, and regression review | None |

## 4. Dependency graph

```text
Inspect current state
      ↓
Stable daily-to-do IDs + migration
      ↓
Dynamic rows + directional deletion ─┐
                                     ├─→ integrated Daily Page checks
Routine default time + snapshots ────┤
                                     │
Month tabs + compact header ─────────┤
                                     │
Wind-down relocation ────────────────┘
                 ↓
       browser/device verification
                 ↓
       independent read-only QA
                 ↓
          fixes + final gates
```

## 5. Phase plan

### Phase 1 — Data contracts and migration

* Mode: sequential.
* Ownership: `frontend/src/types.ts`, `frontend/src/store/seed.ts`, `frontend/src/store/storage.ts`, `frontend/src/store/routines.ts`.
* Deliverables: stable daily-to-do IDs; optional default routine start slot; safe migration of existing local state.
* Gate: old local state hydrates without losing daily entries, routine revisions, or linked blocks.

### Phase 2 — Interaction and layout

* Mode: sequential because `App.tsx` integrates all flows.
* Ownership: `BookShell.tsx`, `App.tsx`, `ToDos.tsx`, `RoutineSetup.tsx`, and `index.css`.
* Deliverables: all-month week tabs, compact header, dynamic/deleteable to-dos, default quick-add timing, and left-page Wind-down.
* Gate: requested behaviors work in desktop and phone browser checks.

### Phase 3 — Independent QA and fixes

* Mode: read-only review followed by sequential fixes.
* Gate: no unresolved critical/high findings; typecheck and build pass after fixes.

## 6. Parallelization rules

No parallel write work is permitted because the data contracts, migration, App composition, and linked deletion behavior are coupled. Independent QA begins only after browser gates pass.

## 7. Quality and safety gates

| Acceptance criterion | Evidence |
|---|---|
| Daily header lists every selected-month week | Four-, five-, and six-week browser checks |
| Header uses materially less vertical space | Desktop/phone computed geometry and screenshots |
| Enter on the last to-do creates and focuses a new row | Browser interaction check |
| Every filled to-do exposes delete | DOM/accessibility check |
| Deleting a to-do removes every linked schedule block | Browser state/DOM check |
| Deleting only a schedule block preserves its to-do | Browser state/DOM check |
| Existing data migrates to stable daily-to-do IDs | Migration/static and hydration check |
| Routine default time is optional and quick-add respects it | Setup and scheduling browser check |
| Wind-down is left; Time Alignment is the sole right-page section | DOM/layout check |
| Persistence wording does not imply a backend | Sync indicator inspection |

## 8. Session continuity

`PROJECT_STATUS.md` is the durable status file. Browser checks and independent QA passed on 2026-07-23. Resume future work by reading `AGENTS.md`, this orchestration document, `PROJECT_STATUS.md`, `decision-list.md`, and the working tree.

## 9. Exact kickoff/resume prompt

> Resume `DAILY-PLANNER-REFINE-V2` in the repository root. Read `AGENTS.md`, `daily-planner-refinement-orchestration.md`, `PROJECT_STATUS.md`, and `decision-list.md`; inspect repository evidence and continue from the first incomplete gate. Preserve existing uncommitted work, delegate only bounded non-overlapping tasks, run independent read-only QA, and update `PROJECT_STATUS.md`.
