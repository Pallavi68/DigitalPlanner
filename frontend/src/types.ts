/**
 * Core data model for the Digital Planner.
 *
 * Everything the owner "writes" lives here. Pages render from this model;
 * recurring habits/chores are a single source of truth (FR-13). The store
 * (see store/PlannerContext) owns instances of these types and persists them.
 */

export type ISODate = string; // 'YYYY-MM-DD'
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Monday ... 6 = Sunday

/** Where a schedulable item originated. Drives future color-coding (FR seam). */
export type SourceTag = 'goodDay' | 'todo' | 'routine' | 'chore' | 'fixed' | 'manual';
export type RoutinePeriod = 'AM' | 'PM' | 'auto';

export interface RoutineRevision {
  effectiveFrom: ISODate;
  label: string;
  period: RoutinePeriod;
  durationMinutes: number;
  /** Optional preferred quick-add start within the Time Alignment grid. */
  defaultStartSlot?: number;
  sortOrder: number;
  archived: boolean;
}

/** A recurring "Successful Day" routine habit (AM/PM bubble checklist). */
export interface RoutineHabit {
  id: string;
  label: string;
  period: RoutinePeriod;
  durationMinutes: number;
  defaultStartSlot?: number;
  sortOrder: number;
  /** Date the habit started applying (recurring changes are forward-only). */
  since: ISODate;
  archived?: boolean;
  /** Date-effective history. The latest revision on/before a date wins. */
  revisions: RoutineRevision[];
}

export interface DailyRoutineInstance {
  id: string;
  sourceRoutineId: string;
  label: string;
  period: 'AM' | 'PM';
  durationMinutes: number;
  defaultStartSlot?: number;
  sortOrder: number;
  done: boolean;
}

/** A recurring or day-specific habit/chore row in the Two-Week grid. */
export interface HabitRow {
  id: string;
  label: string;
  /** Activity type — each grid row is one type, aligned across the week. */
  category: 'Workout' | 'Moneymaker' | 'Walk' | 'Chores' | 'Self-care' | 'Finance' | 'Social' | 'Other';
  /** If set, this row only appears on that weekday; otherwise every day. */
  weekday?: Weekday;
  since: ISODate;
  archived?: boolean;
}

export type CellMark = 'blank' | 'check' | 'cross';

/** A single line in the day's numbered To Dos (01–15). */
export interface DailyTodoLine {
  /** Stable daily identity used by linked Time Alignment blocks. */
  id: string;
  text: string;
  done: boolean;
  /** Set when this line was surfaced from a running list (FR-10). */
  sourceRefId?: string;
}

/** A running-list item (short or long). Persists across days until done. */
export interface Todo {
  id: string;
  text: string;
  done: boolean;
  list: 'short' | 'long';
  note?: string;
  subSteps?: { id: string; text: string; done: boolean }[];
  /** Assigned to a specific day so it surfaces on that Daily Page (FR-10). */
  assignedDate?: ISODate;
  createdAt: number;
  /** How the item was captured — 'ui' now; 'whatsapp'/'telegram' later (FR-16). */
  source: 'ui' | 'whatsapp' | 'telegram';
}

/** A labeled block on the Time Alignment grid. Slots are 30-min indices from the day start. */
export interface TimeBlock {
  id: string;
  date: ISODate;
  startSlot: number;
  endSlot: number; // exclusive
  label: string;
  tag: SourceTag;
  /** Immovable (manual fixed commitment / future scheduler anchor) — FR-15. */
  fixed?: boolean;
  /** Link back to the source item so deletes reconcile (FR / open question). */
  sourceRefId?: string;
  /** Completion mirrors a linked Successful Day item when one exists. */
  completed?: boolean;
}

export interface WindDown {
  checklist: { id: string; label: string; done: boolean }[];
  tomorrowPlan: string;
  bedtime: string;
}

export interface FixedCommitment {
  id: string;
  label: string;
  weekday?: Weekday; // recurring commitment on this weekday
  startSlot: number;
  endSlot: number;
}

export interface Preferences {
  wake: string; // 'HH:MM'
  sleep: string;
  workoutStart: string;
  workoutEnd: string;
  breakCadenceMins: number;
  energyWindows: string; // free text for now, consumed by v1.5 scheduler
  fixedCommitments: FixedCommitment[];
}

/** Per-day, mutable state the owner fills in. */
export interface DayState {
  routineDone: Record<string, boolean>; // habitId -> done
  /** Immutable for past dates; regenerated for today/future after setup edits. */
  routineInstances: DailyRoutineInstance[];
  todos: DailyTodoLine[]; // starts with 15 ruled lines and grows as needed
  blocks: TimeBlock[];
  windDown: WindDown;
}

/** Per-day grid marks for the Two-Week Habit Planner. */
export type GridMarks = Record<string, CellMark>; // key: `${date}|${rowId}`

export interface PlannerState {
  version: number;
  setupComplete: boolean;
  routineHabits: RoutineHabit[];
  habitRows: HabitRow[];
  todos: Todo[];
  days: Record<ISODate, DayState>;
  gridMarks: GridMarks;
  preferences: Preferences;
  /** Bumped on every mutation; used by the sync indicator. */
  lastEditedAt: number;
}
