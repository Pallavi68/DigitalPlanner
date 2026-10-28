# Digital Planner Sync Reliability — Implementation Orchestration

> **Spec ID:** `PLANNER-SYNC-RELIABILITY-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** [`prd.md`](prd.md) FR-11, FR-12, reliability/durability requirements, and the owner's 2026-08-12 incident request
> **Status:** [`PLANNER_SYNC_RELIABILITY_STATUS.md`](PLANNER_SYNC_RELIABILITY_STATUS.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md)

## 1. Objective and boundaries

Plan-and-run a durable cross-device sync repair. Protect the laptop's authoritative planner data before mutation; replace slow full normalized rewrites with a fast owner-scoped document transaction; retain existing normalized rows as rollback evidence; make foreground/reconnect/poll convergence explicit; and prove laptop/phone-equivalent convergence through repeated authenticated production tests.

Excluded: visual redesign, unrelated planner features, destructive cleanup of legacy normalized tables, and Git publication.

## 2. Repository and architecture baseline

The maintained React/Vite app is under `frontend/`; Supabase Auth and RLS own all planner data by `auth.uid()`. The production client currently reconstructs one aggregate from normalized tables and rewrites the entire aggregate for each edit. The owner dataset now requires 24 days, 50 written daily to-dos, 64 time blocks, and 180 routine instances. Supabase documents a 60-second maximum for client API requests, while the existing save RPC has a 120-second function timeout. Mobile suspension, token refresh, missed Realtime invalidations, and long aggregate transactions therefore remain failure modes.

The laptop cache and current remote aggregate were read-only audited before work at identical revision `1786540949567`, timestamp `2026-08-12T13:22:46.877797+00:00`, and identical entity counts. A permission-restricted browser storage snapshot exists outside the repository under `/tmp` for this session.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary integration and data integrity | Tier A | Current Codex model, high effort | Architecture, migration, client, tests, production validation | Sync-specific frontend, SQL, tests, status/docs |

Repository instructions prohibit simultaneous coding agents against shared files, so execution is sequential in the primary session.

## 4. Dependency graph

`P0 safety snapshot/audit → P1 document contract + migration → P2 client coordinator → P3 local tests → P4 remote migration/deploy → P5 repeated authenticated convergence → P6 status/handoff`

## 5. Phase plan

### P0 — Data safety baseline (sequential)

- Deliverables: isolated laptop browser-storage snapshot; cache/unsaved/remote count and revision comparison.
- Gate: laptop has no unaccounted unsaved payload and remote counts/revision match before mutation.
- Status: passed.

### P1 — Fast durable document contract (sequential)

- Ownership: new planner-only migration, schema tests, backend contracts.
- Deliverables: owner-scoped JSONB document table, forced RLS, optimistic revision RPCs, non-destructive coexistence with legacy normalized rows.
- Validation: SQL contract assertions; migration dry run; data preservation review.
- Gate: no delete/drop/truncate of existing planner data; unauthorized access denied; conflict is atomic.

### P2 — Client convergence coordinator (sequential)

- Ownership: planner backend/cache/context and focused tests.
- Deliverables: legacy bootstrap, fast document save/load, durable unsaved journal, verified save read-back, focus/visibility/online/periodic catch-up, channel-token recovery, deterministic retry/conflict behavior, truthful status.
- Validation: unit/integration tests including delayed/missed Realtime, expired session, conflict, offline/reconnect, reload recovery.
- Gate: no state can be labelled synced without a confirmed remote revision.

### P3 — Local verification (sequential)

- Commands: typecheck, full tests, production build, diff check, browser interaction tests with laptop/phone-equivalent contexts.
- Gate: all relevant checks pass three consecutive sync cycles.

### P4 — Production migration and deployment (sequential)

- Inputs: P0 backup and P1–P3 green.
- Deliverables: isolated planner migration applied, production frontend deployed.
- Gate: pre/post remote counts and revision preserved; production HTTP healthy.

### P5 — Repeated authenticated convergence (sequential)

- Test three laptop→phone-equivalent and three phone-equivalent→laptop cycles without refresh; reload persistence; background/foreground catch-up; offline edit/reconnect; token refresh; conflict preservation.
- Gate: every cycle converges to the same revision/content within the stated bound and no protected pre-existing content disappears.

### P6 — Handoff

- Update `PROJECT_STATUS.md` and this status file with exact evidence, remaining limitations, and run instructions.

## 6. Parallelization rules

No parallel writers. Read-only research is allowed, but migration, client contract, deployment, and production data checks are strictly sequential.

## 7. Quality and safety gates

| Requirement | Evidence |
|---|---|
| Laptop content protected | Pre-change snapshot plus local/remote revision and entity-count match |
| Durable saves | Transactional owner document RPC and remote read-back |
| Cross-device convergence | Repeated two-context production tests in both directions |
| Mobile recovery | Focus, visibility, online, polling, and auth-refresh tests |
| Conflict safety | Optimistic revision rejection with local unsaved preservation |
| No unauthorized access | Forced RLS, grants, and anonymous contract checks |
| Rollback protection | Legacy normalized tables retained and unmodified by migration |

## 8. Session continuity

Resume from `PLANNER_SYNC_RELIABILITY_STATUS.md`, then inspect this orchestration, `PROJECT_STATUS.md`, the working tree, and actual remote migration state. A session is incomplete until P5 is evidenced; passing local tests alone is not completion.

## 9. Exact kickoff/resume prompt

Resume `PLANNER-SYNC-RELIABILITY-V1` from `planner-sync-reliability-orchestration.md` and `PLANNER_SYNC_RELIABILITY_STATUS.md`. Reinspect repository and remote evidence, preserve the pre-change laptop data snapshot and all unrelated work, continue from the first incomplete gate, and do not declare completion until repeated authenticated production convergence passes.
