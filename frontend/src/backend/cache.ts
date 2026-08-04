import type { PlannerState } from '../types';
import { BackendError } from './errors';

const CACHE_PREFIX = 'digital-planner:cloud-cache:v1:';
const UNSAVED_PREFIX = 'digital-planner:cloud-unsaved:v1:';

export interface CachedPlanner {
  state: PlannerState;
  revision: number;
  updatedAt: string;
  cachedAt: string;
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch (cause) {
    throw new BackendError('cache', 'The local planner cache could not be read.', { cause });
  }
}

function write(key: string, value: unknown): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(key, JSON.stringify(value));
  } catch (cause) {
    throw new BackendError('cache', 'The local planner cache could not be updated.', { cause });
  }
}

export const plannerCache = {
  read(userId: string): CachedPlanner | null {
    return read<CachedPlanner>(`${CACHE_PREFIX}${userId}`);
  },
  write(userId: string, value: CachedPlanner): void {
    write(`${CACHE_PREFIX}${userId}`, value);
  },
  readUnsaved(userId: string): PlannerState | null {
    return read<PlannerState>(`${UNSAVED_PREFIX}${userId}`);
  },
  writeUnsaved(userId: string, state: PlannerState): void {
    write(`${UNSAVED_PREFIX}${userId}`, state);
  },
  clearUnsaved(userId: string): void {
    storage()?.removeItem(`${UNSAVED_PREFIX}${userId}`);
  },
};
