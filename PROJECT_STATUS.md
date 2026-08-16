# Project Status

Last updated: 2026-08-12

## Current objective

`DAILY-TODO-OVERFLOW-V1` is implemented locally. The Daily To Dos still open with the paper-like 01–15 rows, while an explicit `+ Add another to-do` control now creates, reveals, and focuses row 16 and later rows. Extra rows are collapsed by default and can be shown or collapsed without deleting their persisted content. The existing Enter-to-continue behavior, stable IDs, linked Time Alignment behavior, and planner persistence contracts are unchanged. See `daily-todo-overflow-orchestration.md`.

`PLANNER-SYNC-RELIABILITY-V1` has replaced the slow per-edit normalized aggregate rewrite with a fast owner-scoped planner document while preserving all existing normalized rows as rollback evidence. Before any mutation, the laptop cache and Supabase were audited at the same revision with no unsaved laptop payload: 24 dated pages, 50 written Daily To Dos, 64 Time Alignment blocks, and 180 routine instances. A protected browser-storage snapshot was created outside the repository.

Important 2026-08-12 incident and recovery: the first document client automatically preferred any device-local unsaved recovery payload during startup. A stale phone payload subsequently overwrote the correct document with an older 21-day/29-to-do state, removing the visible August 12 content. The bad document and current laptop storage were backed up. The document was restored under optimistic revision control from the laptop cache, which matched the untouched legacy database. Final verified state is again 24 days, 50 written to-dos, 64 blocks, and 180 routines; August 12 has the same six written to-do IDs, six block IDs, and three completed routines as the protected source. The deployed prevention build no longer auto-promotes local recovery data: it requires explicit confirmation and explicit Retry before any cloud replacement.

The additive migration `20260812000100_planner_document_sync.sql` is applied and the new frontend is deployed at the permanent production URL. Each save now uses atomic optimistic revision control and an independent remote read-back before clearing the local unsaved journal or showing `Synced`. Convergence no longer depends on Realtime alone: reconnect, focus, visibility, and a 15-second visible-tab poll all trigger authoritative catch-up.

Owner acceptance on 2026-08-12: after the emergency restoration and prevention deployment, the owner confirmed that syncing is happening correctly across the laptop and phone. `PLANNER-SYNC-RELIABILITY-V1` is complete. Do not remove the legacy normalized data or recovery safeguards without explicit approval.

Production RPC verification passed six alternating client cycles (three each direction), with saves in 211–377 ms and reads in 168–297 ms; the reversible test edit was removed and the final content counts remain unchanged. Local typecheck, 50 tests, build, isolated migration dry run/application, and linked schema lint all pass. Physical-device acceptance also passed. See `PLANNER_SYNC_RELIABILITY_STATUS.md`.

The Daily Planner is live at `https://digital-planner-plum.vercel.app` from the pushed `release/daily-planner-v1` baseline plus two currently uncommitted launch fixes. Vercel production environment variables and Supabase Auth Site URL/redirect URLs are configured. Email magic-link authentication, production writes, reload persistence, and cross-device persistence were owner-verified. The paused Bingo prototype is neither routed nor bundled and remains unapplied/uncommitted.

Production testing exposed two launch defects. Missing Realtime publication membership was fixed by `20260805000100_enable_planner_realtime.sql`, which is applied to the linked Supabase project; the post-apply dry run reports the database up to date and linked schema lint passes. A laptop tab later failed with `InvalidJWTToken: Token has expired`; `frontend/src/backend/auth.ts` and `frontend/src/backend/plannerBackend.ts` now explicitly refresh sessions that are expired or within 60 seconds of expiry before planner loads/saves. That frontend fix is deployed and locally verified, but the owner paused before repeating the final no-refresh laptop-to-phone Realtime test.

On 2026-08-07 the owner reported a laptop showing `Sync failed` while the phone showed `Synced` without the laptop's new items. The frontend's Realtime invalidation could be silently missed while a local save was in flight, and a disconnected/stale phone could retain the `Synced` label because that label described only its last confirmed write. The working-tree fix now keeps one stable Realtime subscription, queues invalidations received during saves, catches up after subscription/reconnection and whenever the tab becomes visible or focused, and preserves explicit unsaved-device recovery data instead of overwriting it with a refetch. Magic-link authentication now returns to the root route, which opens today's page, rather than preserving an old dated URL.

The 2026-08-07 recovery is now complete. The production laptop's newer unsaved payload was backed up before any mutation, then uploaded as the authoritative owner state and read back from Supabase at the identical revision. The recovered permanent state contains 20 dated planner pages, 29 written Daily To Dos, and 40 Time Alignment blocks. The original 30-second planner-save limit was insufficient for this payload, so `20260807000100_extend_planner_save_timeout.sql` raises only the authenticated aggregate-save RPC to a bounded 120 seconds; the isolated migration was applied without Bingo and the post-apply dry run reports the remote database up to date. The Realtime/default-today frontend fix is deployed and aliased to the permanent production URL.

`DAILY-RECURRING-SCHEDULE-V1` is implemented and its planner-only Supabase migration is applied. Authenticated browser round-trip and cross-device persistence verification pass. Final Realtime-after-token-refresh, offline/conflict, historical-boundary, and representative recurring-schedule browser acceptance remain.

Resume remote validation from `DAILY_RECURRING_SCHEDULE_HANDOFF.md`; do not redo completed implementation/QA work.

The Supabase backend and planner migrations are applied to the linked `Digital-Planner` project. The exact resume checklist and protected working-tree state are in `PRODUCTION_LAUNCH_HANDOFF.md`.

`VISION-ACTION-BINGO-V1` is paused. A substantial first prototype exists uncommitted on `feature/vision-action-bingo-v1`, but the owner explicitly did not approve its latest cadence/board direction and chose to return later. Do not treat the 22×22/four-quadrant design or current action semantics as settled. The canonical pause/restart details are in `VISION_ACTION_BINGO_IMPLEMENTATION_STATUS.md`.

For the next separate chat, the prior Supabase backend thread is the intended workstream. Start from `BACKEND_IMPLEMENTATION_STATUS.md` and `digital-planner-backend-orchestration.md`, preserve every existing uncommitted file, and re-inspect actual repository state before taking action.

The next session should resume in this order:

1. Refresh/sign in on laptop and phone, confirm both show `Synced`, then repeat a no-refresh laptop-to-phone edit and record latency.
2. If Realtime succeeds, run offline/reconnect/conflict, historical-boundary, and representative Week 1/Week 2 recurring-schedule checks from `PRODUCTION_LAUNCH_HANDOFF.md` and `supabase/README.md`.
3. Update status with results, review the focused launch-fix diff, scan it for sensitive data, and request approval before staging/committing/pushing it.
4. Connect Vercel to GitHub after the owner adds a GitHub Login Connection in Vercel; the production deployment is live but future GitHub auto-deploy is not configured.

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
* numbered Daily To Dos beginning with `01–15`, with Enter-to-add growth, an explicit add-beyond-15 control, collapsible overflow rows, and per-item deletion
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
* queued Realtime catch-up after local saves, reconnects, tab focus, and tab visibility changes
* standalone Time Alignment items created directly from any ruled time slot or the `+ Add item` control, with configurable start time and 30-minute-step duration
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

Verified locally on 2026-08-13 for the Two-Week Habit Sheet:

* Two-week habit-sheet windows are Monday-anchored, so each sheet now begins on Monday and ends on Sunday.
* Added consecutive 14-day habit sheets reachable from Month Overview and at `/habits/:start`; cross-month windows are linked from both months as one shared record.
* Added the six requested default categories, owner-added categories, multiple activities in every category/day cell, direct day links, editing, deletion, and completion.
* Refined the sheet with a category manager for renaming and up/down reordering, a single compact `+` entry affordance per cell, alternating pastel day headers and category labels, and explicit blank/✓/✕ activity outcomes.
* Every habit-sheet activity automatically surfaces in that date's existing Daily To Dos; edits and completion reconcile bidirectionally, including linked Time Alignment completion.
* A ✕ remains a habit-sheet miss and deliberately leaves the corresponding Daily To Do incomplete; completing from either surface produces ✓.
* Aggregate planner schema migration now safely defaults the new collections for existing cloud documents.
* `npm run typecheck` — passed.
* `npm test` — passed: 12 files, 70 tests.
* `npm run build` — passed: 115 modules transformed.
* Local Vite startup — passed at `http://127.0.0.1:5173/`; authenticated interactive browser acceptance remains pending.
* Git feature release — committed as `89029c5 Add two-week habit planner` on `release/daily-planner-v1` after the required sensitive-data scan.
* Vercel production deployment — READY as deployment `dpl_2SR5vfJSq99NUB57rGTQEGFfbNcn` and aliased to `https://digital-planner-plum.vercel.app`.
* Production route verification — root, `/month/2026/8`, and `/habits/2026-08-29` return HTTP 200; the deployed bundle contains the two-week sheet, category manager, and ✓/✕ interactions.
* Deployment isolation — production was built from a clean archive of commit `89029c5`; paused Bingo files, the unrelated working-tree lockfile change, and other uncommitted files were excluded.

Verified locally on 2026-08-13 for the Weekly Planner navigation shortcut:

* Every Daily Page now shows a persistent `Plan week` link beside sync status and targets the Monday-anchored week containing the displayed date.
* `npm run typecheck` — passed.
* `npm test` — passed: 11 files, 66 tests.
* `npm run build` — passed: 112 modules transformed.
* Owner local acceptance — passed for the Weekly Planner appearance and the new direct navigation shortcut.
* Git release — committed and pushed to `release/daily-planner-v1` as `a1e9923 Add weekly action planner` after the repository Git-skill sensitive-data scan.
* Vercel production deployment — READY and aliased to `https://digital-planner-plum.vercel.app`; root and direct `/week/2026-08-10` routes return HTTP 200, and the deployed bundle contains the Weekly Planner route and navigation labels.
* Deployment isolation — production was built from a clean archive of commit `a1e9923`; paused uncommitted Bingo files and unrelated working-tree files were not uploaded.

Verified locally on 2026-08-12 for `WEEKLY-PLANNER-V1`:

* Implemented a Monday–Sunday Weekly Planner at `/week/:monday`, reached from each Month Overview week while preserving individual day links.
* Added flat single-entry and multiline-paste weekly capture, scheduled/completed markers, day summaries, previous/next week navigation, desktop drag/drop, explicit touch drag handle, and accessible Assign/Move controls.
* Assigning appends one linked item after the destination day's written Daily To Dos; supported moves preserve identity/completion and remove the old daily surface and its linked Time Alignment blocks.
* Daily edit, completion, and deletion reconcile back to the weekly source; stale IDs and duplicate daily source references are repaired without silent duplication.
* Weekly actions persist inside the existing versioned aggregate planner document; old and malformed payloads hydrate safely without a new SQL migration.
* `npm run typecheck` — passed.
* `npm test` — passed: 11 files, 66 tests.
* `npm run build` — passed: 112 modules transformed.
* Independent UX/data-integrity reviews — prior high-severity stale-link defect fixed and re-review clear of blocking/high findings.
* Local Vite startup — passed. Isolated headless Chrome reached the Supabase sign-in page; authenticated Weekly Planner browser interaction, cross-device persistence, and hands-on phone/tablet touch acceptance remain pending owner-session verification.

Verified locally on 2026-08-12 for `DAILY-TODO-OVERFLOW-V1`:

* Root/today behavior — confirmed by code inspection: `/` and invalid routes intentionally redirect to `/day/${todayISO()}`, and `todayISO()` uses the device-local `new Date()` value.
* `npm run typecheck` — passed.
* `npm test` — passed: 10 files, 50 tests.
* `npm run build` — passed: 108 modules transformed.
* Headless Chrome local startup/render — reached the expected authentication screen; the authenticated add/collapse/reopen interaction could not be exercised from the clean profile without initiating owner sign-in.

Verified during production launch on 2026-08-05/06:

* Vercel production deployment — READY at `https://digital-planner-plum.vercel.app`.
* Production root and direct `/day/2026-08-05` route — HTTP 200.
* Supabase Auth Site URL and allowed redirects — configured for the permanent Vercel URL; localhost retained for development.
* Owner email magic-link authentication — passed on laptop and phone.
* Production write, successful-save indicator, refresh persistence — passed.
* Cross-device persistence after refresh — passed in both directions; phone save was noticeably slow.
* No-refresh Realtime before database fix — failed; `planner_profiles` was absent from `supabase_realtime`.
* Planner-only Realtime migration dry run — listed only `20260805000100_enable_planner_realtime.sql`; Bingo excluded.
* Realtime migration application — passed; post-apply dry run reports remote database up to date.
* Linked Supabase schema lint after Realtime migration — passed with no errors.
* Token-refresh frontend fix: `npm run typecheck`, `npm test` (9 files, 47 tests), and `npm run build` (107 modules) — passed.
* Token-refresh frontend production deployment — READY and aliased to the permanent URL.
* Final fresh-session no-refresh Realtime retest — pending because the owner paused.
* 2026-08-07 Realtime catch-up/default-today fix: `npm run typecheck`, `npm test` (9 files, 47 tests), and `npm run build` (107 modules) — passed; two-device production recovery/retest remains pending deployment.
* 2026-08-07 laptop recovery — passed: protected local payload extracted from a copied browser profile, Supabase save/read-back revisions matched exactly, and read-back contained 20 dated pages, 29 written Daily To Dos, 40 time blocks, and 140 routine instances.
* 2026-08-07 production redeployment — READY and aliased to `https://digital-planner-plum.vercel.app`; root returned HTTP 200.
* `20260807000100_extend_planner_save_timeout.sql` — isolated dry run listed only this planner migration, application passed, and the post-apply dry run reports the remote database up to date.
* 2026-08-07 standalone Time Alignment creation: `npm run typecheck`, `npm test` (9 files, 47 tests), and `npm run build` (107 modules) — passed; Vercel production deployment is READY, aliased to the permanent URL, and returns HTTP 200.

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
* Running Short To-Do List
* Running Long To-Do List
* first-run setup
* Settings, including the approved globally configurable Time Alignment window
* chore drag sources and manual fixed-commitment UI
* automated migration/validation tests
* linting and automated tests
* finish no-refresh Realtime verification after the deployed token-refresh fix
* complete offline/conflict and historical-boundary verification; authenticated login, reload persistence, and cross-device persistence already pass
* browser-verify Week 1/Week 2 materialization, automatic blocks, colors, linked completion, and reopen deduplication against live Supabase
* revisit the paused Bingo product direction before resuming any Bingo implementation or deployment
* owner-verify the Weekly Planner in an authenticated browser and on a touch device, including paste, drag/Assign, move, Daily completion/edit/delete reconciliation, refresh persistence, and second-device sync

## Backend handoff

Backend implementation source of truth:

* `prd.md` defines the cross-device, offline-tolerant product requirement and the daily, to-do, chore, habit, and schedule behavior.
* `daily-checklist-feature-prd.md` defines the proposed Supabase persistence model for recurring routine definitions, date-effective revisions, daily snapshots, completion, linked time blocks, anonymous identity, RLS, retries, and legacy local-state import.
* `digital-planner-backend-orchestration.md`
* `BACKEND_IMPLEMENTATION_STATUS.md`
* `supabase/README.md` and ordered migrations under `supabase/migrations/`

## Known limitations

* The Two-Week Habit Sheet uses a wide paper grid with horizontal scrolling on phone; hands-on touch-device approval and authenticated cross-device persistence verification remain pending.

* The permanent production URL and Auth redirects are configured. Realtime publication and expired-session recovery fixes are live, but their combined no-refresh two-device behavior needs the final fresh-session retest.
* Phone persistence works but saves were noticeably slow, and the owner deferred phone UI refinement to a later milestone.
* Vercel is not connected to GitHub because the Vercel account needs a GitHub Login Connection; deployments currently use the authenticated CLI.
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
* Weekly Planner specification: `weekly-planner-feature-prd.md`
* Weekly Planner execution plan/status: `weekly-planner-orchestration.md`, `weekly-planner-implementation-status.md`
