import type { PlannerState } from '../types';

export const RPC = {
  load: 'get_planner_document',
  save: 'save_planner_document',
  loadLegacy: 'get_planner_state',
  importLegacy: 'import_legacy_planner_state',
} as const;

export interface RemotePlannerEnvelope {
  state: PlannerState;
  revision: number;
  updatedAt: string;
}

export interface SavePlannerInput {
  state: PlannerState;
  idempotencyKey?: string;
  expectedRevision?: number;
}

export interface SavePlannerResult {
  revision: number;
  updatedAt: string;
  idempotentReplay: boolean;
}

export interface ImportPlannerResult extends SavePlannerResult {
  imported: boolean;
}

type JsonRecord = Record<string, unknown>;
type Row = Record<string, unknown>;

function record(value: unknown, context: string): JsonRecord {
  const unwrapped = Array.isArray(value) ? value[0] : value;
  if (!unwrapped || typeof unwrapped !== 'object') throw new TypeError(`${context} returned no JSON object.`);
  return unwrapped as JsonRecord;
}

function stringField(value: JsonRecord, camel: string, snake: string): string {
  const field = value[camel] ?? value[snake];
  if (typeof field !== 'string') throw new TypeError(`Missing ${snake}.`);
  return field;
}

function numberField(value: JsonRecord, camel: string, snake: string): number {
  const field = value[camel] ?? value[snake];
  if (typeof field !== 'number') throw new TypeError(`Missing ${snake}.`);
  return field;
}

export function normalizeLoadResult(value: unknown): RemotePlannerEnvelope | null {
  if (value === null || (Array.isArray(value) && value.length === 0)) return null;
  const result = record(value, RPC.load);
  const profile = result.profile as Row | null;
  if (!profile) return null;
  const rows = (name: string): Row[] => Array.isArray(result[name]) ? result[name] as Row[] : [];
  const routineDefinitions = rows('routineDefinitions');
  const routineRevisions = rows('routineRevisions');
  const instances = rows('dailyRoutineInstances');
  const todos = rows('dailyTodos');
  const runningTodos = rows('runningTodos');
  const windDownDays = rows('windDownDays');
  const windDownItems = rows('windDownItems');
  const blocks = rows('timeBlocks');
  const chores = rows('choreDefinitions');
  const occurrences = rows('choreOccurrences');
  const dates = new Set<string>();
  [...instances, ...todos, ...windDownDays, ...blocks].forEach((row) => dates.add(String(row.day)));
  const state: PlannerState = {
    version: Number(profile.schema_version),
    setupComplete: Boolean(profile.setup_complete),
    preferences: profile.preferences as PlannerState['preferences'],
    lastEditedAt: Number(profile.client_edited_at),
    todos: runningTodos.map((todo) => ({
      id: String(todo.id),
      text: String(todo.text),
      done: Boolean(todo.completed),
      list: todo.list_kind as PlannerState['todos'][number]['list'],
      ...(todo.note == null ? {} : { note: String(todo.note) }),
      ...(Array.isArray(todo.sub_steps)
        ? { subSteps: todo.sub_steps as PlannerState['todos'][number]['subSteps'] }
        : {}),
      ...(todo.assigned_date == null ? {} : { assignedDate: String(todo.assigned_date) }),
      createdAt: Number(todo.captured_at_ms),
      source: todo.source as PlannerState['todos'][number]['source'],
    })),
    // The retired relational backend never stored weekly planner actions. New
    // aggregate documents carry this collection as part of their JSON payload.
    weeklyActions: [],
    // The retired relational backend predates the aggregate two-week sheet.
    habitCategories: [],
    habitPlanItems: [],
    routineHabits: routineDefinitions.map((definition) => {
      const revisions = routineRevisions
        .filter((revision) => revision.routine_id === definition.id)
        .map((revision) => ({
          effectiveFrom: String(revision.effective_from),
          label: String(revision.label),
          period: revision.period as PlannerState['routineHabits'][number]['period'],
          durationMinutes: Number(revision.duration_minutes),
          ...(revision.default_start_slot == null ? {} : { defaultStartSlot: Number(revision.default_start_slot) }),
          ...(Array.isArray(revision.auto_schedule_weekdays) ? { autoScheduleWeekdays: revision.auto_schedule_weekdays.map(Number) as PlannerState['routineHabits'][number]['autoScheduleWeekdays'] } : {}),
          ...(revision.auto_schedule_label == null ? {} : { autoScheduleLabel: String(revision.auto_schedule_label) }),
          sortOrder: Number(revision.sort_order),
          archived: Boolean(revision.archived),
        }));
      const current = revisions[revisions.length - 1];
      if (!current) throw new TypeError(`Routine ${String(definition.id)} has no revision.`);
      return {
        id: String(definition.id),
        since: String(definition.since),
        archived: definition.archived_at != null,
        revisions,
        label: current.label,
        period: current.period,
        durationMinutes: current.durationMinutes,
        ...(current.defaultStartSlot == null ? {} : { defaultStartSlot: current.defaultStartSlot }),
        ...(current.autoScheduleWeekdays == null ? {} : { autoScheduleWeekdays: current.autoScheduleWeekdays }),
        ...(current.autoScheduleLabel == null ? {} : { autoScheduleLabel: current.autoScheduleLabel }),
        sortOrder: current.sortOrder,
      };
    }),
    habitRows: chores.map((chore) => ({
      id: String(chore.id),
      label: String(chore.label),
      category: chore.category as PlannerState['habitRows'][number]['category'],
      ...(chore.weekday == null ? {} : { weekday: Number(chore.weekday) as PlannerState['habitRows'][number]['weekday'] }),
      ...(Array.isArray(chore.cycle_weeks) ? { cycleWeeks: chore.cycle_weeks.map(Number) as PlannerState['habitRows'][number]['cycleWeeks'] } : {}),
      ...(chore.cycle_anchor_date == null ? {} : { cycleAnchorDate: String(chore.cycle_anchor_date) }),
      ...(chore.duration_minutes == null ? {} : { durationMinutes: Number(chore.duration_minutes) }),
      ...(chore.default_start_slot == null ? {} : { defaultStartSlot: Number(chore.default_start_slot) }),
      autoSchedule: Boolean(chore.auto_schedule),
      since: String(chore.since),
      archived: chore.archived_at != null,
    })),
    days: Object.fromEntries([...dates].map((day) => {
      const routineInstances = instances.filter((row) => row.day === day).map((row) => ({
        id: String(row.id),
        sourceRoutineId: String(row.source_routine_id),
        label: String(row.label),
        period: row.period as 'AM' | 'PM',
        durationMinutes: Number(row.duration_minutes),
        ...(row.default_start_slot == null ? {} : { defaultStartSlot: Number(row.default_start_slot) }),
        sortOrder: Number(row.sort_order),
        done: Boolean(row.completed),
      }));
      const windDown = windDownDays.find((row) => row.day === day);
      return [day, {
        routineDone: Object.fromEntries(routineInstances.map((instance) => [instance.sourceRoutineId, instance.done])),
        routineInstances,
        todos: todos.filter((row) => row.day === day).map((row) => ({
          id: String(row.id),
          text: String(row.text),
          done: Boolean(row.completed),
          ...(row.source_ref_id == null ? {} : { sourceRefId: String(row.source_ref_id) }),
        })),
        blocks: blocks.filter((row) => row.day === day).map((row) => ({
          id: String(row.id),
          date: day,
          startSlot: Number(row.start_slot),
          endSlot: Number(row.end_slot),
          label: String(row.label),
          tag: row.tag as PlannerState['days'][string]['blocks'][number]['tag'],
          fixed: Boolean(row.fixed),
          ...(row.source_ref_id == null ? {} : { sourceRefId: String(row.source_ref_id) }),
          completed: Boolean(row.completed),
          ...(row.note == null ? {} : { note: String(row.note) }),
        })),
        windDown: {
          tomorrowPlan: String(windDown?.tomorrow_plan ?? ''),
          bedtime: String(windDown?.bedtime ?? ''),
          checklist: windDownItems.filter((row) => row.day === day).map((row) => ({
            id: String(row.id),
            label: String(row.label),
            done: Boolean(row.completed),
          })),
        },
        suppressedAutoBlockIds: Array.isArray(windDown?.suppressed_auto_block_ids)
          ? windDown.suppressed_auto_block_ids.map(String)
          : [],
      }];
    })),
    gridMarks: Object.fromEntries(occurrences
      .filter((row) => row.mark !== 'blank')
      .map((row) => [
        `${String(row.scheduled_date)}|${String(row.chore_id)}`,
        row.mark as PlannerState['gridMarks'][string],
      ])),
    choreCompletions: Object.fromEntries(occurrences
      .filter((row) => row.mark !== 'blank')
      .map((row) => [
        `${String(row.scheduled_date)}|${String(row.chore_id)}`,
        {
          mark: row.mark as PlannerState['gridMarks'][string],
          ...(row.actual_completion_date == null ? {} : { actualCompletionDate: String(row.actual_completion_date) }),
        },
      ])),
  };
  return {
    state,
    revision: Number(profile.client_edited_at),
    updatedAt: String(profile.updated_at),
  };
}

export function normalizeDocumentResult(value: unknown): RemotePlannerEnvelope | null {
  if (value === null || (Array.isArray(value) && value.length === 0)) return null;
  const result = record(value, RPC.load);
  if (!result.state || typeof result.state !== 'object') throw new TypeError('Missing planner state.');
  return {
    state: result.state as PlannerState,
    revision: numberField(result, 'revision', 'revision'),
    updatedAt: stringField(result, 'updatedAt', 'updated_at'),
  };
}

export function normalizeSaveResult(value: unknown): SavePlannerResult {
  if (typeof value === 'number') {
    return { revision: value, updatedAt: new Date().toISOString(), idempotentReplay: false };
  }
  const result = record(value, RPC.save);
  return {
    revision: numberField(result, 'revision', 'revision'),
    updatedAt: stringField(result, 'updatedAt', 'updated_at'),
    idempotentReplay: Boolean(result.idempotentReplay ?? result.idempotent_replay ?? false),
  };
}

export function normalizeImportResult(value: unknown): ImportPlannerResult {
  if (typeof value === 'number') {
    return { revision: value, updatedAt: new Date().toISOString(), idempotentReplay: false, imported: true };
  }
  const result = record(value, RPC.importLegacy);
  return {
    revision: numberField(result, 'revision', 'revision'),
    updatedAt: stringField(result, 'updatedAt', 'updated_at'),
    idempotentReplay: Boolean(result.idempotentReplay ?? result.idempotent_replay ?? false),
    imported: Boolean(result.imported),
  };
}
