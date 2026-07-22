import { useEffect, useState } from 'react';
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
import { RoutineSetup } from './pages/daily/RoutineSetup';
import { materializeRoutine as buildRoutineSnapshot } from './store/routines';
import { uid } from './store/seed';
import { SLOT_COUNT } from './lib/dates';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string | undefined): value is ISODate {
  if (!value || !ISO_DATE.test(value)) return false;
  const parsed = fromISO(value);
  return !Number.isNaN(parsed.getTime()) && value === `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function DailyPage() {
  const { date: routeDate } = useParams();
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
    const startSlot = Array.from({ length: Math.max(1, SLOT_COUNT - span + 1) }, (_, slot) => slot)
      .find((slot) => !day.blocks.some((block) => slot < block.endSlot && slot + span > block.startSlot)) ?? 0;
    const endSlot = Math.min(SLOT_COUNT, startSlot + span);
    if (endSlot - startSlot < item.durationMinutes / 30) window.alert('The block was shortened to fit at the end of the day.');
    updateBlocks([...day.blocks, { id: uid('blk'), date, startSlot, endSlot, label: item.label, tag: 'routine', sourceRefId: item.id, completed: item.done }]);
  };

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
            onToggleBlock={(block) => {
              const linked = routineItems.find((item) => item.id === block.sourceRefId);
              if (linked) toggleRoutine(date, linked);
              else updateBlocks(day.blocks.map((candidate) => candidate.id === block.id ? { ...candidate, completed: !candidate.completed } : candidate));
            }}
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
