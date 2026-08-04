import type { DailyTodoLine, DayState, PlannerState, RoutineHabit } from '../types';
import { DEFAULT_HABIT_ROWS, DEFAULT_WINDDOWN_ITEMS, TWO_WEEK_CYCLE_ANCHOR } from './seed';

/**
 * Storage adapter — the single seam for cross-device sync (FR-11 / FR-12).
 *
 * v1 persists to localStorage (works offline by definition). To add real
 * cross-device sync later, implement this same interface against Firebase /
 * Supabase / etc. and swap the export below — no page code changes.
 */
export interface StorageAdapter {
  load(): Promise<PlannerState | null>;
  save(state: PlannerState): Promise<void>;
  /** Subscribe to remote changes (no-op for local). Returns an unsubscribe fn. */
  subscribe(onRemote: (state: PlannerState) => void): () => void;
}

const KEY = 'digital-planner:v1';

class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<PlannerState | null> {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return migratePlannerState(JSON.parse(raw) as PlannerState);
    } catch (err) {
      console.error('Failed to load planner state', err);
      return null;
    }
  }

  async save(state: PlannerState): Promise<void> {
    // Simulate the tiny latency of a network write so the "will sync"
    // indicator is observable; harmless locally.
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  subscribe(onRemote: (state: PlannerState) => void): () => void {
    // Reflect edits made in *other tabs* (a stand-in for other devices).
    const handler = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          onRemote(migratePlannerState(JSON.parse(e.newValue) as PlannerState));
        } catch {
          /* ignore malformed */
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export function migratePlannerState(input: PlannerState): PlannerState {
  const state = { ...input };
  const retiredMoneymakerChoreIds = new Set([
    'chore_moneymaker_mon',
    'chore_moneymaker_tue',
    'chore_moneymaker_thu',
    'chore_moneymaker_fri',
  ]);
  const routineHabits = (state.routineHabits ?? []).map((habit, index) => {
    const legacy = habit as RoutineHabit;
    const durationMinutes = legacy.durationMinutes ?? 30;
    const sortOrder = legacy.sortOrder ?? index;
    const period = legacy.period ?? 'auto';
    const movement = /^(fitness|movement\b)/i.test(legacy.label.trim());
    const mobility = /^mobility\b/i.test(legacy.label.trim());
    let revisions = legacy.revisions?.length
      ? legacy.revisions.map((revision) => ({ ...revision, defaultStartSlot: revision.defaultStartSlot, autoScheduleWeekdays: revision.autoScheduleWeekdays, autoScheduleLabel: revision.autoScheduleLabel }))
      : [{ effectiveFrom: legacy.since, label: legacy.label, period, durationMinutes, defaultStartSlot: legacy.defaultStartSlot, autoScheduleWeekdays: legacy.autoScheduleWeekdays, autoScheduleLabel: legacy.autoScheduleLabel, sortOrder, archived: !!legacy.archived }];
    if (movement && !revisions.some((revision) => revision.effectiveFrom === '2026-08-03' && revision.autoScheduleLabel === 'Gym')) {
      const current = revisions.filter((revision) => revision.effectiveFrom <= '2026-08-03').sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? revisions[revisions.length - 1];
      revisions = [...revisions.filter((revision) => revision.effectiveFrom !== '2026-08-03'), {
        ...current,
        effectiveFrom: '2026-08-03',
        label: 'Movement — gym or 10k steps',
        durationMinutes: 150,
        defaultStartSlot: 3,
        autoScheduleWeekdays: [0, 1, 3, 4] as const,
        autoScheduleLabel: 'Gym',
      }];
    }
    if (movement && !revisions.some((revision) => revision.effectiveFrom === '2026-08-04' && revision.label === 'Movement')) {
      const current = revisions.filter((revision) => revision.effectiveFrom <= '2026-08-04').sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? revisions[revisions.length - 1];
      revisions = [...revisions.filter((revision) => revision.effectiveFrom !== '2026-08-04'), {
        ...current,
        effectiveFrom: '2026-08-04',
        label: 'Movement',
        autoScheduleLabel: 'Gym',
      }];
    }
    if (mobility && !revisions.some((revision) => revision.effectiveFrom === '2026-08-04' && revision.autoScheduleLabel === 'Mobility')) {
      const current = revisions.filter((revision) => revision.effectiveFrom <= '2026-08-04').sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0] ?? revisions[revisions.length - 1];
      revisions = [...revisions.filter((revision) => revision.effectiveFrom !== '2026-08-04'), {
        ...current,
        effectiveFrom: '2026-08-04',
        label: 'Mobility',
        period: 'PM',
        durationMinutes: 15,
        defaultStartSlot: 30,
        autoScheduleWeekdays: [0, 1, 2, 3, 4, 5, 6] as const,
        autoScheduleLabel: 'Mobility',
      }];
    }
    const latest = [...revisions].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
    return {
      ...legacy,
      label: latest?.label ?? legacy.label,
      durationMinutes: latest?.durationMinutes ?? durationMinutes,
      sortOrder,
      defaultStartSlot: latest?.defaultStartSlot ?? legacy.defaultStartSlot,
      autoScheduleWeekdays: latest?.autoScheduleWeekdays ?? legacy.autoScheduleWeekdays,
      autoScheduleLabel: latest?.autoScheduleLabel ?? legacy.autoScheduleLabel,
      revisions,
    };
  });
  const retiredLegacyDefaults = new Set(['gym|', '$$maker|', 'biki walk|2', 'clean house|', 'oil hair|0', 'wash hair|1', 'splitwise|6', 'bingo|']);
  const scheduleIds = new Set(DEFAULT_HABIT_ROWS.map((row) => row.id));
  const existingRows = (state.habitRows ?? []).filter((row) => {
    if (retiredMoneymakerChoreIds.has(row.id)) return false;
    if (scheduleIds.has(row.id)) return false;
    const legacyKey = `${row.label.trim().toLowerCase()}|${row.weekday ?? ''}`;
    return !retiredLegacyDefaults.has(legacyKey);
  });
  const habitRows = [
    ...existingRows,
    ...DEFAULT_HABIT_ROWS.map((row) => ({ ...row, since: TWO_WEEK_CYCLE_ANCHOR })),
  ];
  const days = Object.fromEntries(
    Object.entries(state.days ?? {}).map(([date, day]) => {
      const legacyDay = day as DayState;
      const todos: DailyTodoLine[] = (legacyDay.todos ?? []).map((line, index) => ({
        ...line,
        id: line.id ?? `daily_todo_${date}_${index}`,
      }));
      while (todos.length < 15) {
        todos.push({ id: `daily_todo_${date}_${todos.length}`, text: '', done: false });
      }
      const dailyTodoIdByLegacyRef = new Map<string, string>();
      todos.forEach((line, index) => {
        dailyTodoIdByLegacyRef.set(`daily:${date}:${index}`, line.id);
        dailyTodoIdByLegacyRef.set(`daily:${index}`, line.id);
      });
      const routineInstances = legacyDay.routineInstances ?? routineHabits
        .filter((habit) => habit.since <= date && !habit.archived)
        .map((habit) => ({
          id: `legacy_${date}_${habit.id}`,
          sourceRoutineId: habit.id,
          label: habit.label,
          period: habit.period === 'PM' ? 'PM' as const : 'AM' as const,
          durationMinutes: habit.durationMinutes,
          defaultStartSlot: habit.defaultStartSlot,
          sortOrder: habit.sortOrder,
          done: !!legacyDay.routineDone?.[habit.id],
        }));
      const blocks = (legacyDay.blocks ?? [])
        .filter((block) => block.sourceRefId !== `winddown_${date}`)
        .filter((block) => ![...retiredMoneymakerChoreIds].some((id) => block.sourceRefId?.endsWith(`_${id}`)))
        .map((block) => ({
          ...block,
          sourceRefId: block.sourceRefId ? dailyTodoIdByLegacyRef.get(block.sourceRefId) ?? block.sourceRefId : undefined,
        }));
      const legacyWindDownLabels = (legacyDay.windDown?.checklist ?? []).map((item) => item.label).join('|');
      const windDown = date >= '2026-08-03' && legacyWindDownLabels === 'Tidy desk|Set out clothes|Plan tomorrow'
        ? { ...legacyDay.windDown, checklist: DEFAULT_WINDDOWN_ITEMS.map((label, index) => ({ id: `winddown_${date}_${index}`, label, done: false })) }
        : legacyDay.windDown;
      return [date, { ...legacyDay, todos, routineInstances, blocks, windDown, suppressedAutoBlockIds: legacyDay.suppressedAutoBlockIds ?? [] }];
    }),
  );
  const preferences = {
    ...state.preferences,
    windDownSchedule: state.preferences?.windDownSchedule ?? { startSlot: 30, durationMinutes: 60, autoSchedule: true },
  };
  const keepActiveChoreKey = (key: string) => ![...retiredMoneymakerChoreIds].some((id) => key.endsWith(`|${id}`));
  const gridMarks = Object.fromEntries(Object.entries(state.gridMarks ?? {}).filter(([key]) => keepActiveChoreKey(key)));
  const choreCompletions = state.choreCompletions
    ? Object.fromEntries(Object.entries(state.choreCompletions).filter(([key]) => keepActiveChoreKey(key)))
    : undefined;
  return { ...state, version: 5, routineHabits, habitRows, gridMarks, choreCompletions, preferences, days };
}

export const storage: StorageAdapter = new LocalStorageAdapter();
