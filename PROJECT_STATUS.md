# Project Status

Last updated: 2026-08-04

## Current objective

The accepted Daily Planner is prepared on `release/daily-planner-v1` for its first production deployment. The release contains the Supabase-backed Daily Planner, recurring schedule, sync/timeout fixes, notes with persistent checklist lines, nightly exact-time blocks, Vercel SPA configuration, and planner-only database migrations. The paused Bingo prototype is neither routed nor bundled and its source/migration/tests remain unstaged. Local checks pass; Git publication, Vercel deployment, Supabase production Auth URL configuration, and production acceptance remain.

`DAILY-RECURRING-SCHEDULE-V1` is implemented locally and its planner-only Supabase migration is applied. It adds the owner's anchored two-week chore pattern, automatic Gym blocks on Monday/Tuesday/Thursday/Friday from 9:30 AM–12:00 PM, a daily 11:00 PM–12:00 AM wind-down block, draggable untimed chores, completion linkage, and blue Successful Day/purple chore treatments. `Moneymaker` is authoritative in Successful Day only; obsolete chore state is removed during migration. The paused Bingo migration remains unapplied. Authenticated browser round-trip verification is the remaining acceptance gate.

Resume remote validation from `DAILY_RECURRING_SCHEDULE_HANDOFF.md`; do not redo completed implementation/QA work.

The Supabase backend implementation is locally complete and the four approved planner migrations are applied to the linked `Digital-Planner` Supabase project. Local frontend credentials are configured, email auth is enabled, remote schema lint passes, and unauthenticated planner access is rejected. The next objective is to deploy the frontend to one stable production URL with the existing magic-link method unchanged and the paused Bingo prototype hidden but preserved, then complete owner-authenticated data-flow, Realtime, offline/conflict, historical-boundary, and two-device verification.

`VISION-ACTION-BINGO-V1` is paused. A substantial first prototype exists uncommitted on `feature/vision-action-bingo-v1`, but the owner explicitly did not approve its latest cadence/board direction and chose to return later. Do not treat the 22×22/four-quadrant design or current action semantics as settled. The canonical pause/restart details are in `VISION_ACTION_BINGO_IMPLEMENTATION_STATUS.md`.

For the next separate chat, the prior Supabase backend thread is the intended workstream. Start from `BACKEND_IMPLEMENTATION_STATUS.md` and `digital-planner-backend-orchestration.md`, preserve every existing uncommitted file, and re-inspect actual repository state before taking action.

The next session should prepare production deployment in this order:

1. Hide/disable Bingo routes and navigation while preserving all existing Bingo files and backend work; do not apply the Bingo migration.
2. Add hosting configuration for the current frontend without changing the email magic-link authentication method.
3. Run typecheck, all tests, production build, and browser verification.
4. Review the full deployment diff and complete the Git skill's sensitive-data scan.
5. Request explicit approval before staging, committing, or pushing the exact deployment source.
6. Deploy to one permanent URL, add it to Supabase Auth redirect configuration, and run the authenticated/two-device checklist in `supabase/README.md`.

## Current working state

The untouched Claude Design export remains archived under `design-handoff/`. The maintained React 18, TypeScript, and Vite application now lives under `frontend/`.

The maintained app is locally runnable and currently provides:

* root routing to today's Daily Page
* dated Daily Page routes at `/day/:date`
* a safe fallback from invalid or unknown routes to today
* every week intersecting the selected month, seven day tabs for the selected week, and four page-corner controls
* a clickable year that opens a book-like month overview with every calendar week intersecting that month
* previous/next-month corner navigation and direct access to every day in the month grid
* directional two-sided half-page leaf turns based on the archived Claude prototype, without animating the whole spread
* the existing book shell and responsive spread
* the Successful Day routine checklist
* numbered Daily To Dos beginning with `01–15`, with Enter-to-add growth and per-item deletion
* the 8:00 AM–2:00 AM Time Alignment grid
* evening wind-down controls on the left page beneath Daily To Dos
* local persistence through the existing `localStorage` adapter
* explicit local-save status wording that does not imply cloud sync
* paper-consistent Successful Day Setup opened beside the daily checklist
* add, edit, archive, drag/button reorder, AM/PM/automatic preference, optional routine duration, and optional default quick-add time
* deterministic automatic AM/PM balancing with a live two-column preview
* date-effective routine revisions and per-day checklist snapshots that preserve past pages while reconciling today/future pages
* routine drag handles plus a keyboard/button Time Alignment placement flow
* duration-sized, daily-instance-linked routine blocks with duplicate-placement confirmation
* safe migration of legacy v1 local state into the v2 routine/snapshot model
* Enter-to-next-line behavior in the numbered Daily To Dos
* bidirectional completion synchronization between daily to-dos and their linked Time Alignment blocks
* stable daily-to-do IDs with migration of legacy index-linked local state
* directional to-do deletion: source deletion removes linked blocks; schedule-only deletion preserves the source
* unobtrusive borderless checklist quick-add controls
* Supabase email magic-link authentication and `auth.uid()` ownership
* deterministic two-week chore recurrence anchored to Monday, 2026-08-10
* automatic Gym placement on Monday, Tuesday, Thursday, and Friday from 9:30 AM–12:00 PM while daily movement remains a seven-day Successful Day item
* automatic daily Night wind-down placement from 11:00 PM–12:00 AM with Vitamins, Skincare, and Clean down
* daily recurring chores with stable completion identity, manual drag/keyboard placement, and duplicate confirmation
* blue Successful Day/Gym schedule blocks and purple chore schedule blocks
* exact fractional Time Alignment blocks persisted through Supabase
* per-day deletion suppression for automatic Gym and evening blocks
* three individual evening blocks: Vitamins, Clean down, and Night-time skincare
* click-to-edit persisted notes on Time Alignment blocks with subordinate grey rendering
* persistent pencil control for reopening and extending any block's notes
* normalized Supabase schema/RPCs for planner data with forced RLS
* cloud persistence, Realtime invalidation, last-known cache, offline unsaved recovery, retry, and conflict feedback
* safe confirmed one-time migration with local backup and non-overwrite protection
* separate daily morning and evening skincare actions

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
* Added week/day navigation and previous/next page turns from all four page corners.
* Added a month overview route at `/month/:year/:month`, reachable from the displayed year.
* Replaced the spread-wide date-change animation with a single front/back 3D page leaf for forward and backward turns.
* Added short and optional checklist durations while preserving exact short block lengths.
* Added two-way completion synchronization for daily to-dos and linked schedule blocks.
* Replaced relative week tabs with every calendar week intersecting the selected month.
* Reduced the desktop header from two stacked navigation bands to one compact 46px row.
* Added stable-ID dynamic Daily To Dos and safe linked-block deletion.
* Added optional default quick-add times to date-effective Successful Day routine revisions and snapshots.
* Moved Wind-down to the left page and reserved the right page for Time Alignment.

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
npm test
npm run preview
```

## Verification status

Verified on 2026-08-04 for `DAILY-PLANNER-ACCEPTANCE-FIXES-V1`:

* `npm run typecheck` — passed.
* `npm test` — passed: 9 files, 47 tests.
* `npm run build` — passed: 133 modules; existing non-failing >500 kB warning remains.
* Isolated Supabase migration dry run/application/post-check — passed; Bingo excluded and remote database up to date.
* Linked schema lint — passed with no errors.
* Owner-authenticated UI round trip — pending.

Verified on 2026-08-04 after resolving Moneymaker to Successful Day only:

* `npm run typecheck` — passed.
* `npm test` — passed: 9 files, 46 tests.
* `npm run build` — passed: 134 modules; the existing non-failing >500 kB bundle warning remains.
* Focused migration regression — passed: obsolete Moneymaker chore definitions, marks, completion metadata, and linked blocks are removed while the Successful Day routine remains.
* Read-only linked Supabase migration check — could not complete because the CLI timed out while creating its temporary login role; no remote migration was applied.
* A temporary planner-only migration directory excluded Bingo and retained only the four applied planner migrations plus the recurring-schedule migration. After successful relinking, the dry run listed only `20260803000100_daily_recurring_schedule.sql`; application passed, the follow-up dry run reported the remote database up to date, and linked schema lint found no errors.

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

Verified on 2026-07-23:

* `npm run typecheck` — passed.
* `npm run build` — passed with Vite 5.4.21; 54 modules transformed.
* Local development server — passed at `http://127.0.0.1:5173/`.
* Automated Chrome interaction checks — passed for three week tabs, seven day tabs, four corner controls, previous-day navigation, Enter-to-next-line focus, to-do drag creation, bidirectional to-do/block completion, duration choices, exact five-minute scheduling, and no-duration checklist behavior.
* Checklist quick-add visual check — passed with no border and a transparent background.
* `DAILY-NAV-FLIP-V1` browser checks — passed for year-to-month navigation, direct access to 2026-08-13 from July, previous/next months, exact month day counts, and directional forward/back turns.
* Month calendar boundaries — passed against a four-week month (February 2021), five-week month (July 2026), and six-week month (August 2026).
* Page-turn geometry — passed with one animated leaf, two faces, 50% desktop spread width, no whole-spread animation, and cleanup after the transition.
* Month-view visual inspection — passed on desktop and at a 390px phone viewport after correcting cover-height stretch.
* Independent `DAILY-NAV-FLIP-V1` QA — passed after increasing the year and corner hit areas to 44×44 pixels; no critical, high, or unresolved medium findings remain.
* `DAILY-PLANNER-REFINE-V2` browser checks — passed for five July week tabs without relative labels, a 46px desktop header, dynamic row 16 creation/focus, left-source linked deletion, schedule-only deletion, optional default time at 10:00 AM, and left/right page composition.
* Legacy v2 local-state migration — passed: an index-linked daily to-do and block were preserved, mapped to the same stable ID, and remained directionally deletable.
* 390px phone check — passed with all five weeks and all seven selected-week days visible, no document-width overflow, stacked page layout, and Wind-down preceding Time Alignment.
* 768px tablet check — passed with all six August week tabs, all seven selected-week days, and no document-width overflow.
* Stable-ID completion regression — passed in both directions between a Daily To Do and its linked Time Alignment block.
* Independent `DAILY-PLANNER-REFINE-V2` QA — passed after partial first/last weeks were changed to open on an in-month date and mobile week, day, drag, and delete controls were increased to 44×44 pixels; no critical, high, or unresolved medium findings remain.
* Final `npm run typecheck`, `npm run build`, and `git diff --check` — passed after the independent QA fixes.

## Remaining work

The following intentionally remain unavailable pending review and later milestones:

* Vision-to-Action Bingo (`VISION-ACTION-BINGO-V1`) — paused; current prototype direction is not owner-approved
* Two-Week Habit Planner
* Running Short To-Do List
* Running Long To-Do List
* first-run setup
* Settings, including the approved globally configurable Time Alignment window
* chore drag sources and manual fixed-commitment UI
* automated migration/validation tests
* linting and automated tests
* complete owner-authenticated magic-link, planner data-flow, Realtime, offline/conflict, historical-boundary, and two-device verification; planner migrations and local environment variables are already configured
* browser-verify Week 1/Week 2 materialization, automatic blocks, colors, linked completion, and reopen deduplication against live Supabase
* revisit the paused Bingo product direction before resuming any Bingo implementation or deployment

## Backend handoff

Backend implementation source of truth:

* `prd.md` defines the cross-device, offline-tolerant product requirement and the daily, to-do, chore, habit, and schedule behavior.
* `daily-checklist-feature-prd.md` defines the proposed Supabase persistence model for recurring routine definitions, date-effective revisions, daily snapshots, completion, linked time blocks, anonymous identity, RLS, retries, and legacy local-state import.
* `digital-planner-backend-orchestration.md`
* `BACKEND_IMPLEMENTATION_STATUS.md`
* `supabase/README.md` and ordered migrations under `supabase/migrations/`

## Known limitations

* Planner migrations and local Supabase configuration exist, but the permanent production URL and its authenticated cross-device behavior remain unverified until Vercel deployment and Supabase Auth URL configuration are complete.
* Owner-local historical guards use a validated timezone with an Asia/Kolkata fallback, but midnight-boundary behavior still needs live verification.
* The Time Alignment window is still fixed at its approved default of 8:00 AM–2:00 AM until Settings is implemented.
* The recurring checklist has an editor, but the broader first-run setup flow is not implemented; unavailable pages are not linked.
* Google Fonts require a network connection; fallback fonts are used if they cannot load.
* `npm install` reported two dependency audit findings (one moderate and one high). No forced breaking upgrade was applied during this focused milestone.
* Responsive layout and detailed touch interactions still need hands-on device testing even though automated desktop interaction checks pass.
* The page-turn feel has automated and screenshot coverage but still needs subjective hands-on approval on the owner's browser and touch device.

## Sources of truth

* Product requirements: `prd.md`
* Approved Vision-to-Action Bingo feature: `vision-action-bingo-feature-prd.md`
* Vision-to-Action behavioral-design research: `research/vision-action-bingo-behavioral-design.html`
* Approved visual direction: `design-brief.md`
* Durable decisions: `decision-list.md`
* Agent workflow: `AGENTS.md`
* Archival design handoff: `design-handoff/`
* Maintained implementation: `frontend/`
* Current navigation orchestration: `daily-navigation-orchestration.md`
* Current Daily Planner refinement orchestration: `daily-planner-refinement-orchestration.md`
