# Digital Planner — Decision List

A running log of locked product/scope decisions. When a decision changes, update it here and note the date. See `PRD.md` for full context.

_Last updated: 2026-08-04_

---

## Locked decisions

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| D1 | **Input feel** | Typed text styled as handwriting on ruled paper. **No** stylus/ink in v1. | Works identically on laptop, phone, and tablet — lowest friction, most portable. Real-ink layer is a possible later add. |
| D2 | **v1 scope** | Digital pages (Daily spread, Two-Week Habit grid, new Running Short + Long to-do lists) + habit/chore tracking + to-do lists + **manual drag-and-drop time-blocking** onto the hourly Time Alignment grid. | Ships a usable, faithful planner sooner. Drag-and-drop is the manual version of what the scheduler later automates. |
| D3 | **Scheduler** | v1.5 fast-follow — **not** in v1. Rule-based core first (place fixed anchors → routines → chores → break rules → backfill free slots from to-do lists by priority). Optional AI natural-language layer only post-v1.5. | Keeps v1 focused; predictable + free planning before adding AI reasoning. |
| D4 | **Calendar** | Scheduler does **not** use Google Calendar. Fixed commitments are entered manually. Existing GCal/Sheets sync stays as-is and separate. | Simpler; avoids coupling the planner to calendar state. |
| D5 | **Quality bar** | The **pen-and-paper / physical book feel is P0** — the make-or-break constraint. If fidelity conflicts with a digital convenience, paper feel wins. | The only reason to go digital is portability; if it stops feeling like the book, the user reverts to paper. |
| D6 | **Cross-device sync** | Hard requirement — planner state must sync across laptop/phone/tablet. Current static GitHub Pages hosting can't do this alone; needs a cloud store. | The whole point of going digital is access anywhere without the physical book. |
| D7 | **Single user** | Personal tool for one person. No accounts, sharing, permissions, or collaboration. | Not a product for others; keeps scope tight. |
| D8 | **Future capture (architected-for, not built)** | WhatsApp/Telegram inbound capture into the to-do lists, via a single internal "add item" entry point built in v1 (FR-16). | Lets future messaging capture slot in without a rewrite. |
| D9 | **Current milestone storage** | Cloud sync is deferred for the current frontend milestone. Use the existing `localStorage` adapter and preserve the storage seam for a later Firebase, Supabase, or other cloud adapter. Do not imply cross-device sync currently works. | Establishes a runnable frontend without prematurely selecting or integrating a cloud provider. |
| D10 | **Daily to-do layout** | Begin with numbered rows `01–15`, then dynamically add further numbered rows when the owner continues past the last line. | Preserves the paper starting layout without wasting available left-page space or preventing a longer day list. |
| D11 | **Time Alignment window** | Use one globally configurable window in Settings, defaulting to 8:00 AM–2:00 AM. It is not independently configurable per day in v1. | Keeps daily pages consistent while allowing the owner to adjust the planner-wide schedule range. |
| D12 | **Linked-item deletion and reassignment** | For today and future dates, automatically update or remove linked daily entries and time blocks. Preserve past entries unless the user explicitly deletes them from that past day. | Keeps active plans consistent without rewriting the historical record. |
| D13 | **Habit-grid derivation** | Derive rows and applicable dates from recurring configuration. Individual cells store only blank, ✓, or ✗ marks and cannot redefine habit configuration. | Maintains a single source of truth while preserving per-day completion history. |
| D14 | **Calendar navigation and page turns** | Daily pages show every week intersecting the selected month plus seven day tabs for the selected week—never relative “previous/selected/next” labels. The displayed year opens the month overview; month corners move between months and daily corners move between days. Page turns use one directional, two-sided half-page leaf. | Makes the month understandable at a glance, keeps distant dates reachable, and preserves the approved Claude prototype physics. |
| D15 | **Successful Day duration choices** | Duration is optional: none, 5, 10, 15, or 30 minutes, then 1–5 hours in 30-minute increments. No-duration items remain checkable but are not schedulable. | Supports both short routines and outcome-only checks such as being in bed by a target time. |
| D16 | **Linked completion** | A daily checklist or to-do item and every Time Alignment block linked to it share one completion outcome; toggling either surface updates the others. | Prevents the left-page record and right-page schedule from disagreeing. |
| D17 | **Directional to-do deletion** | Deleting a daily to-do removes its linked Time Alignment blocks. Deleting or unscheduling only a Time Alignment block does not delete its source to-do. | The list is the durable intent; the schedule is only that day's placement. |
| D18 | **Daily spread balance and routine defaults** | Wind-down sits on the left beneath Daily To Dos; the right page is reserved for Time Alignment. Successful Day routines may optionally define a default quick-add time; otherwise `+` uses the next free slot. | Uses the physical spread efficiently and makes routine quick-add predictable without making time selection mandatory. |
| D19 | **Cloud backend and owner identity** | Supabase is the approved cloud backend. Planner rows are owned by a recoverable Supabase Auth user (`auth.uid()`), using email OTP/magic-link sign-in for the single owner; row-level security is mandatory on every planner table. | Fulfills hard cross-device sync while keeping account UI minimal. This supersedes D9's deferred provider and the focused checklist PRD's device-only anonymous-session assumption. |
| D20 | **Vision-to-Action Bingo geometry and launch scope** | August 2026 is the first interactive board and its seeded actions are approved. For `N` generated actions, use the smallest containing square: `S = ceil(sqrt(N))`; create an `S×S` board and fill the remaining `S² − N` positions with unique, randomly placed, automatically filled free squares. Every full horizontal row, vertical column, and both corner-to-corner diagonals are valid reward lines. January–June remain analysis inputs only. | Produces a true square without inventing or discarding action occurrences. Random free-square placement preserves the mixed bingo feel, while frozen positions and explicit line rules make completion deterministic and testable. |
| D21 | **Vision-to-Action Bingo interaction details** | Completion reversal requires confirmation only when it affects a previously earned line; ordinary reversals use a short undo path. V1 stores one plain-text note per occurrence with audited timestamps. Dense phone boards use a bounded fit/zoom/pan view plus a persistent accessible list alternative. | Preserves tactile low-friction use, keeps earned rewards durable, avoids prematurely building a journaling system, and makes large frozen boards usable without changing their geometry or excluding assistive-technology users. |
| D22 | **Recurring daily schedule materialization** | Use an anchored repeating two-week chore pattern with Week 1 beginning Monday, 2026-08-10. Applicable untimed chores surface for manual placement. Explicitly timed recurring items auto-create one linked block per date: Gym Monday/Tuesday/Thursday/Friday 9:30 AM–12:00 PM, while daily movement remains visible seven days; Night wind-down runs daily 11:00 PM–12:00 AM. Successful Day/Gym blocks are blue and chore blocks purple. | Gets the owner to a usable planner without waiting for the full Two-Week Habit Planner editor, prevents duplicate scheduling, and preserves stable dated completion identity for later scheduler and Bingo integration. |
| D23 | **Moneymaker completion source** | Keep Moneymaker only in the Successful Day checklist. Exclude the four transcribed weekday entries from generated chore definitions and remove obsolete Moneymaker chore state during migration. | Prevents two independent completion records while retaining Moneymaker in the owner's primary daily-success view. |
| D24 | **Daily acceptance scheduling details** | Successful Day uses the label `Movement`; Gym remains the default Time Alignment label on Monday/Tuesday/Thursday/Friday. Replace the aggregate Night wind-down block and left-page section with four individually timed blocks: Mobility 11:00–11:15 PM, Vitamins 11:15–11:20 PM, Clean down 11:20–11:30 PM, and Night-time skincare 11:30–11:40 PM. Automatic blocks may be explicitly removed for one date, and every Time Alignment block supports a persisted ad-hoc note with interactive `[ ]`/`[x]` checklist lines. | Matches the owner's actual execution ritual, preserves useful defaults without making them undeletable, and keeps small contextual details and sub-checks attached to the scheduled action. |

## Page types

- **Daily spread** — "Successful Day" routine checklist (AM/PM bubbles) + numbered To Dos beginning with 01–15 and growing as needed + left-page evening wind-down + right-page Time Alignment.
- **Two-Week Habit Planner** — 14-day grid, colored day-spines, ✓/✗ per cell.
- **Running Short To-Do List** *(new — we design)* — small, quick items.
- **Running Long To-Do List** *(new — we design)* — bigger, multi-step items with notes/sub-steps.

## Open questions (not yet decided)

- v1.5 scheduler brain: rule-based only vs. hybrid (rules + AI). Leaning rule-based first.
- Whether to add a real-ink (stylus) layer on tablet eventually.

## Process

PRD → **design brief** (next: visual + interaction spec for the book feel) → design → implement.
