import { describe, expect, it } from 'vitest';
import { normalizeDocumentResult, normalizeLoadResult, normalizeSaveResult } from './contracts';

describe('Supabase planner contract', () => {
  it('reconstructs linked daily state and running lists from normalized rows', () => {
    const envelope = normalizeLoadResult({
      profile: {
        schema_version: 3,
        setup_complete: true,
        preferences: { wake: '08:00', sleep: '00:00', workoutStart: '', workoutEnd: '', breakCadenceMins: 60, energyWindows: '', fixedCommitments: [] },
        client_edited_at: 42,
        updated_at: '2026-07-23T00:00:00Z',
      },
      routineDefinitions: [{ id: 'r1', since: '2026-07-23', archived_at: null }],
      routineRevisions: [{ routine_id: 'r1', effective_from: '2026-07-23', label: 'Movement', period: 'AM', duration_minutes: 150, default_start_slot: 3, auto_schedule_weekdays: [0, 1, 3, 4], auto_schedule_label: 'Gym', sort_order: 0, archived: false }],
      dailyRoutineInstances: [{ id: 'ri1', day: '2026-07-23', source_routine_id: 'r1', label: 'Vitamins', period: 'AM', duration_minutes: 5, sort_order: 0, completed: true }],
      dailyTodos: [{ id: 'dt1', day: '2026-07-23', text: 'Call dentist', completed: true, source_ref_id: null }],
      runningTodos: [{ id: 't1', text: 'Plan trip', completed: false, list_kind: 'long', note: '', sub_steps: [], assigned_date: null, captured_at_ms: 10, source: 'ui' }],
      windDownDays: [{ day: '2026-07-23', tomorrow_plan: 'Gym', bedtime: '23:30', suppressed_auto_block_ids: ['auto_gym'] }],
      windDownItems: [{ id: 'w1', day: '2026-07-23', label: 'Set alarm', completed: true }],
      timeBlocks: [{ id: 'b1', day: '2026-07-23', start_slot: 2.1667, end_slot: 2.5, label: 'Call dentist', note: 'Ask about the morning slot', tag: 'todo', fixed: false, source_ref_id: 'dt1', completed: true }],
      choreDefinitions: [{ id: 'c1', label: 'Clean desk', category: 'Chores', weekday: 2, cycle_weeks: [1], cycle_anchor_date: '2026-08-10', duration_minutes: 60, default_start_slot: 12, auto_schedule: true, since: '2026-07-23', archived_at: null }],
      choreOccurrences: [{ chore_id: 'c1', scheduled_date: '2026-07-23', mark: 'check' }],
    });

    expect(envelope?.revision).toBe(42);
    expect(envelope?.state.days['2026-07-23'].blocks[0]).toMatchObject({ sourceRefId: 'dt1', completed: true, startSlot: 2.1667, note: 'Ask about the morning slot' });
    expect(envelope?.state.days['2026-07-23'].suppressedAutoBlockIds).toEqual(['auto_gym']);
    expect(envelope?.state.todos[0]).toMatchObject({ id: 't1', list: 'long', createdAt: 10 });
    expect(envelope?.state.gridMarks['2026-07-23|c1']).toBe('check');
    expect(envelope?.state.routineHabits[0]).toMatchObject({ defaultStartSlot: 3, autoScheduleWeekdays: [0, 1, 3, 4], autoScheduleLabel: 'Gym' });
    expect(envelope?.state.habitRows[0]).toMatchObject({ cycleWeeks: [1], cycleAnchorDate: '2026-08-10', durationMinutes: 60, defaultStartSlot: 12, autoSchedule: true });
  });

  it('accepts the bigint save result returned by the SQL RPC', () => {
    expect(normalizeSaveResult(81).revision).toBe(81);
  });

  it('reads the fast owner document envelope without rebuilding normalized rows', () => {
    const state = { version: 3, setupComplete: true, lastEditedAt: 99 } as never;
    expect(normalizeDocumentResult({ state, revision: 101, updated_at: '2026-08-12T00:00:00Z' })).toEqual({
      state,
      revision: 101,
      updatedAt: '2026-08-12T00:00:00Z',
    });
  });
});
