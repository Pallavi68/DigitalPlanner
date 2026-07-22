import { useState } from 'react';
import { Modal } from './Modal';
import { PaperButton } from './PaperButton';
import { usePlanner } from '../store/PlannerContext';
import { useToast } from './Toast';
import { todayISO, addDays, weekdayShort, dayOfMonth, monthName } from '../lib/dates';
import type { Todo } from '../types';

interface Props {
  todo: Todo | null;
  open: boolean;
  onClose: () => void;
}

/** FR-10: assign a running-list item to a day so it surfaces on that Daily Page. */
export function AssignToDayModal({ todo, open, onClose }: Props) {
  const { assignTodoToDay } = usePlanner();
  const toast = useToast();
  const [date, setDate] = useState(todayISO());

  if (!todo) return null;

  const quick = [
    { label: 'Today', value: todayISO() },
    { label: 'Tomorrow', value: addDays(todayISO(), 1) },
    { label: 'In 2 days', value: addDays(todayISO(), 2) },
  ];

  const confirm = () => {
    const placed = assignTodoToDay(todo.id, date);
    if (placed) {
      toast('success', `Added to ${weekdayShort(date)} ${dayOfMonth(date)} ${monthName(date)}`);
    } else {
      toast('info', `That day's To Dos are full (01–15) — kept on the running list`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Assign to a day">
      <p style={{ font: "400 15px var(--serif)", color: 'var(--ink)', margin: '0 0 14px' }}>
        Surface <strong>“{todo.text}”</strong> on a day's To&nbsp;Dos and draggable pool.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {quick.map((q) => (
          <PaperButton
            key={q.label}
            variant={date === q.value ? 'primary' : 'secondary'}
            onClick={() => setDate(q.value)}
            style={{ padding: '7px 12px', minHeight: 40 }}
          >
            {q.label}
          </PaperButton>
        ))}
      </div>

      <label style={{ display: 'block', font: "500 12px var(--serif)", letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 6 }}>
        Or pick a date
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ display: 'block', marginTop: 6, font: "400 15px var(--serif)", padding: '8px 10px', border: '1px solid var(--rule)', borderRadius: 6, background: 'var(--paper)', color: 'var(--ink)', width: '100%' }}
        />
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
        <PaperButton variant="ghost" onClick={onClose}>
          Cancel
        </PaperButton>
        <PaperButton variant="primary" onClick={confirm}>
          Assign
        </PaperButton>
      </div>
    </Modal>
  );
}
