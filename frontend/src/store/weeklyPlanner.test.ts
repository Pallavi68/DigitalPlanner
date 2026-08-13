import { describe, expect, it } from 'vitest';
import type { PlannerState } from '../types';
import { blankDailyTodo, emptyDay, initialState } from './seed';
import { migratePlannerState } from './storage';
import {
  assignWeeklyAction,
  createWeeklyAction,
  deleteWeeklyAction,
  editWeeklyAction,
  normalizeWeeklyActionLines,
  pasteWeeklyActions,
  reconcileWeeklyActionsFromDailyPatch,
  toggleWeeklyAction,
} from './weeklyPlanner';

const WEEK = '2026-08-10';

function withAction(text = 'Book doctor'): PlannerState {
  return createWeeklyAction(initialState(), WEEK, text, { now: 100, actionId: 'wa-1' });
}

describe('weekly action capture', () => {
  it('normalizes multiline paste and preserves stable order and timestamps', () => {
    expect(normalizeWeeklyActionLines(' First \r\n\n Second  \n   ')).toEqual(['First', 'Second']);
    const state = pasteWeeklyActions(initialState(), WEEK, ' First \n\n Second ', { now: 100, ids: ['a', 'b'] });
    expect(state.weeklyActions).toEqual([
      expect.objectContaining({ id: 'a', text: 'First', sortOrder: 0, createdAt: 100, updatedAt: 100 }),
      expect.objectContaining({ id: 'b', text: 'Second', sortOrder: 1, createdAt: 100, updatedAt: 100 }),
    ]);
  });

  it('rejects blank actions and non-Monday week anchors', () => {
    const state = initialState();
    expect(createWeeklyAction(state, WEEK, '   ')).toBe(state);
    expect(createWeeklyAction(state, '2026-08-11', 'Task')).toBe(state);
  });
});

describe('weekly and daily assignment invariants', () => {
  it('assigns only inside the owning week and same-day assignment is a no-op', () => {
    const state = withAction();
    expect(assignWeeklyAction(state, 'wa-1', '2026-08-17')).toBe(state);
    const assigned = assignWeeklyAction(state, 'wa-1', '2026-08-13', { now: 200, dailyTodoId: 'daily-1' });
    expect(assigned.weeklyActions[0]).toEqual(expect.objectContaining({ assignedDate: '2026-08-13', linkedDailyTodoId: 'daily-1' }));
    expect(assigned.days['2026-08-13'].todos.filter((line) => line.sourceRefId === 'wa-1')).toEqual([
      expect.objectContaining({ id: 'daily-1', text: 'Book doctor', done: false }),
    ]);
    expect(assignWeeklyAction(assigned, 'wa-1', '2026-08-13')).toBe(assigned);
  });

  it('appends after the last written line while preserving paper blanks', () => {
    const state = withAction();
    const day = emptyDay();
    day.todos[0] = { ...day.todos[0], text: 'First' };
    day.todos[3] = { ...day.todos[3], text: 'Fourth written' };
    state.days['2026-08-13'] = day;
    const assigned = assignWeeklyAction(state, 'wa-1', '2026-08-13', { dailyTodoId: 'daily-1' });
    expect(assigned.days['2026-08-13'].todos[1].text).toBe('');
    expect(assigned.days['2026-08-13'].todos[3].text).toBe('Fourth written');
    expect(assigned.days['2026-08-13'].todos[4]).toEqual(expect.objectContaining({ id: 'daily-1', sourceRefId: 'wa-1' }));
  });

  it('moves atomically, retains identities/completion, and removes old linked blocks', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { now: 200, dailyTodoId: 'daily-1' });
    state = toggleWeeklyAction(state, 'wa-1', 250);
    state.days['2026-08-13'].blocks.push({ id: 'block-1', date: '2026-08-13', startSlot: 2, endSlot: 3, label: 'Book doctor', tag: 'todo', sourceRefId: 'daily-1' });
    const moved = assignWeeklyAction(state, 'wa-1', '2026-08-14', { now: 300 });
    expect(moved.weeklyActions[0]).toEqual(expect.objectContaining({ id: 'wa-1', assignedDate: '2026-08-14', linkedDailyTodoId: 'daily-1', done: true }));
    expect(moved.days['2026-08-13'].todos.some((line) => line.id === 'daily-1')).toBe(false);
    expect(moved.days['2026-08-13'].blocks).toHaveLength(0);
    expect(moved.days['2026-08-14'].todos.filter((line) => line.sourceRefId === 'wa-1')).toEqual([
      expect.objectContaining({ id: 'daily-1', done: true }),
    ]);
  });

  it('moves using a stale linked ID by finding and removing the source-ref surface', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-real' });
    state.weeklyActions[0] = { ...state.weeklyActions[0], linkedDailyTodoId: 'daily-stale' };
    state.days['2026-08-13'].blocks.push({ id: 'block-1', date: '2026-08-13', startSlot: 2, endSlot: 3, label: 'Book doctor', tag: 'todo', sourceRefId: 'daily-real' });
    const moved = assignWeeklyAction(state, 'wa-1', '2026-08-14', { now: 300 });
    expect(moved.days['2026-08-13'].todos.some((line) => line.sourceRefId === 'wa-1')).toBe(false);
    expect(moved.days['2026-08-13'].blocks).toHaveLength(0);
    expect(moved.days['2026-08-14'].todos.filter((line) => line.sourceRefId === 'wa-1')).toEqual([
      expect.objectContaining({ id: 'daily-real' }),
    ]);
    expect(moved.weeklyActions[0].linkedDailyTodoId).toBe('daily-real');
  });

  it('cleans duplicate source-ref surfaces across days before assigning exactly one', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-1' });
    state.days['2026-08-12'] = emptyDay();
    state.days['2026-08-12'].todos[0] = { id: 'daily-duplicate', text: 'Book doctor', done: false, sourceRefId: 'wa-1' };
    state.days['2026-08-12'].blocks.push({ id: 'block-duplicate', date: '2026-08-12', startSlot: 2, endSlot: 3, label: 'Book doctor', tag: 'todo', sourceRefId: 'daily-duplicate' });
    const moved = assignWeeklyAction(state, 'wa-1', '2026-08-14');
    const surfaces = Object.entries(moved.days).flatMap(([date, day]) => day.todos
      .filter((line) => line.sourceRefId === 'wa-1')
      .map((line) => ({ date, id: line.id })));
    expect(surfaces).toEqual([{ date: '2026-08-14', id: 'daily-1' }]);
    expect(moved.days['2026-08-12'].blocks).toHaveLength(0);
  });

  it('deletes a stale-ID action and every daily source-ref surface and block', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-real' });
    state.weeklyActions[0] = { ...state.weeklyActions[0], linkedDailyTodoId: 'daily-stale' };
    state.days['2026-08-13'].blocks.push({ id: 'block-1', date: '2026-08-13', startSlot: 2, endSlot: 3, label: 'Book doctor', tag: 'todo', sourceRefId: 'daily-real' });
    const deleted = deleteWeeklyAction(state, 'wa-1');
    expect(deleted.weeklyActions).toHaveLength(0);
    expect(deleted.days['2026-08-13'].todos.some((line) => line.sourceRefId === 'wa-1')).toBe(false);
    expect(deleted.days['2026-08-13'].blocks).toHaveLength(0);
  });

  it('propagates weekly edits/toggles and scheduled deletion to daily state', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-1' });
    state = editWeeklyAction(state, 'wa-1', 'See the doctor', 200);
    expect(state.days['2026-08-13'].todos.find((line) => line.id === 'daily-1')?.text).toBe('See the doctor');
    state = toggleWeeklyAction(state, 'wa-1', 300);
    expect(state.days['2026-08-13'].todos.find((line) => line.id === 'daily-1')?.done).toBe(true);
    const deleted = deleteWeeklyAction(state, 'wa-1');
    expect(deleted.weeklyActions).toHaveLength(0);
    expect(deleted.days['2026-08-13'].todos).toHaveLength(15);
    expect(deleted.days['2026-08-13'].todos.some((line) => line.id === 'daily-1')).toBe(false);
  });

  it('repairs a stale linked ID while propagating weekly edits and toggles', () => {
    let state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-real' });
    state.weeklyActions[0] = { ...state.weeklyActions[0], linkedDailyTodoId: 'daily-stale' };
    state.days['2026-08-13'].blocks.push({ id: 'block-1', date: '2026-08-13', startSlot: 2, endSlot: 3, label: 'Book doctor', tag: 'todo', sourceRefId: 'daily-real' });
    state = editWeeklyAction(state, 'wa-1', 'See the doctor', 200);
    expect(state.weeklyActions[0].linkedDailyTodoId).toBe('daily-real');
    expect(state.days['2026-08-13'].todos.find((line) => line.id === 'daily-real')?.text).toBe('See the doctor');
    state = toggleWeeklyAction(state, 'wa-1', 300);
    expect(state.days['2026-08-13'].todos.find((line) => line.id === 'daily-real')?.done).toBe(true);
    expect(state.days['2026-08-13'].blocks[0].completed).toBe(true);
  });
});

describe('daily reconciliation', () => {
  it('reflects a Daily Page edit and completion in the weekly source', () => {
    const state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-1' });
    const previous = state.days['2026-08-13'];
    const next = {
      ...previous,
      todos: previous.todos.map((line) => line.id === 'daily-1' ? { ...line, text: 'Doctor appointment', done: true } : line),
    };
    const reconciled = reconcileWeeklyActionsFromDailyPatch({ ...state, days: { ...state.days, '2026-08-13': next } }, '2026-08-13', previous, next, 400);
    expect(reconciled.weeklyActions[0]).toEqual(expect.objectContaining({ text: 'Doctor appointment', done: true, completedAt: 400 }));
  });

  it('unschedules when the linked Daily To Do is deleted', () => {
    const state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-1' });
    const previous = state.days['2026-08-13'];
    const todos = previous.todos.filter((line) => line.id !== 'daily-1');
    while (todos.length < 15) todos.push(blankDailyTodo());
    const next = { ...previous, todos };
    const reconciled = reconcileWeeklyActionsFromDailyPatch({ ...state, days: { ...state.days, '2026-08-13': next } }, '2026-08-13', previous, next, 400);
    expect(reconciled.weeklyActions[0]).toEqual(expect.objectContaining({ done: false }));
    expect(reconciled.weeklyActions[0].assignedDate).toBeUndefined();
    expect(reconciled.weeklyActions[0].linkedDailyTodoId).toBeUndefined();
  });

  it('uses source identity to reconcile daily completion when the stored linked ID is stale', () => {
    const state = assignWeeklyAction(withAction(), 'wa-1', '2026-08-13', { dailyTodoId: 'daily-real' });
    state.weeklyActions[0] = { ...state.weeklyActions[0], linkedDailyTodoId: 'daily-stale' };
    const previous = state.days['2026-08-13'];
    const next = {
      ...previous,
      todos: previous.todos.map((line) => line.id === 'daily-real' ? { ...line, done: true } : line),
    };
    const reconciled = reconcileWeeklyActionsFromDailyPatch(
      { ...state, days: { ...state.days, '2026-08-13': next } },
      '2026-08-13',
      previous,
      next,
      400,
    );
    expect(reconciled.weeklyActions[0]).toEqual(expect.objectContaining({
      linkedDailyTodoId: 'daily-real', done: true, completedAt: 400,
    }));
  });
});

describe('migration', () => {
  it('adds weeklyActions to old aggregate documents without disturbing data', () => {
    const old = initialState() as unknown as Record<string, unknown>;
    delete old.weeklyActions;
    old.version = 5;
    old.setupComplete = true;
    const migrated = migratePlannerState(old as unknown as PlannerState);
    expect(migrated.version).toBe(7);
    expect(migrated.weeklyActions).toEqual([]);
    expect(migrated.setupComplete).toBe(true);
  });

  it('sanitizes malformed weekly action hydration without dropping valid entries', () => {
    const malformedContainer = { ...initialState(), weeklyActions: { nope: true } };
    expect(migratePlannerState(malformedContainer as unknown as PlannerState).weeklyActions).toEqual([]);

    const mixed = {
      ...initialState(),
      weeklyActions: [
        null,
        { id: 'valid', weekStart: WEEK, text: '  Keep me  ', done: true, assignedDate: 'bad-date' },
        { id: '', weekStart: WEEK, text: 'Drop me' },
        'also bad',
      ],
    };
    expect(migratePlannerState(mixed as unknown as PlannerState).weeklyActions).toEqual([
      expect.objectContaining({
        id: 'valid', text: 'Keep me', sortOrder: 1, done: true, assignedDate: undefined,
        linkedDailyTodoId: undefined, createdAt: 0, updatedAt: 0, source: 'weekly-planner',
      }),
    ]);
  });
});
