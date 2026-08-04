import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';
import { useDrag } from '../../lib/DragContext';
import type { DailyChoreOccurrence } from '../../store/recurringSchedule';

interface Props {
  items: DailyChoreOccurrence[];
  onToggle: (item: DailyChoreOccurrence) => void;
  onSchedule: (item: DailyChoreOccurrence) => void;
}

/** Applicable items from the owner's anchored two-week chore pattern. */
export function ChoreChecklist({ items, onToggle, onSchedule }: Props) {
  const { startDrag } = useDrag();
  if (!items.length) return null;

  return (
    <section className="daily-chores" aria-labelledby="daily-chores-heading">
      <SectionLabel>Today&apos;s Chores</SectionLabel>
      <span id="daily-chores-heading" className="sr-only">Today&apos;s recurring chores</span>
      {items.map((item) => (
        <div className="chore-row" key={item.id}>
          <InkBubble done={item.completed} onToggle={() => onToggle(item)} label={`Mark ${item.label} ${item.completed ? 'not done' : 'done'}`} />
          <span className="chore-label">{item.label}</span>
          <button
            type="button"
            className="chore-drag"
            aria-label={`Drag ${item.label} onto Time Alignment`}
            title="Drag to schedule; resize the block after placing it"
            onPointerDown={(event) => startDrag({
              label: item.label,
              tag: 'chore',
              sourceRefId: item.id,
              slots: Math.max(1, Math.ceil((item.durationMinutes ?? 60) / 30)),
              completed: item.completed,
            }, event)}
          >⠿</button>
          <button
            type="button"
            className="chore-quick-add"
            aria-label={`Add ${item.label} to Time Alignment`}
            title="Add to the next available time; resize after placing"
            onClick={() => onSchedule(item)}
          >＋</button>
        </div>
      ))}
    </section>
  );
}
