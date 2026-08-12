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
});
