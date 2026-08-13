import type { DailyTodoLine, DayState, ISODate, PlannerState, WeeklyAction } from '../types';
import { addDays, weekday } from '../lib/dates';
import { blankDailyTodo, emptyDay, uid } from './seed';

export interface WeeklyMutationOptions {
  now?: number;
  actionId?: string;
  dailyTodoId?: string;
}

export function mondayFor(date: ISODate): ISODate {
  return addDays(date, -weekday(date));
}

export function isDateInWeek(date: ISODate, weekStart: ISODate): boolean {
  return mondayFor(weekStart) === weekStart && date >= weekStart && date <= addDays(weekStart, 6);
}

export function normalizeWeeklyActionLines(input: string): string[] {
  return input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function touchAction(action: WeeklyAction, patch: Partial<WeeklyAction>, now: number): WeeklyAction {
  return { ...action, ...patch, updatedAt: now };
}

function findLinkedLine(day: DayState, action: WeeklyAction): DailyTodoLine | undefined {
  return day.todos.find((line) => line.id === action.linkedDailyTodoId)
    ?? day.todos.find((line) => line.sourceRefId === action.id);
}

function nextSortOrder(state: PlannerState, weekStart: ISODate): number {
  return state.weeklyActions.reduce((max, action) => action.weekStart === weekStart ? Math.max(max, action.sortOrder) : max, -1) + 1;
}

export function createWeeklyAction(
  state: PlannerState,
  weekStart: ISODate,
  text: string,
  options: WeeklyMutationOptions = {},
): PlannerState {
  const normalized = text.trim();
  if (!normalized || mondayFor(weekStart) !== weekStart) return state;
  const now = options.now ?? Date.now();
  const action: WeeklyAction = {
    id: options.actionId ?? uid('wa'),
    weekStart,
    text: normalized,
    sortOrder: nextSortOrder(state, weekStart),
    done: false,
    createdAt: now,
    updatedAt: now,
    source: 'weekly-planner',
  };
  return { ...state, weeklyActions: [...state.weeklyActions, action] };
}

export function pasteWeeklyActions(
  state: PlannerState,
  weekStart: ISODate,
  input: string,
  options: { now?: number; ids?: string[] } = {},
): PlannerState {
  return normalizeWeeklyActionLines(input).reduce(
    (next, text, index) => createWeeklyAction(next, weekStart, text, { now: options.now, actionId: options.ids?.[index] }),
    state,
  );
}

export function editWeeklyAction(state: PlannerState, actionId: string, text: string, now = Date.now()): PlannerState {
  const normalized = text.trim();
  const action = state.weeklyActions.find((item) => item.id === actionId);
  if (!action || !normalized || action.text === normalized) return state;
  if (!action.assignedDate) {
    return { ...state, weeklyActions: state.weeklyActions.map((item) => item.id === actionId ? touchAction(item, { text: normalized }, now) : item) };
  }
  const day = state.days[action.assignedDate];
  const linkedLine = day ? findLinkedLine(day, action) : undefined;
  const weeklyActions = state.weeklyActions.map((item) => item.id === actionId
    ? touchAction(item, { text: normalized, linkedDailyTodoId: linkedLine?.id ?? item.linkedDailyTodoId }, now)
    : item);
  if (!day || !linkedLine) return { ...state, weeklyActions };
  return {
    ...state,
    weeklyActions,
    days: {
      ...state.days,
      [action.assignedDate]: {
        ...day,
        todos: day.todos.map((line) => line.id === linkedLine.id || line.sourceRefId === action.id ? { ...line, text: normalized } : line),
      },
    },
  };
}

function linkedDailySurfaceIds(state: PlannerState, action: WeeklyAction): Set<string> {
  const ids = new Set<string>();
  Object.values(state.days).forEach((day) => {
    day.todos.forEach((line) => {
      if (line.id === action.linkedDailyTodoId || line.sourceRefId === action.id) ids.add(line.id);
    });
  });
  return ids;
}

/** Removes every daily representation of an action, including stale/duplicate links. */
function removeLinkedDailySurface(state: PlannerState, action: WeeklyAction): PlannerState {
  const removedTodoIds = linkedDailySurfaceIds(state, action);
  if (!removedTodoIds.size) return state;
  let changed = false;
  const days = Object.fromEntries(Object.entries(state.days).map(([date, day]) => {
    const todos = day.todos.filter((line) => !removedTodoIds.has(line.id) && line.sourceRefId !== action.id);
    const blocks = day.blocks.filter((block) => !block.sourceRefId || !removedTodoIds.has(block.sourceRefId));
    if (todos.length === day.todos.length && blocks.length === day.blocks.length) return [date, day];
    changed = true;
    while (todos.length < 15) todos.push(blankDailyTodo());
    return [date, { ...day, todos, blocks }];
  }));
  return changed ? { ...state, days } : state;
}

export function deleteWeeklyAction(state: PlannerState, actionId: string): PlannerState {
  const action = state.weeklyActions.find((item) => item.id === actionId);
  if (!action) return state;
  const withoutSurface = removeLinkedDailySurface(state, action);
  return { ...withoutSurface, weeklyActions: withoutSurface.weeklyActions.filter((item) => item.id !== actionId) };
}

function appendDailyLine(day: DayState, line: DailyTodoLine): DayState {
  if (day.todos.some((item) => item.sourceRefId === line.sourceRefId || item.id === line.id)) return day;
  let lastWritten = -1;
  day.todos.forEach((item, index) => { if (item.text.trim()) lastWritten = index; });
  const insertAt = lastWritten + 1;
  const todos = day.todos.slice();
  if (insertAt < todos.length && !todos[insertAt].text.trim()) todos[insertAt] = line;
  else todos.splice(insertAt, 0, line);
  return { ...day, todos };
}

export function assignWeeklyAction(
  state: PlannerState,
  actionId: string,
  date: ISODate,
  options: WeeklyMutationOptions = {},
): PlannerState {
  const action = state.weeklyActions.find((item) => item.id === actionId);
  if (!action || !isDateInWeek(date, action.weekStart)) return state;
  const existingSurfaces = Object.entries(state.days).flatMap(([surfaceDate, day]) => day.todos
    .filter((line) => line.id === action.linkedDailyTodoId || line.sourceRefId === action.id)
    .map((line) => ({ surfaceDate, line })));
  if (action.assignedDate === date
    && existingSurfaces.length === 1
    && existingSurfaces[0].surfaceDate === date
    && existingSurfaces[0].line.id === action.linkedDailyTodoId) return state;
  const now = options.now ?? Date.now();
  const reusableDailyTodoId = existingSurfaces.find(({ line }) => line.id === action.linkedDailyTodoId)?.line.id
    ?? existingSurfaces.find(({ line }) => line.sourceRefId === action.id)?.line.id;
  const withoutOldSurface = removeLinkedDailySurface(state, action);
  const linkedDailyTodoId = reusableDailyTodoId ?? options.dailyTodoId ?? action.linkedDailyTodoId ?? uid('dt');
  const destination = withoutOldSurface.days[date] ?? emptyDay();
  const nextDay = appendDailyLine(destination, {
    id: linkedDailyTodoId,
    text: action.text,
    done: action.done,
    sourceRefId: action.id,
  });
  return {
    ...withoutOldSurface,
    weeklyActions: withoutOldSurface.weeklyActions.map((item) => item.id === actionId
      ? touchAction(item, { assignedDate: date, linkedDailyTodoId }, now)
      : item),
    days: { ...withoutOldSurface.days, [date]: nextDay },
  };
}

export function toggleWeeklyAction(state: PlannerState, actionId: string, now = Date.now()): PlannerState {
  const action = state.weeklyActions.find((item) => item.id === actionId);
  if (!action) return state;
  const done = !action.done;
  const day = action.assignedDate ? state.days[action.assignedDate] : undefined;
  const linkedLine = day ? findLinkedLine(day, action) : undefined;
  const weeklyActions = state.weeklyActions.map((item) => item.id === actionId
    ? touchAction(item, {
      done,
      completedAt: done ? now : undefined,
      linkedDailyTodoId: linkedLine?.id ?? item.linkedDailyTodoId,
    }, now)
    : item);
  if (!action.assignedDate || !day || !linkedLine) return { ...state, weeklyActions };
  return {
    ...state,
    weeklyActions,
    days: {
      ...state.days,
      [action.assignedDate]: {
        ...day,
        todos: day.todos.map((line) => line.id === linkedLine.id || line.sourceRefId === action.id ? { ...line, done } : line),
        blocks: day.blocks.map((block) => block.sourceRefId === linkedLine.id ? { ...block, completed: done } : block),
      },
    },
  };
}

/** Reconciles supported edits made through the existing Daily Page patch API. */
export function reconcileWeeklyActionsFromDailyPatch(
  state: PlannerState,
  date: ISODate,
  previousDay: DayState,
  nextDay: DayState,
  now = Date.now(),
): PlannerState {
  const previousById = new Map(previousDay.todos.map((line) => [line.id, line]));
  const nextById = new Map(nextDay.todos.map((line) => [line.id, line]));
  let changed = false;
  const weeklyActions = state.weeklyActions.map((action) => {
    if (action.assignedDate !== date) return action;
    const previous = (action.linkedDailyTodoId ? previousById.get(action.linkedDailyTodoId) : undefined)
      ?? previousDay.todos.find((line) => line.sourceRefId === action.id);
    const next = (action.linkedDailyTodoId ? nextById.get(action.linkedDailyTodoId) : undefined)
      ?? nextDay.todos.find((line) => line.sourceRefId === action.id);
    if (!previous || !next) {
      if (!next) {
        changed = true;
        return touchAction(action, { assignedDate: undefined, linkedDailyTodoId: undefined }, now);
      }
      return action;
    }
    const patch: Partial<WeeklyAction> = {};
    if (next.id !== action.linkedDailyTodoId) patch.linkedDailyTodoId = next.id;
    if (next.text.trim() && next.text !== previous.text) patch.text = next.text.trim();
    if (next.done !== previous.done) {
      patch.done = next.done;
      patch.completedAt = next.done ? now : undefined;
    }
    if (!Object.keys(patch).length) return action;
    changed = true;
    return touchAction(action, patch, now);
  });
  return changed ? { ...state, weeklyActions } : state;
}
