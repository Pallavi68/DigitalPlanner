import { describe, expect, it } from 'vitest';
import type { HabitRow, Preferences, RoutineHabit } from '../types';
import {
  applicableChoreRows,
  choreAutoBlockCandidates,
  choreOccurrenceId,
  cycleWeekForDate,
  dailyAutoBlockCandidates,
  materializeDailyChores,
  routineAutoBlockCandidates,
  windDownAutoBlockCandidates,
} from './recurringSchedule';
import { initialState } from './seed';
import { migratePlannerState } from './storage';

const anchor = '2026-08-10';

describe('anchored recurrence', () => {
  it('calculates Week 1 and 2 before, at, and after the anchor', () => {
    expect(cycleWeekForDate('2026-08-03', anchor)).toBe(2);
    expect(cycleWeekForDate(anchor, anchor)).toBe(1);
    expect(cycleWeekForDate('2026-08-16', anchor)).toBe(1);
    expect(cycleWeekForDate('2026-08-17', anchor)).toBe(2);
    expect(cycleWeekForDate('2026-08-24', anchor)).toBe(1);
  });

  it('filters by start date, archive, weekday, and alternating week', () => {
    const base = { category: 'Chores' as const, weekday: 6 as const, cycleAnchorDate: anchor, since: anchor };
    const rows: HabitRow[] = [
      { ...base, id: 'jewellery', label: 'Clean jewellery section', cycleWeeks: [1] },
      { ...base, id: 'kitchen', label: 'Clean kitchen', cycleWeeks: [2] },
      { ...base, id: 'future', label: 'Future', since: '2026-09-01' },
      { ...base, id: 'archived', label: 'Archived', archived: true },
    ];
    expect(applicableChoreRows(rows, '2026-08-16').map((row) => row.id)).toEqual(['jewellery']);
    expect(applicableChoreRows(rows, '2026-08-23').map((row) => row.id)).toEqual(['kitchen']);
  });
});

describe('chore materialization', () => {
  const timedRow: HabitRow = {
    id: 'laundry', label: 'Laundry', category: 'Chores', weekday: 0, since: anchor,
    durationMinutes: 60, defaultStartSlot: 8, autoSchedule: true,
  };

  it('uses stable occurrence identity and grid completion', () => {
    const first = materializeDailyChores([timedRow], anchor, { [`${anchor}|laundry`]: 'check' });
    const second = materializeDailyChores([timedRow], anchor, { [`${anchor}|laundry`]: 'check' });
    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({ id: choreOccurrenceId('laundry', anchor), completed: true, mark: 'check' });
  });

  it('creates a purple-source candidate once and preserves its link', () => {
    const occurrence = materializeDailyChores([timedRow], anchor, {})[0];
    const candidate = choreAutoBlockCandidates([occurrence]);
    expect(candidate[0]).toMatchObject({ tag: 'chore', startSlot: 8, endSlot: 10, sourceRefId: occurrence.id });
    expect(choreAutoBlockCandidates([occurrence], candidate)).toEqual([]);
  });
});

describe('Moneymaker source ownership', () => {
  it('keeps Moneymaker in Successful Day and excludes it from chore recurrence', () => {
    const state = initialState();
    expect(state.routineHabits.some((habit) => habit.label === 'Moneymaker')).toBe(true);
    expect(state.habitRows.some((row) => row.label === 'Moneymaker')).toBe(false);
  });

  it('removes obsolete Moneymaker chore state during migration', () => {
    const state = initialState();
    const obsoleteId = 'chore_moneymaker_mon';
    state.habitRows.push({ id: obsoleteId, label: 'Moneymaker', category: 'Moneymaker', weekday: 0, since: anchor });
    state.gridMarks[`${anchor}|${obsoleteId}`] = 'check';
    state.choreCompletions = { [`${anchor}|${obsoleteId}`]: { mark: 'check', actualCompletionDate: anchor } };
    state.days[anchor] = {
      routineDone: {}, routineInstances: [], todos: [],
      blocks: [{ id: 'old-block', date: anchor, startSlot: 0, endSlot: 1, label: 'Moneymaker', tag: 'chore', sourceRefId: `chore_${anchor}_${obsoleteId}` }],
      windDown: { checklist: [], tomorrowPlan: '', bedtime: '' },
    };

    const migrated = migratePlannerState(state);
    expect(migrated.habitRows.some((row) => row.id === obsoleteId)).toBe(false);
    expect(migrated.gridMarks[`${anchor}|${obsoleteId}`]).toBeUndefined();
    expect(migrated.choreCompletions?.[`${anchor}|${obsoleteId}`]).toBeUndefined();
    expect(migrated.days[anchor].blocks).toHaveLength(0);
  });
});

describe('automatic block suppression', () => {
  it('does not recreate an automatic block explicitly removed for that date', () => {
    const state = initialState();
    const movement = state.routineHabits.find((habit) => habit.label === 'Movement');
    expect(movement).toBeDefined();
    state.days[anchor] = {
      routineDone: {},
      routineInstances: [],
      todos: [],
      blocks: [],
      windDown: { checklist: [], tomorrowPlan: '', bedtime: '' },
      suppressedAutoBlockIds: [`auto_routine_${anchor}_${movement!.id}`],
    };
    const blocks = dailyAutoBlockCandidates(state, anchor);
    expect(blocks.some((block) => block.label === 'Gym')).toBe(false);
  });
});

describe('routine and wind-down auto blocks', () => {
  const movement: RoutineHabit = {
    id: 'movement', label: 'Daily movement', period: 'AM', durationMinutes: 150,
    defaultStartSlot: 3, autoScheduleWeekdays: [0, 1, 3, 4], autoScheduleLabel: 'Gym',
    sortOrder: 0, since: anchor,
    revisions: [{
      effectiveFrom: anchor, label: 'Daily movement', period: 'AM', durationMinutes: 150,
      defaultStartSlot: 3, autoScheduleWeekdays: [0, 1, 3, 4], autoScheduleLabel: 'Gym',
      sortOrder: 0, archived: false,
    }],
  };

  it('slots Gym at 9:30–12 only on M/T/Th/F with stable identity', () => {
    const monday = routineAutoBlockCandidates([movement], anchor);
    expect(monday[0]).toMatchObject({ label: 'Gym', tag: 'routine', startSlot: 3, endSlot: 8 });
    expect(routineAutoBlockCandidates([movement], '2026-08-12')).toEqual([]);
    expect(routineAutoBlockCandidates([movement], anchor, {}, monday)).toEqual([]);
  });

  it('slots three individual evening actions at their exact times', () => {
    const preferences = {
      windDownSchedule: { startSlot: 30, durationMinutes: 60, autoSchedule: true },
    } as Preferences;
    const checklist = [
      { id: 'vitamins', label: 'Vitamins', done: false },
      { id: 'skincare', label: 'Skincare', done: true },
      { id: 'clean', label: 'Clean down', done: false },
    ];
    const candidates = windDownAutoBlockCandidates(anchor, preferences, checklist);
    expect(candidates).toHaveLength(3);
    expect(candidates[0]).toMatchObject({ startSlot: 30 + 15 / 30, endSlot: 30 + 20 / 30, label: 'Vitamins', sourceRefId: 'vitamins' });
    expect(candidates[1]).toMatchObject({ startSlot: 30 + 20 / 30, endSlot: 31, label: 'Clean down', sourceRefId: 'clean' });
    expect(candidates[2]).toMatchObject({ startSlot: 31, endSlot: 31 + 10 / 30, label: 'Night-time skincare', sourceRefId: 'skincare', completed: true });
    expect(windDownAutoBlockCandidates(anchor, preferences, checklist, candidates)).toEqual([]);
  });
});
