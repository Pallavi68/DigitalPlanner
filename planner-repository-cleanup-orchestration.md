# Digital Planner Repository Cleanup — Implementation Orchestration

> **Spec ID:** `PLANNER-REPOSITORY-CLEANUP-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** Owner cleanup request from 2026-10-28; preserves [`prd.md`](prd.md)
> **Status:** [`PLANNER_REPOSITORY_CLEANUP_STATUS.md`](PLANNER_REPOSITORY_CLEANUP_STATUS.md)
> **Repository instructions:** [`AGENTS.md`](AGENTS.md)

## 1. Objective and boundaries

Make the accepted live Digital Planner and its Supabase planner backend the only active product in the repository. Completely retire the unapproved Vision-to-Action Bingo prototype from the current tree, establish `main` as the single canonical production branch, and make future feature branches isolated and disposable.

This is currently **plan-only**. No feature files, branches, database objects, deployments, or production settings may be changed until the owner approves the relevant phase.

Included:

* preserve all planner behavior currently deployed at `https://digital-planner-plum.vercel.app`;
* preserve planner Auth, data, migrations, recovery safeguards, and ignored local credentials;
* remove Bingo routes, navigation, source, tests, SQL, research, specifications, status files, and active-document references from the current tree;
* verify that no Bingo migration or schema was applied remotely before concluding that no database cleanup is needed;
* consolidate the accepted planner lineage onto `main` without rewriting Git history;
* connect Vercel production to GitHub `main` so unmerged feature branches cannot affect production;
* remove obsolete local and remote branches only after `main` is deployed and verified;
* add durable branch/deployment hygiene instructions to `AGENTS.md`.

Excluded:

* redesigning or adding planner functionality;
* changing planner data or authentication configuration;
* dropping remote database objects without separate evidence and explicit approval;
* force-pushing, rebasing published history, or deleting historical Git commits;
* deleting the current production deployment before its replacement is verified.

“Remove Bingo” means remove it from the current repository state and active documentation. Existing Git history will not be rewritten merely to erase historical mentions.

## 2. Repository and architecture baseline

Verified on 2026-10-28:

* Production frontend: React 18 + TypeScript + Vite on Vercel.
* Backend: Supabase Auth and owner-scoped planner persistence.
* Live planner branch lineage: `release/daily-planner-v1` at `39998b8` plus later planner-only working-tree fixes deployed from isolated copies.
* Current checkout: local `feature/vision-action-bingo-v1`, also at `39998b8`.
* The Bingo branch has no unique commit and no remote counterpart.
* Bingo implementation, SQL, and most Bingo documents are untracked; shared planner files contain mixed uncommitted Bingo and planner changes.
* The Bingo migration is documented as unapplied. This must be verified read-only before removing the local migration.
* Vercel is not connected to GitHub; deployments have been initiated manually.
* The live JavaScript bundle contains planner recovery/weekly/habit functionality and no Bingo route, label, or feature strings.
* `supabase/.temp/` is generated local state and must never be committed.

Target architecture:

```text
feature/* branch -> GitHub/Vercel preview only
                      |
                      | reviewed merge
                      v
                    main -> Vercel production -> existing Supabase planner backend
```

No feature branch may be used as an implicit shared working directory. A feature link reaches production only through a reviewed commit merged into `main`.

## 3. Agent/model assignment

Implementation is intentionally sequential because shared files, Git refs, deployment configuration, and database verification are coupled.

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary cleanup/integration agent | Tier A | Current primary Codex model, high effort | Inventory, selective cleanup, tests, Git batches, deployment gates, final review | Repository-wide, one approved phase at a time |
| Owner | Approval authority | N/A | Approve each destructive/Git/deployment batch and complete any Vercel account interaction | External accounts only |

No subagents or parallel writers are planned. Independent review will be read-only after implementation.

## 4. Dependency graph

```text
P0 approve plan and freeze scope
  -> P1 create recoverable snapshot and cleanup branch
    -> P2 separate planner changes and remove Bingo/current-tree clutter
      -> P3 verify clean planner locally and verify remote DB state read-only
        -> P4 commit and push cleanup branch
          -> P5 reconcile and promote canonical main
            -> P6 connect Vercel to main, deploy, and verify production
              -> P7 delete obsolete branches and close documentation
```

Every phase is a hard gate. Failure or unexpected evidence stops advancement.

## 5. Phase plan

### P0 — Approval and read-only preflight

* **Mode:** Sequential, no writes.
* **Tasks:** Recheck status, refs, ignored files, remote heads, live asset identity, and current production health. Classify every modified/untracked path as planner, Bingo, generated local state, or unresolved.
* **Deliverable:** Owner-readable path inventory and proposed exact first Git/filesystem batch.
* **Gate:** No unresolved file and owner approval for P1.

### P1 — Recovery snapshot and isolated cleanup branch

* **Mode:** Sequential.
* **Tasks:** Create a secrets-excluding recovery archive under `/tmp`; record its manifest/checksum; create `chore/planner-repository-cleanup` from the verified production commit while preserving the working tree.
* **Git safety:** Present exact commands and risks before execution. Do not stash ignored credentials. Do not commit or push yet.
* **Gate:** Archive can restore the mixed working tree; cleanup branch is checked out; live production is unchanged.

### P2 — Remove Bingo while preserving planner fixes

* **Mode:** Sequential, hunk-level edits in shared files.
* **Remove:**
  * `frontend/src/features/bingo/`;
  * Bingo import/routes from `frontend/src/App.tsx`;
  * Bingo header link from `frontend/src/components/BookShell.tsx`;
  * Bingo-specific magic-link redirect from `frontend/src/components/BackendGate.tsx`;
  * `supabase/migrations/20260727000100_vision_action_bingo.sql`;
  * `supabase/tests/bingo_*.sql`;
  * Bingo PRD, research, orchestration, seed, handoff, and implementation-status files;
  * active Bingo decisions/sources/status references after a full text audit.
* **Preserve:**
  * all accepted planner UI, sync, cache/recovery, habit-sheet, weekly-planner, and stale-date fixes;
  * planner migrations including `20261011000100_extend_planner_document_save_timeout.sql` pending remote verification;
  * planner schema/tests and production handoff material;
  * ignored `frontend/.env.local` and all production configuration values.
* **Repository hygiene:** Remove generated `supabase/.temp/` from the working tree and ignore it durably if not already ignored. Add branch/deployment hygiene rules to `AGENTS.md`.
* **Gate:** Working tree contains only intentional planner/current-repository changes; no source import references a removed path.

### P3 — Local, repository, and database verification

* **Mode:** Sequential; remote checks are read-only.
* **Checks:**
  * `npm run typecheck`;
  * `npm test`;
  * `npm run build`;
  * local smoke tests for `/`, `/day/:date`, `/week/:monday`, `/habits/:start`, and `/month/:year/:month`;
  * confirm `/vision/board` has no feature route and resolves through the normal unknown-route fallback;
  * scan source and built assets for Bingo identifiers;
  * `git diff --check` and focused diff review;
  * secrets/PII scan for every future staged file;
  * read-only Supabase migration/schema verification proving that no Bingo migration/tables/RPCs exist remotely.
* **Unexpected database gate:** If any remote Bingo object exists, stop. Back up/inventory it and request separate destructive approval; do not drop it automatically.
* **Gate:** All checks pass, no Bingo is bundled, planner backend remains untouched, and no unresolved high-risk finding remains.

### P4 — Commit and push the cleanup branch

* **Mode:** Sequential Git batches with separate approvals.
* **Tasks:** Stage only reviewed files; repeat PII/secrets scan; commit with the owner-approved message; push `chore/planner-repository-cleanup`.
* **Suggested commit intent:** `Consolidate clean Digital Planner production baseline`.
* **Gate:** Remote cleanup branch matches the verified local commit and contains no credentials or Bingo implementation.

### P5 — Make `main` canonical

* **Mode:** Sequential and evidence-gated.
* **Tasks:** Fetch current remote refs; prove whether `origin/main` is an ancestor of the cleanup branch; review any divergence. Merge through a PR or a non-rewriting fast-forward/merge commit. Never force-push.
* **Divergence gate:** If remote `main` contains unique commits, stop and present them before choosing a merge strategy.
* **Gate:** GitHub `main` contains the verified planner baseline and all required planner backend files. Production remains on its existing deployment until P6 succeeds.

### P6 — Bind production to `main`

* **Mode:** Sequential external-state change with explicit approval.
* **Tasks:** Connect the existing Vercel `digital-planner` project to the GitHub repository; set `main` as the sole production branch; preserve existing environment variables; deploy; verify root and direct routes, Auth entry, planner load, save/reload, and representative cross-device sync.
* **Rollback:** Keep the currently working deployment available until the new `main` deployment is healthy; use Vercel rollback if required.
* **Gate:** Permanent URL serves the `main` commit, no Bingo is bundled, and owner confirms the planner works.

### P7 — Remove obsolete branches and close out

* **Mode:** Sequential destructive Git batches with explicit approval.
* **Tasks:** Re-inventory merged/obsolete refs. Delete local `feature/vision-action-bingo-v1`, local/remote obsolete foundation branches, the cleanup branch after merge, and `release/daily-planner-v1` only after `main` production verification. Never delete an unmerged unique commit. Update `PROJECT_STATUS.md` and this status file; remove temporary cleanup artifacts if the owner wants the leanest possible tree.
* **Target:** local `main`, remote `origin/main`, and no obsolete feature/release refs.
* **Gate:** Clean working tree, production linked to `main`, planner checks pass, branch inventory is unambiguous, and final handoff is recorded.

## 6. Parallelization rules

* No parallel writes: `App.tsx`, navigation, status documents, Git refs, migrations, and deployment state are shared boundaries.
* Read-only validation may run concurrently only after P2 edits are complete.
* Database verification and Vercel changes remain sequential and owner-approved.
* Any unexpected diff, remote object, branch divergence, or secret match stops the current phase.

## 7. Quality and safety gates

| Must-have outcome | Required evidence |
|---|---|
| Live planner behavior preserved | Passing typecheck/tests/build, local route smoke tests, production owner acceptance |
| Bingo absent from active repository | No feature directory, route, link, SQL/test/spec files, or built-bundle identifiers |
| Planner data untouched | Read-only DB inspection before deployment; no data mutation during cleanup |
| No accidental database residue | Remote migration/schema inventory; destructive follow-up only if separately approved |
| One canonical branch | GitHub and local inventories show `main` as the production source; obsolete refs removed after merge |
| Branches cannot leak to production | Vercel Git integration uses `main` for production and feature branches only for previews |
| No secret exposure | Ignored credentials remain untracked; staged-file sensitive-data scan passes |
| Recoverable execution | P1 archive manifest plus Vercel rollback retained until final verification |
| No history rewrite | No force-push, destructive reset, or published-history rewrite |

## 8. Session continuity

Canonical status: [`PLANNER_REPOSITORY_CLEANUP_STATUS.md`](PLANNER_REPOSITORY_CLEANUP_STATUS.md).

At every phase boundary, update completed evidence, current branch/commit, checks, blockers, and the next exact action. An incomplete session must leave production unchanged or explicitly record the verified rollback path. Completion requires all P7 gates.

Restart inspection order:

1. `AGENTS.md`
2. this orchestration document
3. `PLANNER_REPOSITORY_CLEANUP_STATUS.md`
4. `PROJECT_STATUS.md`
5. current Git status/refs/diff
6. live deployment and read-only backend health

## 9. Exact kickoff/resume prompt

```text
Resume PLANNER-REPOSITORY-CLEANUP-V1 from the repository root.
Read AGENTS.md, planner-repository-cleanup-orchestration.md,
PLANNER_REPOSITORY_CLEANUP_STATUS.md, and PROJECT_STATUS.md. Inspect actual Git,
working-tree, live-deployment, and read-only backend evidence. Continue only from
the first incomplete approved gate. Present each destructive, Git, database, or
deployment batch with exact commands and risks, and wait for explicit approval.
Do not rewrite history, expose credentials, alter planner data, or deploy Bingo.
Do not delegate write work; maintain the status file after each completed phase.
```
