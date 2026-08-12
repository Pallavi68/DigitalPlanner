import type { PlannerState } from '../types';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonical(child)]));
  }
  return value;
}

export function plannerStatesMatch(left: PlannerState, right: PlannerState): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}
