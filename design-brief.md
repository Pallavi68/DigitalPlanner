# Design Brief: Digital Planner — the book you carry in your pocket

> **For the designer:** This translates `PRD.md` and `decision-list.md` into a visual + interaction spec. The one rule above all others: **it must feel like writing in her own book.** If a choice is "correct" but breaks the paper feel, the paper feel wins. Ground truth for the look is the physical planner (navy-stripe cover, clean near-white pages, blue-gray rules) — described in detail under §2.

---

## 1. What we're designing

A responsive **book** (web app) the owner flips through, recreating her physical pen-and-paper planner at high fidelity, accessible from laptop, phone, and tablet. This brief covers the **v1 surfaces**:

1. **Book shell & navigation** (flip between days and page types) — builds on existing app
2. **Daily Page** — the heart: routine checklist · numbered To Dos · Time Alignment drag-and-drop schedule · evening wind-down
3. **Two-Week Habit Planner** — 14-day ✓/✗ grid
4. **Running Short To-Do List** *(new — we design from scratch)*
5. **Running Long To-Do List** *(new — we design from scratch)*
6. Supporting: empty states, sync/offline indicators, first-run setup

**Out of scope for this brief:** the v1.5 auto-scheduler, WhatsApp/Telegram capture, stylus ink, Google Calendar. Design so these *slot in later without redesign* (see §7).

---

## 2. Visual foundation (locked — do not reinvent)

Derived from photos of the actual physical planner. This is not decoration; it's the product.

**Cover.** Bold vertical stripes: wide dark navy (`#1c2140`) alternating with narrow cream (`#f3ebda`), roughly 38px navy + 11px cream per cycle. Centered **arch-shaped badge** (cream fill, thin gold border, arch-top radius): "NOTES & THOUGHTS" in small spaced caps up top, a decorative dot, the brand name in large serif, month + year in small spaced caps below. Terracotta ribbon bookmark on the left spine.

**Interior pages.** Near-white / very light cream paper. Thin horizontal ruled lines in a slightly **blue-gray** tone (NOT warm brown). Clean minimal **serif** for date headers and structural labels. Visible **spine crease / shadow** down the center when the book is open. Subtle paper texture only — never heavy or parchment-like.

**Handwriting.** Typed user text renders in a **handwriting-style font** on the ruled lines, sitting on the baseline like real writing. Structural chrome (labels, numbers, headers) stays in the clean serif — handwriting is *only* for what the user "writes."

**Marks.** Check-offs are **ink marks**, not modern checkbox UI: filled bubbles for routine checklist, green ✓ / red ✗ for the habit grid — with a brief, satisfying ink-settle animation.

**What it is NOT:** not leather, not dark/warm parchment, not heavily textured, not a "productivity app" card UI. The old leather aesthetic was wrong and is retired.

---

## 3. Page-by-page spec

### 3a. Daily Page (P0 — design this first and best)
Four faithful zones. On desktop this is a spread; on phone it stacks/tabs (see §4).

1. **"Successful Day" routine checklist** — recurring AM/PM habits as **bubble checkboxes**. Tap fills with an ink mark. Pre-seeded from setup (Fitness, Moneymaker, Vitamins, skincare, Mobility…).
2. **To Dos** — numbered **01–15** ruled list. Tap a line → type → renders in handwriting on that line. Empty lines are just ruled paper with a faint "tap a line to write" affordance. Caps at 15 visible like paper; overflow routes to the running lists (don't break layout).
3. **Time Alignment** — full-day schedule in **30-minute blocks** (default ~8am–2am, start/end configurable). The owner **drags** to-dos / chores / checklist items onto slots to create labeled time blocks; **drag block edges to resize** (30-min steps), **drag body to move**. Overlaps render side-by-side or flag a conflict, but manual double-booking is always allowed (you can on paper too).
4. **Evening wind-down** (P1) — small end-of-day checklist + "tomorrow plan" note line + bedtime line.

Design the **drag affordance** so items feel physically picked up and set down — this is the digital-only superpower and it must feel tactile, not like a form widget.

### 3b. Two-Week Habit Planner (P0)
14-day grid. Colored day-spines (rainbow column separators — reference shows blue and yellow-green). Rows = recurring habits (Gym, Moneymaker, Job hunt, walks, Bingo) + day-specific chores (Clean desk, Fold clothes, Expense tracker…). Tap a cell cycles **blank → ✓ → ✗ → blank**. Recurring habits appear every day; day-specific chores only on their day.

### 3c. Running Short To-Do List — *new, we design*
Low-ceremony capture for small quick items. **Add in ≤1 interaction.** Persists across days until done. Completed items strike through / archive. Must still read as a **page in the book**, not a list app — ruled paper, handwriting entries. Think: the quick-jot page at the back of a notebook.

### 3d. Running Long To-Do List — *new, we design*
Bigger / multi-step items. Each supports a **title + optional note or sub-steps**. Persists until complete. Roomier layout than the short list, still on paper. Design how sub-steps render as handwriting without turning into a checkbox-app UI.

Both lists need an **"assign to a day"** action (FR-10) so an item surfaces on that Daily Page's To Dos / draggable pool.

---

## 4. Responsive / mobile (critical, high-risk)

- Must be **usable one-handed in a phone browser.** This is the whole reason for going digital.
- The **30-min Time Alignment grid** is the hardest thing to keep faithful *and* usable on a small screen. Design a **condensed mobile variant** — it scrolls/zooms within its own container and never breaks the page layout. Propose the mobile interaction for drag-and-drop explicitly (touch drag, long-press to pick up, etc.).
- iPad/tablet is a first-class baseline (owner uses it). Spread view where width allows; stacked/tabbed on phone.
- Tap targets and contrast must stay accessible *even inside* the paper styling.

---

## 5. States & motion

- **Empty states:** ruled lines with faint pencil-prompt affordances — *never* a modern "No items yet" card. A blank page waiting for a pen.
- **Completion:** checked bubbles + a filled timeline + a ✓/✗-filled grid. Flipping to a past day shows it **preserved**, like a real book.
- **Sync/offline:** works offline; a **subtle "will sync"** indicator (not a blocking modal). Reconciles on reconnect. Design the indicator to live quietly within the book chrome.
- **Motion budget:** page flips and check-offs feel **instant (<100ms perceived)**; drag must not jank. Ink-mark and flip animations are the two signature motions — make them feel physical, keep everything else calm.

---

## 6. First-run setup

A short, on-brand setup that captures **recurring habits**, **day-wise chores**, and **preferences** (wake/sleep, workout window, break cadence, energy windows, fixed commitments). Preferences are mostly stored for the v1.5 scheduler but capture them now. Setup should feel like personalizing your book, not filling a settings form.

---

## 7. Design for the future without building it

Leave clean seams so these drop in later:
- **v1.5 auto-scheduler** — a single "plan my day" action that fills Time Alignment the same way the user drags by hand. Reserve a natural home for its trigger and for "fixed anchor" blocks (immovable).
- **Inbound capture (WhatsApp/Telegram)** — items arrive via one internal "add to a to-do list" path. The UI add uses the same path; design the list so externally-captured items appear naturally.
- **Manual fixed commitments** (P1) render as **immovable blocks** on Time Alignment — visually distinct from draggable ones.

---

## 8. Deliverables from the design pass

1. **High-fidelity mockups** of: Daily Page (desktop spread + phone), Two-Week Habit grid, Short list, Long list, first-run setup — plus empty, filled, and offline-sync states.
2. **The drag-and-drop interaction spec** for Time Alignment (desktop mouse + mobile touch): pick-up, drop, resize, move, conflict.
3. A **component/design-token sheet**: paper colors, blue-gray rule color, navy/cream/gold/terracotta, serif + handwriting type scale, bubble/✓/✗ mark styles, spine/shadow treatment, motion specs.
4. Notes on the **phone condensed Time Alignment** variant.
5. Callouts wherever fidelity-to-paper and digital convenience conflict, and which way you resolved it.

---

## 9. Acceptance bar (how we judge it)

- **The feel test (make-or-break):** the owner looks at it and says *"that's my book."* If not, nothing else matters.
- Every zone in §3 is faithful to the physical reference in §2.
- Mobile Time Alignment is genuinely usable one-handed.
- No screen reads like a generic to-do/productivity app.
- Nothing in the design blocks the v1.5 scheduler or future capture from slotting in.

## 10. Open questions to resolve in design
- Default Time Alignment day window and whether it's per-day adjustable.
- How much of the two-week grid auto-derives from recurring config vs. hand-edited per cell.
- What happens visually when a time-blocked to-do is deleted (remove block vs. leave an orphaned labeled block).
