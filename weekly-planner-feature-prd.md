# PRD: Weekly Action Planner

## 1. Summary

The Weekly Action Planner gives the owner one paper-like spread for capturing all actions they intend to complete in a week and distributing those actions across Monday through Sunday. The owner can type or paste actions into an unscheduled weekly list, then drag each action onto a day; the planner appends it to that date's existing Daily To Dos and keeps the weekly and daily completion states linked.

This feature bridges high-level weekly planning and detailed daily planning without introducing time-blocking or a second independent task system. It extends the existing month navigation, Daily To Dos, linked source-item model, touch drag-and-drop behavior, and cross-device persistence.

## 2. Background / Context

The owner begins each week with approximately five to seven outcomes or actions, then decides which day each action should be completed. Today, those weekly lists live elsewhere and must be manually copied into individual Daily Pages. That requires navigating into each date separately and makes it difficult to see whether the planned week is realistic at a glance.

The current Month Overview already displays the calendar as week rows, while each Daily Page has a numbered To Dos list and Time Alignment schedule. The core planner data model also supports running to-dos assigned to a date and daily lines linked back to a source item. The Weekly Action Planner should reuse these foundations while preserving the approved physical-book visual direction.

## 3. Problem Statement

The owner cannot currently capture a week's intended actions, distribute them across days, and monitor completion from one place. They must repeatedly navigate between dates and manually re-enter tasks, which adds friction and obscures the shape of the week.

## 4. Target Use

- **Primary and only user:** the planner owner, who plans weekly and daily, uses the planner across devices, and benefits from reducing the executive effort required to translate weekly intentions into daily actions.
- **Usage frequency:** primarily at the beginning of each week, with brief return visits during the week to reschedule actions and review progress.
- **Not a target:** teams, collaborators, project managers, shared calendars, or users needing dependencies and multi-level goal hierarchies.

## 5. Goals

- Provide one calm, legible view of the actions intended for a specific calendar week.
- Make assigning an action to a day substantially faster than opening and editing each Daily Page separately.
- Preserve one shared action identity and completion state across the Weekly Planner and Daily Page.
- Make rescheduling between days direct and predictable.
- Preserve the planner's paper-book feel on desktop, tablet, and mobile.
- Establish an extensible foundation for future weekly review and carry-forward workflows without building them in v1.

## 6. Non-Goals

- Goal-to-action hierarchy, projects, milestones, subtasks, or dependencies.
- Assigning one action to multiple days.
- Choosing a clock time or creating a Time Alignment block from the Weekly Planner.
- Prioritizing or ordering an action within the destination day's To Dos; scheduled actions append to the bottom of the written list.
- Automatic scheduling or recommendations about which day an action should use.
- Automatic carry-forward of unfinished actions.
- End-of-week review, reflection, or rollover workflows.
- Recurring weekly actions or templates.
- Importing from external documents, task managers, calendars, messages, or APIs. Multiline text pasted by the owner is supported as ordinary input.
- Inferring identity when text is manually cut from one Daily Page and pasted into another.
- Redesigning the Month Overview or Daily Page beyond the entry points and linked states needed for this feature.

## 7. User Jobs / Use Cases

1. **Capture the week's actions:** As the owner, I want to type or paste my weekly action list into the planner so it becomes the place where I plan the week.
2. **Distribute actions:** As the owner, I want to drag an unscheduled action onto Monday through Sunday so it appears on that day's Daily To Dos.
3. **See the week's shape:** As the owner, I want to see which actions are assigned to each day so I can rebalance an overloaded or unrealistic week.
4. **Reschedule:** As the owner, I want to move an action from Thursday to Friday on the Weekly Planner so both views update without duplicate entries.
5. **Track completion:** As the owner, I want completing the action on its Daily Page to mark it complete in the Weekly Planner so I can review weekly progress at a glance.
6. **Open the detailed day:** As the owner, I want to open a day from the Weekly Planner so I can order and time-block that day's work using the existing Daily Page.
7. **Recover from a mistaken placement:** As the owner, I want to undo or reschedule an accidental drop without reconstructing the item.

## 8. Proposed Solution

Add a dedicated **Weekly Planner spread**, reached by selecting a week from the Month Overview. The Month Overview remains a lightweight month-navigation page rather than becoming a dense editing surface.

The Weekly Planner uses the physical spread as follows:

- **Left page — Actions for the Week:** a ruled, editable action pool. The owner can add one action at a time or paste multiple lines; each non-empty line becomes one action. Unscheduled actions remain in the primary pool. Scheduled actions remain visible in the weekly source list with a compact day/date marker, and completed actions receive the planner's existing handwritten completion treatment.
- **Right page — Monday through Sunday:** seven compact day sections showing the actions assigned to each date. Dropping an action onto a day assigns that date and appends a linked line to the bottom of the day's Daily To Dos. Each day provides a clear path to open its Daily Page.
- **Rescheduling:** dragging a scheduled action from one day to another moves the same action. The old linked daily line is removed and a new linked daily line is appended to the destination day.
- **Shared completion:** the weekly action and linked Daily To Do represent the same completion outcome. Completing either supported representation updates the other.

The main tradeoff is density versus overview. A week is narrow enough to support actionable drag-and-drop; embedding six editable weeks in the Month Overview would reduce legibility and touch usability. A dedicated spread adds one navigation step but preserves both the monthly overview and the weekly planning ritual.

## 9. User Experience / Flow

### First use

1. The owner opens the Month Overview and selects a week.
2. The Weekly Planner opens to that calendar week, Monday through Sunday, including dates that cross a month boundary.
3. The left page shows a quiet ruled empty state such as “Write this week's actions.” The right page shows seven empty day sections resembling blank planner lines, not generic application cards.
4. The owner clicks or taps the first line and types actions individually, or pastes a multiline list.
5. For multiline paste, every trimmed non-empty line becomes a separate action, preserving pasted order. The interface confirms how many actions were added without interrupting the writing flow.

### Repeat use

1. The owner opens the week from the Month Overview or returns to the current Weekly Planner.
2. They review unscheduled, scheduled, and completed actions on the left.
3. They drag an unscheduled action onto a weekday section on the right.
4. The day highlights as a valid drop target. On drop, the action appears at the bottom of that day's weekly section and is appended to the destination Daily To Dos.
5. A compact day/date marker appears beside the source action on the left.
6. The owner can continue distributing actions, drag a scheduled action to another day, or open a Daily Page for detailed planning.

### Rescheduling

1. The owner drags a scheduled action from its current day or from its source row onto another day.
2. The system removes the linked Daily To Do from the old date and appends a linked Daily To Do to the new date.
3. The source row's day marker updates immediately.
4. A brief non-blocking Undo affordance restores the previous date if selected.

### Completion

1. The owner completes the linked item on the Daily Page.
2. The shared weekly action is marked complete.
3. Returning to the Weekly Planner shows the action completed on both the source list and assigned day while retaining its placement for end-of-week visibility.

### Empty states

- No weekly actions: ruled writing area with a low-contrast invitation to type or paste.
- Actions exist but none are scheduled: populated left page and blank day sections with subtle drop guidance.
- A day has no actions: its paper lines remain visible and accept drops.
- All actions are scheduled: no special celebration modal; the layout itself communicates the completed planning state.

### Error / failure states

- If a destination Daily To Dos list cannot accept another item, the action stays in its original state and the planner explains that the day has no available line. No partial assignment is saved.
- If a remote save fails, the existing sync indicator communicates pending/failed state and the local interaction remains available under the planner's offline-tolerant behavior.
- If a drag is released outside a valid day, no data changes.
- If a linked daily line cannot be found during a move, the weekly assignment must not create an additional duplicate silently; the system repairs the link where safe or leaves the action in place and shows a non-blocking error.

### Success state

The week shows every captured action with either an unscheduled state or exactly one assigned day. Each scheduled action appears once on the corresponding Daily Page, and completed Daily To Dos visibly resolve in the Weekly Planner.

### Responsive interaction

- **Desktop/tablet landscape:** paper spread with the action pool on the left and seven day sections on the right.
- **Mobile/portrait:** a single-page weekly view with the action pool available as a drawer or collapsible section and horizontally swipeable or vertically stacked day sections. Tapping an action must offer an accessible “Assign to day” alternative to drag-and-drop.

## 10. Functional Requirements

| ID | Requirement | Priority | Notes / Acceptance Criteria |
|----|-------------|----------|-----------------------------|
| FR-1 | The Month Overview provides a clear entry point from each calendar week to its Weekly Planner. | P0 | Given a visible week row, when the owner selects its weekly planning affordance, then the planner opens the Monday-anchored week containing those seven displayed dates. Existing direct links to individual days remain available. |
| FR-2 | The Weekly Planner displays one Monday–Sunday calendar week, including cross-month and cross-year dates. | P0 | Given any valid week, all seven dates render in chronological order and each date maps to the same ISO date used by the Daily Page. |
| FR-3 | The owner can create, edit, and delete flat weekly actions. | P0 | Creating non-empty text produces one action belonging to the displayed week. Edits persist across reloads/devices. Deleting a scheduled action requires confirmation and removes its linked Daily To Do; cancelling leaves both intact. |
| FR-4 | Pasting multiline text creates multiple weekly actions. | P0 | When text containing multiple lines is pasted into the weekly capture area, each trimmed non-empty line becomes one action in original order; blank lines are ignored. No external-format import is required. |
| FR-5 | Every weekly action has exactly one scheduling state: unscheduled or assigned to one date within its week. | P0 | The data model must prevent multiple active day assignments for the same weekly action. |
| FR-6 | The owner can drag an unscheduled action onto any of the week's seven days. | P0 | On a successful drop, the action's assigned date updates, a linked Daily To Do is appended to the destination day, and the weekly UI updates without reload. |
| FR-7 | Dropping an action onto a day appends it to the bottom of that day's written Daily To Dos. | P0 | Existing non-empty lines retain their relative order. The new linked line occupies the next available position after them. Blank placeholder rows remain an implementation detail and must not cause the action to appear above written items. |
| FR-8 | A scheduled weekly action remains visible in the left source list with its assigned weekday/date. | P0 | After assignment, the source row displays exactly one legible day marker; it is not removed from the weekly source-of-truth view. |
| FR-9 | Each day section displays its assigned weekly actions and links to the corresponding Daily Page. | P0 | Selecting the day header or explicit open-day affordance navigates to `/day/:date`. Action controls must not accidentally trigger navigation. |
| FR-10 | The owner can reschedule an action by dragging it from its existing day to another day in the same week. | P0 | The same action ID is retained; the old linked Daily To Do is removed; one linked line is appended to the new day; the assigned-date marker updates. No duplicate remains on the old day. |
| FR-11 | A completed linked Daily To Do marks the weekly action complete, and the Weekly Planner reflects that state. | P0 | Given a weekly action linked to a daily line, when that daily line is completed, then reopening or viewing the Weekly Planner shows the same action complete. |
| FR-12 | Completion changes made from a supported Weekly Planner control update the linked Daily To Do. | P1 | If weekly completion toggling is provided, the linked daily line uses the same completion value. v1 may make weekly completion display-only if needed to preserve interaction clarity. |
| FR-13 | Rescheduling offers a brief undo action. | P1 | Selecting Undo within the notice lifetime restores the previous assigned date and daily link without producing duplicates. |
| FR-14 | Touch and keyboard users have an alternative to drag-and-drop. | P0 | Each action exposes an “Assign” or “Move” control that allows selection of one of the seven dates. All actions and day targets are reachable with visible focus and operable without a pointer drag. |
| FR-15 | Invalid and cancelled drops leave state unchanged. | P0 | Dropping outside a valid target, pressing Escape during keyboard movement, or cancelling the day picker performs no mutation. |
| FR-16 | Weekly action and assignment data persist through the existing cloud-backed planner store. | P0 | After successful synchronization, the same week, action order, assignments, links, and completion values appear on another authenticated device. |
| FR-17 | The feature follows the existing offline-tolerant save and sync-state conventions. | P1 | Locally accepted changes remain visible during transient network failure, are queued through the established persistence approach, and never present a false synced state. |
| FR-18 | The model records stable source identity between a weekly action and its surfaced Daily To Do. | P0 | Editing the weekly action updates the linked daily text. Moving via supported controls preserves identity. Plain manual cut-and-paste of text is not required to preserve identity. |
| FR-19 | The Weekly Planner supports navigation to the previous and next calendar week. | P0 | Previous/next page controls move exactly seven days while preserving Monday anchoring and book navigation conventions. |
| FR-20 | The structure can support future carry-forward and weekly review without changing action identity. | P1 | Store stable week identity, creation timestamp, completion state, assignment state, and source/link IDs. No rollover behavior or review UI is implemented in v1. |

## 11. Non-Functional Requirements

- **Visual fidelity:** reuse the approved navy, cream paper, ruled-line, serif/handwriting typography, restrained gold/coral accents, and book-spread conventions. The feature must feel like a planner spread, not a kanban board.
- **Performance:** local creation, completion, and drop feedback should appear within 100 ms. Opening a populated week should not introduce perceptible lag relative to the existing Month Overview.
- **Data durability:** accepted weekly actions and moves must not be silently lost. A move that touches two dates must be persisted atomically where the backend permits, or reconciled as one logical operation.
- **Accessibility:** semantic controls, visible focus states, useful labels, keyboard assignment, and touch targets of at least 44×44 CSS pixels where layout permits. Do not rely on color alone for scheduled or completed states.
- **Responsive behavior:** usable on current desktop, tablet, and phone web layouts without requiring precision dragging.
- **Compatibility:** follow the browsers and responsive-web constraints already supported by the Digital Planner; no native-only interaction.
- **Privacy:** weekly action text is personal planner data and follows the existing authenticated storage and no-third-party-analytics posture.

## 12. Data / Analytics Requirements

No third-party product analytics are required. This is a private single-user planner.

The application data should support future on-device or owner-visible review calculations without collecting a separate event stream:

- Weekly action ID and week anchor date.
- Text and stable display order.
- Created and last-updated timestamps.
- Assigned ISO date or unscheduled state.
- Completion state and optional completion timestamp.
- Stable link to the surfaced Daily To Do.
- Optional provenance such as `weekly-planner`, allowing future capture sources without changing the action model.

These fields would later answer questions such as how many weekly actions were scheduled, completed, left unfinished, or carried forward. v1 does not expose those metrics in a dashboard.

## 13. Success Metrics

- **North Star:** the owner can translate a real weekly action list into linked Daily To Dos from one Weekly Planner session without manually opening and typing into each day.
- **Activation:** create or paste at least one weekly action and assign it to a day successfully.
- **Task success:** 100% of successful assignments produce exactly one linked Daily To Do on the intended date.
- **Rescheduling quality:** 100% of supported moves leave no duplicate on the original date and preserve completion state.
- **Completion integrity:** completing a linked Daily To Do is reflected correctly in the Weekly Planner with zero known mismatches.
- **Usability:** the owner can capture and distribute a typical five-to-seven-action week comfortably on desktop and phone.
- **Guardrail:** detailed daily planning and time-blocking remain no more complex than before; the Weekly Planner must not create unexpected Time Alignment blocks or duplicate Daily To Dos.

## 14. Edge Cases & Failure States

- **Week crosses month/year:** use the Monday anchor and show all seven true dates; actions belong to the week, not merely the named month.
- **Current day is outside the displayed week:** the planner still opens and edits the requested week without silently jumping to today.
- **Duplicate text:** two actions may have identical text but remain distinct by stable ID.
- **Blank/whitespace paste lines:** ignore them.
- **Very long pasted lists:** accept them without losing data; the action pool scrolls or expands within the book layout. No artificial five-to-seven-item cap.
- **Very long action text:** wrap legibly; dragging uses a truncated ghost while stored text remains intact.
- **Dropping on the already assigned day:** no-op; do not append a duplicate.
- **Destination day is full:** leave the action at its original assignment and explain the failure. Future implementation may allow Daily To Dos to grow; the PRD does not assume a silent cap increase.
- **Deleting a scheduled weekly action:** confirm the linked daily removal, then remove both representations as one logical action.
- **Deleting the linked Daily To Do:** the weekly action remains part of the week but becomes unscheduled. The deletion pathway should use the stable source link rather than leave a false assignment marker.
- **Editing linked text on the Daily Page:** update the weekly action text when the line retains its link. If the owner deletes/cuts the line and creates unrelated text elsewhere, identity preservation is not promised.
- **Completing before rescheduling:** the completed state follows the action to the new date.
- **Past weeks:** remain editable in v1, consistent with revisiting a physical book. No lock or automatic rollover occurs.
- **Concurrent edits on two devices:** follow the established planner conflict policy, but never intentionally preserve two assigned dates for one action. Reconciliation must collapse to one assignment and one linked daily line.
- **Offline move:** present it as locally pending through the existing sync indicator and reconcile the source/destination mutation together.

## 15. Dependencies

- **Blocking:** existing authenticated cloud-backed planner store and sync behavior.
- **Blocking:** existing Daily To Dos model and mutation pathways.
- **Blocking:** stable source references between higher-level tasks and daily lines.
- **Blocking:** existing Month Overview week/date generation and route structure.
- **Blocking:** responsive BookShell/Spread presentation.
- **Implementation dependency:** extend the current pointer drag system beyond the Time Alignment grid or introduce an equally touch-safe weekly drop-target layer without breaking existing daily drag behavior.
- **Design dependency:** detailed Weekly Planner responsive layout and interaction states consistent with `design-brief.md`.
- **Non-blocking:** future weekly review, rollover rules, and action history design.

## 16. Risks & Open Questions

### Risks

- **Data-link risk:** treating the weekly action and Daily To Do as independent copies will create completion and rescheduling drift. Mitigation: stable IDs and centralized mutations are P0 requirements.
- **Atomic-move risk:** rescheduling changes the weekly assignment and two day records. Partial cloud saves could create duplication or loss. Mitigation: persist as one backend operation where possible and add deterministic reconciliation.
- **Density risk:** seven days plus the source list may become visually cramped, particularly on phones. Mitigation: use a dedicated week spread and a non-literal mobile adaptation.
- **Interaction risk:** drag-only behavior is inaccessible and unreliable during touch scrolling. Mitigation: provide an explicit Assign/Move control as a P0 equivalent path.
- **Mental-model risk:** showing scheduled actions both in the left source list and the right day column may look like duplication. Mitigation: distinguish the left as the master weekly list using compact assignment markers and the right as placement by day.
- **Daily-edit risk:** free-form deletion and recreation on Daily Pages can sever identity. Mitigation: preserve links through supported edit/move/delete controls and clearly limit cut-and-paste inference.

### Open questions for feature design or implementation

1. Should scheduled actions be grouped below unscheduled actions on the left, or remain in their original captured order with day markers?
2. Should the Weekly Planner allow completion toggling, or show completion as read-only and keep check-off behavior on Daily Pages for v1?
3. Should deleting a linked Daily To Do immediately unschedule the weekly action, or require confirmation explaining the weekly impact?
4. What exact mobile pattern best preserves context while assigning: bottom drawer, collapsible action pool, or select-action-then-tap-day mode?
5. Can the existing cloud schema perform an assignment/move atomically, or will it require a transaction/RPC and reconciliation rule?

None of these open questions changes the approved v1 scope; they should be settled in the design and engineering brief before implementation.

## 17. Launch Plan

1. **Interaction prototype:** validate the dedicated spread, source-list/day relationship, desktop drag behavior, and mobile non-drag assignment with realistic five-to-seven-action weeks.
2. **Local functional build:** implement create/paste, assign, move, completion sync, delete reconciliation, and week navigation against representative local state.
3. **Persistence integration:** add cloud schema/storage changes and verify creation, assignment, rescheduling, deletion, completion, offline recovery, and cross-device reload.
4. **Focused QA:** test week boundaries, duplicate text, long lists, full days, keyboard use, touch scrolling, concurrent edits, and existing Daily Page regression paths.
5. **Owner trial:** use the feature for one real week. Advance when the owner can plan the week without returning to the external list or manually retyping actions into individual dates.

## 18. Future Iterations

- End-of-week review showing completed, unfinished, deleted, and rescheduled actions.
- Explicit carry-forward flow with choices to move, rewrite, archive, or drop each unfinished action.
- Week templates and recurring weekly actions.
- Optional goal/outcome hierarchy above actions.
- Pulling actions from the existing Running Short and Long To-Do Lists.
- Import/capture from external documents, WhatsApp, Telegram, or other inboxes through the established capture seam.
- Suggested distribution based on workload, routines, deadlines, or energy windows.
- Optional direct time-blocking from the Weekly Planner after day-level planning proves useful.
- Weekly reflection and owner-visible completion patterns, without adding third-party behavioral analytics.

## 19. Appendix

### Assumptions confirmed for v1

- Weekly actions are a flat list with no hierarchy.
- Each action can be assigned to exactly one day in its week.
- Dropping onto a day appends the action to that day's Daily To Dos; it does not select a time or create a Time Alignment block.
- Rescheduling within the Weekly Planner moves the action automatically.
- Completion on the Daily Page appears in the Weekly Planner.
- Unfinished actions stay in their original week in v1.
- Carry-forward and weekly review are intentionally deferred, but the model must not prevent them later.
- The owner creates weekly actions directly in this feature, including by manually pasting text from another source.
- Manual cut-and-paste between Daily Pages is not required to preserve weekly identity. Supported linked move controls should preserve it.

### Recommended information model

```text
Weekly Plan (week starts Monday)
└── Weekly Action
    ├── stable action ID
    ├── text and display order
    ├── assigned date: none or one of the week's seven dates
    ├── completion state
    └── linked Daily To Do ID when scheduled
```

The weekly action is the durable source item. Its Daily To Do is the dated surface through which daily planning and completion occur. Time Alignment blocks remain separate and can continue linking to the Daily To Do under existing behavior.

### Relevant existing product requirements

- The planner is a single-user, cloud-synced, responsive web application.
- The paper/book feel is a P0 product constraint.
- Daily To Dos use stable IDs and can link to higher-level source items.
- Existing time-blocking remains a Daily Page workflow.
- Personal content is not sent to third-party analytics.
