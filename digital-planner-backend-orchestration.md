# Digital Planner Supabase Backend — Implementation Orchestration

> **Spec ID:** `DIGITAL-PLANNER-SUPABASE-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** [`daily-checklist-feature-prd.md`](daily-checklist-feature-prd.md), [`prd.md`](prd.md), and the approved 2026-07-23 backend request
> **Status:** [`BACKEND_IMPLEMENTATION_STATUS.md`](BACKEND_IMPLEMENTATION_STATUS.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md) and [`CLAUDE.md`](CLAUDE.md)

## 1. Objective and boundaries

Plan-and-run a secure Supabase persistence milestone for Successful Day definitions/revisions/snapshots/completion, Daily To Dos, Wind-down, Time Alignment blocks with linked completion, and two-week chore definitions/categories/scheduling/completion/actual completion dates. Preserve immutable historical daily snapshots, safely import legacy `localStorage` once, authenticate the owner for cross-device access, enforce row-level security, and expose honest loading/saving/offline/retry/error states without redesigning the planner.

Excluded: scheduler logic, collaboration, production Supabase project creation, production secrets, deployment, and unimplemented Running To-Do pages. Live cloud verification is gated on owner-supplied Supabase configuration.

## 2. Repository and architecture baseline

* React 18, TypeScript, Vite, React Router; no test runner or backend dependency at inspection time.
* `PlannerContext` owns one aggregate `PlannerState`; `store/storage.ts` is the persistence seam and currently stores `digital-planner:v1` in `localStorage`.
* Routine revisions and daily routine snapshots already exist locally. Daily to-dos have stable IDs, linked completion is implemented, and Wind-down/time blocks are date-scoped.
* Two-week rows and grid marks exist in the data model but have no maintained page yet.
* Supabase is now approved, superseding deferred-provider decision D9. Cross-device requirement D6 means recoverable account authentication is required; anonymous device identity from the focused PRD is insufficient.
* Architecture decision: email OTP/magic-link Supabase Auth, `auth.uid()` ownership, normalized Postgres tables, transactional RPCs for aggregate import/save and immutable snapshot materialization, Realtime invalidation/refetch, and a local last-known-state cache plus explicit unsaved retry. The browser receives only the public URL and publishable/anon key.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary orchestrator/integrator | Tier A | Current Codex model, high effort | Contracts, context integration, UX, dependency gates, docs, final verification | Shared frontend integration and docs |
| Database/security implementer | Tier A | Runtime-selected Codex agent, high effort | Schema, migrations, RLS, transactional SQL, SQL tests | `supabase/**` only |
| Client persistence implementer | Tier A | Runtime-selected Codex agent, high effort | Supabase client, auth API, storage adapter, migration helpers, unit tests | New `frontend/src/backend/**` and config files assigned in spawn contract |
| Independent QA reviewer | Tier A | Runtime-selected Codex agent, high effort | Read-only security, integrity, UX, PRD, and test-gap review after integration | None |

## 4. Dependency graph

```text
Inspection + architecture decision
              ↓
     contracts/schema gate
       ↙             ↘
SQL/RLS/RPC       client/auth/cache
       ↘             ↙
    PlannerContext + auth/sync UX
              ↓
 migration/idempotency/integration tests
              ↓
 build + browser regression + live-config checklist
              ↓
 independent read-only QA → fixes → final gates
```

## 5. Phase plan

### Phase 0 — Baseline and durable plan

* Mode: sequential.
* Deliverables: this file, backend status file, conflict resolution, verified ownership.
* Checks: docs/code/Git inspection.
* Gate: schema/auth/offline strategy and external dependencies are explicit.

### Phase 1 — Schema, migrations, and security

* Mode: parallel after contracts are fixed.
* Database ownership: `supabase/**`.
* Client ownership: new `frontend/src/backend/**`, `frontend/.env.example`, and dependency/test configuration explicitly assigned.
* Deliverables: normalized owner-scoped tables; constraints/indexes; immutable past-snapshot enforcement; transactional materialization/import/save RPCs; RLS for every exposed table; email OTP client; cache/import primitives.
* Checks: SQL static/security tests, TypeScript unit tests.
* Gate: no public planner rows, no service key in browser, idempotent import/snapshot keys, and all required entities represented.

### Phase 2 — State and UX integration

* Mode: sequential at the merge point.
* Primary ownership: `PlannerContext.tsx`, `storage.ts`, `main.tsx`, `App.tsx`, `SyncIndicator.tsx`, auth UI/styles, shared types.
* Deliverables: authenticated cloud source of truth, first-run import confirmation, cache fallback, realtime refetch, retryable unsaved state, honest status and conflict-safe last-write metadata.
* Gate: signed-out/loading/error/offline/saving/saved states are distinguishable; existing daily interactions remain optimistic; past snapshots are never derived after a failed load.

### Phase 3 — Verification

* Mode: isolated tests then integrated browser checks.
* Checks: migration mapping, idempotency, snapshot immutability, RLS/static SQL assertions, linked completion, offline/retry, auth state, cross-tab/realtime invalidation, TypeScript, production build, desktop/phone browser regression.
* External dependency: live Supabase URL/key and configured email auth are required for true cross-device/RLS runtime verification.
* Gate: all locally executable checks pass and live-only checks are precisely documented.

### Phase 4 — Independent QA and fixes

* Mode: read-only review followed by sequential fixes.
* Reviews: specification compliance; auth/RLS/privacy; historical/data integrity; migration safety; UX/accessibility/offline honesty; test gaps.
* Gate: no unresolved critical/high finding; all relevant checks rerun.

## 6. Parallelization rules

* SQL and new client modules may proceed in parallel only against the recorded contract.
* `PlannerContext.tsx`, shared types, package lock, and documentation are primary-owned merge points.
* Database migrations are sequential and single-owner.
* QA is read-only and starts only after integration checks.
* Any collision stops the affected workstream and is re-sequenced by the primary agent.

## 7. Quality and safety gates

| Must-have | Evidence |
|---|---|
| Authenticated cross-device ownership | Email OTP session flow; every planner policy uses `auth.uid()` |
| Complete persistence scope | Schema/RPC mapping tests for routines, daily todos, wind-down, blocks, chores |
| Historical fidelity | Immutable past-snapshot trigger/policy plus yesterday/today/future tests |
| Linked completion | One persisted source completion propagated to linked blocks in RPC/mapping tests |
| One-time safe migration | Preview/confirm, per-user idempotency key, non-overwrite transaction, retained local backup |
| Offline/error honesty | Cached read label, unsaved state, retry controls; no false “synced” claim |
| Cross-device synchronization | Realtime invalidation and authoritative refetch; live two-client checklist |
| Security/privacy | RLS enabled/forced on all planner tables; no service key; no planner content logging |
| Frontend preservation | typecheck/build and targeted desktop/phone daily-flow regression |

## 8. Session continuity

Canonical status is `BACKEND_IMPLEMENTATION_STATUS.md`; `PROJECT_STATUS.md` remains the concise repository-wide summary. Restart inspection order: `AGENTS.md`, this orchestration file, backend status, `daily-checklist-feature-prd.md`, `prd.md`, `decision-list.md`, `PROJECT_STATUS.md`, migrations, frontend code, then Git evidence. Update backend status after every gate and before ending an incomplete session.

## 9. Exact kickoff/resume prompt

> Resume `DIGITAL-PLANNER-SUPABASE-V1` in the repository root. Read `AGENTS.md`, `digital-planner-backend-orchestration.md`, `BACKEND_IMPLEMENTATION_STATUS.md`, `daily-checklist-feature-prd.md`, `prd.md`, `decision-list.md`, and `PROJECT_STATUS.md`; inspect repository and Git evidence, infer the first incomplete gate, delegate only approved non-overlapping workstreams, never commit/push/deploy, run independent read-only QA, and keep both status files current.
