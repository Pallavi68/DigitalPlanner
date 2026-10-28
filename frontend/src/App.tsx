import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BookShell } from './components/BookShell';
import { Spread } from './components/Spread';
import { DateHeader } from './components/ui';
import { RoutineChecklist } from './pages/daily/RoutineChecklist';
import { TimeAlignment } from './pages/daily/TimeAlignment';
import { ToDos } from './pages/daily/ToDos';
import { WeeklyPlannerPage } from './pages/weekly';
import { TwoWeekHabitPage } from './pages/habits/TwoWeekHabitPage';
import { usePlanner } from './store/PlannerContext';
import { addDays, addMonths, dayOfMonth, fromISO, monthName, monthWeeks, ordinal, todayISO, weekday, weekdayLong, weekdayShort } from './lib/dates';
import type { ISODate, TimeBlock } from './types';
import { RoutineSetup } from './pages/daily/RoutineSetup';
import { blankDailyTodo, uid } from './store/seed';
import { SLOT_COUNT } from './lib/dates';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string | undefined): value is ISODate {
  if (!value || !ISO_DATE.test(value)) return false;
  const parsed = fromISO(value);
  return !Number.isNaN(parsed.getTime()) && value === `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function DailyPage() {
  const { date: routeDate } = useParams();
  const navigate = useNavigate();
  const { state, getDay, getChores, patchDay, materializeRoutine, toggleRoutine, toggleChore, saveRoutine, cloudReady, status, retrySave } = usePlanner();
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    if (cloudReady && isValidISODate(routeDate)) materializeRoutine(routeDate);
  }, [routeDate, materializeRoutine, cloudReady]);

  if (!isValidISODate(routeDate)) {
    return <Navigate to={`/day/${todayISO()}`} replace />;
  }

  const date = routeDate;
  if (!cloudReady) {
    return (
      <Spread
        ariaLabel="Planner cloud loading state"
        turnLabel="Cloud planner"
        left={<section className="cloud-page-state"><h1>{status === 'failed' ? 'This page could not be opened' : 'Opening this page…'}</h1><p>A historical page is never recreated when its cloud snapshot cannot be loaded.</p>{status === 'failed' && <button type="button" onClick={retrySave}>Retry</button>}</section>}
        right={<div />}
      />
    );
  }
  const day = getDay(date);
  const routineItems = day.routineInstances;
  const choreItems = getChores(date);
  const updateBlocks = (blocks: TimeBlock[]) => patchDay(date, (current) => ({ ...current, blocks }));
  const scheduleRoutine = (item: typeof routineItems[number]) => {
    const duplicates = day.blocks.some((block) => block.sourceRefId === item.id);
    if (duplicates && !window.confirm(`“${item.label}” is already on this day. Add it again?`)) return;
    const span = item.durationMinutes / 30;
    const startSlot = item.defaultStartSlot ?? Array.from({ length: Math.max(1, Math.floor(SLOT_COUNT - span + 1)) }, (_, slot) => slot)
      .find((slot) => !day.blocks.some((block) => slot < block.endSlot && slot + span > block.startSlot)) ?? 0;
    const endSlot = Math.min(SLOT_COUNT, startSlot + span);
    if (endSlot - startSlot < item.durationMinutes / 30) window.alert('The block was shortened to fit at the end of the day.');
    updateBlocks([...day.blocks, { id: uid('blk'), date, startSlot, endSlot, label: item.label, tag: 'routine', sourceRefId: item.id, completed: item.done }]);
  };

  return (
    <Spread
      ariaLabel={`Daily planner for ${weekdayLong(date)}, ${monthName(date)} ${dayOfMonth(date)}`}
      onPrevious={() => navigate(`/day/${addDays(date, -1)}`)}
      onNext={() => navigate(`/day/${addDays(date, 1)}`)}
      turnLabel={`${weekdayLong(date)}, ${monthName(date)} ${dayOfMonth(date)}`}
      left={
        <>
          <DateHeader eyebrow={weekdayLong(date)} title={`${monthName(date)} ${dayOfMonth(date)}${ordinal(dayOfMonth(date))}`} />
          <RoutineChecklist
            date={date}
            day={day}
            items={routineItems}
            onToggle={(item) => toggleRoutine(date, item)}
            onOpenSetup={() => setSetupOpen(true)}
            onSchedule={scheduleRoutine}
          />
          <RoutineSetup
            open={setupOpen}
            onClose={() => setSetupOpen(false)}
            date={todayISO()}
            habits={state.routineHabits}
            onSave={(habits) => saveRoutine(habits, todayISO())}
          />
          <ToDos
            day={day}
            onEdit={(id, text) =>
              patchDay(date, (current) => ({
                ...current,
                todos: current.todos.map((line) => line.id === id ? { ...line, text } : line),
                blocks: current.blocks.map((block) => block.sourceRefId === id ? { ...block, label: text } : block),
              }))
            }
            onToggle={(id) =>
              patchDay(date, (current) => {
                const source = current.todos.find((line) => line.id === id);
                if (!source) return current;
                const done = !source.done;
                return {
                  ...current,
                  todos: current.todos.map((line) => line.id === id ? { ...line, done } : line),
                  blocks: current.blocks.map((block) => block.sourceRefId === id ? { ...block, completed: done } : block),
                };
              })
            }
            onDelete={(id) =>
              patchDay(date, (current) => {
                const todos = current.todos.filter((line) => line.id !== id);
                while (todos.length < 15) todos.push(blankDailyTodo());
                return {
                  ...current,
                  todos,
                  blocks: current.blocks.filter((block) => block.sourceRefId !== id),
                };
              })
            }
            onAdd={() =>
              patchDay(date, (current) => ({ ...current, todos: [...current.todos, blankDailyTodo()] }))
            }
          />
        </>
      }
      right={
        <>
          <TimeAlignment
            date={date}
            day={day}
            onChange={updateBlocks}
            onDeleteBlock={(block) => patchDay(date, (current) => ({
              ...current,
              blocks: current.blocks.filter((candidate) => candidate.id !== block.id),
              suppressedAutoBlockIds: block.id.startsWith('auto_')
                ? [...new Set([...(current.suppressedAutoBlockIds ?? []), block.id])]
                : current.suppressedAutoBlockIds,
            }))}
            onUpdateBlock={(block) => patchDay(date, (current) => ({
              ...current,
              blocks: current.blocks.map((candidate) => candidate.id === block.id ? block : candidate),
            }))}
            onToggleBlock={(block) => {
              const linked = routineItems.find((item) => item.id === block.sourceRefId);
              if (linked) toggleRoutine(date, linked);
              else if (block.tag === 'chore' && block.sourceRefId) {
                const chore = choreItems.find((item) => item.id === block.sourceRefId);
                if (chore) toggleChore(date, chore);
              } else if (block.sourceRefId && day.windDown.checklist.some((item) => item.id === block.sourceRefId)) {
                patchDay(date, (current) => ({
                  ...current,
                  windDown: {
                    ...current.windDown,
                    checklist: current.windDown.checklist.map((item) => item.id === block.sourceRefId ? { ...item, done: !item.done } : item),
                  },
                  blocks: current.blocks.map((candidate) => candidate.sourceRefId === block.sourceRefId ? { ...candidate, completed: !block.completed } : candidate),
                }));
              }
              else if (block.tag === 'todo' && block.sourceRefId) {
                const todo = day.todos.find((line) => line.id === block.sourceRefId);
                if (todo) {
                  patchDay(date, (current) => {
                    const source = current.todos.find((line) => line.id === block.sourceRefId);
                    if (!source) return current;
                    const done = !source.done;
                    return {
                      ...current,
                      todos: current.todos.map((line) => line.id === block.sourceRefId ? { ...line, done } : line),
                      blocks: current.blocks.map((candidate) => candidate.sourceRefId === block.sourceRefId ? { ...candidate, completed: done } : candidate),
                    };
                  });
                }
              } else updateBlocks(day.blocks.map((candidate) => candidate.id === block.id ? { ...candidate, completed: !candidate.completed } : candidate));
            }}
          />
        </>
      }
    />
  );
}

function mondayContaining(date: ISODate): ISODate {
  return addDays(date, -weekday(date));
}

function WeeklyPlannerRoute() {
  const { monday: routeMonday } = useParams();
  const navigate = useNavigate();
  const fallbackMonday = mondayContaining(todayISO());

  if (!isValidISODate(routeMonday)) {
    return <Navigate to={`/week/${fallbackMonday}`} replace />;
  }

  const monday = mondayContaining(routeMonday);
  if (monday !== routeMonday) {
    return <Navigate to={`/week/${monday}`} replace />;
  }

  return (
    <WeeklyPlannerPage
      weekStart={monday}
      onPrevious={() => navigate(`/week/${addDays(monday, -7)}`)}
      onNext={() => navigate(`/week/${addDays(monday, 7)}`)}
      onOpenDay={(date) => navigate(`/day/${date}`)}
    />
  );
}

// Keep every consecutive 14-day habit sheet aligned to Monday–Sunday weeks.
const HABIT_WINDOW_ANCHOR: ISODate = '2026-08-03';

function habitWindowFor(date: ISODate): ISODate {
  const elapsed = Math.floor((fromISO(date).getTime() - fromISO(HABIT_WINDOW_ANCHOR).getTime()) / 86_400_000);
  return addDays(HABIT_WINDOW_ANCHOR, Math.floor(elapsed / 14) * 14);
}

function HabitPlannerRoute() {
  const { start: routeStart } = useParams();
  const navigate = useNavigate();
  if (!isValidISODate(routeStart)) return <Navigate to={`/habits/${habitWindowFor(todayISO())}`} replace />;
  const start = habitWindowFor(routeStart);
  if (start !== routeStart) return <Navigate to={`/habits/${start}`} replace />;
  return <TwoWeekHabitPage start={start} onPrevious={() => navigate(`/habits/${addDays(start, -14)}`)} onNext={() => navigate(`/habits/${addDays(start, 14)}`)} />;
}

function MonthOverview() {
  const { year: routeYear, month: routeMonth } = useParams();
  const navigate = useNavigate();
  const year = Number(routeYear);
  const month = Number(routeMonth);
  if (!Number.isInteger(year) || year < 1900 || year > 2200 || !Number.isInteger(month) || month < 1 || month > 12) {
    const today = fromISO(todayISO());
    return <Navigate to={`/month/${today.getFullYear()}/${today.getMonth() + 1}`} replace />;
  }

  const monthDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const weeks = monthWeeks(monthDate);
  const monthEnd = addDays(addMonths(monthDate, 1), -1);
  const firstHabitWindow = habitWindowFor(monthDate);
  const habitWindows: ISODate[] = [];
  for (let start = firstHabitWindow; start <= monthEnd; start = addDays(start, 14)) habitWindows.push(start);
  const today = todayISO();
  const monthIndex = fromISO(monthDate).getMonth();
  const previousMonth = addMonths(monthDate, -1);
  const nextMonth = addMonths(monthDate, 1);
  const goToMonth = (date: ISODate) => {
    const target = fromISO(date);
    navigate(`/month/${target.getFullYear()}/${target.getMonth() + 1}`);
  };

  return (
    <Spread
      ariaLabel={`${monthName(monthDate)} ${year} month overview`}
      onPrevious={() => goToMonth(previousMonth)}
      onNext={() => goToMonth(nextMonth)}
      previousLabel="Previous month"
      nextLabel="Next month"
      turnLabel={`${monthName(monthDate)} ${year}`}
      left={
        <div className="month-intro">
          <p>Month overview</p>
          <h1>{monthName(monthDate)}</h1>
          <strong>{year}</strong>
          <span>Select a week, then open the exact day you want to plan.</span>
          <Link to={`/day/${today}`} className="paper-link month-today-link">return to today</Link>
          <Link to={`/habits/${habitWindowFor(monthDate)}`} className="paper-link month-today-link">open two-week habit sheets</Link>
        </div>
      }
      right={
        <div className="month-weeks">
          <div className="month-weeks-heading">
            <span>Weeks</span>
            <small>{weeks.length} calendar weeks</small>
          </div>
          <div className="month-habit-windows" aria-label="Two-week habit sheets">
            {habitWindows.map((start) => {
              const end = addDays(start, 13);
              return <Link key={start} to={`/habits/${start}`}><span>Habit sheet</span><small>{dayOfMonth(start)} {monthName(start).slice(0, 3)} – {dayOfMonth(end)} {monthName(end).slice(0, 3)}</small></Link>;
            })}
          </div>
          {weeks.map((week, weekIndex) => {
            const monday = week[0];
            const sunday = week[6];
            return (
              <section className="month-week-tab" key={monday}>
                <Link to={`/week/${monday}`} className="month-week-link" aria-label={`Open Weekly Planner for week ${weekIndex + 1}`}>
                  <span>Week {weekIndex + 1} · Weekly Planner</span>
                  <small>{dayOfMonth(monday)} {monthName(monday).slice(0, 3)} – {dayOfMonth(sunday)} {monthName(sunday).slice(0, 3)}</small>
                </Link>
                <div className="month-week-days">
                  {week.map((date) => {
                    const outsideMonth = fromISO(date).getMonth() !== monthIndex;
                    return (
                      <Link
                        to={`/day/${date}`}
                        key={date}
                        className={`month-day ${outsideMonth ? 'outside' : ''} ${date === today ? 'today' : ''}`}
                        aria-label={`Open ${weekdayLong(date)}, ${monthName(date)} ${dayOfMonth(date)}`}
                      >
                        <span>{weekdayShort(date)}</span>
                        <strong>{dayOfMonth(date)}</strong>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      }
    />
  );
}

export default function App({ userId: _userId }: { userId: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const initialPath = useRef(location.pathname);
  const initialDailyRouteHandled = useRef(false);

  // A reopened browser tab can retain an old daily URL indefinitely. Daily
  // navigation within an open planner remains untouched; only the initial
  // page load is reset to the device-local date.
  useEffect(() => {
    if (initialDailyRouteHandled.current) return;
    initialDailyRouteHandled.current = true;
    const initialDate = initialPath.current.match(/^\/day\/(\d{4}-\d{2}-\d{2})$/)?.[1];
    const today = todayISO();
    if (initialDate && isValidISODate(initialDate) && initialDate !== today) {
      navigate(`/day/${today}`, { replace: true });
    }
  }, [navigate]);

  return (
    <BookShell>
      <Routes>
        <Route path="/" element={<Navigate to={`/day/${todayISO()}`} replace />} />
        <Route path="/day/:date" element={<DailyPage />} />
        <Route path="/week/:monday" element={<WeeklyPlannerRoute />} />
        <Route path="/habits/:start" element={<HabitPlannerRoute />} />
        <Route path="/month/:year/:month" element={<MonthOverview />} />
        <Route path="*" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      </Routes>
    </BookShell>
  );
}
