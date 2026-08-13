# Weekly Action Planner — Implementation Orchestration

> **Spec ID:** `WEEKLY-PLANNER-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** [weekly-planner-feature-prd.md](weekly-planner-feature-prd.md)
> **Status:** [weekly-planner-implementation-status.md](weekly-planner-implementation-status.md)
> **Repository instructions:** [AGENTS.md](AGENTS.md)
> **Operating mode:** Plan-only; implementation is not authorized by this artifact.

## 1. Objective and boundaries

Implement the approved Weekly Action Planner as a Monday-anchored book spread where the owner can create or paste a flat action list, assign each action to exactly one day, append a linked item to that date's Daily To Dos, reschedule without duplicates, and observe Daily Page completion from the weekly view.

V1 excludes time-block creation, action hierarchy, recurring actions, automatic carry-forward, weekly review, external imports, and identity inference after arbitrary text cut-and-paste. The Month Overview remains navigation-first. Existing Daily Page behavior and the approved cream/navy physical-planner direction must be preserved.

The implementation run must preserve unrelated uncommitted Vision Action Bingo work. No agent may modify `frontend/src/features/bingo/**`, Bingo migrations/tests, or Bingo planning artifacts.

## 2. Repository and architecture baseline

- Stack: React 18, TypeScript, React Router 6, Vite, Vitest, custom context/reducer store, and Supabase.
- Routes are currently composed in `frontend/src/App.tsx`; Month Overview and Daily Page are presently in that file.
- Canonical client data is `PlannerState` in `frontend/src/types.ts`, mutated by `frontend/src/store/PlannerContext.tsx`.
- The current cloud architecture stores the complete `PlannerState` as one owner-scoped JSONB document in `planner_documents`; `save_planner_document` provides optimistic revision checking and one aggregate save. Realtime acts as invalidation followed by authoritative refetch.
- This feature should extend that aggregate document. A weekly-specific table/RPC/migration would split the source of truth and is out of plan unless Phase 0 finds a demonstrated blocker and records a user-approved architecture decision.
- Existing stable `DailyTodoLine.id` and `sourceRefId` fields provide the linking seam. The weekly action should be the durable source; its surfaced Daily To Do uses its own stable ID and points back with `sourceRefId`.
- Existing drag infrastructure is optimized for dropping sources on Time Alignment. Weekly planning needs a feature-local pointer/HTML drop contract or a carefully generalized shared contract; do not overload Time Alignment payload semantics accidentally.
- Automated scripts available: `npm run typecheck`, `npm test`, and `npm run build`. There is no lint script.
- Cloud persistence, offline recovery, conflict feedback, and aggregate read-back verification already exist and must remain intact.

Architecture decisions to settle in Phase 0:

1. Add `weeklyActions: WeeklyAction[]` to `PlannerState` (recommended) versus a plans-by-week map. The flat array is recommended because action identity remains stable across future carry-forward while `weekStart` records its current/original week.
2. Use `linkedDailyTodoId?: string` plus `assignedDate?: ISODate`, while the Daily To Do stores `sourceRefId: weeklyAction.id`. All supported mutations validate both sides.
3. Define one reducer operation per logical mutation—create/paste, edit, delete, assign/move, toggle—so a move edits the weekly action and both day snapshots in one in-memory state transition and one aggregate cloud save.
4. Define deletion semantics explicitly: deleting a scheduled weekly action removes only its linked Daily To Do and any Time Alignment block linked to that daily line; deleting the Daily To Do directly should unschedule the weekly action rather than delete its source. This is required to avoid stale weekly markers.
5. Store `createdAt`, `updatedAt`, optional `completedAt`, and stable `sortOrder`; do not implement rollover fields or behavior beyond the PRD's extensibility requirement.

Any deviation requires a concise decision entry in the status file first. `decision-list.md` is updated only if the primary agent determines the decision is durable and obtains scope to edit it.

## 3. Agent/model assignment

The runtime does not expose model selection. Assign capability tier and effort; the active runtime resolves the actual model.

| Role | Capability tier | Resolved model/effort | Scope | Exclusive write ownership |
|---|---|---|---|---|
| Primary orchestrator/integrator | Tier A | Runtime-selected / high | Gates, contracts, integration, final fixes, status | `weekly-planner-implementation-status.md`; temporarily owns shared files only during its phase |
| Domain/store implementer | Tier A | Runtime-selected / high | Types, migration/defaults, atomic weekly↔daily mutations, domain tests | `frontend/src/types.ts`, `frontend/src/store/PlannerContext.tsx`, `frontend/src/store/storage.ts`, `frontend/src/store/seed.ts`, `frontend/src/store/weeklyPlanner.ts`, `frontend/src/store/weeklyPlanner.test.ts` |
| Weekly UI implementer | Tier B | Runtime-selected / medium | Weekly spread, action capture/paste, day sections, pointer and non-pointer controls | `frontend/src/pages/weekly/**` |
| Navigation/integration implementer | Tier B | Runtime-selected / medium | Routes, Month Overview entry, Daily Page reconciliation hooks | `frontend/src/App.tsx`, `frontend/src/components/BookShell.tsx` |
| Visual/responsive implementer | Tier B | Runtime-selected / medium | Planner-faithful desktop/tablet/mobile styling and focus/touch states | `frontend/src/pages/weekly/weekly-planner.css`; narrowly scoped weekly selectors in `frontend/src/index.css` only if unavoidable |
| Contract/persistence verifier | Tier B | Runtime-selected / medium | Aggregate round-trip/default compatibility tests; no migration unless architecture gate changes | `frontend/src/backend/contracts.test.ts`, `frontend/src/backend/syncVerification.test.ts` |
| Browser QA reviewer | Tier A | Runtime-selected / high | Read-only acceptance, accessibility, responsive, and regression review | Read-only; evidence in status via primary |
| Data-integrity/spec reviewer | Tier A | Runtime-selected / high | Read-only duplicate/link/conflict/deletion review and P0 audit | Read-only; evidence in status via primary |

Agents receive the spawn contract in Section 9. Never give concurrent agents overlapping paths. If `frontend/src/index.css` must change, the visual agent owns it only after other writers finish.

## 4. Dependency graph

```text
P0 inspect + architecture gate
  |
  v
P1 domain contract + atomic store operations + unit tests
  |
  +--------------------------+
  |                          |
  v                          v
P2A weekly UI/components   P2B persistence/compatibility tests
  |                          |
  +-------------+------------+
                v
P3 route + Month/Daily integration (shared App.tsx gate)
                |
                v
P4 visual/responsive/accessibility integration
                |
                v
P5 full automated + browser acceptance
                |
        +-------+-------+
        |               |
        v               v
P6A spec/UX review   P6B data/security review
        |               |
        +-------+-------+
                v
P7 sequential fixes, regression rerun, status handoff
```

P2A and P2B are the only planned write-enabled parallel branch. P6 reviews may run in parallel because they are read-only. Everything touching the shared store contract, `App.tsx`, global CSS, or final fixes is sequential.

## 5. Phase plan

### Phase 0 — Evidence refresh and architecture gate

- **Mode:** Sequential, primary orchestrator.
- **Dependencies/inputs:** PRD, this plan, status, repository instructions, current code, and current diff/status evidence.
- **Tasks:** confirm no part of the feature already exists; inspect unrelated dirty paths; validate the recommended aggregate model, link invariants, delete behavior, full-day behavior, and drag approach; record decisions in status.
- **Exclusive ownership:** `weekly-planner-implementation-status.md` only.
- **Deliverables:** confirmed file map, protected dirty-file list, resolved domain contract, and agent contracts for Phase 1.
- **Checks:** read-only inspection; compare proposed types/mutations to FR-3, FR-5–7, FR-10–11, FR-16, FR-18.
- **Gate:** link invariant and deletion semantics are explicit; no unresolved architecture question can change schema or core UX.
- **External dependency:** user approval is needed only if the recommendation changes materially (for example, introducing new Supabase tables).

### Phase 1 — Domain contract and atomic store operations

- **Mode:** Sequential; Tier A domain/store implementer.
- **Dependencies:** Phase 0 gate.
- **Tasks:** add weekly action types/default migration; implement week validation, multiline normalization, stable ordering, CRUD, assign/move/no-op, daily append-at-bottom, daily completion propagation, weekly edit propagation, and delete/unschedule reconciliation as atomic state transitions; expose narrow context methods.
- **Exclusive ownership:** the domain/store paths listed in Section 3. No `App.tsx`, CSS, backend, or Bingo edits.
- **Deliverables:** tested feature-domain API usable without UI.
- **Validation:** `cd frontend && npm test -- src/store/weeklyPlanner.test.ts`; `npm run typecheck`.
- **Gate:** tests prove exactly one assignment, stable IDs, no duplicates, cross-month weeks, blank-line paste handling, append after written items, move cleanup, completion sync, source deletion, surfaced-line deletion, and migration from state without `weeklyActions`.
- **Durable update:** primary records commands and evidence in status.

### Phase 2A — Weekly spread and interaction UI

- **Mode:** Parallel with Phase 2B after Phase 1; Tier B UI implementer.
- **Dependencies:** stable Phase 1 context/domain API.
- **Tasks:** implement Monday–Sunday spread; create/edit/delete; multiline paste; unscheduled/scheduled/completed source rows; assigned markers; day sections; accessible Assign/Move picker; valid/invalid/cancelled pointer drop behavior; day links; previous/next callbacks. Use feature-local CSS only for structural hooks until Phase 4.
- **Exclusive ownership:** `frontend/src/pages/weekly/**`.
- **Deliverables:** route-ready `WeeklyPlannerPage` and focused component tests where practical.
- **Validation:** focused Vitest tests; `npm run typecheck`.
- **Gate:** components exercise every P0 interaction through callbacks without requiring route or global CSS edits.

### Phase 2B — Aggregate persistence compatibility

- **Mode:** Parallel with Phase 2A; Tier B contract verifier.
- **Dependencies:** Phase 1 types/default migration.
- **Tasks:** add fixtures proving document normalization/save verification accepts weekly actions, preserves IDs/order/assignments/completion, and safely hydrates older payloads. Confirm no SQL change is required because payload is JSONB.
- **Exclusive ownership:** the two backend test files listed in Section 3.
- **Deliverables:** focused compatibility evidence; no production backend code or migration unless Phase 0 explicitly changed the architecture.
- **Validation:** `cd frontend && npm test -- src/backend/contracts.test.ts src/backend/syncVerification.test.ts`.
- **Gate:** aggregate round-trip and backward-compatible load tests pass; existing contract tests remain green.

### Phase 3 — Route, Month Overview, and Daily Page integration

- **Mode:** Sequential; Tier B integration implementer, followed by Tier A primary inspection.
- **Dependencies:** Phases 2A and 2B complete.
- **Tasks:** add `/week/:monday`; validate and Monday-anchor route input; connect seven-day previous/next navigation; add a distinct Weekly Planner affordance per Month Overview row without breaking day links; connect Daily To Do edit/toggle/delete paths to linked weekly reconciliation; keep time-block links anchored to the daily-line ID.
- **Exclusive ownership:** `frontend/src/App.tsx`, `frontend/src/components/BookShell.tsx`. Weekly files are read-only during this phase.
- **Deliverables:** end-to-end local flow wired to existing navigation and sync store.
- **Validation:** route/component tests where existing harness permits, then `npm run typecheck` and `npm test`.
- **Gate:** Month → Week → Day works; daily completion reflects weekly state; Daily Page deletion cannot leave a false scheduled marker; existing Month/Day routes remain intact.

### Phase 4 — Visual, responsive, and accessibility integration

- **Mode:** Sequential; Tier B visual implementer.
- **Dependencies:** Phase 3 functional gate.
- **Tasks:** apply book-spread visual direction; desktop/tablet spread; mobile single-page action section plus stacked or swipeable days; 44px touch targets where layout permits; visible focus; non-color scheduled/completed cues; long-text/list overflow; drag feedback; reduced-motion-compatible behavior.
- **Exclusive ownership:** `frontend/src/pages/weekly/weekly-planner.css`; `frontend/src/index.css` only for narrowly necessary shared variables/shell selectors and only while no other writer is active.
- **Deliverables:** responsive production styling, no generic kanban/card redesign.
- **Validation:** `npm run typecheck`, `npm run build`, screenshots/manual checks at approximately 1440px, 768px, and 390px.
- **Gate:** no document-width overflow, all controls usable without drag, focus is visible, text wraps, and the feature matches `design-brief.md`.

### Phase 5 — Full acceptance and regression verification

- **Mode:** Sequential primary integration.
- **Dependencies:** Phase 4.
- **Tasks:** run full automated suite; browser-test create/paste/edit/delete/assign/move/no-op/cancel/completion/navigation/reload; verify offline/failed sync indication without falsely claiming cross-device success; test duplicate text, long text/list, cross-month/year, day capacity, keyboard and touch alternatives; exercise existing Daily To Do → Time Alignment behavior.
- **Exclusive ownership:** none initially; primary may write only status. Failures move to Phase 7 with isolated ownership.
- **Validation:** `cd frontend && npm run typecheck && npm test && npm run build`; manual/headless browser matrix; `git diff --check` only through the repository's required Git skill/approval process.
- **Gate:** all P0 rows in Section 7 have evidence; no regression in Daily/Month navigation, Daily To Dos, linked time blocks, save/retry, or aggregate hydration.
- **External dependency:** authenticated two-device persistence testing requires owner credentials/session and may be recorded as pending rather than simulated.

### Phase 6 — Independent reviews

- **Mode:** Two parallel read-only Tier A reviewers.
- **Dependencies:** Phase 5 green candidate.
- **Tasks:** one reviewer audits PRD/UX/accessibility/responsiveness; one audits link invariants, deletion/move atomicity, aggregate persistence, conflict/offline behavior, privacy, and unrelated-diff safety.
- **Exclusive ownership:** none.
- **Deliverables:** severity-ranked findings with file references and reproduction/check steps.
- **Gate:** no unresolved critical/high findings; medium findings are fixed or explicitly accepted by the owner.

### Phase 7 — Fix, reverify, and handoff

- **Mode:** Sequential; primary assigns one isolated owner per finding group.
- **Dependencies:** Phase 6 findings.
- **Tasks:** apply scoped fixes; rerun focused then full checks; inspect final diff for accidental/Bingo changes; update `PROJECT_STATUS.md` only after implementation is complete and only when that file is explicitly assigned to the primary; update `decision-list.md` only for a genuinely durable adopted decision.
- **Exclusive ownership:** assigned per finding; never overlap. Status remains primary-owned.
- **Gate:** P0 quality matrix complete, all checks recorded, no unresolved high findings, and remaining limitations clearly stated. No commit, push, migration application, or deployment without separate user authorization.

## 6. Parallelization rules

- Safe write parallelism is limited to Phase 2A (`frontend/src/pages/weekly/**`) and Phase 2B (two backend test files) after the domain contract is frozen.
- Read-only Phase 6 reviews may run concurrently.
- `frontend/src/types.ts`, `frontend/src/store/PlannerContext.tsx`, `frontend/src/App.tsx`, `frontend/src/index.css`, lockfiles, and status artifacts are merge points and therefore sequential.
- No two agents may edit the same file or directory concurrently. Shared imports are integrated by the designated downstream owner, not by upstream agents reaching outside ownership.
- No implementation agent may edit `frontend/src/features/bingo/**`, `supabase/migrations/20260727000100_vision_action_bingo.sql`, `supabase/tests/bingo_*`, or Vision Action Bingo artifacts.
- A subagent may not commit, push, deploy, apply migrations, alter production data, or install dependencies.
- If an agent discovers an ownership need outside its contract, it stops and returns the request. The primary reassigns the path sequentially.
- On collision or unexpected dirty content, stop the affected writer, inspect the actual diff, preserve user work, and re-sequence. Never reset or discard.

## 7. Quality and safety gates

Every P0 requirement is mapped below. P1 items are desirable but do not block V1 unless implementation exposes a broken partial control.

| P0 | Required evidence | Primary check |
|---|---|---|
| FR-1 | Each Month week row has a distinct weekly-planning affordance and day links still work | Browser route/navigation test |
| FR-2 | Seven chronological ISO dates from a Monday anchor, including month/year boundary | Domain unit test + browser boundary check |
| FR-3 | Create/edit/delete persists; scheduled delete confirmation reconciles linked daily line | Store unit tests + browser reload test |
| FR-4 | Trimmed non-empty pasted lines become ordered actions; blanks ignored | Unit/component test |
| FR-5 | Action is unscheduled or assigned once, never both/multiple | Reducer invariant tests |
| FR-6 | Drop assigns date, appends one linked daily line, updates immediately | Store test + pointer browser test |
| FR-7 | Existing written items retain order and new item is after them | Store test with blank placeholders and expanded day |
| FR-8 | Scheduled source row remains with exactly one legible day/date marker | Component/browser assertion |
| FR-9 | Day section shows assigned actions; header/open control reaches `/day/:date` without control bubbling | Component/browser navigation test |
| FR-10 | Move preserves weekly ID, removes old daily line, appends one new line, no duplicate | Atomic reducer unit test + browser move test |
| FR-11 | Daily completion updates weekly action and both weekly representations | Reducer/integration test + browser round trip |
| FR-14 | Assign/Move works by keyboard/touch without pointer drag; focus is visible | Keyboard browser test + responsive manual check |
| FR-15 | Outside drop, Escape, and cancelled picker do not mutate | Unit/component/browser tests |
| FR-16 | Weekly fields survive aggregate normalization, reload, retry cache, and authenticated second device when available | Contract tests + reload; owner-session two-device check |
| FR-18 | Stable source identity; weekly edit propagates daily text; supported move preserves ID | Reducer/link invariant tests |
| FR-19 | Previous/next moves exactly seven days and stays Monday anchored | Route/domain test + browser navigation |

Cross-cutting gates:

- **Data integrity:** one weekly action → zero or one linked Daily To Do; a logical move is one reducer transition and one aggregate save; missing-link repair must not silently duplicate.
- **Backward compatibility:** old planner documents without `weeklyActions` migrate to an empty array without changing unrelated data.
- **Security/privacy:** no third-party analytics; weekly text stays in the authenticated owner document; no secrets or `.env` changes.
- **Offline/conflict:** existing local unsaved recovery and optimistic conflict behavior remain intact; UI must not display `synced` before verified save.
- **Accessibility:** semantic buttons/labels, visible focus, keyboard assignment, non-color state, reasonable 44×44 targets.
- **Regression:** Daily Page editing, deletion, completion, Time Alignment linking, Month navigation, authentication gate, and existing tests remain green.
- **Repository safety:** final diff contains no PDF, secret, generated `dist`, dependency, design-handoff, or Bingo changes caused by this feature.

## 8. Session continuity

The durable status source is [weekly-planner-implementation-status.md](weekly-planner-implementation-status.md). Update it after every gate, material decision, failed check, ownership change, and before ending an incomplete session. Link all evidence by command, test name, screenshot path, or precise file reference.

No ADR directory currently exists for this feature. Record scoped decisions in the status file. If implementation discovers a broad durable architecture decision, pause and ask the primary to decide whether to create an ADR/update `decision-list.md`; do not let a subagent make that cross-project edit.

Restart inspection order:

1. [AGENTS.md](AGENTS.md)
2. [weekly-planner-feature-prd.md](weekly-planner-feature-prd.md)
3. This orchestration document
4. [weekly-planner-implementation-status.md](weekly-planner-implementation-status.md)
5. `prd.md`, `design-brief.md`, `decision-list.md`, and `PROJECT_STATUS.md`
6. Current repository status/diff, then the actual files named by the next incomplete phase

An incomplete session has any ungated phase, unmapped P0 evidence, unresolved critical/high review finding, unrecorded check failure, or intentional uncommitted implementation without a handoff. Completion requires all P0 evidence, full checks, independent reviews, final diff inspection, concise `PROJECT_STATUS.md` update, and owner-visible remaining limitations. Deployment and Git commit are separate authorizations.

## 9. Exact kickoff/resume prompt

```text
Implement WEEKLY-PLANNER-V1 using AGENTS.md, weekly-planner-feature-prd.md, weekly-planner-orchestration.md, and weekly-planner-implementation-status.md as the canonical sources. First inspect repository status/diff and actual code, preserve all unrelated Vision Action Bingo work, and infer the first incomplete gate from the status file. Update the status with the protected dirty paths and Phase 0 architecture decisions before writing product code. Delegate only the bounded workstreams authorized by the orchestration document, give every writer exclusive paths, and never overlap shared files. Run each phase's checks, inspect repository evidence yourself, and advance only when its acceptance gate passes. Maintain weekly-planner-implementation-status.md after every phase and before stopping. Do not commit, push, deploy, apply migrations, or alter production data without separate user approval.
```

### Copyable implementation-agent contract

```text
Role: [role and capability tier]
Goal: [one bounded phase deliverable]
Read first: AGENTS.md; weekly-planner-feature-prd.md; weekly-planner-orchestration.md; weekly-planner-implementation-status.md; [relevant source files]
Exclusive write ownership: [exact files/directories]
Read-only dependencies: [exact files/directories]
Must not change: all files outside ownership; frontend/src/features/bingo/**; Bingo migrations/tests/artifacts; requirements/status docs unless assigned; dependencies; .env files
Acceptance criteria: [phase gate and FR IDs]
Checks to run: [focused commands]
Return: files changed; checks/results; decisions; risks; remaining work; no commit/push/deploy/migration application
```
