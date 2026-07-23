# Digital Planner — Decision List

A running log of locked product/scope decisions. When a decision changes, update it here and note the date. See `PRD.md` for full context.

_Last updated: 2026-07-23_

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

## Page types

- **Daily spread** — "Successful Day" routine checklist (AM/PM bubbles) + numbered To Dos beginning with 01–15 and growing as needed + left-page evening wind-down + right-page Time Alignment.
- **Two-Week Habit Planner** — 14-day grid, colored day-spines, ✓/✗ per cell.
- **Running Short To-Do List** *(new — we design)* — small, quick items.
- **Running Long To-Do List** *(new — we design)* — bigger, multi-step items with notes/sub-steps.

## Open questions (not yet decided)

- Which cloud provider will supply the deferred cross-device sync requirement (Firebase vs. Supabase vs. other).
- v1.5 scheduler brain: rule-based only vs. hybrid (rules + AI). Leaning rule-based first.
- Whether to add a real-ink (stylus) layer on tablet eventually.

## Process

PRD → **design brief** (next: visual + interaction spec for the book feel) → design → implement.
