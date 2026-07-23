import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { BookShell } from './components/BookShell';
import { Spread } from './components/Spread';
import { DateHeader } from './components/ui';
import { RoutineChecklist } from './pages/daily/RoutineChecklist';
import { TimeAlignment } from './pages/daily/TimeAlignment';
import { ToDos } from './pages/daily/ToDos';
import { WindDown } from './pages/daily/WindDown';
import { usePlanner } from './store/PlannerContext';
import { addDays, addMonths, dayOfMonth, fromISO, monthName, monthWeeks, ordinal, todayISO, weekdayLong, weekdayShort } from './lib/dates';
import type { ISODate, TimeBlock } from './types';
import { RoutineSetup } from './pages/daily/RoutineSetup';
import { materializeRoutine as buildRoutineSnapshot } from './store/routines';
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
  const { state, getDay, patchDay, materializeRoutine, toggleRoutine, saveRoutine } = usePlanner();
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    if (isValidISODate(routeDate)) materializeRoutine(routeDate);
  }, [routeDate, materializeRoutine]);

  if (!isValidISODate(routeDate)) {
    return <Navigate to={`/day/${todayISO()}`} replace />;
  }

  const date = routeDate;
  const day = getDay(date);
  const routineItems = day.routineInstances.length ? day.routineInstances : buildRoutineSnapshot(state.routineHabits, date);
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
          <WindDown
            date={date}
            day={day}
            onToggleItem={(itemId) =>
              patchDay(date, (current) => ({
                ...current,
                windDown: {
                  ...current.windDown,
                  checklist: current.windDown.checklist.map((item) =>
                    item.id === itemId ? { ...item, done: !item.done } : item,
                  ),
                },
              }))
            }
            onField={(field, value) =>
              patchDay(date, (current) => ({
                ...current,
                windDown: { ...current.windDown, [field]: value },
              }))
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
            onDeleteBlock={(block) => updateBlocks(day.blocks.filter((candidate) => candidate.id !== block.id))}
            onToggleBlock={(block) => {
              const linked = routineItems.find((item) => item.id === block.sourceRefId);
              if (linked) toggleRoutine(date, linked);
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
        </div>
      }
      right={
        <div className="month-weeks">
          <div className="month-weeks-heading">
            <span>Weeks</span>
            <small>{weeks.length} calendar weeks</small>
          </div>
          {weeks.map((week, weekIndex) => {
            const monday = week[0];
            const sunday = week[6];
            const inMonthTarget = week.find((date) => fromISO(date).getMonth() === monthIndex) ?? monday;
            return (
              <section className="month-week-tab" key={monday}>
                <Link to={`/day/${inMonthTarget}`} className="month-week-link">
                  <span>Week {weekIndex + 1}</span>
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

export default function App() {
  return (
    <BookShell>
      <Routes>
        <Route path="/" element={<Navigate to={`/day/${todayISO()}`} replace />} />
        <Route path="/day/:date" element={<DailyPage />} />
        <Route path="/month/:year/:month" element={<MonthOverview />} />
        <Route path="*" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      </Routes>
    </BookShell>
  );
}
