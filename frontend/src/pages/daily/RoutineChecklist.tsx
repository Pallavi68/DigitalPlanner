import type { DailyRoutineInstance, DayState, ISODate } from '../../types';
import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';
import { useDrag } from '../../lib/DragContext';

interface Props {
  date: ISODate;
  day: DayState;
  items: DailyRoutineInstance[];
  onToggle: (item: DailyRoutineInstance) => void;
  onOpenSetup: () => void;
  onSchedule: (item: DailyRoutineInstance) => void;
}

export function RoutineChecklist({ items, onToggle, onOpenSetup, onSchedule }: Props) {
  const { startDrag } = useDrag();
  const am = items.filter((item) => item.period === 'AM');
  const pm = items.filter((item) => item.period === 'PM');

  return (
    <div style={{ marginBottom: 22 }}>
      <div className="routine-heading">
        <SectionLabel>Successful Day</SectionLabel>
        <button type="button" className="paper-link" onClick={onOpenSetup}>edit setup</button>
      </div>
      {items.length ? (
        <div className="routine-columns">
          <RoutineColumn title="AM" values={am} onToggle={onToggle} onSchedule={onSchedule} startDrag={startDrag} />
          <RoutineColumn title="PM" values={pm} onToggle={onToggle} onSchedule={onSchedule} startDrag={startDrag} />
        </div>
      ) : (
        <button type="button" className="routine-empty" onClick={onOpenSetup}>add the first line to your successful day…</button>
      )}
    </div>
  );
}

interface RoutineColumnProps {
  title: string;
  values: DailyRoutineInstance[];
  onToggle: (item: DailyRoutineInstance) => void;
  onSchedule: (item: DailyRoutineInstance) => void;
  startDrag: ReturnType<typeof useDrag>['startDrag'];
}

function RoutineColumn({ title, values, onToggle, onSchedule, startDrag }: RoutineColumnProps) {
  return <div>
    <div className="routine-period">{title}</div>
    {values.map((item) => <div className="routine-row" key={item.id}>
      <InkBubble done={item.done} onToggle={() => onToggle(item)} label={`${item.label} (${item.period})`} />
      <span className="routine-label">{item.label}</span>
      <button
        type="button"
        className="routine-drag"
        aria-label={`Drag ${item.label} onto Time Alignment`}
        title={`Drag to schedule (${item.durationMinutes} minutes)`}
        onPointerDown={(event) => startDrag({ label: item.label, tag: 'routine', sourceRefId: item.id, slots: item.durationMinutes / 30, completed: item.done }, event)}
      >⠿</button>
      <button type="button" className="routine-quick-add" aria-label={`Add ${item.label} to Time Alignment`} title={`Add using its ${item.durationMinutes}-minute setup duration`} onClick={() => onSchedule(item)}>＋</button>
    </div>)}
  </div>;
}
