import type { PlannerState } from '../types';
import { BackendError } from './errors';

export const LEGACY_STORAGE_KEY = 'digital-planner:v1';
const BACKUP_PREFIX = 'digital-planner:legacy-backup:v1:';
const MARKER_PREFIX = 'digital-planner:legacy-imported:v1:';

export interface LegacyMigrationPreview {
  state: PlannerState;
  byteSize: number;
  summary: {
    routineDefinitions: number;
    dailySnapshots: number;
    dailyTodos: number;
    timeBlocks: number;
    choreDefinitions: number;
    choreCompletions: number;
  };
}

function localStore(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isPlannerState(value: unknown): value is PlannerState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PlannerState>;
  return typeof state.version === 'number'
    && typeof state.lastEditedAt === 'number'
    && Array.isArray(state.routineHabits)
    && Array.isArray(state.habitRows)
    && Array.isArray(state.todos)
    && !!state.days && typeof state.days === 'object'
    && !!state.gridMarks && typeof state.gridMarks === 'object';
}

export function previewLegacyMigration(): LegacyMigrationPreview | null {
  const raw = localStore()?.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return null;
  let state: unknown;
  try {
    state = JSON.parse(raw);
  } catch (cause) {
    throw new BackendError('invalid_data', 'The existing local planner data is malformed and was not imported.', { cause });
  }
  if (!isPlannerState(state)) {
    throw new BackendError('invalid_data', 'The existing local planner data does not have the expected shape.');
  }
  const days = Object.values(state.days);
  return {
    state,
    byteSize: new Blob([raw]).size,
    summary: {
      routineDefinitions: state.routineHabits.length,
      dailySnapshots: days.length,
      dailyTodos: days.reduce((count, day) => count + day.todos.filter((todo) => todo.text.trim()).length, 0),
      timeBlocks: days.reduce((count, day) => count + day.blocks.length, 0),
      choreDefinitions: state.habitRows.length,
      choreCompletions: Object.keys(state.gridMarks).length,
    },
  };
}

export function hasCompletedLegacyMigration(userId: string): boolean {
  return localStore()?.getItem(`${MARKER_PREFIX}${userId}`) !== null;
}

export function createLegacyBackup(userId: string): string | null {
  const store = localStore();
  const raw = store?.getItem(LEGACY_STORAGE_KEY);
  if (!store || !raw) return null;
  const key = `${BACKUP_PREFIX}${userId}`;
  if (!store.getItem(key)) store.setItem(key, raw);
  return key;
}

export function markLegacyMigrationComplete(userId: string, idempotencyKey: string): void {
  localStore()?.setItem(`${MARKER_PREFIX}${userId}`, JSON.stringify({
    completedAt: new Date().toISOString(),
    idempotencyKey,
  }));
}

export function migrationIdempotencyKey(userId: string, state: PlannerState): string {
  return `legacy:${userId}:${state.lastEditedAt}:v${state.version}`;
}
