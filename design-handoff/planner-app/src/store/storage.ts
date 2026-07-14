import type { PlannerState } from '../types';

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
      return JSON.parse(raw) as PlannerState;
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
          onRemote(JSON.parse(e.newValue) as PlannerState);
        } catch {
          /* ignore malformed */
        }
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
}

export const storage: StorageAdapter = new LocalStorageAdapter();
