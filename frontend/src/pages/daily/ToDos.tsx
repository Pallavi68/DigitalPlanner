import type { DayState, ISODate } from '../../types';
import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';
import { useDrag } from '../../lib/DragContext';

interface Props {
  date: ISODate;
  day: DayState;
  onEdit: (index: number, text: string) => void;
  onToggle: (index: number) => void;
}

/** Zone 2 — numbered To Dos 01–15; type on a line, drag a line onto the schedule (FR-3, FR-5). */
export function ToDos({ day, onEdit, onToggle }: Props) {
  const { startDrag } = useDrag();

  return (
    <div>
      <SectionLabel>To Dos</SectionLabel>
      {day.todos.map((line, i) => {
        const filled = line.text.trim() !== '';
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30, borderBottom: '1px solid var(--rule)' }}>
            <span style={{ font: "500 11px var(--serif)", color: 'var(--ink-soft)', width: 20, flex: 'none' }}>{String(i + 1).padStart(2, '0')}</span>
            <InkBubble done={line.done} onToggle={() => onToggle(i)} label={line.text ? `Mark "${line.text}" done` : `Mark line ${i + 1} done`} size={15} />
            <input
              className="hand-input"
              style={{ font: "17px var(--hand)", flex: 1 }}
              value={line.text}
              placeholder={i === 0 ? 'tap a line to write…' : ''}
              onChange={(e) => onEdit(i, e.target.value)}
              aria-label={`To do line ${i + 1}`}
            />
            {filled && (
              <button
                type="button"
                title="Drag onto the schedule to time-block"
                aria-label={`Drag "${line.text}" onto the schedule`}
                onPointerDown={(e) => startDrag({ label: line.text, tag: 'todo', sourceRefId: `daily:${i}`, slots: 2 }, e)}
                style={{
                  flex: 'none',
                  width: 26,
                  height: 26,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--ink-soft)',
                  fontSize: 15,
                  lineHeight: 1,
                  touchAction: 'none',
                  cursor: 'grab',
                }}
              >
                ⠿
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
