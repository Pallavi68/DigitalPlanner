import type { PlannerState, DayState, RoutineHabit, HabitRow, TimeBlock } from '../types';
import { todayISO, SLOT_COUNT } from '../lib/dates';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}

/** Default recurring routine ("Successful Day") — pre-seeded at setup. */
export const DEFAULT_ROUTINE: Omit<RoutineHabit, 'id' | 'since'>[] = [
  { label: 'Wake by 8', period: 'AM' },
  { label: 'Vitamins', period: 'AM' },
  { label: 'Skincare', period: 'AM' },
  { label: 'Mobility — 10 min', period: 'AM' },
  { label: 'Fitness', period: 'AM' },
  { label: 'Moneymaker', period: 'PM' },
  { label: 'Skincare PM', period: 'PM' },
  { label: 'Read 10 pages', period: 'PM' },
  { label: 'In bed by 1', period: 'PM' },
];

/** Default Two-Week grid rows — recurring habits + day-specific chores. */
export const DEFAULT_HABIT_ROWS: Omit<HabitRow, 'id' | 'since'>[] = [
  { label: 'Gym', category: 'Workout' },
  { label: '$$maker', category: 'Moneymaker' },
  { label: 'Biki walk', category: 'Walk', weekday: 2 },
  { label: 'Clean house', category: 'Chores' },
  { label: 'Oil hair', category: 'Self-care', weekday: 0 },
  { label: 'Wash hair', category: 'Self-care', weekday: 1 },
  { label: 'Splitwise', category: 'Finance', weekday: 6 },
  { label: 'Bingo', category: 'Social' },
];

export const DEFAULT_WINDDOWN_ITEMS = ['Tidy desk', 'Set out clothes', 'Plan tomorrow'];

export function emptyDay(): DayState {
  return {
    routineDone: {},
    todos: Array.from({ length: 15 }, () => ({ text: '', done: false })),
    blocks: [],
    windDown: {
      checklist: DEFAULT_WINDDOWN_ITEMS.map((label) => ({ id: uid('wd'), label, done: false })),
      tomorrowPlan: '',
      bedtime: '',
    },
  };
}

/** Fresh, un-set-up state (first run lands on the setup wizard). */
export function initialState(): PlannerState {
  const since = todayISO();
  return {
    version: 1,
    setupComplete: false,
    routineHabits: DEFAULT_ROUTINE.map((h) => ({ ...h, id: uid('rh'), since })),
    habitRows: DEFAULT_HABIT_ROWS.map((r) => ({ ...r, id: uid('hr'), since })),
    todos: [],
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
  sample.forEach((text, i) => (day.todos[i] = { text, done: i === 0 }));

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
