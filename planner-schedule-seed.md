# Planner Schedule Seed

Last updated: 2026-08-03

This file records owner-provided recurring planner inputs before they are normalized and seeded into Supabase. It is a review source, not proof that the schedule is live.

## Confirmed scheduling preferences

| Item | Cadence | Preferred window | Planner source | Auto-schedule |
|---|---|---|---|---|
| Daily movement (Gym or 10k steps/other movement) | Every day | No default block on non-gym days | Successful Day | Gym days only |
| Gym | Monday, Tuesday, Thursday, Friday | 9:30 AM–12:00 PM | Successful Day movement occurrence | Yes |
| Night wind-down | Every day | 11:00 PM–12:00 AM | Successful Day / Wind-down | Yes |

The night wind-down currently contains:

* Vitamins
* Skincare
* Clean down

The repeating two-week cycle begins with Week 1 on Monday, 2026-08-10.

All chore-list items without an explicitly supplied time surface as unscheduled/ad-hoc items on their applicable day. They are not automatically placed in Time Alignment.

`Moneymaker` is authoritative in the Successful Day checklist only. Although it appears in the transcribed physical chore pattern below, it is excluded from generated chore definitions and daily chore occurrences.

## Two-week chore pattern transcribed from owner image

Source image: owner-provided reference image (not committed to this repository)

### Week 1

| Day | Items |
|---|---|
| Monday | Gym; Moneymaker; Laundry; Oil hair; Bingo |
| Tuesday | Moneymaker; Clean desk; Wash hair |
| Wednesday | Gym; Job hunt; Biki walk; Fold clothes; Bingo |
| Thursday | Long walk; Moneymaker; Change bedroom bed sheet; Laundry |
| Friday | Gym; Moneymaker; Bingo |
| Saturday | Badminton; Job hunt; Biki walk; Clean cupboard; Fold clothes; Wash hair |
| Sunday | Clean jewellery section; Expense tracker; Bingo |

### Week 2

| Day | Items |
|---|---|
| Monday | Gym; Moneymaker; Laundry; Oil hair; Bingo |
| Tuesday | Moneymaker; Clean desk; Wash hair |
| Wednesday | Gym; Job hunt; Biki walk; Fold clothes; Bingo |
| Thursday | Long walk; Moneymaker; Change hall bed sheet; Laundry |
| Friday | Gym; Moneymaker; Bingo |
| Saturday | Badminton; Job hunt; Biki walk; Clean cupboard; Fold clothes; Wash hair |
| Sunday | Clean kitchen; Expense tracker; Bingo |

## Implementation rules to preserve

* Successful Day timeline blocks use the blue source treatment.
* Two-week chore timeline blocks use the purple source treatment.
* Gym uses the Successful Day blue treatment. It is the scheduled form of the daily movement commitment, not a second completion target.
* The daily Successful Day movement item remains visible seven days per week. Monday, Tuesday, Thursday, and Friday additionally receive the linked 9:30 AM–12:00 PM Gym block; other days retain an unscheduled movement commitment such as 10k steps.
* A recurring item is materialized at most once per source occurrence and date.
* Auto-scheduled blocks retain a stable link to their daily checklist/chore occurrence so completion stays synchronized.
* Dated completion history must retain stable source identity so a future Bingo mapping can backfill eligible occurrences.
* Moneymaker is excluded from the chore seed and retains one completion source in Successful Day.

## Future refinements (not blockers)

* Job hunt, walks, Badminton, Bingo, and the remaining image entries are treated as chore-pattern items that surface unscheduled on their specified days.
* A preferred time and duration can be added later for any currently ad-hoc chore that should become auto-scheduled.
