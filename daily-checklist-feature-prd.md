# PRD: Persistent Daily Checklist and Routine Time-Blocking

> **Assumptions:**
> - The primary and only user is the planner owner.
> - An item with no AM/PM preference is automatically placed in the shorter visible column; ties alternate AM then PM, preserving global order within each column.
> - “Today forward” uses the device's current date in the owner's local timezone.
> - Checklist duration is configured in 30-minute increments for this milestone, matching the existing Time Alignment grid.
> - Supabase is the recommended backend. The first release uses an invisible anonymous device session: no login UI and no cross-device promise yet, but personal data is not left publicly writable.
> - This PRD is a focused increment of `prd.md`. If they conflict, the existing product-wide PRD and locked decisions remain authoritative unless a new decision is explicitly approved.

## 1. Summary

Build a control panel where the owner can add, edit, archive, classify, duration-estimate, and globally reorder the recurring items shown in the Daily Page's “Successful Day” checklist. Each day's rendered checklist and completion marks must be preserved in a real backend so historical days remain accurate after the routine changes. Checklist items must also be draggable into Time Alignment, initially occupying their configured duration while remaining resizable for that day.

This milestone does not build the automatic scheduler. It establishes the durable routine data and manual scheduling interaction that the future scheduler will consume.

## 2. Background / Context

The runnable Daily Page already renders seeded AM/PM routine items, records completion by date, and supports movable/resizable Time Alignment blocks. It currently stores everything in browser `localStorage`; there is no UI for managing routine items, and routine items are not drag sources.

The owner needs to change the master checklist occasionally, use the revised version from today onward, and still see exactly what existed and was completed on past dates. She also wants routine items such as skincare, vitamins, or physiotherapy to carry a normal duration and be manually placed on the day's calendar before automatic scheduling is attempted.

## 3. Problem Statement

The daily checklist is currently a fixed local prototype: the owner cannot manage its contents, safely preserve its history in a backend, or time-block its items. This prevents the planner from becoming a trustworthy daily record or a foundation for personalized scheduling.

## 4. Target Use

- **Primary user:** the owner, configuring routines occasionally and checking/scheduling them multiple times per day on the responsive web planner.
- **Secondary users:** none.
- **Not a target:** teams, shared lists, public accounts, or generalized recurring-task workflows.

## 5. Goals

- Let the owner maintain one global recurring checklist from a paper-like control panel.
- Make the intended AM/PM layout and ordering directly previewable and controllable.
- Preserve the checklist definition and completion outcome for every historical date.
- Persist checklist configuration, daily completion, and scheduled routine blocks in a backend.
- Let a routine item create a correctly sized Time Alignment block through drag-and-drop.
- Keep the data model usable by a future rules-based scheduler without building that scheduler now.

## 6. Non-Goals

- Automatic or AI-generated day planning.
- Natural-language preference collection or interpretation.
- Protected wind-down windows, conflict resolution, or automatic placement of multiple routines.
- Category-based colors; all routine blocks may use the existing routine color.
- Selecting weekdays for checklist items; every active item applies every day.
- Page-specific checklist order or duration overrides.
- User-facing sign-up, login, password recovery, or account management.
- Cross-device synchronization in this milestone.
- Offline mutation queues and sophisticated conflict resolution beyond clearly reporting failed saves.

## 7. User Jobs / Use Cases

1. **P0:** As the owner, I want to define my recurring checklist once so every current and future day uses it.
2. **P0:** As the owner, I want old days to retain their original items and labels so the planner remains an honest historical record.
3. **P0:** As the owner, I want a check or uncheck to survive reloads and be stored per date.
4. **P0:** As the owner, I want to arrange the AM and PM presentation in the control panel rather than editing each daily page.
5. **P0:** As the owner, I want to drag a checklist item into Time Alignment and have it use its normal duration automatically.
6. **P1:** As the owner, I want an item without a period preference to be balanced into available AM/PM space without extra setup.

## 8. Proposed Solution

Add a “Successful Day Setup” control-panel surface within the existing book experience. Each recurring item has a label, optional period preference (`AM`, `PM`, or automatic), default duration, global sort position, effective start date, and optional archived date. The editor includes a live two-column preview and drag handles so the owner can see and change the actual order shown on daily pages.

Daily checklist rows are date-specific snapshots, linked back to their recurring definition. On first opening a date, the backend materializes that day's applicable item label, resolved AM/PM column, order, and default duration. Completion is stored on that daily instance. This prevents later master-list edits from rewriting history.

Each checklist row is also a drag source. Dropping it onto Time Alignment creates a routine block linked to the daily checklist instance and sized from its configured duration. Resizing affects only that block on that date; it does not modify the recurring default.

Use Supabase Postgres for persistence. On first use, create an anonymous Supabase session silently and scope rows to that generated user identity using row-level security. This is authentication under the hood, but it presents no account UI and intentionally does not promise recovery or access from another device.

**Tradeoff:** materializing daily snapshots adds data compared with deriving every page live, but it makes historical fidelity and future-dated changes explicit and reliable—the behavior expected of a paper planner.

## 9. User Experience / Flow

### First use / migration

1. The app silently establishes an anonymous device session.
2. Existing seeded routine configuration is copied to the backend.
3. The current date's checklist is materialized from the active definitions.
4. If legacy `localStorage` data exists, the app offers one safe import attempt rather than silently discarding it; imported completion dates are preserved where they can be mapped reliably.
5. The owner sees the normal Daily Page, not an authentication screen.

### Configure the checklist

1. Open “Successful Day Setup” from a small, paper-consistent edit/settings affordance near the checklist.
2. See the two-column AM/PM preview in its current global order.
3. Add an item with label, optional AM/PM choice, and expected duration.
4. If no period is selected, the preview automatically assigns the new item to the shorter column; tied automatic assignments alternate starting with AM.
5. Drag rows within or between columns. A cross-column move makes that column an explicit preference; reordering changes the master sort order.
6. Save. The new configuration becomes effective today and applies to all future dates, while earlier snapshots remain unchanged.

### Daily completion

1. Open any date.
2. The page loads that date's checklist snapshot and completion marks from Supabase.
3. Tap a bubble to check or uncheck it.
4. Show the ink result immediately, then show a subtle saved, saving, or retry state.
5. Reloading or revisiting the date returns the stored value.

### Manual time-blocking

1. Press or grab the checklist row's drag handle without toggling its bubble.
2. Drop it on a Time Alignment slot.
3. A linked routine block appears with duration equal to the item's configured duration.
4. Move or resize the block in existing 30-minute increments.
5. The changed block duration is saved only for that date; the control-panel default is unchanged.

### Empty state

The control panel shows balanced blank ruled rows and a handwritten prompt to add the first routine. The Daily Page preserves its ruled-paper layout rather than displaying a generic empty card.

### Error / failure states

- A failed completion save leaves the optimistic ink mark visible with a small unsaved/retry indicator; retry uses an idempotent upsert.
- A failed configuration save keeps the editor open and preserves the entered values locally in memory until retry or navigation confirmation.
- If daily snapshot loading fails, do not substitute a newly derived checklist that could falsify history; show a quiet retry state.
- If a schedule drop cannot be saved, mark the block unsaved and allow retry or removal.

### Completion / success state

The configured order is reflected on today's page, past days remain unchanged, completion survives reload, and a dragged routine occupies the expected number of calendar slots.

## 10. Functional Requirements

| ID | Requirement | Priority | Notes / Acceptance Criteria |
|----|-------------|----------|-----------------------------|
| FR-1 | Checklist control-panel route or modal | P0 | Given the Daily Page, when the owner chooses the edit affordance, then a paper-consistent checklist editor opens without leaving the planner context. |
| FR-2 | Add and edit recurring items | P0 | Each item supports a non-empty label, optional AM/PM preference, and default duration. Saving makes the revision effective today. |
| FR-3 | Archive/remove recurring items | P0 | Removing an item archives it from today onward; snapshots before today retain it and its completion. A confirmation explains this behavior. |
| FR-4 | Manual global reordering | P0 | Given the control panel, when an item is dragged to a new position, then the preview and today/future daily layouts use that order after save. Past layouts do not change. |
| FR-5 | Optional period auto-balancing | P0 | An automatic item is placed in the currently shorter column; ties alternate AM then PM. Resolution is deterministic for a given ordered configuration. |
| FR-6 | Live AM/PM preview | P0 | The editor shows the same two-column ordering the Daily Page will render before the owner saves. |
| FR-7 | Duration configuration | P0 | Duration is required, defaults to 30 minutes, and accepts 30-minute increments from 30 minutes through 8 hours. |
| FR-8 | Date-effective revisions | P0 | Editing label, period, duration, or order affects today and future daily snapshots only. Yesterday and earlier retain their prior snapshot values. |
| FR-9 | Daily checklist snapshot | P0 | On first access to a date, applicable definitions are materialized once with label, resolved period, order, default duration, and source definition ID. Reopening does not regenerate or duplicate rows. |
| FR-10 | Persist completion per date and item instance | P0 | Given a bubble toggle, refreshing and reopening the same date returns the last successfully saved state; other dates are unaffected. Both checked and unchecked writes persist. |
| FR-11 | Backend persistence | P0 | Recurring definitions, revisions, daily instances/completion, and linked Time Alignment blocks are stored in Supabase rather than relying on `localStorage` as their source of truth. |
| FR-12 | Invisible device identity and access control | P0 | The app creates an anonymous session without login UI; row-level security prevents other identities from reading or changing the owner's rows. No table permits public anonymous access without an owner ID. |
| FR-13 | Checklist drag source | P0 | Dragging begins from a dedicated handle or long-press and never accidentally toggles completion. Keyboard users can invoke an equivalent “Add to Time Alignment” action. |
| FR-14 | Default-size schedule block | P0 | Dropping an item creates a `routine` block whose slot count equals configured duration ÷ 30 minutes and links to that day's checklist instance. |
| FR-15 | Per-day block adjustment | P0 | Moving/resizing the block persists its date-specific start/end slots without changing the recurring item's configured duration. Minimum size is one slot. |
| FR-16 | Duplicate scheduling behavior | P1 | The same checklist item may be placed more than once on a day, but the second placement requires a lightweight confirmation to avoid accidental duplicates. |
| FR-17 | Save-state feedback and retry | P0 | Configuration, completion, and block mutations expose saving/saved/failed states. Failed operations can be retried without creating duplicates. |
| FR-18 | Legacy-state migration | P1 | On first backend-enabled run, detect existing planner `localStorage`, preview/import supported routine and completion data once, and retain a migration marker. Never overwrite newer backend data. |
| FR-19 | Responsive and accessible interactions | P0 | Control-panel editing, bubble toggling, reordering, and calendar placement work on desktop, tablet, and phone with visible focus and non-drag alternatives. |

## 11. Non-Functional Requirements

- **Durability:** successful writes remain after refresh and browser restart; no completion state is inferred from visual state alone.
- **Security:** Supabase row-level security is enabled on all planner tables; service-role keys never ship to the browser; only the public client key is exposed.
- **Performance:** bubble feedback appears within 100 ms; routine and day reads target p95 under 500 ms on a normal connection; drag rendering remains frame-responsive.
- **Reliability:** retries are idempotent and snapshot materialization has a uniqueness constraint preventing duplicate date/item revisions.
- **Accessibility:** semantic buttons/labels, visible focus, touch targets of at least 44×44 CSS pixels where practical, keyboard reorder controls, and a keyboard scheduling alternative.
- **Privacy:** no third-party behavioral analytics and no planner text in application logs.
- **Compatibility:** current supported desktop/tablet/mobile browsers for the Vite web app.
- **Historical integrity:** past daily snapshots cannot be rewritten by master configuration mutations.

## 12. Data / Analytics Requirements

No external product analytics are required. Operational logging may record request identifiers, status codes, and table/action names, but never routine labels or personal planner content.

Minimum entities:

- `routine_definitions`: owner, stable routine identity, creation/archive timestamps.
- `routine_revisions`: definition, effective date, label, period preference, duration minutes, global sort position.
- `daily_routine_instances`: owner, date, source definition/revision, snapshotted label, resolved period, position, default duration, completed state, completion timestamp.
- `time_blocks`: owner, date, source daily routine instance, start/end slots, label snapshot, tag, fixed flag.
- `profiles` or equivalent preferences row reserved for later scheduler data; no scheduler logic in this milestone.

Useful owner-facing measure for validation only: number of dates whose checklist was opened and completed without a persistence error. This informs whether backend durability is trustworthy enough for daily use.

## 13. Success Metrics

- **North Star:** percentage of checklist toggles that reload with the intended value on the correct date; target 100% in the single-user trial.
- **Activation:** owner configures at least one item, reorders one item, completes one item, and schedules one routine block.
- **Engagement:** checklist is used on at least five days during a seven-day dogfood period.
- **Quality:** zero lost or duplicated daily checklist instances; zero historical days changed by a later configuration edit.
- **Performance:** at least 95% of backend saves complete without a manual retry during dogfood.
- **Guardrail:** checking a bubble and opening the Daily Page must not feel materially slower than the current local prototype.

## 14. Edge Cases & Failure States

- **All automatic items:** distribute deterministically between AM and PM while retaining their relative global order.
- **Uneven explicit columns:** automatic items fill the shorter side first; visual balance never overrides an explicit AM/PM selection.
- **Reordering an automatic item across columns:** crossing columns changes it to an explicit destination preference; within-column movement changes order only.
- **Editing twice on the same date:** update or replace today's effective revision rather than creating ambiguous same-day revisions.
- **Future date opened before a later config edit:** because today-forward edits must affect future dates, unopened and previously materialized future snapshots are reconciled from today onward; historical dates before today are immutable.
- **Timezone/date rollover while editing:** capture the effective date when save begins and show it in confirmation if midnight has passed.
- **Empty/duplicate labels:** reject blank labels; duplicate labels are allowed but remain distinct by ID.
- **Very long labels:** wrap or truncate visually without changing stored text or breaking the two-column layout.
- **Duration beyond the remaining calendar window:** clamp the created block to the grid end and notify the owner; preserve the configured default.
- **Drop onto an occupied slot:** retain existing project behavior—allow overlap and render side-by-side.
- **Checklist item archived after being scheduled:** today's/future checklist instance follows the archive, but already created schedule blocks retain their label snapshot unless explicitly removed.
- **Anonymous session data loss:** clearing site data loses the device credential even though backend rows remain. Explain this limitation before relying on the planner as the sole record; account linking is a later migration.
- **Backend unavailable:** show existing backend data if cached for reading, but do not claim unsaved changes are durable. This milestone does not promise full offline editing.

## 15. Dependencies

- Existing React/TypeScript Daily Page, `PlannerContext`, Time Alignment component, drag context, and storage-adapter seam.
- Supabase project, database migrations, anonymous authentication enabled, and row-level-security policies. **Blocking.**
- A deployment environment capable of supplying the Supabase URL and public client key. **Blocking.**
- A control-panel visual design consistent with `design-brief.md`. **Blocking before frontend implementation.**
- Touch and keyboard interaction testing on at least one phone-sized viewport and one desktop viewport.

## 16. Risks & Open Questions

### Risks

- **Credential recovery:** invisible anonymous access satisfies the one-device milestone but cannot recover data after browser storage is cleared. Mitigation: clearly label the limitation and prioritize account linking before cross-device use.
- **Historical-model complexity:** effective revisions and snapshots are more involved than editing one array. Mitigation: use explicit date boundaries, uniqueness constraints, and integration tests around yesterday/today/tomorrow.
- **Drag-versus-check conflict:** whole-row drag may trigger accidental completion. Mitigation: dedicated handle, movement threshold, and separate keyboard action.
- **Control-panel density on phone:** two-column reorder is difficult on narrow screens. Mitigation: retain the two-column preview but allow an accessible ordered-list edit mode on phone.
- **Migration correctness:** legacy random routine IDs may make old completions hard to map after definitions change. Mitigation: import by stable ID first, fall back to exact label/period matching, and show ambiguous items rather than guessing.

### Open Questions

- Should daily completion automatically mark a linked schedule block complete in a later milestone, or remain independent?
- Before expanding to a second device, should the anonymous identity be upgraded through email magic link, passkey, or another recovery method?
- Should configured duration eventually support 15-minute increments if Time Alignment becomes more granular?

## 17. Launch Plan

1. **Schema and safety proof:** create Supabase migrations, anonymous session bootstrap, RLS policies, and automated owner-isolation tests. Gate: no cross-identity reads/writes.
2. **Persistence slice:** load today's existing checklist, toggle one item, persist checked/unchecked state, reload, and navigate between dates. Gate: historical and per-date tests pass.
3. **Control-panel slice:** add/edit/archive/reorder with live AM/PM preview and today-forward revision behavior. Gate: yesterday remains unchanged after every mutation.
4. **Time-blocking slice:** make checklist rows draggable and create correctly sized, linked, resizable blocks. Gate: resized duration remains date-local.
5. **Migration and responsive QA:** test legacy import, failure states, keyboard flow, phone, tablet, and desktop.
6. **Seven-day dogfood:** use the checklist as the primary daily record. Do not start automatic scheduling until there are no known data-loss or historical-integrity defects.

## 18. Future Iterations

- Link the anonymous device identity to a recoverable account and enable cross-device sync.
- Capture work hours, sleep/wake windows, gym anchors, wind-down windows, energy preferences, and break cadence.
- Add routine categories such as self-care and maintenance, then map categories to approved colors.
- Add protected recurring windows and a rules-based scheduler that places fixed anchors, routine items, chores, then to-dos.
- Allow natural-language preference updates after deterministic scheduling is trustworthy.
- Add completion relationships between checklist instances and scheduled blocks if owner testing shows that reduces duplicate work.

## 19. Appendix

### Example

Configured routines:

| Order | Item | Preference | Resolved column | Default duration |
|------:|------|------------|-----------------|-----------------:|
| 1 | Vitamins | Automatic | AM | 30 min |
| 2 | Physiotherapy | Automatic | PM | 30 min |
| 3 | Morning skincare | AM | AM | 30 min |
| 4 | Evening skincare | PM | PM | 30 min |

Dragging “Physiotherapy” to 11:00 PM creates an 11:00–11:30 PM routine block. Resizing it to midnight changes only that date's block; the recurring default remains 30 minutes.

### Scope boundary

```text
This milestone
  configure recurring checklist
  → preserve per-date snapshots and completion in Supabase
  → drag a routine using its default duration
  → resize only that day's block

Later scheduler
  personal constraints + protected windows
  → automatic placement and conflict handling
  → category colors and natural-language adjustments
```

