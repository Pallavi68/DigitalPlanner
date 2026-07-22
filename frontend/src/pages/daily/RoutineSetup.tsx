import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import type { ISODate, RoutineHabit, RoutinePeriod } from '../../types';
import { uid } from '../../store/seed';
import { materializeRoutine, revisionForDate } from '../../store/routines';

interface Props {
  open: boolean;
  onClose: () => void;
  date: ISODate;
  habits: RoutineHabit[];
  onSave: (habits: RoutineHabit[]) => void;
}

export function RoutineSetup({ open, onClose, date, habits, onSave }: Props) {
  const [draft, setDraft] = useState<RoutineHabit[]>(habits);
  const [error, setError] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const preview = useMemo(() => materializeRoutine(draft, date), [draft, date]);

  useEffect(() => {
    if (open) {
      setDraft(habits);
      setError('');
    }
  }, [open, habits]);

  const revise = (id: string, patch: Partial<{ label: string; period: RoutinePeriod; durationMinutes: number; archived: boolean }>) => {
    setDraft((current) => current.map((habit) => {
      if (habit.id !== id) return habit;
      const base = revisionForDate(habit, date)!;
      const revision = { ...base, ...patch, effectiveFrom: date };
      return { ...habit, label: revision.label, period: revision.period, durationMinutes: revision.durationMinutes, archived: revision.archived, revisions: [...habit.revisions.filter((item) => item.effectiveFrom !== date), revision] };
    }));
  };
  const move = (id: string, delta: number) => {
    const ordered = [...draft].sort((a, b) => (revisionForDate(a, date)?.sortOrder ?? 0) - (revisionForDate(b, date)?.sortOrder ?? 0));
    const from = ordered.findIndex((item) => item.id === id);
    const to = Math.max(0, Math.min(ordered.length - 1, from + delta));
    if (from === to) return;
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    setDraft(ordered.map((habit, sortOrder) => {
      const base = revisionForDate(habit, date)!;
      const revision = { ...base, sortOrder, effectiveFrom: date };
      return { ...habit, sortOrder, revisions: [...habit.revisions.filter((entry) => entry.effectiveFrom !== date), revision] };
    }));
  };
  const moveBefore = (id: string, beforeId: string) => {
    if (id === beforeId) return;
    const ordered = [...draft].sort((a, b) => (revisionForDate(a, date)?.sortOrder ?? 0) - (revisionForDate(b, date)?.sortOrder ?? 0));
    const from = ordered.findIndex((item) => item.id === id);
    const to = ordered.findIndex((item) => item.id === beforeId);
    const [item] = ordered.splice(from, 1);
    ordered.splice(to, 0, item);
    setDraft(ordered.map((habit, sortOrder) => {
      const base = revisionForDate(habit, date)!;
      const revision = { ...base, sortOrder, effectiveFrom: date };
      return { ...habit, sortOrder, revisions: [...habit.revisions.filter((entry) => entry.effectiveFrom !== date), revision] };
    }));
  };
  const add = () => {
    const sortOrder = draft.length;
    const revision = { effectiveFrom: date, label: 'New routine', period: 'auto' as const, durationMinutes: 30, sortOrder, archived: false };
    setDraft([...draft, { id: uid('rh'), since: date, label: revision.label, period: revision.period, durationMinutes: 30, sortOrder, revisions: [revision] }]);
  };
  const save = () => {
    if (draft.some((habit) => !revisionForDate(habit, date)?.archived && !revisionForDate(habit, date)?.label.trim())) {
      setError('Every active routine needs a name.');
      return;
    }
    onSave(draft);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Successful Day Setup">
      <p className="setup-note">Changes begin {date}. Earlier pages keep their original checklist and marks.</p>
      <div className="setup-editor">
        <div>
          {draft
            .filter((habit) => !revisionForDate(habit, date)?.archived)
            .sort((a, b) => (revisionForDate(a, date)?.sortOrder ?? 0) - (revisionForDate(b, date)?.sortOrder ?? 0))
            .map((habit, index, active) => {
              const revision = revisionForDate(habit, date)!;
              return <div
                className="setup-row"
                key={habit.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => { if (draggedId) moveBefore(draggedId, habit.id); setDraggedId(null); }}
              >
                <span className="setup-handle" draggable onDragStart={() => setDraggedId(habit.id)} onDragEnd={() => setDraggedId(null)} title="Drag to reorder" aria-hidden>⠿</span>
                <input aria-label="Routine name" className="hand-input" value={revision.label} onChange={(event) => revise(habit.id, { label: event.target.value })} />
                <select aria-label={`Period for ${revision.label}`} value={revision.period} onChange={(event) => revise(habit.id, { period: event.target.value as RoutinePeriod })}>
                  <option value="auto">Auto</option><option value="AM">AM</option><option value="PM">PM</option>
                </select>
                <select aria-label={`Duration for ${revision.label}`} value={revision.durationMinutes} onChange={(event) => revise(habit.id, { durationMinutes: Number(event.target.value) })}>
                  {Array.from({ length: 16 }, (_, i) => (i + 1) * 30).map((minutes) => <option key={minutes} value={minutes}>{minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}</option>)}
                </select>
                <button type="button" disabled={index === 0} onClick={() => move(habit.id, -1)} aria-label={`Move ${revision.label} earlier`}>↑</button>
                <button type="button" disabled={index === active.length - 1} onClick={() => move(habit.id, 1)} aria-label={`Move ${revision.label} later`}>↓</button>
                <button type="button" onClick={() => window.confirm(`Archive “${revision.label}” from ${date}? Earlier pages will keep it.`) && revise(habit.id, { archived: true })} aria-label={`Archive ${revision.label}`}>×</button>
              </div>;
            })}
          <button type="button" className="paper-link add-routine" onClick={add}>＋ add a routine</button>
        </div>
        <div className="setup-preview" aria-label="AM and PM preview">
          {(['AM', 'PM'] as const).map((period) => <div key={period}><strong>{period}</strong>{preview.filter((item) => item.period === period).map((item) => <span key={item.id}>○ {item.label}</span>)}</div>)}
        </div>
      </div>
      {error && <p role="alert" className="setup-error">{error}</p>}
      <div className="setup-actions"><button type="button" onClick={onClose}>Cancel</button><button type="button" className="setup-save" onClick={save}>Save from {date}</button></div>
    </Modal>
  );
}
