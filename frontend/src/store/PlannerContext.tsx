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
import { migratePlannerState } from './storage';
import {
  BackendError,
  createLegacyBackup,
  hasCompletedLegacyMigration,
  markLegacyMigrationComplete,
  migrationIdempotencyKey,
  plannerCache,
  previewLegacyMigration,
  supabasePlannerBackend,
} from '../backend';
import { blankDailyTodo, emptyDay, initialState, demoState, uid } from './seed';
import { todayISO } from '../lib/dates';
import { materializeRoutine } from './routines';
import { dailyAutoBlockCandidates, materializeDailyChores, type DailyChoreOccurrence } from './recurringSchedule';

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
      const choreCompletions = { ...state.choreCompletions };
      if (action.mark === 'blank') delete gridMarks[action.key];
      else gridMarks[action.key] = action.mark;
      if (action.mark === 'blank') delete choreCompletions[action.key];
      else choreCompletions[action.key] = {
        mark: action.mark,
        ...(action.mark === 'check' ? { actualCompletionDate: action.key.split('|')[0] } : {}),
      };
      return touched({ ...state, gridMarks, choreCompletions });
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
          return [{ ...block, label: block.id.startsWith('auto_') ? linked.autoScheduleLabel ?? linked.label : linked.label, completed: linked.done }];
        });
        days[date] = { ...current, routineInstances, blocks };
      });
      return touched({ ...state, routineHabits: action.routineHabits, days });
    }
    case 'MATERIALIZE_ROUTINE': {
      const current = ensureDay(state, action.date);
      const routineInstances = current.routineInstances.length ? current.routineInstances : materializeRoutine(state.routineHabits, action.date).map((instance) => ({
        ...instance,
        done: !!current.routineDone[instance.sourceRoutineId],
      }));
      const withInstances = { ...current, routineInstances };
      const base = { ...state, days: { ...state.days, [action.date]: withInstances } };
      const automaticBlocks = dailyAutoBlockCandidates(base, action.date);
      if (current.routineInstances.length && automaticBlocks.length === 0) return state;
      return touched({ ...base, days: { ...base.days, [action.date]: { ...withInstances, blocks: [...withInstances.blocks, ...automaticBlocks] } } });
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
  signOut: () => void;
  syncDetail?: string;
  cloudReady: boolean;
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
  getChores: (date: ISODate) => DailyChoreOccurrence[];
  toggleChore: (date: ISODate, occurrence: DailyChoreOccurrence) => void;
  setHabitRows: (r: HabitRow[]) => void;
  loadDemo: () => void;
  resetAll: () => void;
}

const PlannerContext = createContext<PlannerContextValue | null>(null);

export function PlannerProvider({ children, userId, onSignOut }: { children: ReactNode; userId: string; onSignOut: () => void }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as PlannerState, initialState);
  const [status, setStatus] = useState<SyncStatus>('loading');
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const hydrated = useRef(false);
  const saveTimer = useRef<number | undefined>(undefined);
  const saveInFlight = useRef(false);
  const saveQueued = useRef(false);
  const latestState = useRef(state);
  const revision = useRef<number | undefined>(undefined);
  const suppressSave = useRef(true);
  const statusRef = useRef<SyncStatus>(status);
  const invalidationQueued = useRef(false);
  const [syncDetail, setSyncDetail] = useState<string>();
  const [cloudReady, setCloudReady] = useState(false);
  latestState.current = state;
  statusRef.current = status;

  // Hydrate from the authoritative cloud state, with an explicitly labelled
  // last-known cache when the network is unavailable.
  useEffect(() => {
    let alive = true;
    const cached = plannerCache.read(userId);
    const unsaved = plannerCache.readUnsaved(userId);
    if (unsaved && !cached) {
      dispatch({ type: 'HYDRATE', state: migratePlannerState(unsaved) });
      setStatus(navigator.onLine ? 'loading' : 'offline');
      setCloudReady(!navigator.onLine);
    }
    if (cached) {
      dispatch({ type: 'HYDRATE', state: migratePlannerState(unsaved ?? cached.state) });
      revision.current = cached.revision;
      setStatus(navigator.onLine ? 'loading' : 'offline');
      setSyncDetail('Showing the last cloud-synced copy stored on this device.');
      setCloudReady(!navigator.onLine);
    }
    supabasePlannerBackend.load()
      .then(async (remote) => {
        if (!alive) return;
        if (remote) {
          dispatch({ type: 'HYDRATE', state: migratePlannerState(unsaved ?? remote.state) });
          revision.current = remote.revision;
        } else {
          const legacy = !hasCompletedLegacyMigration(userId) ? previewLegacyMigration() : null;
          if (legacy && window.confirm(`Import this browser's existing planner into Supabase? This includes ${legacy.summary.dailySnapshots} daily pages and ${legacy.summary.timeBlocks} time blocks. Existing cloud data will never be overwritten.`)) {
            const migrated = migratePlannerState(legacy.state);
            const key = migrationIdempotencyKey(userId, migrated);
            createLegacyBackup(userId);
            const result = await supabasePlannerBackend.importLegacy(migrated, key);
            markLegacyMigrationComplete(userId, key);
            dispatch({ type: 'HYDRATE', state: migrated });
            revision.current = result.revision;
          } else if (!legacy) {
            const seeded = initialState();
            const result = await supabasePlannerBackend.save({ state: seeded });
            dispatch({ type: 'HYDRATE', state: seeded });
            revision.current = result.revision;
          } else {
            throw new BackendError('migration_already_completed', 'Import was deferred. Retry when you are ready; no blank cloud planner was created.');
          }
        }
        hydrated.current = true;
        setCloudReady(true);
        suppressSave.current = !unsaved;
        setStatus(unsaved ? 'saving' : 'synced');
        setSyncDetail(unsaved ? 'Restored unsynced changes from this device; saving them to Supabase.' : undefined);
      })
      .catch((error) => {
        if (!alive) return;
        hydrated.current = !!(cached || unsaved);
        if (unsaved && !navigator.onLine) setCloudReady(true);
        setStatus(navigator.onLine ? 'failed' : 'offline');
        setSyncDetail(error instanceof Error ? error.message : 'Cloud planner data could not be loaded.');
      });
    return () => {
      alive = false;
    };
  }, [userId]);

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

  // Realtime messages are invalidations; always refetch the authoritative
  // aggregate to avoid applying partial or out-of-order row events. An event
  // received during a local save is queued instead of being silently lost.
  useEffect(() => {
    let alive = true;
    let loadingRemote = false;

    const catchUp = () => {
      if (!alive || loadingRemote) return;
      if (statusRef.current === 'saving') {
        invalidationQueued.current = true;
        return;
      }
      loadingRemote = true;
      void supabasePlannerBackend.load().then((remote) => {
        if (!alive || !remote || remote.revision === revision.current) return;
        // Never replace edits which this device has explicitly preserved for a
        // retry after a failed save.
        if (plannerCache.readUnsaved(userId)) {
          invalidationQueued.current = true;
          return;
        }
        suppressSave.current = true;
        revision.current = remote.revision;
        dispatch({ type: 'HYDRATE', state: migratePlannerState(remote.state) });
        setStatus('synced');
        setSyncDetail(undefined);
      }).catch(() => setSyncDetail('Live sync was interrupted; the app will retry when it reconnects or becomes active.'))
        .finally(() => {
          loadingRemote = false;
        });
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') catchUp();
    };
    window.addEventListener('focus', catchUp);
    window.addEventListener('planner-sync-catch-up', catchUp);
    document.addEventListener('visibilitychange', onVisible);
    const unsubscribe = supabasePlannerBackend.subscribeInvalidation(
      userId,
      catchUp,
      (error) => setSyncDetail(`${error.message} The app will retry automatically.`),
      catchUp,
    );
    return () => {
      alive = false;
      unsubscribe();
      window.removeEventListener('focus', catchUp);
      window.removeEventListener('planner-sync-catch-up', catchUp);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [userId]);

  // Debounced persistence with a visible saving -> synced transition.
  useEffect(() => {
    if (!hydrated.current) return;
    if (suppressSave.current) {
      suppressSave.current = false;
      return;
    }
    setStatus(online ? 'saving' : 'offline');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (!online) {
        plannerCache.writeUnsaved(userId, state);
        setSyncDetail('Changes are stored on this device and are not yet in Supabase.');
        return;
      }
      if (saveInFlight.current) {
        saveQueued.current = true;
        return;
      }
      const snapshot = state;
      saveInFlight.current = true;
      supabasePlannerBackend.save({ state, expectedRevision: revision.current })
        .then((result) => {
          revision.current = result.revision;
          saveInFlight.current = false;
          const changedWhileSaving = latestState.current.lastEditedAt !== snapshot.lastEditedAt;
          if (saveQueued.current || changedWhileSaving) {
            saveQueued.current = false;
            setStatus('saving');
            setSaveAttempt((attempt) => attempt + 1);
          } else {
            statusRef.current = 'synced';
            setStatus('synced');
            setSyncDetail(undefined);
            if (invalidationQueued.current) {
              invalidationQueued.current = false;
              window.dispatchEvent(new Event('planner-sync-catch-up'));
            }
          }
        })
        .catch(async (error) => {
          saveInFlight.current = false;
          saveQueued.current = false;
          if (error instanceof BackendError && error.code === 'conflict') {
            try {
              const remote = await supabasePlannerBackend.load();
              if (!remote) throw error;
              revision.current = remote.revision;
              plannerCache.writeUnsaved(userId, state);
              const keepThisDevice = window.confirm(
                'Another device saved newer changes. Press OK to keep this device’s version (then choose Retry), or Cancel to keep the cloud version.',
              );
              if (keepThisDevice) {
                setStatus('failed');
                setSyncDetail('Your device version is preserved. Choose Retry to replace the cloud version.');
              } else {
                plannerCache.clearUnsaved(userId);
                suppressSave.current = true;
                dispatch({ type: 'HYDRATE', state: migratePlannerState(remote.state) });
                setStatus('synced');
                setSyncDetail('Kept the newer cloud version.');
              }
              return;
            } catch {
              // Preserve the original conflict message below.
            }
          }
          setStatus('failed');
          setSyncDetail(error instanceof Error ? error.message : 'Cloud save failed.');
        });
    }, 350);
    return () => window.clearTimeout(saveTimer.current);
  }, [state, online, saveAttempt, userId]);

  const value = useMemo<PlannerContextValue>(() => {
    const getDay = (date: ISODate) => state.days[date] ?? emptyDay();
    const getChores = (date: ISODate) => materializeDailyChores(state.habitRows, date, state.gridMarks);
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
      signOut: onSignOut,
      syncDetail,
      cloudReady,
      retrySave: () => cloudReady ? setSaveAttempt((attempt) => attempt + 1) : window.location.reload(),
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
      getChores,
      toggleChore: (date, occurrence) => {
        const done = !occurrence.completed;
        dispatch({ type: 'SET_GRID_MARK', key: `${date}|${occurrence.sourceChoreId}`, mark: done ? 'check' : 'blank' });
        dispatch({
          type: 'PATCH_DAY',
          date,
          patch: (day) => ({
            ...day,
            blocks: day.blocks.map((block) => block.sourceRefId === occurrence.id ? { ...block, completed: done } : block),
          }),
        });
      },
      setHabitRows: (habitRows) => dispatch({ type: 'SET_HABIT_ROWS', habitRows }),
      loadDemo: () => dispatch({ type: 'RESET', state: demoState() }),
      resetAll: () => dispatch({ type: 'RESET', state: initialState() }),
    };
  }, [state, status, online, onSignOut, syncDetail, cloudReady]);

  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}

export function usePlanner(): PlannerContextValue {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}

export { todayISO };
