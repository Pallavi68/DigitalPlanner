# PRD: Digital Planner — a pen-and-paper planner you can carry in your pocket

> **Assumptions (made explicit — correct me any time):**
> - **Single user.** This is a personal tool for one person (the owner). No accounts, sharing, or multi-user features. A lightweight private login may be needed only to enable cross-device sync.
> - **Cross-device is a hard requirement.** The entire reason for going digital is to access the same planner from laptop, phone, and tablet without carrying a book. State must sync across devices, not live in one browser's local storage.
> - **Typed, styled-handwriting input.** You type; text renders in a handwriting-style font on ruled "paper." No stylus/ink in v1 (a real-ink layer on tablet is a possible later add).
> - **The physical-book feel is a P0 constraint, not decoration.** If a feature is faithful but breaks the paper feel, the paper feel wins and we redesign the feature.
> - **Existing repo is the foundation.** There is already a book-feel web app (GitHub Pages) with a daily page and Google Calendar sync code. This PRD builds on it. Google Calendar sync stays as-is and is **out of scope for the scheduler** — the scheduler does not read or write GCal in the planned versions.
> - **Built for future inbound capture.** Architecture must allow adding items via WhatsApp/Telegram later without a rewrite (a clean "capture an item" entry point feeding the to-do lists).

---

## 1. Summary

A personal digital planner that faithfully recreates the owner's physical pen-and-paper planner — the same page types, layouts, and tactile "book" feel — but accessible from any device. v1 delivers the digital pages (daily spread, two-week habit grid, and two new to-do lists), habit/chore tracking, and **drag-and-drop time-blocking** of the day. A fast-follow v1.5 adds an automated "personal assistant" scheduler that plans the day from the owner's routines, chores, to-dos, and preferences.

The product's north star is emotional as much as functional: it must feel like writing in your own book, or it has failed — even if every feature works.

## 2. Background / Context

The owner runs their life on a physical planner they designed themselves, with purpose-built page types: a detailed **daily spread** (routine checklist + numbered to-dos + a full-day 30-minute "Time Alignment" schedule + an evening wind-down list) and a **two-week habit planner** grid tracking recurring habits and day-specific chores with ✓/✗ marks.

The owner has ADHD and finds physical pen-and-paper planning genuinely effective — the tactile ritual is part of what makes it work. The only real problem with paper is **portability**: the book can't be everywhere they are. Going digital solves that — *if and only if* the digital version preserves the pen-and-paper experience. A generic to-do app would technically replace the planner while destroying the exact thing that makes it work.

There is already an in-progress web app recreating the book feel (navy-stripe cover, paper texture, page-flip physics) with a daily page and Google Calendar sync. This PRD defines the full product on top of that foundation.

## 3. Problem Statement

The owner's paper planner works well but can't travel with them everywhere. They need the *same* planner — same pages, same feel — available on laptop and phone, plus an assistant that can plan their day from their routines, chores, and to-do lists so they don't have to assemble the schedule by hand every morning.

## 4. Target Use

- **Primary (and only) user:** the owner — an ADHD person who plans in detail daily, values the ritual of pen-and-paper, and wants their planner accessible anywhere without carrying a book. Uses it multiple times a day (morning planning, midday check-offs, evening wind-down + tomorrow prep).
- **Secondary users:** none. This is explicitly a single-person tool.
- **Not a target:** teams, shared/collaborative planning, selling this as a product, generic productivity users.

## 5. Goals

- Recreate the owner's existing page types digitally with **high visual and tactile fidelity** to the paper book.
- Make the planner **available and in-sync across laptop, phone, and tablet.**
- Let the owner **track habits and day-wise chores** exactly as the paper two-week grid does.
- Give the owner **two running to-do lists** (short items, long items) that persist across days.
- Let the owner **build their day by dragging** to-dos, chores, and routine items onto an hourly schedule.
- Lay a foundation so a **v1.5 auto-scheduler** and **future inbound capture (WhatsApp/Telegram)** can be added without re-architecting.

## 6. Non-Goals

- **Not** a Google Calendar-driven scheduler. GCal sync remains as the existing app already does it; the scheduler ignores the calendar. Fixed commitments are entered manually.
- **Not** stylus/handwriting-ink input in v1 (typed styled-handwriting only).
- **Not** the auto-scheduler in v1 — that is v1.5.
- **Not** multi-user, sharing, permissions, or collaboration.
- **Not** WhatsApp/Telegram capture in v1 (architected-for, not built).
- **Not** a mobile-native app in v1 — a responsive web app that works well on phone browsers.
- **Not** analytics dashboards, gamification, or streaks beyond what the paper planner already does (✓/✗ marks).

## 7. User Jobs / Use Cases

1. *"When I start my day, I want to see my routine checklist, today's chores, and my to-dos in one place, so I can plan the day without hunting."*
2. *"When I plan, I want to drag tasks onto an hourly timeline and block my day, so my plan is visual and concrete."*
3. *"Through the day, I want to check things off with a satisfying mark, so I feel progress the way ticking a paper box feels."*
4. *"I want to jot a task the moment it occurs to me into a short or long running list, so it's captured and I can schedule it later."*
5. *"Each evening, I want a wind-down checklist and to set up tomorrow, so I close the day and prep the next — like I do on paper."*
6. *"I want to track my habits and chores across two weeks in a grid, so I can see my consistency at a glance."*
7. *"I want the same planner on my phone when I'm out, so I never need the physical book."*
8. *(v1.5)* *"I want to press one button and have my day planned for me from my routines, chores, and to-dos around my preferences, so I don't assemble it by hand."*

## 8. Proposed Solution

A responsive web app structured as a **book** you flip through, with these page types:

- **Daily Page** (the spread) — the heart of the product. Four zones faithful to the paper:
  1. **"Successful Day" routine checklist** — the recurring AM/PM habits, with bubble checkboxes (filled = done).
  2. **To Dos** — a numbered list (01–15) for the day's tasks.
  3. **Time Alignment** — a full-day schedule in 30-minute blocks; the owner **drags items onto it** to time-block, and resizes blocks by dragging edges.
  4. **Evening wind-down** — a small end-of-day checklist + "tomorrow plan" + bedtime.
- **Two-Week Habit Planner** — a 14-day grid, colored day-spines, each day a stack of habits/chores marked ✓/✗.
- **Running Short To-Do List** (*new, designed by us*) — quick, small items; low-ceremony capture; persists until done.
- **Running Long To-Do List** (*new, designed by us*) — bigger/multi-step items; room for a note or sub-steps; persists until done.

Underneath, a shared data model links these so the checklist, habit grid, and daily page draw from the same habits/chores/to-dos rather than duplicating them. The **v1.5 scheduler** automates the drag-and-drop step: a rule-based engine places fixed anchors, routines, and chores, then backfills free slots from the to-do lists by priority — producing the same time-blocked day the owner would build by hand.

**Key tradeoff called out:** faithfulness to paper vs. digital convenience. Where they conflict (e.g., a slick auto-sort that breaks the hand-written feel), we bias to paper feel and make digital-only powers *additive and optional* (drag-and-drop, sync, search) rather than replacing the core ritual.

## 9. User Experience / Flow

**First use (empty states):**
- Owner opens the book to today. Routine checklist is pre-seeded from a one-time setup of their recurring habits (Fitness, Moneymaker, Vitamins, skincare, Mobility, etc.). To-do lists are empty with a gentle "tap a line to write" affordance on ruled paper. Habit grid shows the current two-week window with their habits/chores as rows.
- A short setup captures **recurring habits**, **day-wise chores**, and **preferences** (wake/sleep, workout window, break cadence, energy windows). Preferences are stored now and mostly used by the v1.5 scheduler.

**Repeat use (the everyday path):**
- **Morning:** open today → checklist + to-dos + empty Time Alignment. Owner drags today's chores and to-dos onto the timeline, adds any fixed commitments manually, resizes blocks.
- **Through the day:** tap bubbles to check off routines and chores (satisfying ink-mark animation); add ad-hoc tasks to the short/long lists as they arise.
- **Evening:** complete wind-down checklist, jot tomorrow's plan, mark habits in the grid.

**Empty states:** ruled lines with faint prompts; never a modern "no items yet" card — it should look like a blank page waiting for a pen.

**Error/failure states:** offline → keep working locally, show a subtle "will sync" indicator, reconcile when back online. Sync conflict → last-write-wins per field with a non-blocking notice (single user makes true conflicts rare).

**Completion state:** a finished day shows checked bubbles and a filled timeline; the habit grid fills with ✓/✗. Flipping back to a past day shows it preserved, like a real book you can page through.

## 10. Functional Requirements

| ID | Requirement | Priority | Notes / Acceptance Criteria |
|----|-------------|----------|-----------------------------|
| FR-1 | **Book shell & navigation** — app presents as a book with page-flip navigation between days and page types. | P0 | Given the app is open, when the user flips forward/back, then the target page renders with the book/paper aesthetic and the flip animation. Builds on existing shell. |
| FR-2 | **Daily Page — routine checklist** — renders the recurring AM/PM "Successful Day" items as bubble checkboxes; tap toggles done. | P0 | Given today's page, when the user taps a bubble, then it fills (done) with an ink-style mark and state persists + syncs. |
| FR-3 | **Daily Page — To Dos** — numbered 01–15 ruled list; tap a line to type; items styled as handwriting. | P0 | Given the To Dos zone, when the user taps line N and types, then text saves to that day and renders in handwriting font. Empty lines show ruled paper only. |
| FR-4 | **Daily Page — Time Alignment grid** — full-day 30-min blocks (configurable start/end, default ~8am–2am). | P0 | Grid renders all 30-min slots for the day; scrolls within the page without breaking layout on phone. |
| FR-5 | **Drag-and-drop time-blocking** — drag any to-do, chore, or checklist item onto a time slot to create a block; drag block edges to resize; drag block body to move. | P0 | Given an item and the grid, when the user drops it on a slot, then a labeled block appears spanning the chosen duration and persists. Resizing changes duration in 30-min (or finer) steps. |
| FR-6 | **Daily Page — evening wind-down** — small end-of-day checklist + "tomorrow plan" note + bedtime line. | P1 | Renders configurable wind-down items as checkboxes; "tomorrow plan" text persists to that day. |
| FR-7 | **Two-Week Habit Planner grid** — 14-day grid, day columns with colored spines, habit/chore rows, ✓/✗ per cell. | P0 | Given the grid, when the user taps a cell, then it cycles blank → ✓ → ✗ → blank; state persists per day. Recurring habits appear every day; day-specific chores appear on their day. |
| FR-8 | **Running Short To-Do List** — low-friction list for small items; quick add; persists across days until completed; mark done. | P0 | Add item in ≤1 interaction from the list; completed items visually struck/archived; list survives day changes. |
| FR-9 | **Running Long To-Do List** — list for bigger items with room for a note/sub-steps; persists until completed. | P0 | Each item supports a title + optional note/sub-steps; completing top item or sub-steps updates state; persists across days. |
| FR-10 | **Scheduling a to-do to a day** — assign a short/long to-do (or chore) to a specific date so it surfaces on that Daily Page. | P0 | Given a to-do, when the user assigns date D, then it appears in D's To Dos / draggable pool. |
| FR-11 | **Cross-device sync** — all planner state syncs across the user's devices via a cloud store. | P0 | Given a change on device A, when device B opens/refreshes, then it reflects the change (target < a few seconds when online). |
| FR-12 | **Offline-tolerant editing** — edits work offline and reconcile on reconnect. | P1 | Given no network, when the user edits, then changes persist locally and sync automatically when back online; a subtle indicator shows sync state. |
| FR-13 | **Recurring-item engine** — recurring habits and day-wise chores auto-populate the daily checklist and habit grid from a single source of truth. | P0 | Editing a recurring habit updates future days; past days are not retroactively changed. |
| FR-14 | **Preferences capture** — store wake/sleep, workout window, break cadence, energy windows, fixed commitments. | P1 | Preferences editable in settings; persisted; consumed by v1.5 scheduler (stored, minimally used, in v1). |
| FR-15 | **Manual fixed commitments** — add a fixed, time-boxed commitment to a day (the manual stand-in for calendar events). | P1 | Added commitments render as fixed blocks on Time Alignment and are treated as immovable by the v1.5 scheduler. |
| FR-16 | **Capture entry point (foundation)** — a single internal "add item to a to-do list" pathway that a future WhatsApp/Telegram bot can call. | P2 | An internal API/function creates a to-do from {text, list, optional date}; UI add uses the same path. Not exposed externally in v1. |
| FR-17 | **Auto-scheduler (rule-based)** — one action plans the day: place fixed anchors + routines + chores, apply break rules, backfill free slots from to-do lists by priority. | P1.5 *(v1.5)* | Given today's items + preferences, when the user triggers "plan my day," then the Time Alignment grid is populated with a valid, conflict-free plan the user can then adjust by drag-and-drop. |
| FR-18 | **AI scheduling layer (natural language)** — optional layer to accept preferences/tweaks in natural language and reason about tradeoffs. | P2 *(post-v1.5)* | Deferred; final brain (rule vs. hybrid) decided at v1.5 design (see Open Questions). |

*(P1.5/P2-vNext rows are documented here for continuity but are out of the v1 build.)*

## 11. Non-Functional Requirements

- **Fidelity:** the paper/book aesthetic (texture, ruled lines, handwriting font, ink marks, flip physics) must hold up on both desktop and phone. This is the defining quality bar.
- **Responsiveness:** usable one-handed on a phone browser; the dense Time Alignment grid must remain legible and interactive on small screens (scroll/zoom within its own container, never break page layout).
- **Performance:** page flips and check-offs feel instant (<100ms perceived); no jank on the drag-and-drop grid.
- **Reliability/durability:** planner data must never be silently lost; sync is durable and offline edits are preserved.
- **Privacy:** single-user personal data; stored in the owner's own cloud store; no third-party analytics on personal content.
- **Accessibility:** sufficient contrast and tap-target sizes on mobile even within the "paper" styling.
- **Extensibility:** clean separation between data model and page rendering so new page types, the scheduler, and inbound capture slot in without rework.

## 12. Data / Analytics Requirements

Personal tool — **no product analytics/tracking of the user.** "Analytics" here means *self-tracking the owner already values*:

- Habit/chore completion is captured as the ✓/✗ grid state (already the paper behavior).
- Optional lightweight views to support the owner's own reflection: habit completion rate over the two-week window; to-do throughput (created vs. completed). P2, only if it doesn't clutter the book feel.
- No event pipeline, no dashboards for anyone but the owner.

## 13. Success Metrics

Because this is a personal tool, success is adoption-by-one and feel, not scale.

- **North Star:** the owner uses the digital planner *instead of* the physical book on a normal day — and doesn't miss the paper. (Proxy: paper book stays closed.)
- **Activation:** owner completes first-day setup (habits, chores, preferences) and plans one full day via drag-and-drop.
- **Engagement:** days-per-week the planner is opened and edited; morning-plan + evening-wind-down both used.
- **Quality/feel:** owner's subjective rating that it "feels like my book" (the make-or-break metric); zero data-loss incidents.
- **Guardrail (must not get worse):** planning a day digitally should take **no longer** than on paper; sync/latency must not make check-offs feel laggy vs. a pen.

## 14. Edge Cases & Failure States

- **Offline / flaky connection:** edits persist locally, sync later; clear-but-subtle sync indicator; never block writing.
- **Two devices edit the same field:** last-write-wins per field with a non-blocking notice (rare — single user).
- **Long to-do text / many to-dos:** To Dos zone caps visible at 01–15 like paper; overflow goes to the running lists rather than breaking layout.
- **Time Alignment overlaps:** two blocks on the same slot render side-by-side or flag a conflict; manual override always allowed (you can double-book yourself on paper too).
- **Changing a recurring habit:** applies going forward only; historical days stay as they were (a real book doesn't rewrite past pages).
- **Day-boundary / timezone:** "today" follows the device's local date; traveling across timezones shouldn't duplicate or drop a day.
- **Deleting an item that's time-blocked:** removing a to-do should handle its block gracefully (remove or leave an orphaned labeled block — decide in design).
- **Phone small-screen density:** the 30-min grid must stay usable; consider a condensed mobile view of Time Alignment.

## 15. Dependencies

- **Existing app foundation** — the current book-feel web app, daily page, and page-flip shell.
- **Cloud sync store** — a backend or hosted DB (e.g., Firebase/Supabase or similar) to enable cross-device sync; current GitHub Pages hosting is static and cannot sync by itself. *(Blocking for FR-11.)*
- **Handwriting font(s)** licensed for web use.
- **Drag-and-drop + touch gesture handling** on both desktop and mobile.
- **Design brief** (next step) translating this PRD into the exact visual/interaction spec for the book feel.
- **(v1.5)** rule-engine design; **(post-v1.5)** Claude API access if the AI layer is built.

## 16. Risks & Open Questions

**Risks**
- **Feel risk (highest):** if the digital version feels like "just another to-do app," the owner reverts to paper and the project fails. Mitigation: treat paper-feel as P0, prototype the daily page feel early, test on real use before adding breadth.
- **Mobile density risk:** the Time Alignment 30-min grid is hard to make both faithful and usable on a phone. Mitigation: design a condensed mobile variant.
- **Sync/hosting risk:** cross-device sync requires moving beyond static hosting; under-scoping this blocks the core reason for going digital.
- **Scope creep from the scheduler:** the assistant is exciting and could balloon v1. Mitigation: it's firmly v1.5; v1 ships manual drag-and-drop first.

**Open Questions**
- Where should sync/data live (Firebase vs. Supabase vs. other)? Decide in design/architecture.
- v1.5 scheduler brain: **rule-based only, or hybrid (rules + AI natural-language layer)?** Leaning rule-based core first, AI as an optional later layer.
- Do we want a real-ink (stylus) layer on tablet eventually, or is styled-handwriting typing enough long-term?
- How much of the two-week grid is auto-derived from recurring config vs. hand-edited per cell?
- Default Time Alignment day window and whether it's per-day adjustable.

## 17. Launch Plan

Single-user tool, so "launch" = the owner adopting it in stages.

1. **Internal build/dogfood (self):** ship the Daily Page feel first (checklist + to-dos + drag-and-drop Time Alignment) and use it for a few real days on both laptop and phone.
2. **Fidelity checkpoint:** the owner judges whether it "feels like my book." Fix feel before adding breadth. **Gate:** don't proceed until this passes.
3. **Breadth:** add Two-Week Habit grid + Running Short/Long to-do lists + evening wind-down; wire cross-device sync.
4. **Daily-driver trial:** owner uses it as the primary planner for ~2 weeks; paper book stays closed. Collect friction notes.
5. **v1.5 scheduler:** once v1 is a comfortable daily driver, add the rule-based "plan my day" and iterate.
6. **Later:** inbound capture (WhatsApp/Telegram), optional AI scheduling layer, optional stylus ink.

## 18. Future Iterations

- **v1.5:** rule-based auto-scheduler ("plan my day") consuming routines, chores, to-dos, and preferences.
- **v-next:** WhatsApp/Telegram inbound capture into the running to-do lists (foundation built in v1 via FR-16).
- **v-next:** AI natural-language scheduling layer (talk to your planner: "give me a lighter morning").
- **v-next:** optional stylus/handwriting-ink layer on tablet for true pen feel.
- **v-next:** additional custom page types as the owner designs them (the paper planner will keep evolving).
- **Maybe:** lightweight personal reflection views (habit consistency, to-do throughput) if they don't hurt the book feel.

## 19. Appendix

**Page-type reference (from the owner's physical planner):**
- *Daily spread:* "Successful Day" routine checklist (AM/PM bubble habits) · numbered To Dos 01–15 · "Time Alignment" full-day 30-min schedule with hand-drawn blocking brackets · evening wind-down mini-checklist + tomorrow plan + bedtime.
- *Two-Week Habit Planner:* 14-day grid, rainbow day-spines, recurring habits (Gym, Moneymaker, Job hunt, walks, Bingo) + day-specific chores (Clean desk, Fold clothes, Clean cupboard, Expense tracker, Clean kitchen…), each marked ✓/✗.
- *Running Short To-Do List (new):* to be designed — small, quick items.
- *Running Long To-Do List (new):* to be designed — bigger, multi-step items.

**Glossary:**
- *Time Alignment* — the daily hourly schedule zone (30-min blocks).
- *Successful Day* — the daily routine/habit checklist.
- *Fixed anchor* — a time-locked item (workout, meal, commitment) the scheduler won't move.
- *Running list* — a to-do list that persists across days until items are completed.

**Locked product decisions (from scoping):**
1. Input = typed text styled as handwriting (works on all devices).
2. v1 = digital pages + habit/chore tracking + to-do lists + manual drag-and-drop time-blocking.
3. Scheduler = v1.5 fast-follow, rule-based core (AI layer later).
4. No Google Calendar in the scheduler; fixed commitments entered manually.
5. Paper/book feel is the make-or-break quality bar.
