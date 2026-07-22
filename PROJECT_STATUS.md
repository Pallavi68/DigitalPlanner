# Project Status

Last updated: 2026-07-22

## Current objective

Dogfood the new persistent Successful Day checklist setup and routine time-blocking flow.

## Current working state

The untouched Claude Design export remains archived under `design-handoff/`. The maintained React 18, TypeScript, and Vite application now lives under `frontend/`.

The maintained app is locally runnable and currently provides:

* root routing to today's Daily Page
* dated Daily Page routes at `/day/:date`
* a safe fallback from invalid or unknown routes to today
* the existing book shell and responsive spread
* the Successful Day routine checklist
* numbered Daily To Dos `01–15`
* the 8:00 AM–2:00 AM Time Alignment grid
* evening wind-down controls
* local persistence through the existing `localStorage` adapter
* explicit local-save status wording that does not imply cloud sync
* paper-consistent Successful Day Setup opened beside the daily checklist
* add, edit, archive, drag/button reorder, AM/PM/automatic preference, and 30-minute-to-8-hour routine durations
* deterministic automatic AM/PM balancing with a live two-column preview
* date-effective routine revisions and per-day checklist snapshots that preserve past pages while reconciling today/future pages
* routine drag handles plus a keyboard/button Time Alignment placement flow
* duration-sized, daily-instance-linked routine blocks with duplicate-placement confirmation
* safe migration of legacy v1 local state into the v2 routine/snapshot model

## Completed in the runnable-foundation milestone

* Copied `design-handoff/planner-app/` to the maintained `frontend/` directory without changing the archive.
* Installed the npm dependencies and created `frontend/package-lock.json`.
* Corrected the TypeScript build command/configuration.
* Added the missing top-level app and minimum Daily Page composition.
* Composed the Planner, Toast, and Drag providers.
* Removed links to unavailable future pages from the maintained navigation.
* Recorded the five approved durable product decisions in `decision-list.md`.
* Fixed three exported TypeScript errors: two unused imports and the demo-block tag inference.

## Completed in the daily-checklist milestone

* Extended the existing local-first storage model with routine revision history and date-scoped routine instances.
* Added the Successful Day Setup editor and responsive paper styling.
* Added daily completion persistence against snapshot instances.
* Added pointer and non-drag scheduling paths using each routine's default duration.
* Preserved the storage-adapter seam for a future cloud implementation.
* Added a real drag threshold and full calendar-boundary drop detection so clicks and left-page releases cannot create blocks.
* Made 30-minute schedule blocks usable for moving, completion, and deletion, with linked completion synchronized both ways.
* Reconciled edited or archived routines with today/future linked blocks while preserving past dates.
* Added an explicit failed local-save state and retry action.

## How to run

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The default local URL is:

```text
http://localhost:5173/
```

Useful checks:

```bash
cd frontend
npm run typecheck
npm run build
npm run preview
```

## Verification status

Verified on 2026-07-21:

* `npm install` — passed; 70 packages installed and lockfile created.
* `npm run typecheck` — passed.
* `npm run build` — passed with Vite 5.4.21; 51 modules transformed.
* Development server — passed at `http://127.0.0.1:5173/`.
* Root and dated-route HTTP checks — passed with HTTP 200 responses.
* Headless Chrome render — passed; the Daily Page rendered rather than a blank screen, and no application runtime errors were observed.
* `design-handoff/` integrity — checksum unchanged after implementation.

No lint or automated-test configuration is present yet, so those checks could not be run.

Verified on 2026-07-22:

* `npm run typecheck` — passed.
* `npm run build` — passed with Vite 5.4.21; 54 modules transformed.
* Development server started successfully at `http://127.0.0.1:5173/`.
* A follow-up headless-browser DOM check did not complete cleanly because the local Chrome process/profile stalled; interactive setup, drag/drop, and narrow-screen behavior still need manual browser QA.
* Follow-up QA review passed the reported checklist flicker, drag threshold/bounds, quick-add duration, 30-minute block controls, linked completion, D12 reconciliation, save retry, XSS, repo-safety, and code-hygiene checks by static inspection.

## Remaining work

The following intentionally remain unavailable pending review and later milestones:

* Two-Week Habit Planner
* Running Short To-Do List
* Running Long To-Do List
* first-run setup
* Settings, including the approved globally configurable Time Alignment window
* complete previous/next-day navigation and date selection
* chore drag sources and manual fixed-commitment UI
* cloud sync, authentication, and cross-device persistence
* automated migration/validation tests
* linting and automated tests
* deployment configuration

## Known limitations

* State is stored only in the current browser's `localStorage`; cross-device synchronization does not work yet.
* The focused feature PRD's Supabase persistence, anonymous device identity, RLS, network retry/error states, and cloud import flow are deferred under locked decision D9 because no provider/configuration has been approved. Current save feedback accurately reports local state only.
* The Time Alignment window is still fixed at its approved default of 8:00 AM–2:00 AM until Settings is implemented.
* The initial state contains recurring configuration but no setup UI; unavailable pages are not linked.
* Google Fonts require a network connection; fallback fonts are used if they cannot load.
* `npm install` reported two dependency audit findings (one moderate and one high). No forced breaking upgrade was applied during this focused milestone.
* Responsive layout and detailed drag interactions have not yet received full manual device testing.

## Sources of truth

* Product requirements: `prd.md`
* Approved visual direction: `design-brief.md`
* Durable decisions: `decision-list.md`
* Agent workflow: `AGENTS.md`
* Archival design handoff: `design-handoff/`
* Maintained implementation: `frontend/`
