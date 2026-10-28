import type { PlannerState, DayState, RoutineHabit, HabitRow, TimeBlock, DailyTodoLine } from '../types';
import { todayISO, SLOT_COUNT } from '../lib/dates';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Default recurring routine ("Successful Day") — pre-seeded at setup. */
export const DEFAULT_ROUTINE: Array<Pick<RoutineHabit, 'label' | 'period'> & Partial<Pick<RoutineHabit, 'durationMinutes' | 'defaultStartSlot' | 'autoScheduleWeekdays' | 'autoScheduleLabel'>>> = [
  { label: 'Wake by 8', period: 'AM' },
  { label: 'Vitamins', period: 'AM' },
  { label: 'Skincare', period: 'AM' },
  { label: 'Mobility', period: 'PM', durationMinutes: 15, defaultStartSlot: 30, autoScheduleWeekdays: [0, 1, 2, 3, 4, 5, 6], autoScheduleLabel: 'Mobility' },
  { label: 'Movement', period: 'AM', durationMinutes: 150, defaultStartSlot: 3, autoScheduleWeekdays: [0, 1, 3, 4], autoScheduleLabel: 'Gym' },
  { label: 'Moneymaker', period: 'PM' },
  { label: 'Skincare PM', period: 'PM' },
  { label: 'Read 10 pages', period: 'PM' },
  { label: 'In bed by 1', period: 'PM' },
];

/** Default Two-Week grid rows — recurring habits + day-specific chores. */
export const TWO_WEEK_CYCLE_ANCHOR = '2026-08-10';

/** Owner-approved two-week pattern. Untimed items surface for manual placement. */
export const DEFAULT_HABIT_ROWS: Array<Omit<HabitRow, 'since'>> = [
  { id: 'chore_job_hunt_wed', label: 'Job hunt', category: 'Other', weekday: 2 },
  { id: 'chore_job_hunt_sat', label: 'Job hunt', category: 'Other', weekday: 5 },
  { id: 'chore_biki_walk_wed', label: 'Biki walk', category: 'Walk', weekday: 2 },
  { id: 'chore_biki_walk_sat', label: 'Biki walk', category: 'Walk', weekday: 5 },
  { id: 'chore_long_walk_thu', label: 'Long walk', category: 'Walk', weekday: 3 },
  { id: 'chore_badminton_sat', label: 'Badminton', category: 'Workout', weekday: 5 },
  { id: 'chore_laundry_mon', label: 'Laundry', category: 'Chores', weekday: 0 },
  { id: 'chore_laundry_thu', label: 'Laundry', category: 'Chores', weekday: 3 },
  { id: 'chore_oil_hair_mon', label: 'Oil hair', category: 'Self-care', weekday: 0 },
  { id: 'chore_clean_desk_tue', label: 'Clean desk', category: 'Chores', weekday: 1 },
  { id: 'chore_wash_hair_tue', label: 'Wash hair', category: 'Self-care', weekday: 1 },
  { id: 'chore_wash_hair_sat', label: 'Wash hair', category: 'Self-care', weekday: 5 },
  { id: 'chore_fold_clothes_wed', label: 'Fold clothes', category: 'Chores', weekday: 2 },
  { id: 'chore_fold_clothes_sat', label: 'Fold clothes', category: 'Chores', weekday: 5 },
  { id: 'chore_clean_cupboard_sat', label: 'Clean cupboard', category: 'Chores', weekday: 5 },
  { id: 'chore_expense_tracker_sun', label: 'Expense tracker', category: 'Finance', weekday: 6 },
  { id: 'chore_bingo_mon', label: 'Bingo', category: 'Social', weekday: 0 },
  { id: 'chore_bingo_wed', label: 'Bingo', category: 'Social', weekday: 2 },
  { id: 'chore_bingo_fri', label: 'Bingo', category: 'Social', weekday: 4 },
  { id: 'chore_bingo_sun', label: 'Bingo', category: 'Social', weekday: 6 },
  { id: 'chore_bedroom_sheet_w1', label: 'Change bedroom bed sheet', category: 'Chores', weekday: 3, cycleWeeks: [1], cycleAnchorDate: TWO_WEEK_CYCLE_ANCHOR },
  { id: 'chore_jewellery_w1', label: 'Clean jewellery section', category: 'Chores', weekday: 6, cycleWeeks: [1], cycleAnchorDate: TWO_WEEK_CYCLE_ANCHOR },
  { id: 'chore_hall_sheet_w2', label: 'Change hall bed sheet', category: 'Chores', weekday: 3, cycleWeeks: [2], cycleAnchorDate: TWO_WEEK_CYCLE_ANCHOR },
  { id: 'chore_kitchen_w2', label: 'Clean kitchen', category: 'Chores', weekday: 6, cycleWeeks: [2], cycleAnchorDate: TWO_WEEK_CYCLE_ANCHOR },
];

export const DEFAULT_WINDDOWN_ITEMS = ['Vitamins', 'Skincare', 'Clean down'];

export function blankDailyTodo(): DailyTodoLine {
  return { id: uid('dt'), text: '', done: false };
}

export function emptyDay(): DayState {
  return {
    routineDone: {},
    routineInstances: [],
    todos: Array.from({ length: 15 }, blankDailyTodo),
    blocks: [],
    windDown: {
      checklist: DEFAULT_WINDDOWN_ITEMS.map((label) => ({ id: uid('wd'), label, done: false })),
      tomorrowPlan: '',
      bedtime: '',
    },
    suppressedAutoBlockIds: [],
  };
}

/** Fresh, un-set-up state (first run lands on the setup wizard). */
export function initialState(): PlannerState {
  const since = todayISO();
  return {
    version: 7,
    setupComplete: false,
    routineHabits: DEFAULT_ROUTINE.map((h, sortOrder) => ({
      ...h,
      id: uid('rh'),
      since,
      durationMinutes: h.durationMinutes ?? 30,
      defaultStartSlot: h.defaultStartSlot,
      autoScheduleWeekdays: h.autoScheduleWeekdays,
      autoScheduleLabel: h.autoScheduleLabel,
      sortOrder,
      revisions: [{ effectiveFrom: since, label: h.label, period: h.period, durationMinutes: h.durationMinutes ?? 30, defaultStartSlot: h.defaultStartSlot, autoScheduleWeekdays: h.autoScheduleWeekdays, autoScheduleLabel: h.autoScheduleLabel, sortOrder, archived: false }],
    })),
    habitRows: DEFAULT_HABIT_ROWS.map((r) => ({ ...r, since: TWO_WEEK_CYCLE_ANCHOR })),
    todos: [],
    weeklyActions: [],
    habitCategories: ['Gym', 'Job hunt', 'My cat', 'Organizing my house', 'Sorting my finances', 'Bingo']
      .map((label, sortOrder) => ({ id: `habit_category_${sortOrder + 1}`, label, sortOrder })),
    habitPlanItems: [],
    days: {},
    gridMarks: {},
    preferences: {
      wake: '08:00',
      sleep: '01:00',
      workoutStart: '17:00',
      workoutEnd: '18:00',
      breakCadenceMins: 90,
      energyWindows: 'Sharpest 9–12; dip after lunch; second wind ~4pm',
      fixedCommitments: [],
      windDownSchedule: { startSlot: 30, durationMinutes: 60, autoSchedule: true },
    },
    lastEditedAt: Date.now(),
  };
}

/**
 * Demo state — a realistic, filled-in day so the app looks alive on first
 * open when someone clicks "Explore with sample data" on the setup screen.
 */
export function demoState(): PlannerState {
  const base = initialState();
  base.setupComplete = true;
  const t = todayISO();
  const day = emptyDay();

  // Routine: a few morning bubbles filled.
  base.routineHabits.slice(0, 3).forEach((h) => (day.routineDone[h.id] = true));

  // To Dos
  const sample = [
    'Call bank re: new card',
    'Grocery run — veg + coffee',
    'Email landlord about leak',
    'Book dentist follow-up',
    'Finish expense tracker',
    '30 min job hunt',
  ];
  sample.forEach((text, i) => (day.todos[i] = { ...day.todos[i], text, done: i === 0 }));

  // Time Alignment blocks
  const demoBlocks: TimeBlock[] = [
    { id: uid('blk'), date: t, startSlot: 0, endSlot: 2, label: 'Morning routine', tag: 'routine' },
    { id: uid('blk'), date: t, startSlot: 3, endSlot: 7, label: 'Moneymaker — client site', tag: 'goodDay' },
    { id: uid('blk'), date: t, startSlot: 9, endSlot: 12, label: 'Gym + shower', tag: 'chore' },
    { id: uid('blk'), date: t, startSlot: 16, endSlot: 18, label: 'Email landlord + bank call', tag: 'todo' },
    { id: uid('blk'), date: t, startSlot: 20, endSlot: 22, label: 'Dentist appointment', tag: 'fixed', fixed: true },
    { id: uid('blk'), date: t, startSlot: 24, endSlot: 26, label: 'Dinner', tag: 'goodDay' },
  ];
  day.blocks = demoBlocks.filter((b) => b.endSlot <= SLOT_COUNT);

  day.windDown.tomorrowPlan = 'Gym early, finish expenses';
  day.windDown.bedtime = '12:30';
  base.days[t] = day;

  // Running lists
  base.todos = [
    { id: uid('td'), text: 'Return library books', done: false, list: 'short', createdAt: Date.now(), source: 'ui' },
    { id: uid('td'), text: 'Text Priya back', done: true, list: 'short', createdAt: Date.now(), source: 'ui' },
    { id: uid('td'), text: 'Refill prescription', done: false, list: 'short', createdAt: Date.now(), source: 'ui' },
    {
      id: uid('td'),
      text: 'Plan Lisbon trip',
      done: false,
      list: 'long',
      note: 'September, ~5 days, budget flights',
      subSteps: [
        { id: uid('ss'), text: 'Compare flights', done: true },
        { id: uid('ss'), text: 'Shortlist neighbourhoods', done: false },
        { id: uid('ss'), text: 'Book accommodation', done: false },
      ],
      createdAt: Date.now(),
      source: 'ui',
    },
    {
      id: uid('td'),
      text: 'Redo CV',
      done: false,
      list: 'long',
      note: 'Tailor for product roles',
      subSteps: [
        { id: uid('ss'), text: 'Update experience section', done: false },
        { id: uid('ss'), text: 'Get feedback from Sam', done: false },
      ],
      createdAt: Date.now(),
      source: 'ui',
    },
  ];

  base.lastEditedAt = Date.now();
  return base;
}
