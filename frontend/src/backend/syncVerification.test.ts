import { describe, expect, it } from 'vitest';
import type { PlannerState } from '../types';
import { plannerStatesMatch } from './syncVerification';

describe('planner sync verification', () => {
  it('ignores JSON object key order while retaining array order', () => {
    const left = { version: 3, days: { '2026-08-12': { todos: [{ id: 'a' }] } } } as unknown as PlannerState;
    const right = { days: { '2026-08-12': { todos: [{ id: 'a' }] } }, version: 3 } as unknown as PlannerState;
    expect(plannerStatesMatch(left, right)).toBe(true);
  });

  it('detects content divergence', () => {
    const left = { version: 3, days: { '2026-08-12': { todos: [{ id: 'a' }] } } } as unknown as PlannerState;
    const right = { version: 3, days: { '2026-08-12': { todos: [{ id: 'b' }] } } } as unknown as PlannerState;
    expect(plannerStatesMatch(left, right)).toBe(false);
  });

  it('retains weekly action identity, order, assignment, and completion in read-back comparison', () => {
    const weeklyActions = [
      {
        id: 'weekly-a',
        weekStart: '2026-08-10',
        text: 'Prepare notes',
        sortOrder: 0,
        done: false,
        createdAt: 1,
        updatedAt: 1,
        source: 'weekly-planner',
      },
      {
        id: 'weekly-b',
        weekStart: '2026-08-10',
        text: 'Doctor appointment',
        sortOrder: 1,
        done: true,
        assignedDate: '2026-08-13',
        linkedDailyTodoId: 'daily-b',
        createdAt: 2,
        updatedAt: 3,
        completedAt: 3,
        source: 'weekly-planner',
      },
    ];
    const saved = { version: 6, weeklyActions } as unknown as PlannerState;

    expect(plannerStatesMatch(saved, { weeklyActions, version: 6 } as unknown as PlannerState)).toBe(true);
    expect(plannerStatesMatch(saved, {
      version: 6,
      weeklyActions: weeklyActions.map((action) => action.id === 'weekly-b'
        ? { ...action, id: 'weekly-replaced' }
        : action),
    } as unknown as PlannerState)).toBe(false);
    expect(plannerStatesMatch(saved, { version: 6, weeklyActions: [...weeklyActions].reverse() } as unknown as PlannerState)).toBe(false);
    expect(plannerStatesMatch(saved, {
      version: 6,
      weeklyActions: weeklyActions.map((action) => action.id === 'weekly-b'
        ? { ...action, assignedDate: '2026-08-14' }
        : action),
    } as unknown as PlannerState)).toBe(false);
    expect(plannerStatesMatch(saved, {
      version: 6,
      weeklyActions: weeklyActions.map((action) => action.id === 'weekly-b'
        ? { ...action, done: false, completedAt: undefined }
        : action),
    } as unknown as PlannerState)).toBe(false);
  });
});
