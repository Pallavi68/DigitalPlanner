import type {
  CellMark,
  GridMarks,
  HabitRow,
  ISODate,
  PlannerState,
  Preferences,
  RoutineHabit,
  TimeBlock,
} from '../types';
import { SLOT_COUNT, SLOT_MINUTES, weekday } from '../lib/dates';
import { revisionForDate } from './routines';

export type CycleWeek = 1 | 2;

export interface DailyChoreOccurrence {
  id: string;
  sourceChoreId: string;
  date: ISODate;
  label: string;
  durationMinutes?: number;
  defaultStartSlot?: number;
  autoSchedule: boolean;
  mark: CellMark;
  completed: boolean;
}

const MS_PER_DAY = 86_400_000;

function utcDayNumber(date: ISODate): number {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / MS_PER_DAY;
}

function durationSlots(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes / SLOT_MINUTES));
}

function withoutExisting(candidates: TimeBlock[], existing: readonly TimeBlock[]): TimeBlock[] {
  const ids = new Set(existing.map((block) => block.id));
  const sourceRefs = new Set(existing.map((block) => block.sourceRefId).filter(Boolean));
  return candidates.filter((candidate) => !ids.has(candidate.id) && !sourceRefs.has(candidate.sourceRefId));
}

/** Returns the anchored repeating cycle week, including for dates before the anchor. */
export function cycleWeekForDate(date: ISODate, weekOneAnchor: ISODate): CycleWeek {
  const dayDelta = utcDayNumber(date) - utcDayNumber(weekOneAnchor);
  const weekOffset = Math.floor(dayDelta / 7);
  return (((weekOffset % 2) + 2) % 2 === 0 ? 1 : 2) as CycleWeek;
}

export function choreOccurrenceId(rowId: string, date: ISODate): string {
  return `chore_${date}_${rowId}`;
}

export function choreGridKey(rowId: string, date: ISODate): string {
  return `${date}|${rowId}`;
}

export function applicableChoreRows(rows: readonly HabitRow[], date: ISODate): HabitRow[] {
  const dateWeekday = weekday(date);
  return rows.filter((row) => {
    if (row.archived || row.since > date) return false;
    if (row.weekday !== undefined && row.weekday !== dateWeekday) return false;
    if (!row.cycleWeeks?.length) return true;
    if (!row.cycleAnchorDate) return false;
    return row.cycleWeeks.includes(cycleWeekForDate(date, row.cycleAnchorDate));
  });
}

export function materializeDailyChores(
  rows: readonly HabitRow[],
  date: ISODate,
  gridMarks: GridMarks,
): DailyChoreOccurrence[] {
  return applicableChoreRows(rows, date).map((row) => {
    const mark = gridMarks[choreGridKey(row.id, date)] ?? 'blank';
    return {
      id: choreOccurrenceId(row.id, date),
      sourceChoreId: row.id,
      date,
      label: row.label,
      durationMinutes: row.durationMinutes,
      defaultStartSlot: row.defaultStartSlot,
      autoSchedule: row.autoSchedule === true,
      mark,
      completed: mark === 'check',
    };
  });
}

export function choreAutoBlockCandidates(
  occurrences: readonly DailyChoreOccurrence[],
  existingBlocks: readonly TimeBlock[] = [],
): TimeBlock[] {
  const candidates = occurrences.flatMap((occurrence): TimeBlock[] => {
    if (!occurrence.autoSchedule || occurrence.defaultStartSlot === undefined || !occurrence.durationMinutes) return [];
    const endSlot = Math.min(SLOT_COUNT, occurrence.defaultStartSlot + durationSlots(occurrence.durationMinutes));
    if (occurrence.defaultStartSlot < 0 || occurrence.defaultStartSlot >= endSlot) return [];
    return [{
      id: `auto_${occurrence.id}`,
      date: occurrence.date,
      startSlot: occurrence.defaultStartSlot,
      endSlot,
      label: occurrence.label,
      tag: 'chore',
      sourceRefId: occurrence.id,
      completed: occurrence.completed,
    }];
  });
  return withoutExisting(candidates, existingBlocks);
}

export function routineAutoBlockCandidates(
  habits: readonly RoutineHabit[],
  date: ISODate,
  routineDone: Record<string, boolean> = {},
  existingBlocks: readonly TimeBlock[] = [],
): TimeBlock[] {
  const dateWeekday = weekday(date);
  const candidates = habits.flatMap((habit): TimeBlock[] => {
    const revision = revisionForDate(habit, date);
    if (!revision || revision.archived || revision.defaultStartSlot === undefined) return [];
    if (!revision.autoScheduleWeekdays?.includes(dateWeekday)) return [];
    const endSlot = Math.min(SLOT_COUNT, revision.defaultStartSlot + durationSlots(revision.durationMinutes));
    if (revision.defaultStartSlot < 0 || revision.defaultStartSlot >= endSlot) return [];
    const sourceRefId = `routine_${date}_${habit.id}`;
    return [{
      id: `auto_${sourceRefId}`,
      date,
      startSlot: revision.defaultStartSlot,
      endSlot,
      label: revision.autoScheduleLabel ?? revision.label,
      tag: 'routine',
      sourceRefId,
      completed: routineDone[habit.id] ?? false,
    }];
  });
  return withoutExisting(candidates, existingBlocks);
}

export function windDownAutoBlockCandidates(
  date: ISODate,
  _preferences: Preferences,
  checklist: readonly { id: string; label: string; done: boolean }[] = [],
  existingBlocks: readonly TimeBlock[] = [],
): TimeBlock[] {
  const byLabel = new Map(checklist.map((item) => [item.label.toLowerCase(), item]));
  const definitions = [
    { label: 'Vitamins', source: byLabel.get('vitamins'), startSlot: 30 + 15 / 30, endSlot: 30 + 20 / 30 },
    { label: 'Clean down', source: byLabel.get('clean down'), startSlot: 30 + 20 / 30, endSlot: 31 },
    { label: 'Night-time skincare', source: byLabel.get('skincare'), startSlot: 31, endSlot: 31 + 10 / 30 },
  ];
  return withoutExisting(definitions.map((definition) => {
    const sourceRefId = definition.source?.id ?? `winddown_${date}_${definition.label.toLowerCase().replace(/[^a-z]+/g, '_')}`;
    return {
      id: `auto_${sourceRefId}`,
      date,
      startSlot: definition.startSlot,
      endSlot: definition.endSlot,
      label: definition.label,
      tag: 'routine' as const,
      sourceRefId,
      completed: definition.source?.done ?? false,
    };
  }), existingBlocks);
}

/** Pure convenience helper used by integration to calculate every automatic block for a day. */
export function dailyAutoBlockCandidates(state: PlannerState, date: ISODate): TimeBlock[] {
  const day = state.days[date];
  const chores = materializeDailyChores(state.habitRows, date, state.gridMarks);
  const routineBlocks = routineAutoBlockCandidates(state.routineHabits, date, day?.routineDone, day?.blocks);
  const afterRoutines = [...(day?.blocks ?? []), ...routineBlocks];
  const choreBlocks = choreAutoBlockCandidates(chores, afterRoutines);
  const afterChores = [...afterRoutines, ...choreBlocks];
  const candidates = [
    ...routineBlocks,
    ...choreBlocks,
    ...windDownAutoBlockCandidates(date, state.preferences, day?.windDown.checklist, afterChores),
  ];
  const suppressed = new Set(day?.suppressedAutoBlockIds ?? []);
  return candidates.filter((block) => !suppressed.has(block.id));
}
