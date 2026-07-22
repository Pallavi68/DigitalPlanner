# Project Status

Last updated: 2026-07-21

## Current objective

Review the runnable Daily Page foundation before implementing the remaining v1 pages and flows.

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

## Completed in the runnable-foundation milestone

* Copied `design-handoff/planner-app/` to the maintained `frontend/` directory without changing the archive.
* Installed the npm dependencies and created `frontend/package-lock.json`.
* Corrected the TypeScript build command/configuration.
* Added the missing top-level app and minimum Daily Page composition.
* Composed the Planner, Toast, and Drag providers.
* Removed links to unavailable future pages from the maintained navigation.
* Recorded the five approved durable product decisions in `decision-list.md`.
* Fixed three exported TypeScript errors: two unused imports and the demo-block tag inference.

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

## Remaining work

The following intentionally remain unavailable pending review and later milestones:

* Two-Week Habit Planner
* Running Short To-Do List
* Running Long To-Do List
* first-run setup
* Settings, including the approved globally configurable Time Alignment window
* complete previous/next-day navigation and date selection
* routine/chore drag sources and manual fixed-commitment UI
* approved linked-item deletion/reassignment reconciliation
* cloud sync, authentication, and cross-device persistence
* storage migrations and validation
* linting and automated tests
* deployment configuration

## Known limitations

* State is stored only in the current browser's `localStorage`; cross-device synchronization does not work yet.
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
