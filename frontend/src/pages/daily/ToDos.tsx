import { useEffect, useRef, useState } from 'react';
import type { DayState } from '../../types';
import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';
import { useDrag } from '../../lib/DragContext';

interface Props {
  day: DayState;
  onEdit: (id: string, text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

/** Zone 2 — numbered Daily To Dos; starts with 15 ruled lines and grows as needed. */
export function ToDos({ day, onEdit, onToggle, onDelete, onAdd }: Props) {
  const { startDrag } = useDrag();
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const focusNewest = useRef(false);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const baseRowCount = 15;
  const overflowCount = Math.max(0, day.todos.length - baseRowCount);
  const visibleTodos = overflowOpen ? day.todos : day.todos.slice(0, baseRowCount);

  useEffect(() => {
    if (!focusNewest.current) return;
    inputs.current[day.todos.length - 1]?.focus();
    focusNewest.current = false;
  }, [day.todos.length]);

  return (
    <div>
      <SectionLabel>To Dos</SectionLabel>
      {visibleTodos.map((line, i) => {
        const filled = line.text.trim() !== '';
        return (
          <div className="todo-row" key={line.id}>
            <span style={{ font: "500 11px var(--serif)", color: 'var(--ink-soft)', width: 20, flex: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
            <InkBubble done={line.done} onToggle={() => onToggle(line.id)} label={line.text ? `Mark "${line.text}" done` : `Mark line ${i + 1} done`} size={15} />
            <input
              ref={(element) => { inputs.current[i] = element; }}
              className="hand-input"
              style={{ font: "17px var(--hand)", flex: 1 }}
              value={line.text}
              placeholder={i === 0 ? 'tap a line to write…' : ''}
              onChange={(e) => onEdit(line.id, e.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (i < day.todos.length - 1) {
                  if (i + 1 >= baseRowCount && !overflowOpen) setOverflowOpen(true);
                  window.requestAnimationFrame(() => inputs.current[i + 1]?.focus());
                }
                else {
                  focusNewest.current = true;
                  setOverflowOpen(true);
                  onAdd();
                }
              }}
              aria-label={`To do line ${i + 1}`}
            />
            {filled && (
              <button
                type="button"
                title="Drag onto the schedule to time-block"
                aria-label={`Drag "${line.text}" onto the schedule`}
                className="todo-drag"
                onPointerDown={(e) => startDrag({ label: line.text, tag: 'todo', sourceRefId: line.id, slots: 2, completed: line.done }, e)}
              >
                ⠿
              </button>
            )}
            {filled && (
              <button
                type="button"
                className="todo-delete"
                aria-label={`Delete "${line.text}" and remove it from Time Alignment`}
                title="Delete to-do"
                onClick={() => onDelete(line.id)}
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <div className="todo-overflow-controls">
        {overflowCount > 0 && (
          <button
            type="button"
            className="paper-link todo-overflow-toggle"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((open) => !open)}
          >
            {overflowOpen ? 'Collapse extra to-dos' : `Show ${overflowCount} more ${overflowCount === 1 ? 'to-do' : 'to-dos'}`}
          </button>
        )}
        <button
          type="button"
          className="paper-link todo-add-extra"
          onClick={() => {
            focusNewest.current = true;
            setOverflowOpen(true);
            onAdd();
          }}
        >
          + Add another to-do
        </button>
      </div>
    </div>
  );
}
