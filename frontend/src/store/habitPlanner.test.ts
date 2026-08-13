import { describe, expect, it } from 'vitest';
import { initialState } from './seed';
import { addHabitPlanItem, editHabitPlanItem, moveHabitCategory, reconcileHabitItemsFromDailyPatch, renameHabitCategory, setHabitPlanItemMark } from './habitPlanner';

describe('two-week habit planner daily synchronization', () => {
  it('surfaces every added activity directly in the matching Daily To Dos', () => {
    const base = initialState();
    const category = base.habitCategories.find((item) => item.label === 'Organizing my house')!;
    let state = addHabitPlanItem(base, category.id, '2026-08-13', 'Change bed sheets', { itemId: 'habit-1', dailyTodoId: 'daily-1' }, 1);
    state = addHabitPlanItem(state, category.id, '2026-08-13', 'Clean room', { itemId: 'habit-2', dailyTodoId: 'daily-2' }, 2);
    expect(state.days['2026-08-13'].todos.filter((item) => item.text)).toEqual([
      { id: 'daily-1', text: 'Change bed sheets', done: false, sourceRefId: 'habit-1' },
      { id: 'daily-2', text: 'Clean room', done: false, sourceRefId: 'habit-2' },
    ]);
  });

  it('keeps text and completion synchronized in both directions', () => {
    const base = initialState();
    const categoryId = base.habitCategories[0].id;
    let state = addHabitPlanItem(base, categoryId, '2026-08-13', 'Go to the gym', { itemId: 'habit-1', dailyTodoId: 'daily-1' }, 1);
    state = setHabitPlanItemMark(state, 'habit-1', 'check', 2);
    expect(state.days['2026-08-13'].todos.find((item) => item.id === 'daily-1')?.done).toBe(true);
    state = editHabitPlanItem(state, 'habit-1', 'Gym workout', 3);
    expect(state.days['2026-08-13'].todos.find((item) => item.id === 'daily-1')?.text).toBe('Gym workout');

    const day = state.days['2026-08-13'];
    state = { ...state, days: { ...state.days, '2026-08-13': { ...day, todos: day.todos.map((item) => item.id === 'daily-1' ? { ...item, text: 'Strength workout', done: false } : item) } } };
    state = reconcileHabitItemsFromDailyPatch(state, '2026-08-13', 4);
    expect(state.habitPlanItems[0]).toMatchObject({ text: 'Strength workout', done: false, linkedDailyTodoId: 'daily-1' });
  });

  it('supports an explicit cross without completing the Daily To Do', () => {
    const base = initialState();
    let state = addHabitPlanItem(base, base.habitCategories[0].id, '2026-08-11', 'Gym', { itemId: 'habit-1', dailyTodoId: 'daily-1' }, 1);
    state = setHabitPlanItemMark(state, 'habit-1', 'cross', 2);
    expect(state.habitPlanItems[0]).toMatchObject({ mark: 'cross', done: false });
    expect(state.days['2026-08-11'].todos.find((item) => item.id === 'daily-1')?.done).toBe(false);
  });

  it('renames and rearranges category labels', () => {
    let state = initialState();
    const gymId = state.habitCategories[0].id;
    state = renameHabitCategory(state, gymId, 'Movement');
    state = moveHabitCategory(state, gymId, 1);
    expect([...state.habitCategories].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.label).slice(0, 2)).toEqual(['Job hunt', 'Movement']);
  });
});
