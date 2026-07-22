import type { DayState, PlannerState, RoutineHabit } from '../types';

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
      return migrate(JSON.parse(raw) as PlannerState);
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
          onRemote(migrate(JSON.parse(e.newValue) as PlannerState));
        } catch {
          /* ignore malformed */
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

function migrate(input: PlannerState): PlannerState {
  const state = { ...input };
  const routineHabits = (state.routineHabits ?? []).map((habit, index) => {
    const legacy = habit as RoutineHabit;
    const durationMinutes = legacy.durationMinutes ?? 30;
    const sortOrder = legacy.sortOrder ?? index;
    const period = legacy.period ?? 'auto';
    return {
      ...legacy,
      durationMinutes,
      sortOrder,
      revisions: legacy.revisions?.length
        ? legacy.revisions
        : [{ effectiveFrom: legacy.since, label: legacy.label, period, durationMinutes, sortOrder, archived: !!legacy.archived }],
    };
  });
  const days = Object.fromEntries(
    Object.entries(state.days ?? {}).map(([date, day]) => {
      const legacyDay = day as DayState;
      const routineInstances = legacyDay.routineInstances ?? routineHabits
        .filter((habit) => habit.since <= date && !habit.archived)
        .map((habit) => ({
          id: `legacy_${date}_${habit.id}`,
          sourceRoutineId: habit.id,
          label: habit.label,
          period: habit.period === 'PM' ? 'PM' as const : 'AM' as const,
          durationMinutes: habit.durationMinutes,
          sortOrder: habit.sortOrder,
          done: !!legacyDay.routineDone?.[habit.id],
        }));
      return [date, { ...legacyDay, routineInstances }];
    }),
  );
  return { ...state, version: 2, routineHabits, days };
}

export const storage: StorageAdapter = new LocalStorageAdapter();
