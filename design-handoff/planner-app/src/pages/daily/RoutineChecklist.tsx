import type { DayState, ISODate, RoutineHabit } from '../../types';
import { InkBubble } from '../../components/InkBubble';
import { SectionLabel } from '../../components/ui';

interface Props {
  date: ISODate;
  day: DayState;
  habits: RoutineHabit[];
  onToggle: (habitId: string) => void;
}

/** Zone 1 — "Successful Day" recurring AM/PM routine checklist (FR-2). */
export function RoutineChecklist({ day, habits, onToggle }: Props) {
  const am = habits.filter((h) => h.period === 'AM' && !h.archived);
  const pm = habits.filter((h) => h.period === 'PM' && !h.archived);

  const Col = ({ title, items }: { title: string; items: RoutineHabit[] }) => (
    <div>
      <div style={{ font: "500 10px var(--serif)", letterSpacing: '2px', color: 'var(--ink-soft)', marginBottom: 6 }}>{title}</div>
      {items.map((h) => (
        <label
          key={h.id}
          style={{ display: 'flex', alignItems: 'center', gap: 10, height: 30, borderBottom: '1px solid #dde4ee', cursor: 'pointer' }}
        >
          <InkBubble done={!!day.routineDone[h.id]} onToggle={() => onToggle(h.id)} label={`${h.label} (${h.period})`} />
          <span style={{ font: "17px var(--hand)", color: 'var(--ink)' }}>{h.label}</span>
        </label>
      ))}
    </div>
  );

  return (
    <div style={{ marginBottom: 22 }}>
      <SectionLabel>Successful Day</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <Col title="AM" items={am} />
        <Col title="PM" items={pm} />
      </div>
    </div>
  );
}
