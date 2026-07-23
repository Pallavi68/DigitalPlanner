import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import type {
  PlannerState,
  DayState,
  ISODate,
  Todo,
  CellMark,
  RoutineHabit,
  HabitRow,
  Preferences,
  DailyRoutineInstance,
} from '../types';
import { storage } from './storage';
import { blankDailyTodo, emptyDay, initialState, demoState, uid } from './seed';
import { todayISO } from '../lib/dates';
import { materializeRoutine } from './routines';

/* ------------------------------------------------------------------ actions */

type Action =
  | { type: 'HYDRATE'; state: PlannerState }
  | { type: 'RESET'; state: PlannerState }
  | { type: 'COMPLETE_SETUP'; routineHabits: RoutineHabit[]; habitRows: HabitRow[]; preferences: Preferences }
  | { type: 'PATCH_DAY'; date: ISODate; patch: (day: DayState) => DayState }
  | { type: 'SET_GRID_MARK'; key: string; mark: CellMark }
  | { type: 'UPSERT_TODO'; todo: Todo }
  | { type: 'DELETE_TODO'; id: string }
  | { type: 'SET_PREFERENCES'; preferences: Preferences }
  | { type: 'SET_ROUTINE'; routineHabits: RoutineHabit[] }
  | { type: 'SAVE_ROUTINE'; routineHabits: RoutineHabit[]; effectiveDate: ISODate }
  | { type: 'MATERIALIZE_ROUTINE'; date: ISODate }
  | { type: 'SET_HABIT_ROWS'; habitRows: HabitRow[] };

function ensureDay(state: PlannerState, date: ISODate): DayState {
  return state.days[date] ?? emptyDay();
}

function reducer(state: PlannerState, action: Action): PlannerState {
  const touched = (next: PlannerState): PlannerState => ({ ...next, lastEditedAt: Date.now() });

  switch (action.type) {
    case 'HYDRATE':
      return action.state;
    case 'RESET':
      return touched(action.state);
    case 'COMPLETE_SETUP':
      return touched({
        ...state,
        setupComplete: true,
        routineHabits: action.routineHabits,
        habitRows: action.habitRows,
        preferences: action.preferences,
      });
    case 'PATCH_DAY': {
      const day = action.patch(ensureDay(state, action.date));
      return touched({ ...state, days: { ...state.days, [action.date]: day } });
    }
    case 'SET_GRID_MARK': {
      const gridMarks = { ...state.gridMarks };
      if (action.mark === 'blank') delete gridMarks[action.key];
      else gridMarks[action.key] = action.mark;
      return touched({ ...state, gridMarks });
    }
    case 'UPSERT_TODO': {
      const idx = state.todos.findIndex((t) => t.id === action.todo.id);
      const todos = idx === -1 ? [...state.todos, action.todo] : state.todos.map((t) => (t.id === action.todo.id ? action.todo : t));
      return touched({ ...state, todos });
    }
    case 'DELETE_TODO':
      return touched({ ...state, todos: state.todos.filter((t) => t.id !== action.id) });
    case 'SET_PREFERENCES':
      return touched({ ...state, preferences: action.preferences });
    case 'SET_ROUTINE':
      return touched({ ...state, routineHabits: action.routineHabits });
    case 'SAVE_ROUTINE': {
      const days = { ...state.days };
      Object.keys(days).forEach((date) => {
        if (date < action.effectiveDate) return;
        const current = days[date];
        const priorByRoutine = new Map(current.routineInstances.map((instance) => [instance.sourceRoutineId, instance]));
        const routineInstances = materializeRoutine(action.routineHabits, date).map((instance) => {
          const prior = priorByRoutine.get(instance.sourceRoutineId);
          return { ...instance, done: prior?.done ?? !!current.routineDone[instance.sourceRoutineId] };
        });
        const nextById = new Map(routineInstances.map((instance) => [instance.id, instance]));
        const blocks = current.blocks.flatMap((block) => {
          if (block.tag !== 'routine' || !block.sourceRefId) return [block];
          const linked = nextById.get(block.sourceRefId);
          if (!linked) return [];
          return [{ ...block, label: linked.label, completed: linked.done }];
        });
        days[date] = { ...current, routineInstances, blocks };
      });
      return touched({ ...state, routineHabits: action.routineHabits, days });
    }
    case 'MATERIALIZE_ROUTINE': {
      const current = ensureDay(state, action.date);
      if (current.routineInstances.length) return state;
      const instances = materializeRoutine(state.routineHabits, action.date).map((instance) => ({
        ...instance,
        done: !!current.routineDone[instance.sourceRoutineId],
      }));
      return touched({ ...state, days: { ...state.days, [action.date]: { ...current, routineInstances: instances } } });
    }
    case 'SET_HABIT_ROWS':
      return touched({ ...state, habitRows: action.habitRows });
    default:
      return state;
  }
}

/* ------------------------------------------------------------------ context */

export type SyncStatus = 'loading' | 'synced' | 'saving' | 'offline' | 'failed';

interface PlannerContextValue {
  state: PlannerState;
  status: SyncStatus;
  online: boolean;
  retrySave: () => void;
  getDay: (date: ISODate) => DayState;
  patchDay: (date: ISODate, patch: (day: DayState) => DayState) => void;
  setGridMark: (key: string, mark: CellMark) => void;
  /** FR-16: the single internal "add item to a list" entry point. */
  captureTodo: (input: { text: string; list: 'short' | 'long'; assignedDate?: ISODate; source?: Todo['source'] }) => Todo;
  upsertTodo: (todo: Todo) => void;
  deleteTodo: (id: string) => void;
  /** FR-10: surface a running-list item onto a specific day's To Dos. */
  assignTodoToDay: (todoId: string, date: ISODate) => boolean;
  completeSetup: (p: { routineHabits: RoutineHabit[]; habitRows: HabitRow[]; preferences: Preferences }) => void;
  setPreferences: (p: Preferences) => void;
  setRoutine: (r: RoutineHabit[]) => void;
  saveRoutine: (r: RoutineHabit[], effectiveDate: ISODate) => void;
  materializeRoutine: (date: ISODate) => void;
  toggleRoutine: (date: ISODate, instance: DailyRoutineInstance) => void;
  setHabitRows: (r: HabitRow[]) => void;
  loadDemo: () => void;
  resetAll: () => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as PlannerState, initialState);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const hydrated = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);

  // Initial hydrate from storage.
  useEffect(() => {
    let alive = true;
    storage.load().then((loaded) => {
      if (!alive) return;
      if (loaded) dispatch({ type: 'HYDRATE', state: loaded });
      hydrated.current = true;
      setStatus('synced');
    });
    return () => {
      alive = false;
    };
  }, []);

  // Online/offline tracking for the sync indicator.
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);

  // Reflect edits from other tabs (stand-in for other devices).
  useEffect(() => {
    return storage.subscribe((remote) => dispatch({ type: 'HYDRATE', state: remote }));
  }, []);

  // Debounced persistence with a visible saving -> synced transition.
  useEffect(() => {
    if (!hydrated.current) return;
    setStatus(online ? 'saving' : 'offline');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      storage.save(state)
        .then(() => setStatus(online ? 'synced' : 'offline'))
        .catch(() => setStatus('failed'));
    }, 350);
    return () => window.clearTimeout(saveTimer.current);
  }, [state, online, saveAttempt]);

  const value = useMemo<PlannerContextValue>(() => {
    const getDay = (date: ISODate) => state.days[date] ?? emptyDay();
    const patchDay = (date: ISODate, patch: (day: DayState) => DayState) => dispatch({ type: 'PATCH_DAY', date, patch });

    const captureTodo: PlannerContextValue['captureTodo'] = ({ text, list, assignedDate, source = 'ui' }) => {
      const todo: Todo = {
        id: uid('td'),
        text: text.trim(),
        done: false,
        list,
        assignedDate,
        createdAt: Date.now(),
        source,
        ...(list === 'long' ? { note: '', subSteps: [] } : {}),
      };
      dispatch({ type: 'UPSERT_TODO', todo });
      if (assignedDate) surfaceOnDay(todo, assignedDate);
      return todo;
    };

    const surfaceOnDay = (todo: Todo, date: ISODate) => {
      dispatch({
        type: 'PATCH_DAY',
        date,
        patch: (day) => {
          if (day.todos.some((l) => l.sourceRefId === todo.id)) return day;
          const idx = day.todos.findIndex((l) => l.text.trim() === '');
          if (idx === -1) {
            return { ...day, todos: [...day.todos, { ...blankDailyTodo(), text: todo.text, sourceRefId: todo.id }] };
          }
          const todos = day.todos.slice();
          todos[idx] = { ...todos[idx], text: todo.text, done: false, sourceRefId: todo.id };
          return { ...day, todos };
        },
      });
    };

    const assignTodoToDay = (todoId: string, date: ISODate) => {
      const todo = state.todos.find((t) => t.id === todoId);
      if (!todo) return false;
      dispatch({ type: 'UPSERT_TODO', todo: { ...todo, assignedDate: date } });
      surfaceOnDay(todo, date);
      return true;
    };

    return {
      state,
      status,
      online,
      retrySave: () => setSaveAttempt((attempt) => attempt + 1),
      getDay,
      patchDay,
      setGridMark: (key, mark) => dispatch({ type: 'SET_GRID_MARK', key, mark }),
      captureTodo,
      upsertTodo: (todo) => dispatch({ type: 'UPSERT_TODO', todo }),
      deleteTodo: (id) => dispatch({ type: 'DELETE_TODO', id }),
      assignTodoToDay,
      completeSetup: (p) => dispatch({ type: 'COMPLETE_SETUP', ...p }),
      setPreferences: (preferences) => dispatch({ type: 'SET_PREFERENCES', preferences }),
      setRoutine: (routineHabits) => dispatch({ type: 'SET_ROUTINE', routineHabits }),
      saveRoutine: (routineHabits, effectiveDate) => dispatch({ type: 'SAVE_ROUTINE', routineHabits, effectiveDate }),
      materializeRoutine: (date) => dispatch({ type: 'MATERIALIZE_ROUTINE', date }),
      toggleRoutine: (date, instance) => dispatch({
        type: 'PATCH_DAY',
        date,
        patch: (day) => ({
          ...day,
          routineDone: { ...day.routineDone, [instance.sourceRoutineId]: !instance.done },
          routineInstances: day.routineInstances.map((item) => item.id === instance.id ? { ...item, done: !item.done } : item),
          blocks: day.blocks.map((block) => block.sourceRefId === instance.id ? { ...block, completed: !instance.done } : block),
        }),
      }),
      setHabitRows: (habitRows) => dispatch({ type: 'SET_HABIT_ROWS', habitRows }),
      loadDemo: () => dispatch({ type: 'RESET', state: demoState() }),
      resetAll: () => dispatch({ type: 'RESET', state: initialState() }),
    };
  }, [state, status, online]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}

export { todayISO };
