# Digital Planner Daily Navigation and Page Turn — Implementation Orchestration

> **Spec ID:** `DAILY-NAV-FLIP-V1`
> **Document role:** Implementation execution source of truth
> **Implements:** `prd.md`, `design-brief.md`, `decision-list.md`, and the approved 2026-07-23 navigation/page-turn correction
> **Status:** `PROJECT_STATUS.md`
> **Repository instructions:** `AGENTS.md` and `CLAUDE.md`

## 1. Objective and boundaries

Plan-and-run the Daily Planner navigation correction:

* make the displayed year open a book-like month overview;
* show every Monday–Sunday week intersecting that month, with direct day access;
* provide previous/next-month navigation;
* preserve the compact selected-week/seven-day navigation on daily pages;
* replace the spread-wide fade/rotation with the Claude prototype's directional single-leaf 3D page turn.

Backend persistence, new planner page types, and broader visual redesign are excluded.

## 2. Repository and architecture baseline

* React 18, TypeScript, Vite, and React Router.
* Daily routes use `/day/:date`.
* `BookShell` owns calendar chrome; `Spread` owns physical-book presentation.
* The archived prototype in `design-handoff/Planner Explorations.dc.html` is the page-turn interaction reference.
* Existing uncommitted Daily Planner refinements must be preserved.
* Month views include all intersecting weeks; calendar months can require four, five, or six week rows.

## 3. Agent/model assignment

| Role | Capability tier | Resolved model/effort | Scope | Write ownership |
|---|---|---|---|---|
| Primary implementation/integration | Tier A | Current Codex model, high effort | Architecture, routing, month view, page-turn integration, tests, documentation | Relevant frontend and planning/status files |
| Independent QA reviewer | Tier A | Runtime-selected Codex agent, high effort | Read-only acceptance, UX, accessibility, regression, and test-gap review | None |

## 4. Dependency graph

```text
Prototype/code inspection
        ↓
Month route + navigation ──→ integration checks
        ↓                         ↓
Directional leaf turn ─────→ browser verification
                                  ↓
                         independent QA review
                                  ↓
                           fixes + final gates
```

The routing and page-turn work are sequential because they share `App.tsx`, `BookShell.tsx`, `Spread.tsx`, and `index.css`.

## 5. Phase plan

### Phase 1 — Architecture and interaction

* Mode: sequential.
* Deliverables: month route/helpers, clickable year, full month-week navigation, true single-leaf turn.
* Validation: TypeScript and production build.
* Gate: every day in the selected month is reachable, adjacent months are reachable, and only one half-page animates during a day/month turn.

### Phase 2 — Browser verification

* Mode: sequential.
* Checks: desktop and phone route behavior, week counts, exact-day navigation, previous/next month, corner turns, animation DOM/CSS geometry, reduced motion, keyboard access.
* Gate: checks pass with no runtime error.

### Phase 3 — Independent QA and fixes

* Mode: read-only review, then sequential fixes.
* Checks: specification compliance, UX, accessibility, regressions, code quality, and missing tests.
* Gate: no unresolved critical/high findings; typecheck and build rerun.

## 6. Parallelization rules

No parallel write work is permitted because the affected routing and book components overlap. Independent QA is read-only and begins only after implementation checks pass.

## 7. Quality and safety gates

| Acceptance criterion | Evidence |
|---|---|
| Clicking the displayed year opens its month overview | Browser route and interaction check |
| Every calendar date remains reachable | Month-week generation test across four-, five-, and six-week months |
| A date three weeks ahead can be selected directly | Browser interaction check |
| Adjacent months are reachable | Previous/next month browser check |
| Page turn animates one leaf, not the whole spread | DOM/CSS geometry and browser animation-state check |
| Forward and backward turns are directional | Browser state/class check |
| Navigation remains keyboard accessible | Semantic link/button inspection |
| Existing Daily Planner behavior remains intact | Typecheck, build, targeted interaction regression checks |

No external data, deployment, secrets, or destructive operations are in scope.

## 8. Session continuity

`PROJECT_STATUS.md` is the durable status file. Restart inspection order:

1. `AGENTS.md`
2. this orchestration document
3. `PROJECT_STATUS.md`
4. `decision-list.md`
5. current working tree and frontend implementation

The work is incomplete until browser checks and independent QA pass and status evidence is updated.

## 9. Exact kickoff/resume prompt

> Resume `DAILY-NAV-FLIP-V1` in `/Users/pallavi/Documents/Projects/Digital Planner`. Read `AGENTS.md`, `daily-navigation-orchestration.md`, `PROJECT_STATUS.md`, and `decision-list.md`; inspect repository evidence and continue from the first incomplete gate. Preserve existing uncommitted Daily Planner changes, delegate only bounded non-overlapping work, run independent read-only QA, and keep `PROJECT_STATUS.md` current.
