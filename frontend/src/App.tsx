import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { BookShell } from './components/BookShell';
import { Spread } from './components/Spread';
import { DateHeader } from './components/ui';
import { RoutineChecklist } from './pages/daily/RoutineChecklist';
import { TimeAlignment } from './pages/daily/TimeAlignment';
import { ToDos } from './pages/daily/ToDos';
import { WindDown } from './pages/daily/WindDown';
import { usePlanner } from './store/PlannerContext';
import { dayOfMonth, fromISO, monthName, ordinal, todayISO, weekdayLong } from './lib/dates';
import type { ISODate, TimeBlock } from './types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string | undefined): value is ISODate {
  if (!value || !ISO_DATE.test(value)) return false;
  const parsed = fromISO(value);
  return !Number.isNaN(parsed.getTime()) && value === `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function DailyPage() {
  const { date: routeDate } = useParams();
  const { state, getDay, patchDay } = usePlanner();

  if (!isValidISODate(routeDate)) {
    return <Navigate to={`/day/${todayISO()}`} replace />;
  }

  const date = routeDate;
  const day = getDay(date);
  const habits = state.routineHabits.filter((habit) => !habit.archived && habit.since <= date);
  const updateBlocks = (blocks: TimeBlock[]) => patchDay(date, (current) => ({ ...current, blocks }));

  return (
    <Spread
      flipKey={date}
      ariaLabel={`Daily planner for ${weekdayLong(date)}, ${monthName(date)} ${dayOfMonth(date)}`}
      left={
        <>
          <DateHeader eyebrow={weekdayLong(date)} title={`${monthName(date)} ${dayOfMonth(date)}${ordinal(dayOfMonth(date))}`} />
          <RoutineChecklist
            date={date}
            day={day}
            habits={habits}
            onToggle={(habitId) =>
              patchDay(date, (current) => ({
                ...current,
                routineDone: { ...current.routineDone, [habitId]: !current.routineDone[habitId] },
              }))
            }
          />
          <ToDos
            date={date}
            day={day}
            onEdit={(index, text) =>
              patchDay(date, (current) => ({
                ...current,
                todos: current.todos.map((line, lineIndex) => (lineIndex === index ? { ...line, text } : line)),
              }))
            }
            onToggle={(index) =>
              patchDay(date, (current) => ({
                ...current,
                todos: current.todos.map((line, lineIndex) => (lineIndex === index ? { ...line, done: !line.done } : line)),
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
    />
  );
}

export default function App() {
  return (
    <BookShell>
      <Routes>
        <Route path="/" element={<Navigate to={`/day/${todayISO()}`} replace />} />
        <Route path="/day/:date" element={<DailyPage />} />
        <Route path="*" element={<Navigate to={`/day/${todayISO()}`} replace />} />
      </Routes>
    </BookShell>
  );
}
