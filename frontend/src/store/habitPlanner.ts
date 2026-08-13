import type { DailyTodoLine, HabitPlanItem, ISODate, PlannerState } from '../types';
import { blankDailyTodo, emptyDay, uid } from './seed';

export const DEFAULT_HABIT_CATEGORIES = [
  'Gym',
  'Job hunt',
  'My cat',
  'Organizing my house',
  'Sorting my finances',
  'Bingo',
];

function appendDailyLine(state: PlannerState, item: HabitPlanItem): PlannerState {
  const day = state.days[item.date] ?? emptyDay();
  if (day.todos.some((line) => line.sourceRefId === item.id)) return state;
  const todos = day.todos.slice();
  let insertAt = 0;
  todos.forEach((line, index) => { if (line.text.trim()) insertAt = index + 1; });
  const line: DailyTodoLine = { id: item.linkedDailyTodoId, text: item.text, done: item.done, sourceRefId: item.id };
  if (insertAt < todos.length && !todos[insertAt].text.trim()) todos[insertAt] = line;
  else todos.splice(insertAt, 0, line);
  return { ...state, days: { ...state.days, [item.date]: { ...day, todos } } };
}

export function addHabitCategory(state: PlannerState, label: string, id = uid('hc')): PlannerState {
  const normalized = label.trim();
  if (!normalized) return state;
  return { ...state, habitCategories: [...state.habitCategories, { id, label: normalized, sortOrder: state.habitCategories.length }] };
}

export function renameHabitCategory(state: PlannerState, categoryId: string, label: string): PlannerState {
  const normalized = label.trim();
  if (!normalized || !state.habitCategories.some((category) => category.id === categoryId)) return state;
  return { ...state, habitCategories: state.habitCategories.map((category) => category.id === categoryId ? { ...category, label: normalized } : category) };
}

export function moveHabitCategory(state: PlannerState, categoryId: string, direction: -1 | 1): PlannerState {
  const categories = [...state.habitCategories].sort((a, b) => a.sortOrder - b.sortOrder);
  const index = categories.findIndex((category) => category.id === categoryId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= categories.length) return state;
  [categories[index], categories[target]] = [categories[target], categories[index]];
  return { ...state, habitCategories: categories.map((category, sortOrder) => ({ ...category, sortOrder })) };
}

export function addHabitPlanItem(state: PlannerState, categoryId: string, date: ISODate, text: string, ids?: { itemId: string; dailyTodoId: string }, now = Date.now()): PlannerState {
  const normalized = text.trim();
  if (!normalized || !state.habitCategories.some((category) => category.id === categoryId)) return state;
  const item: HabitPlanItem = {
    id: ids?.itemId ?? uid('hp'), categoryId, date, text: normalized, done: false, mark: 'blank',
    linkedDailyTodoId: ids?.dailyTodoId ?? uid('dt'), createdAt: now, updatedAt: now, source: 'habit-planner',
  };
  return appendDailyLine({ ...state, habitPlanItems: [...state.habitPlanItems, item] }, item);
}

export function editHabitPlanItem(state: PlannerState, itemId: string, text: string, now = Date.now()): PlannerState {
  const normalized = text.trim();
  const item = state.habitPlanItems.find((candidate) => candidate.id === itemId);
  if (!item || !normalized) return state;
  return {
    ...state,
    habitPlanItems: state.habitPlanItems.map((candidate) => candidate.id === itemId ? { ...candidate, text: normalized, updatedAt: now } : candidate),
    days: Object.fromEntries(Object.entries(state.days).map(([date, day]) => [date, {
      ...day,
      todos: day.todos.map((line) => line.sourceRefId === itemId || line.id === item.linkedDailyTodoId ? { ...line, text: normalized } : line),
      blocks: day.blocks.map((block) => block.sourceRefId === item.linkedDailyTodoId ? { ...block, label: normalized } : block),
    }])),
  };
}

export function setHabitPlanItemMark(state: PlannerState, itemId: string, mark: 'blank' | 'check' | 'cross', now = Date.now()): PlannerState {
  const item = state.habitPlanItems.find((candidate) => candidate.id === itemId);
  if (!item) return state;
  const done = mark === 'check';
  return {
    ...state,
    habitPlanItems: state.habitPlanItems.map((candidate) => candidate.id === itemId ? { ...candidate, mark, done, updatedAt: now, completedAt: done ? now : undefined } : candidate),
    days: Object.fromEntries(Object.entries(state.days).map(([date, day]) => [date, {
      ...day,
      todos: day.todos.map((line) => line.sourceRefId === itemId || line.id === item.linkedDailyTodoId ? { ...line, done } : line),
      blocks: day.blocks.map((block) => block.sourceRefId === item.linkedDailyTodoId ? { ...block, completed: done } : block),
    }])),
  };
}

export function deleteHabitPlanItem(state: PlannerState, itemId: string): PlannerState {
  const item = state.habitPlanItems.find((candidate) => candidate.id === itemId);
  if (!item) return state;
  const days = Object.fromEntries(Object.entries(state.days).map(([date, day]) => {
    const todos = day.todos.filter((line) => line.sourceRefId !== itemId && line.id !== item.linkedDailyTodoId);
    while (todos.length < 15) todos.push(blankDailyTodo());
    return [date, { ...day, todos, blocks: day.blocks.filter((block) => block.sourceRefId !== item.linkedDailyTodoId) }];
  }));
  return { ...state, habitPlanItems: state.habitPlanItems.filter((candidate) => candidate.id !== itemId), days };
}

export function reconcileHabitItemsFromDailyPatch(state: PlannerState, date: ISODate, now = Date.now()): PlannerState {
  const day = state.days[date];
  if (!day) return state;
  let changed = false;
  const habitPlanItems = state.habitPlanItems.map((item) => {
    if (item.date !== date) return item;
    const line = day.todos.find((candidate) => candidate.sourceRefId === item.id || candidate.id === item.linkedDailyTodoId);
    if (!line) return item;
    const text = line.text.trim() || item.text;
    if (text === item.text && line.done === item.done && line.id === item.linkedDailyTodoId) return item;
    changed = true;
    const mark: HabitPlanItem['mark'] = line.done ? 'check' : item.mark === 'check' ? 'blank' : item.mark;
    return { ...item, text, done: line.done, mark, linkedDailyTodoId: line.id, updatedAt: now, completedAt: line.done ? item.completedAt ?? now : undefined };
  });
  return changed ? { ...state, habitPlanItems } : state;
}
